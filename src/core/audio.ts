import gsap from 'gsap';
import { onLub } from './beat';

/**
 * Sound. Two layers:
 *  1. Music — drop a file named music.mp3 (or .m4a / .ogg / .wav) into public/audio/ and it
 *     will loop quietly under the experience. Nothing breaks if the file is missing.
 *  2. A synthesized "lub-dub" heartbeat that is locked to the on-screen heartbeat clock.
 * Both start from the Enter click (browsers require a user gesture) and share one on/off switch.
 */
const CANDIDATES = ['music.mp3', 'music.m4a', 'music.ogg', 'music.wav'];
const KEY = 'opus-sound';
const MUSIC_VOLUME = 0.5;
const THUMP_VOLUME = 0.28;

let el: HTMLAudioElement | null = null;
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let src: string | null = null;
let on = false;
let wired = false;
const level = { v: 0 };

const base = import.meta.env.BASE_URL;

async function findMusic(): Promise<string | null> {
  for (const name of CANDIDATES) {
    const url = `${base}audio/${name}`;
    try {
      const r = await fetch(url, { method: 'HEAD' });
      const type = r.headers.get('content-type') || '';
      // the dev server answers unknown paths with index.html, so check the type
      if (r.ok && (type.startsWith('audio/') || type.includes('ogg') || type.includes('octet-stream'))) return url;
    } catch {
      /* offline / blocked */
    }
  }
  return null;
}

export function soundPref(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}

function savePref(v: boolean) {
  try {
    localStorage.setItem(KEY, v ? 'on' : 'off');
  } catch {
    /* ignore */
  }
}

export async function initAudio(): Promise<void> {
  src = await findMusic();
}

function thump(freq: number, gain: number, when: number) {
  if (!ctx || !master) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(freq * 1.9, when);
  o.frequency.exponentialRampToValueAtTime(freq, when + 0.07);
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(gain, when + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 0.26);
  o.connect(g).connect(master);
  o.start(when);
  o.stop(when + 0.3);
}

function lubDub() {
  if (!on || !ctx) return;
  const t = ctx.currentTime;
  thump(58, THUMP_VOLUME, t);
  thump(68, THUMP_VOLUME * 0.6, t + 0.2);
}

function apply() {
  if (master) master.gain.value = level.v;
  if (el) el.volume = Math.min(1, level.v * MUSIC_VOLUME);
}

/** Call from a user gesture (the Enter button). */
export async function startAudio(): Promise<void> {
  if (!soundPref()) {
    paintButton(false);
    return;
  }
  await enable();
}

async function enable() {
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!ctx && AC) {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
  }
  await ctx?.resume();
  if (src && !el) {
    el = new Audio(src);
    el.loop = true;
    el.preload = 'auto';
  }
  if (el) el.play().catch(() => undefined);
  if (!wired) {
    wired = true;
    onLub(lubDub);
  }
  on = true;
  gsap.to(level, { v: 1, duration: 3.2, ease: 'power1.inOut', onUpdate: apply });
  paintButton(true);
}

async function disable() {
  on = false;
  gsap.to(level, {
    v: 0,
    duration: 0.8,
    onUpdate: apply,
    onComplete: () => el?.pause(),
  });
  paintButton(false);
}

function paintButton(v: boolean) {
  const b = document.getElementById('snd');
  if (!b) return;
  b.setAttribute('aria-pressed', String(v));
  b.classList.toggle('on', v);
}

export function bindSoundButton(label: (on: boolean) => string) {
  const b = document.getElementById('snd');
  if (!b) return;
  b.addEventListener('click', async () => {
    if (on) {
      savePref(false);
      await disable();
    } else {
      savePref(true);
      await enable();
    }
    b.setAttribute('aria-label', label(on));
  });
}
