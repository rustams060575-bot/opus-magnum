/**
 * The visitor's own path: which rituals they lived through, the one small step they chose in each, the colours of
 * their mandala, the lights they left. Stored only on this device (localStorage); nothing is ever sent anywhere.
 * There are no scores, levels or streaks: only a heart that slowly fills with gold.
 */
const KEY = 'opus-journey';

export interface Journey {
  v: 1;
  /** stage → chosen step id (0..2) or -1 when the ritual was done without choosing */
  done: Record<string, number>;
  /** the seven petal colours of the visitor's mandala (index into PALETTE) */
  petals: number[];
  /** the step carried into tomorrow (stage number) */
  tomorrow: number | null;
  /** lights left for other travellers (local count) */
  lights: number;
  /** golden crack samples revealed in the kintsugi ritual (0..1) */
  kintsugi: number;
}

export const PALETTE = ['#e8b84a', '#d9566a', '#5aa6d6', '#7bc4a0', '#b690e0', '#f2d9a0'];

const blank = (): Journey => ({ v: 1, done: {}, petals: [], tomorrow: null, lights: 0, kintsugi: 0 });
let st: Journey = load();
const subs = new Set<() => void>();

function load(): Journey {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null') as Partial<Journey> | null;
    if (!raw || raw.v !== 1) return blank();
    const b = blank();
    return {
      v: 1,
      done: typeof raw.done === 'object' && raw.done ? Object.fromEntries(Object.entries(raw.done).filter(([k, v]) => /^[1-7]$/.test(k) && typeof v === 'number')) : b.done,
      petals: Array.isArray(raw.petals) ? raw.petals.filter((n) => Number.isInteger(n) && n >= 0 && n < PALETTE.length).slice(0, 7) : b.petals,
      tomorrow: typeof raw.tomorrow === 'number' ? raw.tomorrow : null,
      lights: typeof raw.lights === 'number' ? Math.max(0, Math.min(999, raw.lights)) : 0,
      kintsugi: typeof raw.kintsugi === 'number' ? Math.max(0, Math.min(1, raw.kintsugi)) : 0,
    };
  } catch {
    return blank();
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(st));
  } catch {
    /* private mode / full: the visit still works */
  }
  subs.forEach((f) => f());
}

export const journey = (): Journey => st;
export const onJourney = (f: () => void): (() => void) => {
  subs.add(f);
  return () => subs.delete(f);
};
export const isDone = (n: number): boolean => String(n) in st.done;
export const doneCount = (): number => Object.keys(st.done).length;
/** how much of the heart has turned to gold: the seven rituals count equally, the kintsugi ritual adds its own share */
export const repair = (): number => Math.min(1, (doneCount() + st.kintsugi * 0.0) / 7);

export function completeRitual(n: number, step = -1): void {
  st.done[String(n)] = step;
  save();
}
export function setPetals(p: number[]): void {
  st.petals = p.slice(0, 7);
  save();
}
export function setTomorrow(n: number | null): void {
  st.tomorrow = n;
  save();
}
export function addLight(): number {
  st.lights = Math.min(999, st.lights + 1);
  save();
  return st.lights;
}
export function setKintsugi(v: number): void {
  st.kintsugi = Math.max(st.kintsugi, v);
  save();
}
export function resetJourney(): void {
  st = blank();
  save();
}
