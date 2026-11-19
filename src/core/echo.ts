import gsap from 'gsap';
import { isSoft } from './prefs';

/**
 * ONE rhythm for the whole arc: the hero heart answers the visitor's entrance with two soft visual beats, and the
 * finished mandala answers with two passes of light from its centre — the same count, gap and breath, once per run.
 * Purely visual (works with sound off and never touches the music); reduced motion gets a calm, still glow.
 */
export const ECHO = { beats: 2, gap: 0.62, dur: 1.5 };

const played = new Set<string>();

export function echo(host: HTMLElement | null, kind: 'heart' | 'mandala'): void {
  if (!host || played.has(kind)) return;
  played.add(kind);
  const el = document.createElement('i');
  el.className = `echo echo--${kind}`;
  el.setAttribute('aria-hidden', 'true');
  host.appendChild(el);
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches || isSoft();
  if (still) {
    el.classList.add('echo--still');
    gsap.fromTo(el, { opacity: 0 }, { opacity: 0.5, duration: 2.2, ease: 'sine.inOut' });
    return;
  }
  const from = kind === 'heart' ? 0.82 : 0.06;
  const to = kind === 'heart' ? 1.12 : 1.18;
  const peak = kind === 'heart' ? 0.5 : 0.85;
  const tl = gsap.timeline({ onComplete: () => el.remove() });
  for (let i = 0; i < ECHO.beats; i++) {
    tl.fromTo(
      el,
      { scale: from, opacity: 0 },
      { scale: to, opacity: peak, duration: ECHO.dur * 0.3, ease: 'sine.out' },
      i * (ECHO.dur + ECHO.gap),
    ).to(el, { opacity: 0, duration: ECHO.dur * 0.7, ease: 'sine.in' }, i * (ECHO.dur + ECHO.gap) + ECHO.dur * 0.3);
  }
}
