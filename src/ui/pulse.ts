import gsap from 'gsap';
import type { Extra } from '../i18n/extra';
import { setBpm } from '../core/beat';
import { softTick } from '../core/audio';

/**
 * "Feel your pulse": tap the heart with every beat you feel, the shared beat clock locks to your tempo, then six guided
 * breaths (4 s in, 6 s out) slow it down. Nothing is stored or sent.
 */
export interface PulseCtx {
  X: () => Extra;
  stop: () => void;
  start: () => void;
  restoreBpm: () => void;
  /** 0 = hero, 1..7 stage, 8 epilogue */
  current: () => number;
  openNote: (n: number) => void;
}

const HEART = 'M50 90 C19 67 6 49 6 32 C6 17 18 8 31 8 C40 8 47 13 50 21 C53 13 60 8 69 8 C82 8 94 17 94 32 C94 49 81 67 50 90Z';
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

let c: PulseCtx;
let el: HTMLElement | null = null;
let tl: gsap.core.Timeline | null = null;
let lastFocus: HTMLElement | null = null;

export function initPulse(ctx: PulseCtx): void {
  c = ctx;
  addEventListener('keydown', (e) => {
    if (el && e.key === 'Escape') closePulse();
  });
}

export function closePulse(): void {
  if (!el) return;
  tl?.kill();
  tl = null;
  const node = el;
  el = null;
  node.classList.remove('on');
  c.restoreBpm();
  c.start();
  setTimeout(() => node.remove(), 650);
  lastFocus?.focus?.({ preventScroll: true });
}

export function openPulse(): void {
  if (el) return;
  const X = c.X().ui;
  lastFocus = (document.activeElement as HTMLElement) || null;
  el = document.createElement('div');
  el.id = 'pulse';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', X.pulseTitle);
  el.innerHTML = `<div class="pl__bg"></div><div class="pl__warm"></div>
<button class="pn__x pl__x" type="button" aria-label="${esc(X.close)}" style="position:absolute;top:16px;right:16px"><i></i><i></i></button>
<div class="pl__top"><p class="pl__eyebrow">${esc(X.pulseTitle)}</p><h3 class="pl__h"></h3><p class="pl__t"></p></div>
<div class="pl__stage"><i class="pl__glow"></i><i class="pl__ring"></i>
  <button class="pl__heart tappable" type="button" aria-label="${esc(X.pulseTap)}"><svg viewBox="0 0 100 100" aria-hidden="true"><defs><radialGradient id="plg" cx="50%" cy="38%" r="68%"><stop offset="0" stop-color="#ffcf7a"/><stop offset="1" stop-color="#e2452a"/></radialGradient></defs><path d="${HEART}" fill="url(#plg)"/></svg></button>
</div>
<div class="pl__foot"><p class="pl__bpm" aria-live="polite"><b>--</b><span>${esc(X.pulseBpm)}</span></p><p class="pl__breath" aria-live="polite"></p><div class="pl__dots"></div><div class="pl__row"></div></div>`;
  document.body.appendChild(el);
  c.stop();
  requestAnimationFrame(() => el?.classList.add('on'));
  const q = <T extends HTMLElement>(s: string) => el!.querySelector<T>(s)!;
  q('.pn__x').addEventListener('click', closePulse);
  const heart = q<HTMLButtonElement>('.pl__heart');
  const ring = q('.pl__ring');
  const glow = q('.pl__glow');
  const warm = q('.pl__warm');
  const h = q('.pl__h');
  const t = q('.pl__t');
  const bpmEl = q('.pl__bpm b');
  const breathEl = q('.pl__breath');
  const dots = q('.pl__dots');
  const row = q('.pl__row');
  const button = (label: string, fn: () => void, ghost = false) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pn__btn' + (ghost ? ' pn__btn--ghost' : '');
    b.textContent = label;
    b.addEventListener('click', fn);
    row.appendChild(b);
    return b;
  };

  /* ---- phase 1: find the pulse ---- */
  const find = () => {
    tl?.kill();
    heart.classList.add('tappable');
    h.textContent = X.pulseFind;
    t.textContent = X.pulseFindText;
    breathEl.textContent = '';
    dots.innerHTML = '';
    row.innerHTML = '';
    bpmEl.textContent = '--';
    gsap.set(heart, { scale: 1 });
    let taps: number[] = [];
    const go = button(X.pulseGo, breathe);
    go.disabled = true;
    go.style.opacity = '0.45';
    button(X.pulseSkip, () => {
      setBpm(54);
      breathe();
    }, true);
    heart.onclick = () => {
      const now = performance.now();
      if (taps.length && now - taps[taps.length - 1] > 2500) taps = [];
      taps.push(now);
      taps = taps.slice(-8);
      softTick();
      if (navigator.vibrate) navigator.vibrate(12);
      gsap.fromTo(heart, { scale: 1.12 }, { scale: 1, duration: 0.35, ease: 'power2.out', overwrite: 'auto' });
      gsap.fromTo(ring, { scale: 1, opacity: 0.8 }, { scale: 1.5, opacity: 0, duration: 0.8, ease: 'power2.out' });
      if (taps.length >= 4) {
        const span = (taps[taps.length - 1] - taps[0]) / (taps.length - 1);
        const bpm = Math.max(40, Math.min(150, Math.round(60000 / span)));
        bpmEl.textContent = String(bpm);
        setBpm(bpm, 0.8);
        go.disabled = false;
        go.style.opacity = '1';
      }
    };
  };

  /* ---- phase 2: six guided breaths ---- */
  const breathe = () => {
    heart.onclick = null;
    heart.classList.remove('tappable');
    h.textContent = X.pulseBreathe;
    t.textContent = X.pulseBreatheText;
    row.innerHTML = '';
    dots.innerHTML = '<i></i><i></i><i></i><i></i><i></i><i></i>';
    const di = Array.from(dots.children);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('soft');
    const k = reduce ? 1.4 : 1;
    tl?.kill();
    tl = gsap.timeline({ onComplete: done });
    for (let i = 0; i < 6; i++) {
      tl.call(() => {
        breathEl.textContent = X.inhale;
        bpmEl.textContent = String(Math.round(70 - i * 4));
        setBpm(70 - i * 4, 3);
      })
        .to(heart, { scale: 1.18, duration: 4 * k, ease: 'sine.inOut' })
        .to(glow, { opacity: 0.55, duration: 4 * k, ease: 'sine.inOut' }, '<')
        .call(() => {
          breathEl.textContent = X.exhale;
        })
        .to(heart, { scale: 0.9, duration: 6 * k, ease: 'sine.inOut' })
        .to(glow, { opacity: 0.2, duration: 6 * k, ease: 'sine.inOut' }, '<')
        .call(() => di[i]?.classList.add('on'));
    }
    gsap.to(warm, { opacity: 1, duration: 60 * k, ease: 'none' });
  };

  /* ---- phase 3: rest ---- */
  const done = () => {
    h.textContent = X.pulseDone;
    t.textContent = X.pulseDoneText;
    breathEl.textContent = '';
    gsap.to(heart, { scale: 1, duration: 2, ease: 'sine.inOut' });
    row.innerHTML = '';
    button(X.pulseAgain, find, true);
    const n = c.current();
    if (n >= 1 && n <= 7) {
      button(X.pulseNote, () => {
        closePulse();
        setTimeout(() => c.openNote(n), 500);
      });
    }
  };

  find();
  heart.focus({ preventScroll: true });
}
