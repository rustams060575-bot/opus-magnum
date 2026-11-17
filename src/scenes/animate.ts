import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { splitChars, splitMaskWords, splitWords } from '../core/split';
import { clearPulses, onBeatFrame, onLub, registerGlow, registerPulse } from '../core/beat';
import { Smoke } from '../core/smoke';
import { scenes, type Mood, type SceneDef } from './config';

gsap.registerPlugin(ScrollTrigger);

export interface Hooks {
  /** a scene became the active one (mood, rail, …) */
  activate: (def: SceneDef, el: HTMLElement) => void;
  /** override only the fixed UI colour (used by the finale) */
  setUi: (ui: Mood['ui']) => void;
}

let heroShown = false;
let mm: gsap.MatchMedia | null = null;
let offs: Array<() => void> = [];

const $ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) =>
  root.querySelector<T>(sel);
const $$ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel));

const stackOf = (sec: HTMLElement) => sec.closest<HTMLElement>('.stack')!;
const dwellOf = (sec: HTMLElement) => Number(stackOf(sec)?.dataset.dwell ?? 1);
/** ScrollTrigger config shared by every scene: scrubbed over its dwell; CSS sticky does the pinning. */
const trig = (sec: HTMLElement, scrub: number | boolean = 0.6): ScrollTrigger.Vars => ({
  id: sec.id,
  trigger: stackOf(sec),
  start: 'top top',
  end: () => `+=${innerHeight * dwellOf(sec)}`,
  scrub,
  invalidateOnRefresh: true,
});
/** While the next scene slides over this one, this one sinks back and darkens. */
function cover(sec: HTMLElement, mode: Mode) {
  if (mode === 'reduce') return;
  gsap.to(sec, {
    '--cover': 0.82,
    scale: mode === 'desktop' ? 0.93 : 0.96,
    yPercent: mode === 'desktop' ? -3 : -1.5,
    ease: 'none',
    scrollTrigger: {
      trigger: stackOf(sec),
      start: () => `top+=${innerHeight * dwellOf(sec)} top`,
      end: () => `+=${innerHeight}`,
      scrub: true,
      invalidateOnRefresh: true,
    },
  });
}

/**
 * Layer parallax while a scene slides in over the previous one: background, artwork and text
 * travel at different speeds and settle together as the scene lands. (Containers are oversized
 * in CSS so the lagging layers never expose a gap.)
 */
function enterParallax(sec: HTMLElement, mode: Mode) {
  if (mode === 'reduce' || sec.classList.contains('hero')) return;
  const k = mode === 'desktop' ? 1 : 0.6;
  const parts: [string, number][] = sec.classList.contains('hs')
    ? [['.hs__layers', 5 * k]]
    : [
        ['.st__bg', 4 * k],
        ['.st__art', 9 * k],
        ['.st__cv', 15 * k],
      ];
  for (const [sel, pct] of parts) {
    const el = $(sel, sec);
    if (!el) continue;
    gsap.fromTo(
      el,
      { yPercent: pct },
      {
        yPercent: 0,
        ease: 'none',
        scrollTrigger: { trigger: stackOf(sec), start: 'top bottom', end: 'top top', scrub: true, invalidateOnRefresh: true },
      },
    );
  }
}

type Enter = 'flipX' | 'swingR' | 'swingL' | 'depth' | 'card';
const HEART_ENTERS: Enter[] = ['flipX', 'swingR', 'depth', 'swingL'];

/**
 * How a scene arrives over the previous one. Hearts fly in as 3D (page-flip, door swing, fly-through);
 * stages open as a 2D rounded card. The two alternate, so the journey never feels like a slideshow.
 */
function enterTransition(sec: HTMLElement, mode: Mode) {
  if (mode === 'reduce' || sec.classList.contains('hero')) return;
  const heart = sec.classList.contains('hs');
  const n = Number(sec.id.split('-')[1] || 1);
  const kind: Enter = heart ? HEART_ENTERS[(n - 1) % HEART_ENTERS.length] : 'card';
  if (!heart && mode !== 'desktop') return;
  const d = mode === 'desktop' ? 1 : 0.55;
  const st = { trigger: stackOf(sec), start: 'top bottom', end: 'top top', scrub: true, invalidateOnRefresh: true };
  const P = 1500;
  const from: gsap.TweenVars = {};
  const to: gsap.TweenVars = { ease: 'power2.out', scrollTrigger: st };
  switch (kind) {
    case 'flipX':
      Object.assign(from, { rotationX: 34 * d, transformPerspective: P, transformOrigin: '50% 0%' });
      Object.assign(to, { rotationX: 0 });
      break;
    case 'swingR':
      Object.assign(from, { rotationY: -32 * d, transformPerspective: P, transformOrigin: '0% 50%' });
      Object.assign(to, { rotationY: 0 });
      break;
    case 'swingL':
      Object.assign(from, { rotationY: 32 * d, transformPerspective: P, transformOrigin: '100% 50%' });
      Object.assign(to, { rotationY: 0 });
      break;
    case 'depth':
      Object.assign(from, { z: -900 * d, rotationX: 10 * d, transformPerspective: P, transformOrigin: '50% 100%' });
      Object.assign(to, { z: 0, rotationX: 0 });
      break;
    case 'card':
      Object.assign(from, { clipPath: 'inset(9% 7% 9% 7% round 44px)' });
      Object.assign(to, { clipPath: 'inset(0% 0% 0% 0% round 0px)' });
      break;
  }
  gsap.fromTo(sec, from, to);
}

/** Only scenes near the viewport get a GPU layer (will-change); the rest stay cheap. */
function warm(sec: HTMLElement) {
  ScrollTrigger.create({
    trigger: stackOf(sec),
    start: 'top bottom+=60%',
    end: 'bottom top-=60%',
    toggleClass: { targets: sec, className: 'warm' },
  });
}

const defOf = (id: string): SceneDef =>
  scenes.find((s) => s.id === (id === 'finale' ? 'epilogue' : id)) as SceneDef;

/** Tear everything down (before a language rebuild). */
export function destroyScenes(): void {
  offs.forEach((f) => f());
  offs = [];
  mm?.revert();
  mm = null;
  ScrollTrigger.getAll().forEach((t) => t.kill());
  clearPulses();
}

/** Scroll position at which a scene begins (works for pinned and plain sections). */
export function sceneStart(id: string): number | null {
  const st = ScrollTrigger.getById(id);
  return st ? st.start : null;
}

export function initScenes(hooks: Hooks): void {
  mm = gsap.matchMedia();
  mm.add(
    {
      desktop: '(min-width: 900px) and (prefers-reduced-motion: no-preference)',
      mobile: '(max-width: 899px) and (prefers-reduced-motion: no-preference)',
      reduce: '(prefers-reduced-motion: reduce)',
    },
    (ctx) => {
      const { desktop, mobile, reduce } = ctx.conditions as Record<string, boolean>;
      document.documentElement.classList.toggle('reduced', !!reduce);
      clearPulses();
      const mode: Mode = reduce ? 'reduce' : desktop ? 'desktop' : 'mobile';

      $$('.scene').forEach((sec) => {
        if (mode !== 'reduce' && sec.closest('.stack')) warm(sec);
        if (sec.classList.contains('hero')) buildHero(sec, mode);
        else if (sec.classList.contains('hs')) buildHeart(sec, mode);
        else if (sec.classList.contains('st')) buildStage(sec, mode);
        else if (sec.classList.contains('epi')) buildEpilogue(sec, mode);
        else if (sec.classList.contains('fin')) buildFinale(sec, mode, hooks);
      });

      trackActive(hooks);
      void mobile;
    },
  );
}

type Mode = 'desktop' | 'mobile' | 'reduce';

/* ------------------------------------------------------------------ */
/* Active-scene tracking (mood, bpm, particles, rail)                  */
/* ------------------------------------------------------------------ */
function trackActive(hooks: Hooks) {
  const secs = $$('.scene');
  let starts: { id: string; el: HTMLElement; y: number }[] = [];
  const measure = () => {
    starts = secs
      .map((el) => {
        const st = ScrollTrigger.getById(el.id);
        const y = st ? st.start : el.getBoundingClientRect().top + scrollY;
        return { id: el.id, el, y };
      })
      .sort((a, b) => a.y - b.y);
  };
  let current = '';
  const check = () => {
    if (!starts.length) return;
    const y = scrollY + innerHeight * 0.4;
    let pick = starts[0];
    for (const s of starts) if (s.y <= y) pick = s;
    if (pick.id !== current) {
      current = pick.id;
      hooks.activate(defOf(pick.id), pick.el);
    }
  };
  const onRefresh = () => {
    measure();
    check();
  };
  ScrollTrigger.addEventListener('refresh', onRefresh);
  offs.push(() => ScrollTrigger.removeEventListener('refresh', onRefresh));
  const st = ScrollTrigger.create({ trigger: document.body, start: 0, end: 'max', onUpdate: check });
  offs.push(() => st.kill());
  measure();
  check();
}

/* ------------------------------------------------------------------ */
/* Pointer parallax (desktop, fine pointers)                           */
/* ------------------------------------------------------------------ */
/** Layers drift against the cursor by different amounts — cheap depth. Returns a cleanup fn. */
function parallax(root: HTMLElement, layers: [string, number][]): () => void {
  if (!matchMedia('(pointer: fine)').matches) return () => undefined;
  const setters = layers.flatMap(([sel, k]) =>
    $$(sel, root).map((el) => ({
      k,
      x: gsap.quickTo(el, 'x', { duration: 1.4, ease: 'power3' }),
      y: gsap.quickTo(el, 'y', { duration: 1.4, ease: 'power3' }),
    })),
  );
  const on = (e: PointerEvent) => {
    const nx = (e.clientX / innerWidth - 0.5) * 2;
    const ny = (e.clientY / innerHeight - 0.5) * 2;
    for (const s of setters) {
      s.x(nx * s.k);
      s.y(ny * s.k);
    }
  };
  addEventListener('pointermove', on, { passive: true });
  return () => removeEventListener('pointermove', on);
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */
let heroChars: HTMLElement[] = [];

function buildHero(sec: HTMLElement, mode: Mode) {
  heroChars = splitChars($('.hero__tt', sec)!);
  // letters wait below their slots until the intro lifts them (set in GSAP, not CSS, so transforms don't fight)
  if (mode !== 'reduce' && !heroShown) gsap.set(heroChars, { yPercent: 118, rotation: 6 });
  const heart = $('.hero__heart', sec)!;
  // the heart, its cracks, the red glow behind the title: all beat through transform/opacity only
  registerPulse(heart, 0.032);
  registerGlow($('.hh-lava', sec)!, 0.16, 0.84);
  registerGlow($('.hero__halo', sec)!, 0.22, 0.5);
  registerGlow($('.hero__redpulse', sec)!, 0.14, 0.5);
  registerGlow($('.hero__titleglow', sec)!, 0.3, 0.7);

  // ripples travel outwards on every "lub"
  const ripples = $$('.hero__ripples i', sec);
  let ri = 0;
  offs.push(
    onLub(() => {
      if (mode === 'reduce' || !heroShown) return;
      const r = ripples[ri++ % ripples.length];
      gsap.fromTo(r, { scale: 0.5, opacity: 0.5 }, { scale: 2.3, opacity: 0, duration: 2.6, ease: 'power2.out' });
    }),
  );

  const smokeCanvas = $<HTMLCanvasElement>('.hero__smoke', sec);
  if (smokeCanvas && mode !== 'reduce') {
    const smoke = new Smoke(smokeCanvas);
    offs.push(() => smoke.destroy());
    offs.push(onBeatFrame((v) => smoke.setBeat(v)));
  }
  if (mode === 'desktop') {
    offs.push(
      parallax(sec, [
        ['.hero__heartwrap', 22],
        ['.hero__bg', -10],
        ['.hero__cv', 6],
      ]),
    );
  }
  // slow camera drift on the parchment: one long GSAP tween on transform only
  if (mode !== 'reduce') gsap.to($('.hero__bg img', sec), { scale: 1.12, xPercent: -1.2, yPercent: -0.8, duration: 40, ease: 'sine.inOut', yoyo: true, repeat: -1 });

  if (heroShown) showHero(sec);

  if (mode === 'reduce') {
    ScrollTrigger.create({ id: 'hero', trigger: stackOf(sec), start: 'top top', end: 'bottom top' });
    return;
  }

  // Scroll: dive into the heart — it swallows the screen and becomes the next scene.
  const tl = gsap.timeline({ scrollTrigger: trig(sec), defaults: { ease: 'none' } });
  tl.to($('.hero__content', sec), { yPercent: -14, opacity: 0, duration: 0.38, ease: 'power2.in' }, 0)
    .to($('.hero__shade', sec), { opacity: 1, duration: 0.8 }, 0)
    .to(heart, { scale: mode === 'desktop' ? 7 : 5.5, duration: 1, ease: 'power3.in' }, 0.12)
    .to($('.hero__bg', sec), { opacity: 0.25, duration: 0.9 }, 0)
    .to($('.hero__flood', sec), { opacity: 1, duration: 0.45 }, 0.5)
    .to($('.hero__ripples', sec), { opacity: 0, duration: 0.2 }, 0);
  cover(sec, mode);
}

function showHero(sec: HTMLElement) {
  gsap.set($$('.hero__bg, .hero__heartwrap, .hero__tagline, .hero__quote, .hero__hint, .hero__tg', sec), { autoAlpha: 1, clearProps: 'transform' });
  gsap.set($('.hero__quote', sec), { clipPath: 'inset(0 0% 0 0)' });
  gsap.set(heroChars, { yPercent: 0, rotation: 0 });
  gsap.set($$('.hero__bar', sec), { scaleY: 0 });
  const sm = $('.hero__smoke', sec);
  if (sm) gsap.set(sm, { opacity: 0.9 });
}

/**
 * The first-screen entrance, built as a short film:
 * black → cinema bars open → the first heartbeat (flash) → the heart wakes → the title rises out of
 * invisible slots letter by letter → the quote is wiped in → the invitation to scroll.
 */
export function playIntro(): gsap.core.Timeline {
  const sec = $('.hero')!;
  heroShown = true;
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.fromTo($$('.hero__bar', sec), { scaleY: 1 }, { scaleY: 0, duration: 2.4, ease: 'expo.inOut' }, 0.15)
    .fromTo($('.hero__bg', sec), { autoAlpha: 0, scale: 1.25 }, { autoAlpha: 1, scale: 1, duration: 4.8, ease: 'power3.out' }, 0)
    .fromTo($('.hero__smoke', sec), { opacity: 0 }, { opacity: 0.9, duration: 3.6, ease: 'power1.inOut' }, 0.6)
    // the first heartbeat
    .fromTo($('.hero__flash', sec), { opacity: 0 }, { opacity: 0.8, duration: 0.12, ease: 'power4.out' }, 0.55)
    .to($('.hero__flash', sec), { opacity: 0, duration: 2.0, ease: 'power2.out' }, 0.67)
    .fromTo($('.hero__heartwrap', sec), { autoAlpha: 0, scale: 0.6, yPercent: 5 }, { autoAlpha: 1, scale: 1, yPercent: 0, duration: 3.4 }, 0.55)
    // the word
    .fromTo($('.hero__tagline', sec), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 2.2 }, 1.3)
    .fromTo(heroChars, { yPercent: 118, rotation: 6 }, { yPercent: 0, rotation: 0, duration: 1.7, stagger: 0.078 }, 1.15)
    .fromTo($('.hero__tg', sec), { autoAlpha: 0 }, { autoAlpha: 1, duration: 2.4, ease: 'power2.out' }, 2.3)
    // the quote is wiped in from the left
    .fromTo($('.hero__quote', sec), { autoAlpha: 1, clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.8, ease: 'power4.inOut' }, 3.0)
    .fromTo($('.hero__hint', sec), { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.4 }, 4.2);
  return tl;
}

/* ------------------------------------------------------------------ */
/* Heart interludes — every heart is a stack of layers                  */
/* ------------------------------------------------------------------ */
function buildHeart(sec: HTMLElement, mode: Mode) {
  const layers = $$('.hl', sec);
  // beat: the heart itself scales, its halo / bloom / ring swell in opacity
  layers.forEach((l) => {
    const rig = $('.hc-rig', l);
    if (rig) registerPulse(rig, 0.022);
    const halo = $('.hc-halo', l);
    if (halo) registerGlow(halo, 0.26, 0.62);
    const bloom = $('.hl__bloom', l);
    if (bloom) registerGlow(bloom, 0.04, 0.5);
    const pulse = $('.hl__pulse', l);
    if (pulse) registerPulse(pulse, 0.018);
    const oldHalo = $('.hl__halo', l);
    if (oldHalo) registerGlow(oldHalo, 0.3, 0.6);
    const ring = $('.hl__ring', l);
    if (ring) registerGlow(ring, 0.25, 0.75);
  });

  if (mode === 'reduce') {
    gsap.set(layers.slice(1), { autoAlpha: 0 });
    ScrollTrigger.create({ id: sec.id, trigger: stackOf(sec), start: 'top top', end: 'bottom top' });
    return;
  }
  if (mode === 'desktop') {
    offs.push(
      parallax(sec, [
        ['.hc-rig', 20],
        ['.hc-halo', 12],
        ['.hc-bg', -9],
        ['.hf', -8],
      ]),
    );
  }

  const tl = gsap.timeline({ scrollTrigger: trig(sec, 0.55), defaults: { ease: 'power2.inOut' } });
  // every picture after the first waits behind a closed iris and opens from the heart's centre
  gsap.set(layers.slice(1), { clipPath: 'circle(0% at 50% 50%)' });

  const rig0 = $('.hc-rig', layers[0]);
  if (rig0) tl.fromTo(rig0, { scale: 0.9 }, { scale: 1, duration: 1.6, ease: 'expo.out' }, 0);
  tl.to({}, { duration: 0.9 }); // hold — the heart just beats

  layers.slice(1).forEach((next, i) => {
    const prev = layers[i];
    const t0 = tl.duration();
    const nextRig = $('.hc-rig', next);
    const prevRig = $('.hc-rig', prev);
    tl.to(next, { clipPath: 'circle(88% at 50% 50%)', duration: 1.7, ease: 'power3.inOut' }, t0);
    const dir = i % 2 ? -1 : 1;
    if (prevRig) tl.to(prevRig, { scale: 1.12, rotationY: 28 * dir, transformPerspective: 1200, duration: 1.7, ease: 'power2.in' }, t0);
    if (nextRig) tl.fromTo(nextRig, { scale: 0.62, rotationY: -70 * dir, z: -300, transformPerspective: 1200 }, { scale: 1, rotationY: 0, z: 0, duration: 2.2, ease: 'expo.out' }, t0 + 0.15);
    const nextHalo = $('.hc-halo', next);
    if (nextHalo) tl.fromTo(nextHalo, { scale: 0.4 }, { scale: 1.12, duration: 2.0, ease: 'power2.out' }, t0 + 0.1);
    tl.to({}, { duration: 1.0 }, t0 + 2.0);
  });
  tl.to({}, { duration: 0.5 });

  // a slow push-in on every picture for the whole dwell, so nothing sits still
  const slow = $$('.hc-bg, .hf', sec);
  if (slow.length) tl.fromTo(slow, { scale: 1 }, { scale: 1.12, duration: tl.duration(), ease: 'none' }, 0);
  // 3D life: the heart tilts toward the cursor and drifts, so it reads as an object in space
  if (mode === 'desktop' && matchMedia('(pointer: fine)').matches) {
    $$('.hc-heart', sec).forEach((h, i) => {
      gsap.set(h, { transformPerspective: 1100 });
      const qy = gsap.quickTo(h, 'rotationY', { duration: 1.2, ease: 'power3' });
      const qx = gsap.quickTo(h, 'rotationX', { duration: 1.2, ease: 'power3' });
      const on = (e: PointerEvent) => {
        qy((e.clientX / innerWidth - 0.5) * 18);
        qx(-(e.clientY / innerHeight - 0.5) * 12);
      };
      addEventListener('pointermove', on, { passive: true });
      offs.push(() => removeEventListener('pointermove', on));
      gsap.to(h, { y: i % 2 ? -10 : 10, duration: 5 + i, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    });
  }
  cover(sec, mode);
  enterParallax(sec, mode);
  enterTransition(sec, mode);
}

/* ------------------------------------------------------------------ */
/* Stages                                                              */
/* ------------------------------------------------------------------ */
/** Shrinks a stage's text just enough to stay inside the viewport (long RU/ES translations). */
function fitText(sec: HTMLElement) {
  const text = $('.st__text', sec);
  const cv = $('.st__cv', sec);
  if (!text || !cv) return;
  sec.style.setProperty('--fit', '1');
  const H = sec.clientHeight;
  for (let i = 0; i < 3; i++) {
    const cvTop = (H - cv.offsetHeight) / 2;
    const bottom = cvTop + text.offsetTop + text.offsetHeight;
    const limit = H - Math.max(24, H * 0.035);
    if (bottom <= limit) break;
    const cur = Number(sec.style.getPropertyValue('--fit')) || 1;
    const next = Math.max(0.5, cur * ((limit - cvTop - text.offsetTop) / text.offsetHeight) * 0.99);
    sec.style.setProperty('--fit', next.toFixed(3));
  }
}

function buildStage(sec: HTMLElement, mode: Mode) {
  const n = Number(sec.dataset.stage);
  const words = $$('.st__q, .st__p', sec).flatMap((p) => splitWords(p));
  const title = $('.st__title', sec)!;
  const titleWords = splitMaskWords(title);
  const cite = $('.st__cite', sec);
  const art = $$('.st__art > *', sec);
  const bgImg = $('.bgimg', sec);

  // ambient life that doesn't depend on scroll
  const pulseMap: Record<number, [string, number][]> = {
    1: [['.s1-glow', 0]],
    2: [['.s2-wrap', 0.01]],
    3: [['.s3-hands', 0.015]],
    5: [['.s5-star', 0.035]],
    6: [['.s6-flare', 0.03]],
    7: [['.s7-man', 0.012]],
  };
  (pulseMap[n] ?? []).forEach(([sel, amp]) => {
    const el = $(sel, sec);
    if (el) registerPulse(el, amp);
  });
  const glow1 = $('.s1-glow', sec);
  if (glow1) registerGlow(glow1, 0.25, 0.6);
  const glow3 = $('.s3-aura', sec);
  if (glow3) registerGlow(glow3, 0.3, 0.65);
  if (mode !== 'reduce') ambient(n, sec);

  if (mode === 'reduce') {
    ScrollTrigger.create({ id: sec.id, trigger: stackOf(sec), start: 'top top', end: 'bottom top' });
    return;
  }

  if (mode === 'desktop') {
    const refit = () => fitText(sec);
    refit();
    ScrollTrigger.addEventListener('refreshInit', refit);
    offs.push(() => ScrollTrigger.removeEventListener('refreshInit', refit));
    document.fonts?.ready.then(() => {
      refit();
      ScrollTrigger.refresh();
    });
    const T = 15;
    const tl = gsap.timeline({
      scrollTrigger: trig(sec),
      defaults: { ease: 'power2.out' },
    });
    // the scene slides in already composed (art + title visible); then it comes alive
    if (bgImg) tl.fromTo(bgImg, { scale: 1.16 }, { scale: 1.0, duration: T, ease: 'none' }, 0);
    tl.from(art, { scale: 1.1, duration: 2.4, stagger: 0.3 }, 0);
    $$('[data-par]', sec).forEach((p) => tl.fromTo(p, { yPercent: 5 }, { yPercent: -5, duration: T, ease: 'none' }, 0));
    tl.fromTo(titleWords, { yPercent: 118 }, { yPercent: 0, duration: 1.2, stagger: 0.08, ease: 'expo.out' }, 0.05);
    tl.to(words, { opacity: 1, duration: 0.55, ease: 'none', stagger: { each: 6 / words.length } }, 2.3);
    if (cite) tl.from(cite, { autoAlpha: 0, y: 12, duration: 0.9 }, 8.7);
    stageExtras(n, sec, tl, T);
    // the text leaves as slowly as it arrived: dissolving word by word, in reading order, while drifting up
    const exitAt = 10.4;
    tl.to(words, { opacity: 0, duration: 0.6, ease: 'none', stagger: { each: 3.6 / words.length } }, exitAt);
    tl.to([title, cite].filter(Boolean), { autoAlpha: 0, duration: 1.6, ease: 'none' }, exitAt + 2.2);
    tl.to($('.st__text', sec), { yPercent: -5, duration: T - exitAt, ease: 'none' }, exitAt);
    tl.to(art, { opacity: 0.35, scale: 1.05, duration: 2.4, ease: 'none' }, T - 2.4);
    cover(sec, mode);
    enterParallax(sec, mode);
    enterTransition(sec, mode);
    return;
  }

  // mobile: no pinning — native scroll, words light up as they cross the viewport
  ScrollTrigger.create({ id: sec.id, trigger: stackOf(sec), start: 'top top', end: 'bottom top' });
  gsap.from(art, {
    autoAlpha: 0,
    scale: 1.08,
    duration: 1.4,
    ease: 'power2.out',
    stagger: 0.2,
    scrollTrigger: { trigger: sec, start: 'top 75%', toggleActions: 'play none none reverse' },
  });
  gsap.fromTo(
    titleWords,
    { yPercent: 118 },
    {
      yPercent: 0,
      duration: 1.1,
      stagger: 0.08,
      ease: 'expo.out',
      scrollTrigger: { trigger: title, start: 'top 88%', toggleActions: 'play none none reverse' },
    },
  );
  $$('.st__q, .st__p', sec).forEach((p) => {
    const ws = $$('.w', p);
    gsap.to(ws, {
      opacity: 1,
      ease: 'none',
      stagger: 0.5 / ws.length,
      scrollTrigger: { trigger: p, start: 'top 88%', end: 'bottom 58%', scrub: true },
    });
  });
  if (cite) gsap.from(cite, { autoAlpha: 0, y: 10, scrollTrigger: { trigger: cite, start: 'top 94%', toggleActions: 'play none none reverse' } });
  if (bgImg) gsap.fromTo(bgImg, { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true } });
}

/** Infinite, scroll-independent motion that gives each stage its own personality. */
function ambient(n: number, sec: HTMLElement) {
  if (n === 2) {
  }
  if (n === 4) {
    gsap.to($('.m1', sec), { xPercent: 12, duration: 18, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    gsap.to($('.m2', sec), { xPercent: -14, duration: 24, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  }
  if (n === 5) gsap.to($('.s5-star img', sec), { rotation: 8, duration: 14, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  if (n === 7) {
    gsap.to($('.r1', sec), { rotation: 360, duration: 120, repeat: -1, ease: 'none', transformOrigin: '50% 50%' });
    gsap.to($('.r2', sec), { rotation: -360, duration: 90, repeat: -1, ease: 'none', transformOrigin: '50% 50%' });
    gsap.to($('.r3', sec), { rotation: 360, duration: 60, repeat: -1, ease: 'none', transformOrigin: '50% 50%' });
  }
}

function stageExtras(n: number, sec: HTMLElement, tl: gsap.core.Timeline, T: number) {
  if (n === 5) tl.fromTo($('.s5-star', sec), { scale: 0.55 }, { scale: 1.05, duration: T, ease: 'none' }, 0);
  if (n === 6) {
    tl.fromTo($('.s6-line', sec), { scaleX: 0.04, opacity: 0.1 }, { scaleX: 1, opacity: 1, duration: 8, ease: 'power1.inOut' }, 1);
    tl.fromTo($('.s6-flare', sec), { scale: 0.7 }, { scale: 1.1, duration: T, ease: 'none' }, 0);
  }
  if (n === 7) tl.fromTo($('.s7-rings', sec), { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 4, ease: 'power2.out' }, 0.4);
  if (n === 2) tl.fromTo($('.s2-ring', sec), { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 2.5 }, 0.8);
  if (n === 3) tl.fromTo($('.s3-aura', sec), { scale: 0.4 }, { scale: 1.15, duration: 6, ease: 'power1.out' }, 0.5);
  if (n === 1) tl.fromTo($('.s1-glow', sec), { scale: 0.3 }, { scale: 1.2, duration: 5, ease: 'power1.out' }, 1);
}

/* ------------------------------------------------------------------ */
/* Epilogue + finale                                                   */
/* ------------------------------------------------------------------ */
function buildEpilogue(sec: HTMLElement, mode: Mode) {
  const words = $$('.st__q, .st__p', sec).flatMap((p) => splitWords(p));
  void words;
  ScrollTrigger.create({ id: 'epilogue', trigger: sec, start: 'top top', end: 'bottom top' });
  if (mode === 'reduce') return;

  const epiTitle = $('.st__title', sec)!;
  gsap.fromTo(
    splitMaskWords(epiTitle),
    { yPercent: 118 },
    {
      yPercent: 0,
      duration: 1.3,
      stagger: 0.09,
      ease: 'expo.out',
      scrollTrigger: { trigger: sec, start: 'top 55%', toggleActions: 'play none none reverse' },
    },
  );
  $$('.st__q, .st__p', sec).forEach((p) => {
    const ws = $$('.w', p);
    gsap.to(ws, {
      opacity: 1,
      ease: 'none',
      stagger: 0.5 / ws.length,
      scrollTrigger: { trigger: p, start: 'top 82%', end: 'bottom 52%', scrub: true },
    });
  });
  gsap.fromTo(
    $('.epi__glow', sec),
    { scale: 0.5, opacity: 0.2 },
    { scale: 1.5, opacity: 1, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom bottom', scrub: true } },
  );
}

function buildFinale(sec: HTMLElement, mode: Mode, hooks: Hooks) {
  const text = $('.fin__text', sec)!;
  const words = splitWords(text);
  registerPulse($('.fin__rings', sec)!, 0.02);

  if (mode === 'reduce') {
    ScrollTrigger.create({ id: 'finale', trigger: stackOf(sec), start: 'top top', end: 'bottom top' });
    gsap.set($('.fin__light', sec), { clipPath: 'none' });
    gsap.set(words, { opacity: 1 });
    hooks.setUi('dark');
    return;
  }
  gsap.set(words, { opacity: 0, y: 22, filter: 'blur(10px)' });
  const tl = gsap.timeline({
    scrollTrigger: {
      ...trig(sec),
      onUpdate: (self) => hooks.setUi(self.progress > 0.42 ? 'dark' : 'light'),
    },
    defaults: { ease: 'none' },
  });
  tl.fromTo($('.fin__light', sec), { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(150% at 50% 50%)', duration: 4, ease: 'power2.inOut' }, 0)
    .fromTo($('.fin__rings', sec), { scale: 0.3, opacity: 0, rotation: -40 }, { scale: 1, opacity: 1, rotation: 0, duration: 5 }, 0.5)
    .to(words, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, stagger: 0.55, ease: 'power2.out' }, 2.8)
    .from($('.fin__foot', sec), { autoAlpha: 0, y: 20, duration: 1.4, ease: 'power2.out' }, 6.4)
    .to({}, { duration: 1 });
}
