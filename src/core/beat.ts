import gsap from 'gsap';

/**
 * The global heartbeat. One clock drives every pulsing thing on the page,
 * so the whole site breathes together. BPM is tweened per scene:
 * agitated in the Nigredo, calm and slow by the Self.
 *
 * Performance rule: a beat may only touch `transform` (scale) and `opacity` —
 * both are compositor-only, so 60 pulses a minute cost the main thread almost nothing.
 * (Earlier versions wrote a CSS variable that drove filters and shadows; that re-painted
 * large layers every frame and made the hero stutter.)
 */
export const beat = {
  bpm: 82,
  /** 0..1 envelope of a "lub-dub" */
  value: 0,
  phase: 0,
};

const g = (x: number, c: number, w: number) => Math.exp(-(((x - c) / w) ** 2));
/** lub (strong) … dub (softer) */
export const envelope = (t: number) => Math.min(1, g(t, 0.06, 0.05) + 0.6 * g(t, 0.31, 0.055));

interface Pulsed {
  el: HTMLElement;
  /** scale amplitude (0 = none) */
  amp: number;
  /** opacity channel: base + gain * beat */
  glow?: [number, number];
  visible: boolean;
  /** survives scene rebuilds (language switch) — used for the beam and the preloader */
  persistent: boolean;
}

const pulsed: Pulsed[] = [];
const byEl = new Map<Element, Pulsed>();
const lubListeners = new Set<() => void>();
const frameListeners = new Set<(v: number) => void>();
let observer: IntersectionObserver | null = null;
let started = false;

function ensureObserver() {
  if (observer) return;
  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const p = byEl.get(e.target);
        if (p) p.visible = e.isIntersecting;
      }
    },
    { rootMargin: '10% 0px' },
  );
}

/**
 * Makes an element beat. `amp` scales it; `glow` = [base, gain] drives its opacity.
 * Off-screen elements are skipped.
 */
export function registerPulse(el: HTMLElement, amp = 0.03, persistent = false, glow?: [number, number]): void {
  ensureObserver();
  const item: Pulsed = { el, amp, glow, visible: true, persistent };
  pulsed.push(item);
  byEl.set(el, item);
  observer!.observe(el);
}

/** Opacity-only convenience: a glow layer that swells with each beat. */
export const registerGlow = (el: HTMLElement, base: number, gain: number, persistent = false) =>
  registerPulse(el, 0, persistent, [base, gain]);

export function clearPulses(): void {
  const keep = pulsed.filter((p) => p.persistent && p.el.isConnected);
  observer?.disconnect();
  pulsed.length = 0;
  byEl.clear();
  for (const k of keep) {
    pulsed.push(k);
    byEl.set(k.el, k);
    observer?.observe(k.el);
  }
}

export function onLub(fn: () => void): () => void {
  lubListeners.add(fn);
  return () => lubListeners.delete(fn);
}

export function onBeatFrame(fn: (v: number) => void): () => void {
  frameListeners.add(fn);
  return () => frameListeners.delete(fn);
}

export function setBpm(bpm: number, duration = 2.4): void {
  gsap.to(beat, { bpm, duration, ease: 'sine.inOut', overwrite: 'auto' });
}

export function startBeat(): void {
  if (started) return;
  started = true;
  let last = performance.now();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lastScale = -1;
  gsap.ticker.add(() => {
    const now = performance.now();
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const prev = beat.phase;
    beat.phase = (beat.phase + (dt * beat.bpm) / 60) % 1;
    if (beat.phase < prev) lubListeners.forEach((fn) => fn());
    const v = reduce ? 0 : envelope(beat.phase);
    beat.value = v;
    // skip the DOM entirely while the envelope is flat (most of each cycle)
    const key = Math.round(v * 200);
    if (key !== lastScale) {
      lastScale = key;
      for (const p of pulsed) {
        if (!p.visible) continue;
        if (p.amp) p.el.style.scale = String(1 + p.amp * v);
        if (p.glow) p.el.style.opacity = String(p.glow[0] + p.glow[1] * v);
      }
    }
    frameListeners.forEach((fn) => fn(v));
  });
}
