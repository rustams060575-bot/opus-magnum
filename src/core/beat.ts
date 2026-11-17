import gsap from 'gsap';

/**
 * The global heartbeat. One clock drives every pulsing thing on the page,
 * so the whole site breathes together. BPM is tweened per scene:
 * agitated in the Nigredo, calm and slow by the Self.
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
  amp: number;
  visible: boolean;
  /** survives scene rebuilds (language switch) — used for the beam and the preloader */
  persistent: boolean;
}

const pulsed: Pulsed[] = [];
const lubListeners = new Set<() => void>();
const frameListeners = new Set<(v: number) => void>();
let observer: IntersectionObserver | null = null;
let started = false;

/** Elements get a CSS `scale` pulse plus a `--b` variable (0..1) for glow in CSS. */
export function registerPulse(el: HTMLElement, amp = 0.03, persistent = false): void {
  const item: Pulsed = { el, amp, visible: true, persistent };
  pulsed.push(item);
  if (!observer) {
    observer = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const p = pulsed.find((x) => x.el === e.target);
        if (p) p.visible = e.isIntersecting;
      }
    }, { rootMargin: '10% 0px' });
  }
  observer.observe(el);
}

export function clearPulses(): void {
  const keep = pulsed.filter((p) => p.persistent && p.el.isConnected);
  observer?.disconnect();
  pulsed.length = 0;
  for (const k of keep) {
    pulsed.push(k);
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
  gsap.ticker.add(() => {
    const now = performance.now();
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const prev = beat.phase;
    beat.phase = (beat.phase + (dt * beat.bpm) / 60) % 1;
    if (beat.phase < prev) lubListeners.forEach((fn) => fn());
    const v = reduce ? 0 : envelope(beat.phase);
    beat.value = v;
    for (const p of pulsed) {
      if (!p.visible) continue;
      p.el.style.scale = String(1 + p.amp * v);
      p.el.style.setProperty('--b', v.toFixed(3));
    }
    frameListeners.forEach((fn) => fn(v));
  });
}
