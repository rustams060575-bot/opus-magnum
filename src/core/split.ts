/** Wrap every word of an element in a span (for scroll-linked "reading light" reveals). */
export function splitWords(el: HTMLElement): HTMLElement[] {
  const text = (el.textContent ?? '').trim();
  el.setAttribute('aria-label', text);
  el.textContent = '';
  const out: HTMLElement[] = [];
  text.split(/\s+/).forEach((word, i, arr) => {
    const s = document.createElement('span');
    s.className = 'w';
    s.setAttribute('aria-hidden', 'true');
    s.textContent = word;
    el.appendChild(s);
    out.push(s);
    if (i < arr.length - 1) el.appendChild(document.createTextNode(' '));
  });
  return out;
}

/**
 * Masked word reveal: each word sits in an overflow-hidden slot and its inner span rises out of it
 * (the classic "type emerges from nowhere" move). Returns the inner spans to animate.
 */
export function splitMaskWords(el: HTMLElement): HTMLElement[] {
  const text = (el.textContent ?? '').trim();
  el.setAttribute('aria-label', text);
  el.textContent = '';
  const out: HTMLElement[] = [];
  text.split(/\s+/).forEach((word, i, arr) => {
    const slot = document.createElement('span');
    slot.className = 'mw';
    slot.setAttribute('aria-hidden', 'true');
    const inner = document.createElement('span');
    inner.textContent = word;
    slot.appendChild(inner);
    el.appendChild(slot);
    out.push(inner);
    if (i < arr.length - 1) el.appendChild(document.createTextNode(' '));
  });
  return out;
}

/** Wrap every letter in an overflow-hidden slot (keeps spaces) — used for the hero title. */
export function splitChars(el: HTMLElement): HTMLElement[] {
  const text = (el.textContent ?? '').trim();
  el.setAttribute('aria-label', text);
  el.textContent = '';
  const out: HTMLElement[] = [];
  for (const ch of text) {
    if (ch === ' ') {
      const sp = document.createElement('span');
      sp.className = 'sp';
      sp.setAttribute('aria-hidden', 'true');
      sp.innerHTML = '&nbsp;';
      el.appendChild(sp);
      continue;
    }
    const slot = document.createElement('span');
    slot.className = 'chw';
    slot.setAttribute('aria-hidden', 'true');
    const inner = document.createElement('span');
    inner.className = 'ch';
    inner.textContent = ch;
    slot.appendChild(inner);
    el.appendChild(slot);
    out.push(inner);
  }
  return out;
}
