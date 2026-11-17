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
const mix = { duck: 1, soft: 1 };
let filter: BiquadFilterNode | null = null;
let routed = false;

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
  if (el) el.volume = Math.min(1, level.v * MUSIC_VOLUME * mix.duck * mix.soft);
}

/**
 * Music already plays on the intro screen. Browsers block sound before a gesture, so try at once
 * and, if refused, start on the first click / key / touch (e.g. picking a language).
 */
export function primeIntroMusic(): void {
  if (!soundPref() || !src) return;
  const go = () => {
    if (!on) void enable();
  };
  const el0 = new Audio(src);
  el0.loop = true;
  el = el0;
  el0.volume = 0;
  el0.play().then(
    () => go(),
    () => {
      // any first gesture (tap, click, key) starts the music; the toggle button handles its own click
      const evs = ['pointerdown', 'keydown', 'touchstart'];
      const once = (e: Event) => {
        if ((e.target as HTMLElement | null)?.closest?.('#pre-snd, #snd')) {
          evs.forEach((n) => removeEventListener(n, once, true));
          return;
        }
        evs.forEach((n) => removeEventListener(n, once, true));
        go();
      };
      evs.forEach((n) => addEventListener(n, once, true));
    },
  );
}

/** Called from the Enter button: music continues (or stays off if the visitor switched it off). */
export async function startAudio(): Promise<void> {
  if (!soundPref()) {
    paintButton(false);
    return;
  }
  if (!on) await enable();
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
  for (const id of ['snd', 'pre-snd']) {
    const b = document.getElementById(id);
    if (!b) continue;
    b.setAttribute('aria-pressed', String(v));
    b.classList.toggle('on', v);
  }
  window.dispatchEvent(new CustomEvent('soundchange', { detail: v }));
}

export function bindSoundButton(label: (on: boolean) => string) {
  for (const id of ['snd', 'pre-snd']) {
    const b = document.getElementById(id);
    if (!b) continue;
    b.addEventListener('click', async (e) => {
      e.stopPropagation();
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
}

let brightFreq = 3200;

/** 0 → 1 across the journey: the music slowly opens up (3 kHz → 16 kHz), a warmer, brighter sound. */
export function setBrightness(p: number): void {
  brightFreq = 3200 + 12800 * Math.pow(Math.min(1, Math.max(0, p)), 1.4);
  if (filter && ctx) filter.frequency.setTargetAtTime(brightFreq, ctx.currentTime, 0.4);
}

/** Lower the music while the chapter is read aloud. */
export function duckMusic(on: boolean): void {
  gsap.to(mix, { duck: on ? 0.28 : 1, duration: 0.6, onUpdate: apply });
}

/** Gentle mode: quieter music. */
export function setSoftVolume(soft: boolean): void {
  gsap.to(mix, { soft: soft ? 0.55 : 1, duration: 0.6, onUpdate: apply });
}
