import type { ParticleMode } from '../core/particles';

/** Public-folder image helper (works on Vercel root and GitHub Pages subpath). */
export const img = (name: string): string => `${import.meta.env.BASE_URL}img/${name}.webp`;

export interface Mood {
  bpm: number;
  particles: ParticleMode;
  accent: string;
  /** colour of fixed UI (header, rail) */
  ui: 'light' | 'dark';
}

export interface HeartLayer {
  src: string;
  /** portal = image cropped to a glowing oval (light backgrounds); soft = feathered edges (dark backgrounds) */
  kind: 'portal' | 'soft';
  glow: string;
  /** optional full-bleed backdrop that travels with this layer */
  behind?: string;
}

export type SceneDef =
  | { type: 'hero'; id: 'hero'; mood: Mood }
  | { type: 'heart'; id: string; layers: HeartLayer[]; smoke?: boolean; mood: Mood }
  | { type: 'stage'; id: string; n: number; side: 'left' | 'right'; mood: Mood }
  | { type: 'epilogue'; id: 'epilogue'; mood: Mood };

const M = (bpm: number, particles: ParticleMode, accent: string, ui: 'light' | 'dark' = 'light'): Mood => ({
  bpm,
  particles,
  accent,
  ui,
});

/**
 * The journey, in order. To insert a new heart interlude, add a `heart` entry
 * (and drop its image in public/img). Hearts transform into each other as you scroll.
 */
export const scenes: SceneDef[] = [
  { type: 'hero', id: 'hero', mood: M(84, 'dust', '#ff5a2a') },

  // — Nigredo —
  {
    type: 'heart',
    id: 'heart-1',
    smoke: true,
    layers: [
      { src: 'heart-chained', kind: 'portal', glow: '#b8352c' },
      { src: 'heart-caged', kind: 'soft', glow: '#e0a24a' },
    ],
    mood: M(88, 'ember', '#ff4a2a'),
  },
  { type: 'stage', id: 'stage-1', n: 1, side: 'right', mood: M(92, 'ember', '#ff6a2a', 'dark') },

  // — Anima & Animus —
  {
    type: 'heart',
    id: 'heart-2',
    layers: [
      { src: 'heart-lava', kind: 'soft', glow: '#ff6a1f' },
      { src: 'heart-stone', kind: 'soft', glow: '#ffb44a', behind: 'crescent' },
    ],
    mood: M(82, 'ember', '#ff7a2a'),
  },
  { type: 'stage', id: 'stage-2', n: 2, side: 'left', mood: M(76, 'ash', '#ff5a3c') },

  // — The Wise Old Man —
  {
    type: 'heart',
    id: 'heart-3',
    layers: [{ src: 'heart-hall', kind: 'soft', glow: '#ffc766' }],
    mood: M(70, 'gold', '#ffc766'),
  },
  { type: 'stage', id: 'stage-3', n: 3, side: 'left', mood: M(66, 'gold', '#ffb347') },

  // — The Hero’s Path —
  {
    type: 'heart',
    id: 'heart-4',
    layers: [
      { src: 'heart-green', kind: 'portal', glow: '#54d48a' },
      { src: 'heart-fire', kind: 'soft', glow: '#ff7a2e' },
    ],
    mood: M(70, 'dust', '#54d48a'),
  },
  { type: 'stage', id: 'stage-4', n: 4, side: 'right', mood: M(66, 'snow', '#9fd4ff') },

  // — Power & the Void —
  { type: 'stage', id: 'stage-5', n: 5, side: 'left', mood: M(64, 'star', '#5aa0ff') },
  { type: 'stage', id: 'stage-6', n: 6, side: 'left', mood: M(50, 'star', '#ffb45a') },

  // — The Self —
  {
    type: 'heart',
    id: 'heart-7',
    layers: [
      { src: 'heart-gold', kind: 'portal', glow: '#ffd37a' },
      { src: 'heart-flowers', kind: 'portal', glow: '#ff4d5e' },
    ],
    mood: M(56, 'gold', '#ffd37a'),
  },
  { type: 'stage', id: 'stage-7', n: 7, side: 'left', mood: M(54, 'gold', '#ffd27a') },
  { type: 'epilogue', id: 'epilogue', mood: M(50, 'gold', '#ffd27a') },
];

export const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

/** Stage 1 is the only one on a light (parchment) background — UI switches to dark ink there. */
export const stageIds = scenes.filter((s) => s.type === 'stage' || s.type === 'epilogue').map((s) => s.id);
