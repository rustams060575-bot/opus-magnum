/** Notes and the letter live only in this browser (localStorage). Nothing is ever sent anywhere. */
const KEY = 'opus-notes';

export type Notes = Record<string, string>;

export function getNotes(): Notes {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') as Notes;
  } catch {
    return {};
  }
}

export function setNote(id: string, text: string): void {
  try {
    const n = getNotes();
    if (text.trim()) n[id] = text;
    else delete n[id];
    localStorage.setItem(KEY, JSON.stringify(n));
  } catch {
    /* ignore */
  }
}
