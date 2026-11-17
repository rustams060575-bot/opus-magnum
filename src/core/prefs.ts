/** Small persisted preferences (all optional; storage may be blocked). */
const SOFT = 'opus-soft';

export function isSoft(): boolean {
  try {
    return localStorage.getItem(SOFT) === '1';
  } catch {
    return false;
  }
}

export function setSoft(v: boolean): void {
  try {
    localStorage.setItem(SOFT, v ? '1' : '0');
  } catch {
    /* ignore */
  }
  document.documentElement.classList.toggle('soft', v);
}
