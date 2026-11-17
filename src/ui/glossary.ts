import type { Term } from '../i18n/extra';

/**
 * Marks the first occurrence of each glossary term in a stage's words and shows a small card
 * on hover / focus / tap. Stems ending in "$" must match the whole word; German is case-sensitive
 * (nouns are capitalised), the other languages are not.
 */
let tip: HTMLElement | null = null;
let hideT = 0;

function ensureTip(): HTMLElement {
  if (tip) return tip;
  tip = document.createElement('div');
  tip.id = 'tip';
  tip.setAttribute('role', 'tooltip');
  tip.innerHTML = '<b></b><span></span>';
  document.body.appendChild(tip);
  return tip;
}

function show(el: HTMLElement, t: Term) {
  const box = ensureTip();
  clearTimeout(hideT);
  box.querySelector('b')!.textContent = t.term;
  box.querySelector('span')!.textContent = t.text;
  box.classList.add('on');
  const r = el.getBoundingClientRect();
  const w = Math.min(320, innerWidth - 24);
  box.style.width = `${w}px`;
  const x = Math.max(12, Math.min(innerWidth - w - 12, r.left + r.width / 2 - w / 2));
  box.style.left = `${x}px`;
  // below the word if there is room, otherwise above
  const h = box.offsetHeight;
  const below = r.bottom + 12 + h < innerHeight;
  box.style.top = `${below ? r.bottom + 12 : Math.max(12, r.top - h - 12)}px`;
}

function hide() {
  hideT = window.setTimeout(() => tip?.classList.remove('on'), 120);
}

export function markTerms(words: HTMLElement[], gloss: Term[], lang: string): void {
  const strict = lang === 'de';
  const done = new Set<number>();
  for (const w of words) {
    const raw = (w.textContent ?? '').replace(/^[^\p{L}]+|[^\p{L}\p{M}-]+$/gu, '');
    const low = strict ? raw : raw.toLowerCase();
    const idx = gloss.findIndex((g, gi) => {
      if (done.has(gi)) return false;
      return g.stems.some((s) => {
        const exact = s.endsWith('$');
        const stem = exact ? s.slice(0, -1) : s;
        return exact ? low === stem : low.startsWith(stem);
      });
    });
    if (idx < 0) continue;
    done.add(idx);
    const t = gloss[idx];
    w.classList.add('term');
    w.tabIndex = 0;
    w.setAttribute('role', 'button');
    w.setAttribute('aria-label', `${raw}: ${t.text}`);
    w.addEventListener('mouseenter', () => show(w, t));
    w.addEventListener('mouseleave', hide);
    w.addEventListener('focus', () => show(w, t));
    w.addEventListener('blur', hide);
    w.addEventListener('click', (e) => {
      e.stopPropagation();
      show(w, t);
    });
  }
}

export function initGlossaryDismiss(): void {
  addEventListener('pointerdown', (e) => {
    if (!(e.target as HTMLElement).closest?.('.term, #tip')) tip?.classList.remove('on');
  });
  addEventListener('scroll', () => tip?.classList.remove('on'), { passive: true });
}
