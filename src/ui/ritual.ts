import gsap from 'gsap';
import { chime } from '../core/audio';
import { setBpm } from '../core/beat';
import { completeRitual, isDone, journey, PALETTE, setKintsugi, setPetals } from '../journey/state';
import { jfor } from '../journey/content';

/**
 * Seven short rituals, one per stage. Each takes 30–40 seconds, is played with a finger (no typing), can be skipped,
 * and ends with a warm line, a quotation by C. G. Jung and an optional choice of ONE small step for today.
 * Nothing is scored; the only trace is the heart slowly turning to gold.
 */
export interface RitualCtx {
  lang: () => string;
  stop: () => void;
  start: () => void;
  stageTitle: (n: number) => string;
  restoreBpm: () => void;
  goto: (sceneId: string) => void;
}

const HEART = 'M50 90 C19 67 6 49 6 32 C6 17 18 8 31 8 C40 8 47 13 50 21 C53 13 60 8 69 8 C82 8 94 17 94 32 C94 49 81 67 50 90Z';
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const buzz = (ms: number) => navigator.vibrate?.(ms);

let c: RitualCtx;
let root: HTMLElement | null = null;
let cleanup: Array<() => void> = [];
let raf = 0;
let lastFocus: HTMLElement | null = null;
let finished = false;

export function initRitual(ctx: RitualCtx): void {
  c = ctx;
  addEventListener('keydown', (e) => {
    if (root && e.key === 'Escape') closeRitual();
  });
}

export function closeRitual(): void {
  if (!root) return;
  cancelAnimationFrame(raf);
  cleanup.forEach((f) => f());
  cleanup = [];
  const node = root;
  root = null;
  node.classList.remove('on');
  c.restoreBpm();
  c.start();
  setTimeout(() => node.remove(), 500);
  lastFocus?.focus?.({ preventScroll: true });
}

/** a small burst of gold specks from a point (or the screen centre) */
export function goldBurst(x = innerWidth / 2, y = innerHeight / 2, n = 18): void {
  for (let i = 0; i < n; i++) {
    const d = document.createElement('i');
    d.className = 'rt-spark';
    d.style.left = `${x}px`;
    d.style.top = `${y}px`;
    document.body.appendChild(d);
    const a = Math.random() * Math.PI * 2;
    const r = 60 + Math.random() * 120;
    gsap.fromTo(d, { x: 0, y: 0, scale: 1, opacity: 1 }, { x: Math.cos(a) * r, y: Math.sin(a) * r - 20, scale: 0.2, opacity: 0, duration: 1.1 + Math.random() * 0.6, ease: 'power2.out', onComplete: () => d.remove() });
  }
}

export function openRitual(n: number): void {
  if (root || n < 1 || n > 7) return;
  const T = jfor(c.lang());
  const R = T.rituals[n - 1];
  lastFocus = document.activeElement as HTMLElement | null;
  finished = false;
  root = document.createElement('div');
  root.id = 'ritual';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', R.title);
  root.innerHTML = `<div class="rt__bg"></div>
<button class="rt__x" type="button" aria-label="${esc(T.ui.close)}"><i></i><i></i></button>
<div class="rt__head"><p class="rt__eyebrow">${esc(T.ui.stageWord)} ${ROMAN[n - 1]} · ${esc(c.stageTitle(n))}</p><h3 class="rt__h">${esc(R.title)}</h3><p class="rt__t">${esc(R.how)}</p></div>
<div class="rt__stage"></div>
<div class="rt__foot"><div class="rt__bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div><button class="rt__skip" type="button">${esc(T.ui.skip)}</button></div>`;
  document.body.appendChild(root);
  c.stop();
  requestAnimationFrame(() => root?.classList.add('on'));
  const q = <E extends HTMLElement>(s: string) => root!.querySelector<E>(s)!;
  q('.rt__x').addEventListener('click', closeRitual);
  q('.rt__skip').addEventListener('click', closeRitual);
  const stage = q('.rt__stage');
  const bar = q('.rt__bar');
  const fill = bar.querySelector('i')!;
  const api: Api = {
    progress(p) {
      const v = Math.max(0, Math.min(1, p));
      fill.style.transform = `scaleX(${v})`;
      bar.setAttribute('aria-valuenow', String(Math.round(v * 100)));
    },
    finish() {
      if (finished) return;
      finished = true;
      api.progress(1);
      setTimeout(() => showDone(n), 650);
    },
    on(target, ev, fn, opts) {
      target.addEventListener(ev, fn as EventListener, opts);
      cleanup.push(() => target.removeEventListener(ev, fn as EventListener, opts));
    },
    T,
  };
  RITUALS[n - 1](stage, api);
}

interface Api {
  progress: (p: number) => void;
  finish: () => void;
  on: (target: EventTarget, ev: string, fn: (e: never) => void, opts?: AddEventListenerOptions) => void;
  T: ReturnType<typeof jfor>;
}

/* ------------------------------------------------------------------ */
/* the seven rituals                                                   */
/* ------------------------------------------------------------------ */
const svgPoint = (svg: SVGSVGElement, e: PointerEvent): DOMPoint => {
  const p = svg.createSVGPoint();
  p.x = e.clientX;
  p.y = e.clientY;
  return p.matrixTransform(svg.getScreenCTM()!.inverse());
};

/** 1 · Kintsugi: trace the cracks and they fill with gold */
function kintsugi(stage: HTMLElement, api: Api) {
  const cracks = [
    'M50 20 L46 34 L53 44 L47 58 L52 72 L50 84',
    'M50 34 L36 30 L26 40 L20 36',
    'M53 44 L68 40 L76 48 L84 46',
    'M47 58 L33 56 L27 66 L22 60',
    'M52 72 L62 66 L70 62 L78 66',
    'M46 34 L40 22 L34 16',
    'M53 44 L58 28 L66 22 L72 14',
  ];
  stage.innerHTML = `<svg class="rt-k" viewBox="0 0 100 100" role="img" aria-label="${esc(api.T.rituals[0].title)}">
  <defs><radialGradient id="rk-g" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="#7a1a2c"/><stop offset="1" stop-color="#2a0a14"/></radialGradient><filter id="rk-f" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.1"/></filter></defs>
  <path d="${HEART}" fill="url(#rk-g)" stroke="#a8556a" stroke-width=".6"/>
  ${cracks.map((d) => `<path class="rt-crack" d="${d}" fill="none" stroke="#0b0306" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}
  <g class="rt-gold" filter="url(#rk-f)"></g><g class="rt-gold2"></g>
</svg>`;
  const svg = stage.querySelector('svg')!;
  const g = svg.querySelector('.rt-gold')!;
  const g2 = svg.querySelector('.rt-gold2')!;
  const pts: { x: number; y: number; on: boolean; a: SVGCircleElement; b: SVGCircleElement }[] = [];
  svg.querySelectorAll<SVGPathElement>('.rt-crack').forEach((p) => {
    const L = p.getTotalLength();
    for (let s = 0; s <= L; s += 1.6) {
      const pt = p.getPointAtLength(s);
      const mk = (parent: Element, r: number) => {
        const ci = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        ci.setAttribute('cx', pt.x.toFixed(2));
        ci.setAttribute('cy', pt.y.toFixed(2));
        ci.setAttribute('r', String(r));
        ci.setAttribute('fill', '#ffd277');
        ci.setAttribute('opacity', '0');
        parent.appendChild(ci);
        return ci;
      };
      pts.push({ x: pt.x, y: pt.y, on: false, a: mk(g, 2.6), b: mk(g2, 0.9) });
    }
  });
  let lit = 0;
  const light = (i: number) => {
    const p = pts[i];
    if (p.on) return;
    p.on = true;
    lit++;
    p.a.setAttribute('opacity', '0.85');
    p.b.setAttribute('opacity', '1');
  };
  let down = false;
  let last = 0;
  const move = (e: PointerEvent) => {
    if (!down && e.pointerType !== 'mouse') return;
    if (e.pointerType === 'mouse' && !down) return;
    const p = svgPoint(svg, e);
    for (let i = 0; i < pts.length; i++) if (Math.hypot(pts[i].x - p.x, pts[i].y - p.y) < 6.5) light(i);
    const prog = lit / pts.length;
    api.progress(prog / 0.88);
    if (lit - last > 14) {
      last = lit;
      buzz(5);
    }
    if (prog >= 0.88) {
      pts.forEach((_, i) => light(i));
      svg.classList.add('rt-k--glow');
      setKintsugi(1);
      api.finish();
    }
  };
  api.on(svg, 'pointerdown', ((e: PointerEvent) => {
    down = true;
    svg.setPointerCapture(e.pointerId);
    move(e);
  }) as never);
  api.on(svg, 'pointermove', move as never);
  api.on(svg, 'pointerup', (() => (down = false)) as never);
  api.on(svg, 'pointercancel', (() => (down = false)) as never);
  // keyboard / assistive way: a button that pours gold along the next crack
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'rt__alt';
  b.textContent = api.T.ui.trace;
  b.addEventListener('click', () => {
    const n = Math.ceil(pts.length / 6);
    let k = 0;
    for (let i = 0; i < pts.length && k < n; i++) if (!pts[i].on) (light(i), k++);
    api.progress(lit / pts.length / 0.88);
    if (lit / pts.length >= 0.88) {
      pts.forEach((_, i) => light(i));
      svg.classList.add('rt-k--glow');
      setKintsugi(1);
      api.finish();
    }
  });
  stage.appendChild(b);
}

/** 2 · Two currents: slide until dark and light become one ring */
function currents(stage: HTMLElement, api: Api) {
  stage.innerHTML = `<svg class="rt-c" viewBox="0 0 200 90" aria-hidden="true">
  <defs><linearGradient id="rc-g" x1="0" x2="1"><stop offset="0" stop-color="#8d8a99"/><stop offset=".5" stop-color="#fff2c4"/><stop offset="1" stop-color="#ffcb5a"/></linearGradient></defs>
  <line x1="14" y1="45" x2="186" y2="45" stroke="#6a5a48" stroke-width=".6" stroke-dasharray="2 3"/>
  <circle class="rc-l" cx="40" cy="45" r="17" fill="#262330" stroke="#8d8a99" stroke-width="1.2"/>
  <circle class="rc-r" cx="160" cy="45" r="17" fill="#f6d98a" stroke="#ffcb5a" stroke-width="1.2"/>
  <circle class="rc-ring" cx="100" cy="45" r="19" fill="none" stroke="url(#rc-g)" stroke-width="3" opacity="0"/>
</svg>
<label class="rt-range"><span class="sr-only">${esc(api.T.ui.drag)}</span><input type="range" min="0" max="100" value="0" step="1"></label>`;
  const l = stage.querySelector<SVGCircleElement>('.rc-l')!;
  const r = stage.querySelector<SVGCircleElement>('.rc-r')!;
  const ring = stage.querySelector<SVGCircleElement>('.rc-ring')!;
  const inp = stage.querySelector('input')!;
  let tick = 0;
  api.on(inp, 'input', (() => {
    const t = Number(inp.value) / 100;
    l.setAttribute('cx', String(40 + t * 60));
    r.setAttribute('cx', String(160 - t * 60));
    l.setAttribute('r', String(17 + t * 2));
    r.setAttribute('r', String(17 + t * 2));
    api.progress(t);
    if (Math.floor(t * 10) !== tick) {
      tick = Math.floor(t * 10);
      buzz(4);
    }
    if (t >= 0.97) {
      inp.disabled = true;
      l.setAttribute('opacity', '0');
      r.setAttribute('opacity', '0');
      ring.setAttribute('opacity', '1');
      gsap.fromTo(ring, { attr: { r: 14 } }, { attr: { r: 26 }, duration: 1.2, ease: 'elastic.out(1,0.5)' });
      api.finish();
    }
  }) as never);
}

/** 3 · Call the light: keep a finger on the screen */
function callLight(stage: HTMLElement, api: Api) {
  stage.innerHTML = `<button class="rt-hold" type="button" aria-label="${esc(api.T.ui.hold)}"><i class="rt-hold__glow"></i><i class="rt-hold__core"></i><span>${esc(api.T.ui.hold)}</span></button>`;
  const btn = stage.querySelector<HTMLButtonElement>('.rt-hold')!;
  const glow = btn.querySelector<HTMLElement>('.rt-hold__glow')!;
  let level = 0;
  let holding = false;
  let last = performance.now();
  let tickAt = 0;
  const loop = (t: number) => {
    const dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    level = Math.max(0, Math.min(1, level + (holding ? dt / 4.5 : -dt / 14)));
    glow.style.transform = `scale(${0.35 + level * 1.25})`;
    glow.style.opacity = String(0.25 + level * 0.75);
    api.progress(level);
    if (holding && t - tickAt > 700) {
      tickAt = t;
      buzz(9);
    }
    if (level >= 1) {
      holding = false;
      setBpm(48, 1.5);
      api.finish();
      return;
    }
    raf = requestAnimationFrame(loop);
  };
  const on = () => {
    holding = true;
    setBpm(54, 3);
  };
  const off = () => {
    holding = false;
  };
  api.on(btn, 'pointerdown', on as never);
  api.on(btn, 'pointerup', off as never);
  api.on(btn, 'pointerleave', off as never);
  api.on(btn, 'pointercancel', off as never);
  api.on(btn, 'keydown', ((e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      on();
    }
  }) as never);
  api.on(btn, 'keyup', off as never);
  raf = requestAnimationFrame(loop);
}

/** 4 · Steps: tap at your own pace to climb */
function steps(stage: HTMLElement, api: Api) {
  stage.innerHTML = `<svg class="rt-s" viewBox="0 0 200 110" aria-hidden="true">
  <defs><linearGradient id="rs-g" x1="0" x2="1"><stop offset="0" stop-color="#6c6a7a"/><stop offset="1" stop-color="#ffd98a"/></linearGradient></defs>
  <path class="rs-path" d="M10 100 C40 100 50 72 80 74 S125 52 145 42 S178 22 190 10" fill="none" stroke="url(#rs-g)" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="1 5"/>
  <circle class="rs-sun" cx="190" cy="10" r="9" fill="#ffe29a" opacity=".25"/>
  <circle class="rs-me" cx="10" cy="100" r="4" fill="#fff5d6"/>
</svg>
<button class="rt-step" type="button">${esc(api.T.ui.steps)}</button>`;
  const path = stage.querySelector<SVGPathElement>('.rs-path')!;
  const me = stage.querySelector<SVGCircleElement>('.rs-me')!;
  const sun = stage.querySelector<SVGCircleElement>('.rs-sun')!;
  const btn = stage.querySelector<HTMLButtonElement>('.rt-step')!;
  const L = path.getTotalLength();
  let n = 0;
  const N = 14;
  api.on(btn, 'click', (() => {
    if (n >= N) return;
    n++;
    const p = path.getPointAtLength((L * n) / N);
    gsap.to(me, { attr: { cx: p.x, cy: p.y }, duration: 0.35, ease: 'power2.out' });
    gsap.fromTo(btn, { scale: 0.94 }, { scale: 1, duration: 0.25, ease: 'back.out(3)' });
    sun.setAttribute('opacity', String(0.25 + (n / N) * 0.75));
    api.progress(n / N);
    buzz(7);
    if (n >= N) api.finish();
  }) as never);
}

/** 5 · Strength with shores: carry the light into the vessel */
function vessel(stage: HTMLElement, api: Api) {
  stage.innerHTML = `<svg class="rt-v" viewBox="0 0 200 120" aria-hidden="true">
  <defs><linearGradient id="rv-g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffcb5a"/><stop offset="1" stop-color="#fff2c4"/></linearGradient><clipPath id="rv-c"><path d="M128 52 H192 C192 90 176 108 160 108 C144 108 128 90 128 52Z"/></clipPath></defs>
  <rect class="rv-fill" x="128" y="108" width="64" height="0" fill="url(#rv-g)" clip-path="url(#rv-c)"/>
  <path d="M128 52 H192 C192 90 176 108 160 108 C144 108 128 90 128 52Z" fill="none" stroke="#b99452" stroke-width="2"/>
  <path d="M128 52 H192" stroke="#e8c98a" stroke-width="3"/>
  <g class="rv-orb"><circle cx="34" cy="60" r="16" fill="#ffd98a" opacity=".25"/><circle cx="34" cy="60" r="8" fill="#fff5d6"/></g>
</svg>
<button class="rt__alt" type="button">${esc(api.T.ui.drag)}</button>`;
  const svg = stage.querySelector('svg')!;
  const orb = svg.querySelector<SVGGElement>('.rv-orb')!;
  const fillEl = svg.querySelector<SVGRectElement>('.rv-fill')!;
  let level = 0;
  let drag = false;
  const pour = () => {
    level++;
    const h = (56 * level) / 3;
    gsap.to(fillEl, { attr: { y: 108 - h, height: h }, duration: 0.8, ease: 'power2.out' });
    api.progress(level / 3);
    buzz(14);
    if (level >= 3) api.finish();
  };
  const home = () => gsap.to(orb, { x: 0, y: 0, duration: 0.5, ease: 'power3.out' });
  api.on(svg, 'pointerdown', ((e: PointerEvent) => {
    const p = svgPoint(svg, e);
    if (Math.hypot(p.x - 34, p.y - 60) < 26) {
      drag = true;
      svg.setPointerCapture(e.pointerId);
    }
  }) as never);
  api.on(svg, 'pointermove', ((e: PointerEvent) => {
    if (!drag) return;
    const p = svgPoint(svg, e);
    gsap.set(orb, { x: p.x - 34, y: p.y - 60 });
  }) as never);
  const end = (e: PointerEvent) => {
    if (!drag) return;
    drag = false;
    const p = svgPoint(svg, e);
    if (p.x > 124 && p.x < 196 && p.y > 36 && p.y < 112) pour();
    home();
  };
  api.on(svg, 'pointerup', end as never);
  api.on(svg, 'pointercancel', (() => {
    drag = false;
    home();
  }) as never);
  api.on(stage.querySelector('.rt__alt')!, 'click', (() => {
    if (level < 3) pour();
  }) as never);
}

/** 6 · Do nothing: twelve seconds of stillness (a touch just starts the count again, with no scolding) */
function stillness(stage: HTMLElement, api: Api) {
  stage.innerHTML = `<div class="rt-still"><i class="rt-still__sun"></i><i class="rt-still__line"></i><p class="rt-still__msg" aria-live="polite"></p></div>`;
  const sun = stage.querySelector<HTMLElement>('.rt-still__sun')!;
  const line = stage.querySelector<HTMLElement>('.rt-still__line')!;
  const msg = stage.querySelector<HTMLElement>('.rt-still__msg')!;
  const TOTAL = 12000;
  let t0 = performance.now();
  const reset = (e: Event) => {
    if ((e.target as HTMLElement | null)?.closest('.rt__x, .rt__skip')) return;
    t0 = performance.now();
    msg.textContent = api.T.ui.stillBreak;
    setTimeout(() => {
      if (performance.now() - t0 > 600) msg.textContent = '';
    }, 2200);
  };
  api.on(document, 'pointerdown', reset as never, { capture: true });
  api.on(document, 'keydown', ((e: KeyboardEvent) => {
    if (e.key !== 'Escape' && e.key !== 'Tab') reset(e);
  }) as never);
  const loop = (t: number) => {
    const p = Math.min(1, (t - t0) / TOTAL);
    sun.style.transform = `translateY(${(1 - p) * 60}px) scale(${0.5 + p * 0.7})`;
    sun.style.opacity = String(0.25 + p * 0.75);
    line.style.transform = `scaleX(${0.15 + p * 0.85})`;
    api.progress(p);
    if (p >= 1) {
      api.finish();
      return;
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
}

/** 7 · Your handwriting: paint the seven petals of your own mandala */
function mandala(stage: HTMLElement, api: Api) {
  const petals: number[] = Array.from({ length: 7 }, (_, i) => journey().petals[i] ?? -1);
  let color = 0;
  const pet = (i: number) => {
    const a = (i * 360) / 7;
    return `<ellipse class="rm-p" data-i="${i}" cx="100" cy="52" rx="15" ry="34" transform="rotate(${a} 100 100)" tabindex="0" role="button" aria-label="${i + 1}"/>`;
  };
  stage.innerHTML = `<svg class="rt-m" viewBox="0 0 200 200">${Array.from({ length: 7 }, (_, i) => pet(i)).join('')}<circle cx="100" cy="100" r="13" fill="#fff0c0" opacity=".9"/></svg>
<div class="rt-pal" role="group" aria-label="${esc(api.T.ui.mandalaPick)}">${PALETTE.map((p, i) => `<button type="button" class="rt-pal__c" data-c="${i}" style="--c:${p}" aria-pressed="${i === 0}" aria-label="${i + 1}"></button>`).join('')}</div>
<p class="rt__hint">${esc(api.T.ui.mandalaPick)}</p>`;
  const els = Array.from(stage.querySelectorAll<SVGEllipseElement>('.rm-p'));
  const paint = () => {
    els.forEach((el, i) => {
      el.setAttribute('fill', petals[i] >= 0 ? PALETTE[petals[i]] : 'rgba(255,240,200,.06)');
      el.setAttribute('stroke', petals[i] >= 0 ? PALETTE[petals[i]] : 'rgba(255,230,170,.55)');
    });
    const n = petals.filter((p) => p >= 0).length;
    api.progress(n / 7);
    if (n >= 7) {
      setPetals(petals);
      api.finish();
    }
  };
  const put = (i: number) => {
    petals[i] = color;
    buzz(6);
    gsap.fromTo(els[i], { opacity: 0.4 }, { opacity: 1, duration: 0.5 });
    paint();
  };
  els.forEach((el, i) => {
    api.on(el, 'click', (() => put(i)) as never);
    api.on(el, 'keydown', ((e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        put(i);
      }
    }) as never);
  });
  stage.querySelectorAll<HTMLButtonElement>('.rt-pal__c').forEach((b) =>
    api.on(b, 'click', (() => {
      color = Number(b.dataset.c);
      stage.querySelectorAll('.rt-pal__c').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
    }) as never),
  );
  paint();
}

const RITUALS = [kintsugi, currents, callLight, steps, vessel, stillness, mandala] as const;

/* ------------------------------------------------------------------ */
/* the end of a ritual: warmth, a quotation, one optional small step    */
/* ------------------------------------------------------------------ */
function showDone(n: number) {
  if (!root) return;
  const T = jfor(c.lang());
  const R = T.rituals[n - 1];
  const Q = T.quotes[n - 1];
  completeRitual(n, -1);
  chime(n - 1);
  buzz(30);
  goldBurst();
  const wasDone = isDone(n);
  void wasDone;
  root.classList.add('rt--done');
  root.innerHTML = `<div class="rt__bg"></div>
<button class="rt__x" type="button" aria-label="${esc(T.ui.close)}"><i></i><i></i></button>
<div class="rt__end">
  <p class="rt__eyebrow">${esc(T.ui.stageWord)} ${ROMAN[n - 1]} · ${esc(R.title)}</p>
  <h3 class="rt__h">${esc(R.done)}</h3>
  <blockquote class="rt__q"><p>«${esc(Q.q)}»</p><cite>— ${esc(T.ui.quoteNote)}<br><small>${esc(Q.src)}</small></cite></blockquote>
  <p class="rt__t">${esc(T.ui.chooseStep)}</p>
  <div class="rt__cards" role="group">${T.steps[n - 1].map((s, i) => `<button type="button" class="rt__card" data-i="${i}" aria-pressed="false">${esc(s)}</button>`).join('')}<button type="button" class="rt__card rt__card--soft" data-i="-1" aria-pressed="false">${esc(T.ui.noStep)}</button></div>
  <div class="rt__row"><button type="button" class="rt__go">${esc(T.ui.cont)}</button>${n < 7 ? `<button type="button" class="rt__go rt__go--ghost" data-next>${esc(T.ui.next)}</button>` : ''}</div>
  <p class="rt__tiny">${esc(T.ui.privacy)}</p>
</div>`;
  const q = <E extends HTMLElement>(s: string) => root!.querySelector<E>(s)!;
  q('.rt__x').addEventListener('click', closeRitual);
  const cards = Array.from(root.querySelectorAll<HTMLButtonElement>('.rt__card'));
  cards.forEach((b) =>
    b.addEventListener('click', () => {
      cards.forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
      completeRitual(n, Number(b.dataset.i));
      chime(n + 2);
      buzz(12);
    }),
  );
  q('.rt__go').addEventListener('click', closeRitual);
  root.querySelector('[data-next]')?.addEventListener('click', () => {
    closeRitual();
    setTimeout(() => c.goto(`stage-${n + 1}`), 520);
  });
  q('.rt__go').focus({ preventScroll: true });
}
