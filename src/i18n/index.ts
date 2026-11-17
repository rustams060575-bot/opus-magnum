import type { Locale } from './types';
import { en } from './en';
import { ru } from './ru';
import { es } from './es';
import { uk } from './uk';
import { fr } from './fr';
import { de } from './de';
import { pt } from './pt';

/**
 * To add a language: create src/i18n/xx.ts (copy en.ts), then register it here.
 * The language switch, <html lang>, and persisted choice are all driven from this list.
 */
export const locales: Record<string, Locale> = { en, ru, es, uk, fr, de, pt };
export const order = Object.keys(locales);

const KEY = 'opus-lang';

export function detectLang(): string {
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (q && locales[q]) return q;
    const saved = localStorage.getItem(KEY);
    if (saved && locales[saved]) return saved;
  } catch {
    /* storage may be blocked */
  }
  const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
  return locales[nav] ? nav : 'en';
}

export function saveLang(code: string): void {
  try {
    localStorage.setItem(KEY, code);
  } catch {
    /* ignore */
  }
  document.documentElement.lang = code;
}

export { extraFor } from './extra';
export type { Locale };
