import type { ParticleMode } from '../core/particles';
import frameMeta from './frames.json';
import cutMeta from './cutouts.json';

/** Public-folder image helper (works on Vercel root and GitHub Pages sub-path). */
export const img = (name: string): string => `${import.meta.env.BASE_URL}img/${name}.webp`;
const touch = typeof matchMedia !== 'undefined' && (matchMedia('(pointer: coarse)').matches || innerWidth < 900);
export const frameUrl = (name: string): string => img(`${touch ? 'frames-m' : 'frames'}/${name}`);
export const cutUrl = (name: string): string => img(`cut/${name}`);
export const bgUrl = (name: string): string => img(`bg/${name}`);
/** width / height of a trimmed cut-out */
export const cutAspect = (name: string): number => (cutMeta as Record<string, { ar: number }>)[name]?.ar ?? 0.75;
export const frameBg = (name: string): string =>
  (frameMeta as Record<string, { bg: string }>)[name]?.bg ?? '#050506';

export interface Mood {
  bpm: number;
  particles: ParticleMode;
  accent: string;
  /** colour of fixed UI (header, rail) */
  ui: 'light' | 'dark';
}

export interface HeartLayer {
  src: string;
  /**
   * cut    = the heart cut out of its frame, layered over a blurred ambient copy of the frame
   * frame  = a full 16:10 Figma frame shown edge to edge (src is a name in public/img/frames)
   * portal = image cropped to a glowing oval (light backgrounds)
   * soft   = feathered edges on black (dark backgrounds)
   */
  kind: 'cut' | 'frame' | 'portal' | 'soft';
  glow: string;
  /** optional full-bleed backdrop that travels with this layer */
  behind?: string;
  /** mobile scale for `frame` layers so the whole heart fits a portrait screen */
  ms?: number;
  /** the picture is a clean cut-out: no ambient background copy, it floats on the scene colour */
  nobg?: boolean;
}

export type SceneDef =
  | { type: 'hero'; id: 'hero'; dwell: number; mood: Mood }
  | { type: 'heart'; id: string; dwell: number; layers: HeartLayer[]; mood: Mood }
  | { type: 'stage'; id: string; dwell: number; n: number; side: 'left' | 'right'; mood: Mood }
  | { type: 'epilogue'; id: 'epilogue'; dwell: number; mood: Mood };

const M = (bpm: number, particles: ParticleMode, accent: string, ui: 'light' | 'dark' = 'light'): Mood => ({
  bpm,
  particles,
  accent,
  ui,
});

/**
 * The journey, in the order of the Figma file. Every scene is a full-screen layer;
 * the next one slides over the previous one ("stacking"). `dwell` is how many screen
 * heights of scrolling the scene's own choreography gets before the next one covers it.
 */
export const scenes: SceneDef[] = [
  { type: 'hero', id: 'hero', dwell: 1.5, mood: M(84, 'dust', '#ff5a2a') },

  // — The heart: ONE interlude, two pictures that melt into each other (chained → half-gold) —
  {
    type: 'heart',
    id: 'heart-1',
    dwell: 2.6,
    layers: [
      { src: 'heart-chained', kind: 'cut', glow: '#c0283a', ms: 1.0, nobg: true },
      { src: 'heart-gold', kind: 'cut', glow: '#f0c04a', ms: 1.0, nobg: true },
    ],
    mood: M(80, 'ember', '#ff4a2a'),
  },
  { type: 'stage', id: 'stage-1', dwell: 3.6, n: 1, side: 'right', mood: M(92, 'ember', '#ff6a2a', 'dark') },

  // — Anima & Animus —
  { type: 'stage', id: 'stage-2', dwell: 3.6, n: 2, side: 'left', mood: M(76, 'ash', '#ff5a3c') },

  // — The Wise Old Man —
  { type: 'stage', id: 'stage-3', dwell: 3.6, n: 3, side: 'left', mood: M(66, 'gold', '#ffb347') },

  // — The Hero’s Path —
  { type: 'stage', id: 'stage-4', dwell: 3.6, n: 4, side: 'right', mood: M(66, 'snow', '#9fd4ff') },

  // — Power —
  { type: 'stage', id: 'stage-5', dwell: 3.6, n: 5, side: 'left', mood: M(64, 'star', '#5aa0ff') },

  // — The Void —
  { type: 'stage', id: 'stage-6', dwell: 3.6, n: 6, side: 'left', mood: M(50, 'star', '#ffb45a') },

  // — The Self —
  { type: 'stage', id: 'stage-7', dwell: 3.6, n: 7, side: 'left', mood: M(54, 'gold', '#ffd27a') },

  // — Epilogue: the conjunction of opposites —
  {
    type: 'heart',
    id: 'heart-8',
    dwell: 2.4,
    layers: [
      { src: 'h8-hands-a', kind: 'frame', glow: '#ffe0a0', ms: 1.0 },
      { src: 'h8-hands-b', kind: 'frame', glow: '#ffc880', ms: 1.0 },
    ],
    mood: M(52, 'gold', '#ffd890'),
  },
  { type: 'epilogue', id: 'epilogue', dwell: 1.7, mood: M(50, 'gold', '#ffd27a') },
];

export const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
export const stageIds = scenes.filter((s) => s.type === 'stage' || s.type === 'epilogue').map((s) => s.id);
