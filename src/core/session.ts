/**
 * If the browser reloads the page mid-journey (low memory, accidental refresh), the visitor lands where they were —
 * not back on the intro. Only the scroll position is kept, in sessionStorage (gone when the tab is closed).
 */
const KEY = 'opus-session';

export function saveScroll(y: number): void {
  try {
    sessionStorage.setItem(KEY, String(Math.max(0, Math.round(y))));
  } catch {
    /* private mode */
  }
}

export function savedScroll(): number | null {
  try {
    const v = sessionStorage.getItem(KEY);
    if (v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function clearScroll(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* nothing */
  }
}
