import gsap from 'gsap';

/**
 * Small, physical interactions: tap anywhere on the artwork and light ripples out from your finger
 * (with a tiny haptic tick on phones that support it); tap the first heart and it answers with a beat.
 */
const SKIP = 'button, a, input, textarea, .st__text, .hero__tagline, .hero__title, .hero__quote, #panel, #pulse, #agent, #ui, #rail, .lang';

export function initTouchPlay(app: HTMLElement, accent: () => string, onHeartTap: () => void): void {
  app.addEventListener('pointerup', (e) => {
    const t = e.target as HTMLElement;
    if (t.closest(SKIP) || !t.closest('.scene')) return;
    if (t.closest('.hero')) {
      onHeartTap();
    }
    const dot = document.createElement('i');
    dot.className = 'tap-ripple';
    dot.style.left = `${e.clientX}px`;
    dot.style.top = `${e.clientY}px`;
    dot.style.setProperty('--c', accent());
    document.body.appendChild(dot);
    gsap.fromTo(dot, { scale: 0.2, opacity: 0.85 }, { scale: 4.2, opacity: 0, duration: 1.1, ease: 'power2.out', onComplete: () => dot.remove() });
    if (navigator.vibrate && e.pointerType === 'touch') navigator.vibrate(10);
  });
}

/** a very light tick when a new chapter takes over (phones only, and only if the browser allows it) */
export function chapterTick(): void {
  if (navigator.vibrate && matchMedia('(pointer: coarse)').matches) navigator.vibrate(8);
}
