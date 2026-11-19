import gsap from 'gsap';
import { onLub } from './beat';

/**
 * Sound, in two independent layers:
 *  1. The HEARTBEAT — a synthesized "lub-dub" locked to the on-screen heartbeat clock. It is there from the very
 *     start (intro included) until the visitor chooses silence; browsers only allow sound after a gesture, so it
 *     begins at the first tap / click / key press (or immediately where autoplay is allowed).
 *  2. MUSIC — drop music.mp3 (or .m4a / .ogg / .wav) into public/audio/. It is the visitor's choice: off by default.
 * The header sound button cycles  heartbeat → heartbeat + music → silence.
 */
const CANDIDATES = ['music.mp3', 'music.m4a', 'music.ogg', 'music.wav'];
const KEY = 'opus-sound2';
const MUSIC_VOLUME = 0.32;
const BEAT_VOLUME = 0.45;

export type SoundMode = 'beat' | 'music' | 'off';

let el: HTMLAudioElement | null = null;
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let fxBus: GainNode | null = null;
let src: string | null = null;
let wired = false;
let mode: SoundMode = prefOff() ? 'off' : 'beat';
const beatLevel = { v: 0 };
const musicLevel = { v: 0 };
const mix = { duck: 1, soft: 1 };
let filter: BiquadFilterNode | null = null;
let routed = false;
let wantMusic = false;
let silent: HTMLAudioElement | null = null;
let brightFreq = 3200;

const base = import.meta.env.BASE_URL;

function prefOff(): boolean {
  try {
    return localStorage.getItem(KEY) === 'off';
  } catch {
    return false;
  }
}
function savePref(m: SoundMode) {
  try {
    if (m === 'off') localStorage.setItem(KEY, 'off');
    else localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

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

export async function initAudio(): Promise<void> {
  src = await findMusic();
}

export const soundMode = (): SoundMode => mode;

function ensureCtx(): boolean {
  if (ctx) return true;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return false;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  return true;
}

function thump(freq: number, gain: number, when: number, dest: AudioNode | null = master) {
  if (!ctx || !dest) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(freq * 1.9, when);
  o.frequency.exponentialRampToValueAtTime(freq, when + 0.07);
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(gain, when + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 0.26);
  o.connect(g).connect(dest);
  o.start(when);
  o.stop(when + 0.3);
}

/** the quiet, muffled "room" for interaction sounds: low-passed, with a soft dark echo */
function fx(): AudioNode {
  if (fxBus) return fxBus;
  const c = ctx!;
  fxBus = c.createGain();
  fxBus.gain.value = 1;
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 700;
  lp.Q.value = 0.3;
  fxBus.connect(lp);
  lp.connect(c.destination);
  const delay = c.createDelay(1);
  delay.delayTime.value = 0.34;
  const fb = c.createGain();
  fb.gain.value = 0.38;
  const dark = c.createBiquadFilter();
  dark.type = 'lowpass';
  dark.frequency.value = 420;
  const wet = c.createGain();
  wet.gain.value = 0.5;
  lp.connect(delay);
  delay.connect(dark).connect(fb).connect(delay);
  dark.connect(wet).connect(c.destination);
  return fxBus;
}

function lubDub() {
  if (mode === 'off' || !ctx || ctx.state !== 'running') return;
  const t = ctx.currentTime;
  thump(58, 1, t);
  thump(68, 0.6, t + 0.2);
}

function apply() {
  // with music playing the heartbeat steps back a little
  if (master) master.gain.value = beatLevel.v * BEAT_VOLUME * mix.duck * mix.soft;
  if (el) el.volume = Math.min(1, musicLevel.v * MUSIC_VOLUME * mix.duck * mix.soft);
}

async function startBeatLayer() {
  if (!ensureCtx()) return;
  if (!wired) {
    wired = true;
    onLub(lubDub);
  }
  try {
    await ctx!.resume();
  } catch {
    /* needs a gesture: the unlock listener below will retry */
  }
  gsap.to(beatLevel, { v: 1, duration: 1.8, ease: 'power1.inOut', onUpdate: apply });
}

async function startMusicLayer() {
  if (!ensureCtx()) return;
  try {
    await ctx!.resume();
  } catch {
    /* retried on the next gesture */
  }
  if (src && !el) {
    el = new Audio(src);
    el.loop = true;
    el.preload = 'auto';
  }
  wantMusic = true;
  if (el) el.play().catch(() => undefined);
  // route the music through a low-pass filter so it can open up (grow brighter) as the journey moves toward the light
  if (ctx && el && !routed) {
    try {
      const node = ctx.createMediaElementSource(el);
      filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = brightFreq;
      filter.Q.value = 0.4;
      node.connect(filter).connect(ctx.destination);
      routed = true;
    } catch {
      /* already routed or unsupported: play unfiltered */
    }
  }
  gsap.to(musicLevel, { v: 1, duration: 3, ease: 'power1.inOut', onUpdate: apply, overwrite: true });
}

function stopMusicLayer() {
  wantMusic = false;
  gsap.to(musicLevel, {
    v: 0,
    duration: 0.8,
    onUpdate: apply,
    overwrite: true,
    // a late "pause" must never cut music that has been switched on again meanwhile
    onComplete: () => {
      if (mode !== 'music') el?.pause();
    },
  });
}
function stopBeatLayer() {
  gsap.to(beatLevel, { v: 0, duration: 0.5, onUpdate: apply, overwrite: true });
}

/** Make sure the background music is really playing (after a dialog, the guide chat, speech…). Never restarts it. */
export function ensureMusic(): void {
  if (mode !== 'music') return;
  if (ctx && ctx.state !== 'running') void ctx.resume().catch(() => undefined);
  if (el && el.paused) el.play().catch(() => undefined);
}

const NAMES: Record<string, [string, string, string]> = {
  en: ['Sound: heartbeat', 'Sound: heartbeat and music', 'Sound: off'],
  ru: ['Звук: сердцебиение', 'Звук: сердцебиение и музыка', 'Звук: выключен'],
  es: ['Sonido: latido', 'Sonido: latido y música', 'Sonido: apagado'],
  uk: ['Звук: серцебиття', 'Звук: серцебиття і музика', 'Звук: вимкнено'],
  fr: ['Son : battement', 'Son : battement et musique', 'Son : coupé'],
  de: ['Ton: Herzschlag', 'Ton: Herzschlag und Musik', 'Ton: aus'],
  pt: ['Som: batimento', 'Som: batimento e música', 'Som: desligado'],
};

function paintButton() {
  const music = mode === 'music';
  const names = NAMES[document.documentElement.lang] ?? NAMES.en;
  const label = names[mode === 'beat' ? 0 : mode === 'music' ? 1 : 2];
  const snd = document.getElementById('snd');
  if (snd) {
    snd.dataset.state = mode;
    snd.classList.toggle('on', music);
    snd.setAttribute('aria-pressed', String(mode !== 'off'));
    snd.setAttribute('aria-label', label);
    snd.title = label;
  }
  const pre = document.getElementById('pre-snd');
  if (pre) {
    pre.setAttribute('aria-pressed', String(music));
    pre.classList.toggle('on', music);
  }
  window.dispatchEvent(new CustomEvent('soundchange', { detail: music }));
}

/** Switch the sound mode (heartbeat layer and music layer are started / stopped accordingly). */
export async function setSoundMode(next: SoundMode, remember = true): Promise<void> {
  const prev = mode;
  mode = next;
  if (remember) savePref(next);
  if (next === 'off') {
    stopBeatLayer();
    stopMusicLayer();
  } else {
    if (prev === 'off' || !wired) await startBeatLayer();
    if (next === 'music') await startMusicLayer();
    else if (prev === 'music') stopMusicLayer();
    apply();
  }
  paintButton();
}

/**
 * Called as early as possible: the heartbeat starts at once where the browser allows it, otherwise on the first
 * tap, click or key press anywhere on the page (the intro screen has plenty of those: language, Enter, …).
 */
export function primeSound(): void {
  paintButton();
  if (mode === 'off') return;
  void startBeatLayer();
  // Chrome/Safari only count click / keydown / touchend / pointerup as an audio-unlocking gesture (not pointerdown),
  // so keep listening until the context is truly running instead of giving up after the first event.
  const evs = ['pointerdown', 'pointerup', 'click', 'keydown', 'touchstart', 'touchend', 'wheel'];
  const unlock = async () => {
    if (mode === 'off') return;
    // synchronous, inside the gesture: wake the context, play a silent blip (iOS), and an inaudible <audio> so the
    // phone's silent switch does not mute Web Audio
    if (ensureCtx() && ctx) {
      void ctx.resume().catch(() => undefined);
      try {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        g.gain.value = 0.0001;
        o.connect(g).connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + 0.05);
        if (!silent) {
          silent = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
          silent.loop = true;
          silent.volume = 0.01;
        }
        void silent.play().catch(() => undefined);
      } catch {
        /* ignore */
      }
    }
    await startBeatLayer();
    if (mode === 'music' || wantMusic) await startMusicLayer();
    if (ctx && ctx.state === 'running') evs.forEach((n) => removeEventListener(n, unlock, true));
  };
  evs.forEach((n) => addEventListener(n, unlock, true));
}

/**
 * Called from the Enter button (a guaranteed gesture): the heartbeat keeps going and the background music starts and
 * then plays continuously (unless the visitor chose silence earlier).
 */
export async function startAudio(): Promise<void> {
  if (mode === 'off') return;
  await startBeatLayer();
  // music is only ever the visitor's own choice (the "music" button); if they turned it on, make sure it keeps playing
  if (mode === 'music') await startMusicLayer();
}

/** re-label the sound button (language change) */
export const repaintSound = paintButton;

export function bindSoundButton(): void {
  document.getElementById('snd')?.addEventListener('click', (e) => {
    e.stopPropagation();
    void setSoundMode(mode === 'beat' ? 'music' : mode === 'music' ? 'off' : 'beat');
  });
  // on the intro the second button is the plain music switch; the heartbeat stays
  document.getElementById('pre-snd')?.addEventListener('click', (e) => {
    e.stopPropagation();
    void setSoundMode(mode === 'music' ? 'beat' : 'music');
  });
}

/** 0 → 1 across the journey: the music slowly opens up (3 kHz → 16 kHz), a warmer, brighter sound. */
export function setBrightness(p: number): void {
  brightFreq = 3200 + 12800 * Math.pow(Math.min(1, Math.max(0, p)), 1.4);
  if (filter && ctx) filter.frequency.setTargetAtTime(brightFreq, ctx.currentTime, 0.4);
}

/** Lower everything while the chapter is read aloud. */
export function duckMusic(on: boolean): void {
  gsap.to(mix, { duck: on ? 0.28 : 1, duration: 0.6, onUpdate: apply, overwrite: true });
}

/** Gentle mode: quieter sound. */
export function setSoftVolume(soft: boolean): void {
  gsap.to(mix, { soft: soft ? 0.55 : 1, duration: 0.6, onUpdate: apply });
}

/** A tiny soft thump for a tap (unless sound is off). */
export function softTick(): void {
  if (mode === 'off' || !ctx || ctx.state !== 'running') return;
  thump(84, 0.08 * mix.soft, ctx.currentTime, fx());
}

/** A soft rising chime for a finished ritual: a pentatonic scale, so any order sounds kind. i = 0..9 */
export function chime(i: number): void {
  if (mode === 'off' || !ctx || ctx.state !== 'running') return;
  const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0];
  const f = scale[Math.max(0, Math.min(scale.length - 1, i))];
  const t = ctx.currentTime;
  const out = ctx.createGain();
  out.gain.value = 0.035 * mix.soft * (mix.duck < 1 ? 0.4 : 1);
  const soft = ctx.createBiquadFilter();
  soft.type = 'lowpass';
  soft.frequency.value = 900;
  // through the muffled, echoing interaction bus (the heartbeat is untouched)
  out.connect(soft).connect(fx());
  for (const [mult, vol] of [[1, 1], [2.005, 0.28], [3.01, 0.1]] as const) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = f * mult;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 2.7);
  }
}
