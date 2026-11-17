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

/** Wrap every letter (keeps spaces) — used for the hero title. */
export function splitChars(el: HTMLElement): HTMLElement[] {
  const text = (el.textContent ?? '').trim();
  el.setAttribute('aria-label', text);
  el.textContent = '';
  const out: HTMLElement[] = [];
  for (const ch of text) {
    const s = document.createElement('span');
    s.setAttribute('aria-hidden', 'true');
    if (ch === ' ') {
      s.className = 'sp';
      s.innerHTML = '&nbsp;';
    } else {
      s.className = 'ch';
      s.textContent = ch;
      out.push(s);
    }
    el.appendChild(s);
  }
  return out;
}
