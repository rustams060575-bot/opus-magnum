import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { splitChars, splitWords } from '../core/split';
import { clearPulses, onBeatFrame, onLub, registerPulse } from '../core/beat';
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
/* Hero                                                                */
/* ------------------------------------------------------------------ */
let heroChars: HTMLElement[] = [];

function buildHero(sec: HTMLElement, mode: Mode) {
  const title = $('.hero__title', sec)!;
  heroChars = splitChars(title);
  const heart = $('.hero__heart', sec)!;
  registerPulse(heart, 0.05);
  const off = onBeatFrame((v) => sec.style.setProperty('--b', v.toFixed(3)));
  offs.push(off);

  // ripples travel outwards on every "lub"
  const ripples = $$('.hero__ripples i', sec);
  let ri = 0;
  const offLub = onLub(() => {
    if (mode === 'reduce' || !heroShown) return;
    const r = ripples[ri++ % ripples.length];
    gsap.fromTo(r, { scale: 0.5, opacity: 0.55 }, { scale: 2.4, opacity: 0, duration: 2.6, ease: 'power2.out' });
  });
  offs.push(offLub);

  const smokeCanvas = $<HTMLCanvasElement>('.hero__smoke', sec);
  if (smokeCanvas && mode !== 'reduce') {
    const smoke = new Smoke(smokeCanvas);
    offs.push(() => smoke.destroy());
    offs.push(onBeatFrame((v) => smoke.setBeat(v)));
  }

  if (heroShown) showHero(sec);

  if (mode === 'reduce') {
    ScrollTrigger.create({ id: 'hero', trigger: sec, start: 'top top', end: 'bottom top' });
    return;
  }

  // Scroll: dive into the heart — it swallows the screen and becomes the next scene.
  const tl = gsap.timeline({
    scrollTrigger: {
      id: 'hero',
      trigger: sec,
      start: 'top top',
      end: mode === 'desktop' ? '+=150%' : '+=120%',
      pin: true,
      scrub: 0.6,
      anticipatePin: 1,
    },
    defaults: { ease: 'none' },
  });
  tl.to($('.hero__content', sec), { yPercent: -18, opacity: 0, filter: mode === 'desktop' ? 'blur(10px)' : 'none', duration: 0.35 }, 0)
    .to($('.hero__shade', sec), { opacity: 1, duration: 0.8 }, 0)
    .to(heart, { scale: mode === 'desktop' ? 9 : 7, duration: 1, ease: 'power2.in' }, 0.1)
    .to($('.hero__bg', sec), { scale: 1.25, opacity: 0.2, duration: 0.9 }, 0)
    .to($('.hero__flood', sec), { opacity: 1, duration: 0.45 }, 0.45)
    .to($('.hero__ripples', sec), { opacity: 0, duration: 0.2 }, 0);
}

function showHero(sec: HTMLElement) {
  gsap.set($$('.hero__bg, .hero__heartwrap, .hero__tagline, .hero__quote, .hero__hint', sec), { autoAlpha: 1, clearProps: 'transform,filter' });
  gsap.set(heroChars, { autoAlpha: 1, clearProps: 'transform,filter' });
  const sm = $('.hero__smoke', sec);
  if (sm) gsap.set(sm, { opacity: 0.85 });
}

/** The first-screen entrance: letters swim out of the dark while the heart wakes. */
export function playIntro(): gsap.core.Timeline {
  const sec = $('.hero')!;
  heroShown = true;
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  // 0. the dark: parchment surfaces from black while the camera slowly pushes in
  tl.fromTo($('.hero__bg', sec), { autoAlpha: 0, scale: 1.32 }, { autoAlpha: 1, scale: 1, duration: 4.2, ease: 'power2.out' }, 0)
    .fromTo($('.hero__smoke', sec), { opacity: 0 }, { opacity: 0.85, duration: 3.2, ease: 'power1.inOut' }, 0.6)
    // 1. the first heartbeat: a red flash and the heart wakes
    .fromTo($('.hero__flash', sec), { opacity: 0 }, { opacity: 0.85, duration: 0.14, ease: 'power4.out' }, 0.5)
    .to($('.hero__flash', sec), { opacity: 0, duration: 1.8, ease: 'power2.out' }, 0.66)
    .fromTo($('.hero__heartwrap', sec), { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 2.8, ease: 'expo.out' }, 0.5)
    // 2. the word: letters swim out of the dark, one by one
    .fromTo($('.hero__tagline', sec), { autoAlpha: 0, y: 14, letterSpacing: '0.75em' }, { autoAlpha: 1, y: 0, letterSpacing: '0.46em', duration: 2.4 }, 1.2)
    .fromTo(
      heroChars,
      { autoAlpha: 0, yPercent: 60, scale: 1.5, filter: 'blur(20px)' },
      { autoAlpha: 1, yPercent: 0, scale: 1, filter: 'blur(0px)', duration: 1.9, stagger: 0.11, ease: 'expo.out' },
      1.0,
    )
    // 3. the quote and the invitation to scroll
    .fromTo($('.hero__quote', sec), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 2 }, 3.0)
    .fromTo($('.hero__hint', sec), { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.4 }, 4.0);
  return tl;
}

/* ------------------------------------------------------------------ */
/* Heart interludes                                                    */
/* ------------------------------------------------------------------ */
function buildHeart(sec: HTMLElement, mode: Mode) {
  const layers = $$('.hl', sec);
  $$('.hl__pulse', sec).forEach((p) => registerPulse(p, 0.018));
  const smoke = $('.hs__smoke', sec);
  if (smoke && mode !== 'reduce') {
    gsap.to(smoke, { xPercent: -6, duration: 26, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  }

  if (mode === 'reduce') {
    ScrollTrigger.create({ id: sec.id, trigger: sec, start: 'top top', end: 'bottom top' });
    return;
  }
  const blur = (v: number) => (mode === 'desktop' ? `blur(${v}px)` : 'none');
  const many = layers.length > 1;
  const tl = gsap.timeline({
    scrollTrigger: {
      id: sec.id,
      trigger: sec,
      start: 'top top',
      end: many ? '+=190%' : '+=120%',
      pin: true,
      scrub: 0.55,
      anticipatePin: 1,
    },
    defaults: { ease: 'power2.inOut' },
  });
  gsap.set(layers.slice(1), { autoAlpha: 0 });

  tl.fromTo($('.hs__bg', sec), { opacity: 0 }, { opacity: 1, duration: 0.8 }, 0);
  tl.fromTo(layers[0], { autoAlpha: 0, scale: 0.84, filter: blur(14) }, { autoAlpha: 1, scale: 1, filter: blur(0), duration: 1.1, ease: 'power2.out' }, 0);
  tl.to({}, { duration: 0.8 }); // hold — the heart just beats

  layers.slice(1).forEach((next, i) => {
    const prev = layers[i];
    tl.to(prev, { autoAlpha: 0, scale: 1.1, filter: blur(12), duration: 1 });
    tl.fromTo(next, { autoAlpha: 0, scale: 0.88, filter: blur(12) }, { autoAlpha: 1, scale: 1, filter: blur(0), duration: 1 }, '<');
    tl.fromTo($('.hl__halo', next), { opacity: 0.2, scale: 0.7 }, { opacity: 1, scale: 1.2, duration: 0.6, yoyo: true, repeat: 1 }, '<');
    tl.to({}, { duration: 0.8 });
  });
  tl.to(layers[layers.length - 1], { scale: 1.14, autoAlpha: 0, filter: blur(10), duration: 0.9, ease: 'power2.in' });
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
  if (mode !== 'reduce') ambient(n, sec);

  if (mode === 'reduce') {
    ScrollTrigger.create({ id: sec.id, trigger: sec, start: 'top top', end: 'bottom top' });
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
      scrollTrigger: { id: sec.id, trigger: sec, start: 'top top', end: '+=360%', pin: true, scrub: 0.6, anticipatePin: 1 },
      defaults: { ease: 'power2.out' },
    });
    if (bgImg) tl.fromTo(bgImg, { scale: 1.16 }, { scale: 1.0, duration: T, ease: 'none' }, 0);
    tl.from(art, { autoAlpha: 0, scale: 1.1, duration: 2.4, stagger: 0.3 }, 0);
    $$('[data-par]', sec).forEach((p) => tl.fromTo(p, { yPercent: 5 }, { yPercent: -5, duration: T, ease: 'none' }, 0));
    tl.from(title, { autoAlpha: 0, y: 28, filter: 'blur(8px)', duration: 1.3 }, 0.7);
    tl.to(words, { opacity: 1, duration: 0.55, ease: 'none', stagger: { each: 6 / words.length } }, 2.3);
    if (cite) tl.from(cite, { autoAlpha: 0, y: 12, duration: 0.9 }, 8.7);
    stageExtras(n, sec, tl, T);
    // the text leaves as slowly as it arrived: dissolving word by word, in reading order, while drifting up
    const exitAt = 10.4;
    tl.to(words, { opacity: 0, duration: 0.6, ease: 'none', stagger: { each: 3.6 / words.length } }, exitAt);
    tl.to([title, cite].filter(Boolean), { autoAlpha: 0, duration: 1.6, ease: 'none' }, exitAt + 2.2);
    tl.to($('.st__text', sec), { yPercent: -5, duration: T - exitAt, ease: 'none' }, exitAt);
    tl.to(art, { opacity: 0.3, scale: 1.05, duration: 2.4, ease: 'none' }, T - 2.4);
    return;
  }

  // mobile: no pinning — native scroll, words light up as they cross the viewport
  ScrollTrigger.create({ id: sec.id, trigger: sec, start: 'top top', end: 'bottom top' });
  gsap.from(art, {
    autoAlpha: 0,
    scale: 1.08,
    duration: 1.4,
    ease: 'power2.out',
    stagger: 0.2,
    scrollTrigger: { trigger: sec, start: 'top 75%', toggleActions: 'play none none reverse' },
  });
  gsap.from(title, {
    autoAlpha: 0,
    y: 22,
    duration: 1,
    stagger: 0.15,
    scrollTrigger: { trigger: title, start: 'top 88%', toggleActions: 'play none none reverse' },
  });
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

  gsap.from($('.st__title', sec), {
    autoAlpha: 0,
    y: 26,
    duration: 1.2,
    stagger: 0.2,
    scrollTrigger: { trigger: sec, start: 'top 55%', toggleActions: 'play none none reverse' },
  });
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
    ScrollTrigger.create({ id: 'finale', trigger: sec, start: 'top top', end: 'bottom top' });
    gsap.set($('.fin__light', sec), { clipPath: 'none' });
    gsap.set(words, { opacity: 1 });
    hooks.setUi('dark');
    return;
  }
  gsap.set(words, { opacity: 0, y: 22, filter: 'blur(10px)' });
  const tl = gsap.timeline({
    scrollTrigger: {
      id: 'finale',
      trigger: sec,
      start: 'top top',
      end: '+=170%',
      pin: true,
      scrub: 0.6,
      anticipatePin: 1,
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
