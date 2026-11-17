import { duckMusic } from '../core/audio';

/** "Listen to the chapter" — the browser's own speech synthesis (no audio files, works offline on most devices). */
const TAGS: Record<string, string> = { en: 'en-US', ru: 'ru-RU', es: 'es-ES', uk: 'uk-UA', fr: 'fr-FR', de: 'de-DE', pt: 'pt-PT' };

export const speechSupported = typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';

let activeBtn: HTMLElement | null = null;

export function stopSpeech(): void {
  if (!speechSupported) return;
  speechSynthesis.cancel();
  activeBtn?.classList.remove('on');
  activeBtn = null;
  duckMusic(false);
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
  chunks.forEach((c, i) => {
    const u = new SpeechSynthesisUtterance(c);
    u.lang = tag;
    if (voice) u.voice = voice;
    u.rate = 0.92;
    u.pitch = 1;
    if (i === chunks.length - 1) {
      u.onend = () => {
        if (activeBtn === btn) {
          stopSpeech();
          (btn.querySelector('span') ?? btn).textContent = labels[0];
        }
      };
    }
    speechSynthesis.speak(u);
  });
}
