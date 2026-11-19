import { duckMusic, ensureMusic } from '../core/audio';

/** "Listen to the chapter" — the browser's own speech synthesis (no audio files, works offline on most devices). */
const TAGS: Record<string, string> = { en: 'en-US', ru: 'ru-RU', es: 'es-ES', uk: 'uk-UA', fr: 'fr-FR', de: 'de-DE', pt: 'pt-PT' };

export const speechSupported = typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';

let activeBtn: HTMLElement | null = null;
/** bumped on every start/stop: callbacks of cancelled utterances carry an old token and are ignored */
let token = 0;
/** Chrome garbage-collects utterances that are not referenced, which silently drops speech and `onend` */
const keep = new Set<SpeechSynthesisUtterance>();

/** Stops ONLY the card's speech; the background music is merely un-ducked and keeps playing. */
export function stopSpeech(): void {
  if (!speechSupported) return;
  token++;
  speechSynthesis.cancel();
  keep.clear();
  activeBtn?.classList.remove('on');
  activeBtn = null;
  duckMusic(false);
  ensureMusic();
}

function pickVoice(tag: string): SpeechSynthesisVoice | undefined {
  const vs = speechSynthesis.getVoices();
  const base = tag.slice(0, 2);
  return vs.find((v) => v.lang === tag) ?? vs.find((v) => v.lang.slice(0, 2) === base);
}

/** Toggle reading `parts` aloud; `labels` = [listen, stop] for the button text. */
export function toggleSpeech(btn: HTMLElement, parts: string[], lang: string, labels: [string, string]): void {
  if (!speechSupported) return;
  if (activeBtn === btn) {
    stopSpeech();
    (btn.querySelector('span') ?? btn).textContent = labels[0];
    return;
  }
  stopSpeech();
  const tag = TAGS[lang] ?? 'en-US';
  const voice = pickVoice(tag);
  // long texts get cut off by some engines: speak sentence-sized pieces in a queue
  const chunks = parts.flatMap((p) => p.match(/[^.!?…]+[.!?…]*/g) ?? [p]).map((s) => s.trim()).filter(Boolean);
  activeBtn = btn;
  btn.classList.add('on');
  (btn.querySelector('span') ?? btn).textContent = labels[1];
  duckMusic(true);
  const my = token;
  const finish = () => {
    if (my !== token || activeBtn !== btn) return;
    stopSpeech();
    (btn.querySelector('span') ?? btn).textContent = labels[0];
  };
  // Chrome drops a speak() issued in the same tick as cancel(): start on the next tick
  setTimeout(() => {
    if (my !== token) return;
    speechSynthesis.resume();
    chunks.forEach((c, i) => {
      const u = new SpeechSynthesisUtterance(c);
      u.lang = tag;
      if (voice) u.voice = voice;
      u.rate = 0.92;
      u.pitch = 1;
      keep.add(u);
      if (i === chunks.length - 1) {
        u.onend = finish;
        u.onerror = finish;
      }
      speechSynthesis.speak(u);
    });
  }, 60);
}
