import '@fontsource/cinzel-decorative/latin-400.css';
import '@fontsource/cinzel-decorative/latin-700.css';
import '@fontsource/montserrat/latin-500.css';
import '@fontsource/montserrat/latin-600.css';
import '@fontsource/montserrat/latin-700.css';
import '@fontsource/montserrat/cyrillic-500.css';
import '@fontsource/montserrat/cyrillic-600.css';
import '@fontsource/montserrat/cyrillic-700.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/cyrillic-400.css';
import '@fontsource/inter/cyrillic-500.css';
import '@fontsource/inter/cyrillic-600.css';
import '@fontsource/inter/cyrillic-ext-400.css';
import '@fontsource/inter/cyrillic-ext-500.css';
import '@fontsource/libre-franklin/latin-500.css';
import '@fontsource/libre-franklin/latin-600.css';
import '@fontsource/cormorant-garamond/latin-600.css';
import '@fontsource/cormorant-garamond/latin-700.css';
import '@fontsource/cormorant-garamond/cyrillic-600.css';
import '@fontsource/cormorant-garamond/cyrillic-700.css';
import '@fontsource/cormorant-garamond/latin-600-italic.css';
import '@fontsource/cormorant-garamond/cyrillic-600-italic.css';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/cormorant-garamond/latin-500-italic.css';
import '@fontsource/cormorant-garamond/cyrillic-500.css';
import '@fontsource/cormorant-garamond/cyrillic-500-italic.css';
import 'lenis/dist/lenis.css';
import './styles/main.css';
import './styles/extra.css';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

import { detectLang, extraFor, locales, order, saveLang } from './i18n';
import { startBeat, setBpm, registerPulse, registerGlow } from './core/beat';
import { Particles } from './core/particles';
import { bindSoundButton, initAudio, primeSound, repaintSound, setBrightness, setSoftVolume, softTick, startAudio } from './core/audio';
import { renderApp } from './scenes/render';
import { destroyScenes, initScenes, playIntro, sceneStart, type Hooks } from './scenes/animate';
import { scenes, type Mood } from './scenes/config';
import { isSoft, setSoft } from './core/prefs';
import { close as closePanel, initPanel, openDiary, openMap, openPractice } from './ui/panel';
import { closePulse, initPulse, openPulse } from './ui/pulse';
import { initGlossaryDismiss } from './ui/glossary';
import { stopSpeech, toggleSpeech, speechSupported } from './ui/speech';
import { initAgent, openAgent, resetAgent } from './ui/agent';
import { agentFor } from './i18n/agent';
import { getNotes, setNote } from './ui/store';
import { windowImages, stopWindowing } from './core/memory';
import { clearScroll, saveScroll, savedScroll } from './core/session';
import { chapterTick, initTouchPlay } from './ui/touch';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const root = document.documentElement;
const app = $('#app');

let lang = detectLang();
let entered = false;
let currentId = 'hero';
let prefetched = false;
root.lang = lang;

/* ---------------- smooth scroll ---------------- */
/**
 * Desktop: Lenis smooth wheel scrolling. Touch devices: plain native scrolling — a JS scroll layer on top of
 * iOS/Android momentum scrolling and the collapsing address bar made the page jump; native is rock solid.
 */
const touchDevice = matchMedia('(pointer: coarse)').matches || innerWidth < 900;
interface Scroller {
  stop(): void;
  start(): void;
  scrollTo(y: number, o?: { duration?: number; immediate?: boolean; force?: boolean }): void;
}
let lenis: Scroller;
if (!touchDevice) {
  const L = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, smoothWheel: true });
  L.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => L.raf(t * 1000));
  lenis = L;
} else {
  lenis = {
    stop: () => root.classList.add('scroll-lock'),
    start: () => root.classList.remove('scroll-lock'),
    scrollTo: (y, o) => scrollTo({ top: y, behavior: o?.immediate ? 'auto' : 'smooth' }),
  };
}
lenis.stop();
gsap.ticker.lagSmoothing(0);

/* ---------------- fixed chrome ---------------- */
const particles = new Particles($<HTMLCanvasElement>('#fx'));
const railList = $('#rail-list');
let railItems: HTMLElement[] = [];

function setUi(ui: Mood['ui']) {
  if (root.dataset.ui !== ui) root.dataset.ui = ui;
}

function buildRail() {
  const L = locales[lang];
  const names = [...L.stages.map((s) => s.title.split('.')[0]), L.epilogue.title];
  railList.innerHTML = names
    .map((n, i) => `<li data-n="${i + 1}"><button type="button" aria-label="${n}"></button><span>${n}</span></li>`)
    .join('');
  railItems = Array.from(railList.querySelectorAll<HTMLElement>('li'));
  railItems.forEach((li, i) =>
    li.querySelector('button')!.addEventListener('click', () => {
      const id = i < 7 ? `stage-${i + 1}` : 'epilogue';
      const y = sceneStart(id);
      if (y != null) lenis.scrollTo(y, { duration: 2.2 });
    }),
  );
  paintRail(railStage);
}

let railStage = 0;
let sceneBpm = 80;
function paintRail(n: number) {
  railStage = n;
  railItems.forEach((li, i) => {
    li.classList.toggle('on', i + 1 === n);
    li.classList.toggle('done', i + 1 < n);
  });
}

function buildLangButtons() {
  const row = order
    .map((c) => `<button type="button" data-lang="${c}" aria-pressed="${c === lang}" lang="${c}" title="${locales[c].name}">${locales[c].label}</button>`)
    .join('');
  const pl = document.getElementById('pre-langs');
  if (pl) pl.innerHTML = row;
  const list = order
    .map(
      (c) =>
        `<li><button type="button" role="option" data-lang="${c}" aria-selected="${c === lang}" aria-pressed="${c === lang}" lang="${c}"><b>${locales[c].label}</b>${locales[c].name}</button></li>`,
    )
    .join('');
  $('#lang').innerHTML = `<button type="button" class="lang__cur" aria-haspopup="listbox" aria-expanded="false" aria-label="${locales[lang].ui.chooseLanguage}">${locales[lang].label}<i></i></button><ul class="lang__list" role="listbox">${list}</ul>`;
  const wrap = $('#lang');
  const cur = wrap.querySelector<HTMLButtonElement>('.lang__cur')!;
  cur.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = wrap.classList.toggle('open');
    cur.setAttribute('aria-expanded', String(open));
  });
  document.querySelectorAll<HTMLButtonElement>('[data-lang]').forEach((b) =>
    b.addEventListener('click', () => {
      wrap.classList.remove('open');
      switchLang(b.dataset.lang!);
    }),
  );
}
addEventListener('click', () => $('#lang').classList.remove('open'));
addEventListener('keydown', (e) => {
  if (e.key === 'Escape') $('#lang').classList.remove('open');
});

function paintSoundLabel(on = document.getElementById('snd')?.classList.contains('on') ?? false) {
  const t = document.getElementById('pre-snd-t');
  if (t) t.textContent = on ? locales[lang].ui.musicOn : locales[lang].ui.musicOff;
}

function paintUiLabels() {
  const X = extraFor(lang).ui;
  const pu = document.getElementById('pulse-btn');
  if (pu) {
    pu.setAttribute('aria-label', X.pulseBtn);
    pu.title = X.pulseBtn;
  }
  const ag = document.getElementById('agent-btn');
  if (ag) {
    ag.setAttribute('aria-label', agentFor(lang).ui.open);
    ag.title = agentFor(lang).ui.open;
  }
  const m = document.getElementById('map-btn');
  const sf = document.getElementById('soft-btn');
  if (m) {
    m.setAttribute('aria-label', X.map);
    m.title = X.map;
  }
  if (sf) {
    sf.setAttribute('aria-label', X.soft);
    sf.title = X.softTitle;
    sf.setAttribute('aria-pressed', String(isSoft()));
  }
}

function paintPreloaderText() {
  repaintSound();
  const L = locales[lang];
  const label = document.getElementById('pre-label');
  const enterLabel = document.querySelector('#pre-enter .pre__label');
  paintSoundLabel();
  paintUiLabels();
  if (label) label.textContent = L.ui.loading;
  if (enterLabel) enterLabel.textContent = L.ui.enter;
  document.querySelectorAll<HTMLButtonElement>('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
}

/* ---------------- scene hooks ---------------- */
const hooks: Hooks = {
  setUi,
  activate(def, el) {
    currentId = def.id === 'epilogue' && el.id === 'finale' ? 'finale' : def.id;
    const m = def.mood;
    sceneBpm = m.bpm;
    setBpm(m.bpm);
    if (!touchDevice) particles.setMode(m.particles);
    root.style.setProperty('--accent', m.accent);
    if (el.id !== 'finale') setUi(m.ui);
    if (def.type === 'stage') {
      if (entered && railStage !== def.n) chapterTick();
      paintRail(def.n);
    } else if (def.type === 'epilogue') paintRail(8);
    else if (def.type === 'hero') paintRail(0);
  },
};

function mount() {
  app.innerHTML = renderApp(locales[lang]);
  if (touchDevice) windowImages(app);
  else stopWindowing();
  if (prefetched) app.querySelectorAll<HTMLImageElement>('img[loading="lazy"]').forEach((i) => (i.loading = 'eager'));
  initScenes(hooks);
  ScrollTrigger.refresh();
}

async function switchLang(code: string) {
  if (code === lang || !locales[code]) return;
  lang = code;
  saveLang(code);
  buildLangButtons();
  buildRail();
  paintPreloaderText();
  if (!entered) {
    destroyScenes();
    mount();
    return;
  }
  stopSpeech();
  closePulse();
  resetAgent();
  await remount();
}

/** Rebuild the scenes in place (language or gentle-mode change) and return to the same scene. */
async function remount() {
  const keep = currentId;
  await gsap.to(app, { opacity: 0, duration: 0.35, ease: 'power1.in' });
  destroyScenes();
  mount();
  const y = sceneStart(keep);
  if (y != null) lenis.scrollTo(y, { immediate: true, force: true });
  ScrollTrigger.update();
  gsap.to(app, { opacity: 1, duration: 0.6, ease: 'power1.out' });
}

async function toggleSoft() {
  const v = !isSoft();
  setSoft(v);
  setSoftVolume(v);
  stopSpeech();
  paintUiLabels();
  if (entered) await remount();
  else {
    destroyScenes();
    mount();
  }
}

/* ---------------- overall progress bar ---------------- */
ScrollTrigger.create({
  trigger: document.body,
  start: 0,
  end: 'max',
  onUpdate: (s) => {
    $('#rail').style.setProperty('--p', s.progress.toFixed(4));
    // light conquers darkness: the screen warms and the music opens up as the journey advances
    $('#dawn').style.opacity = (Math.pow(s.progress, 1.25) * 0.62).toFixed(3);
    setBrightness(s.progress);
  },
});

/* ---------------- the visitor's own tools: practice, diary, map, listening ---------------- */
initPanel({
  L: () => locales[lang],
  X: () => extraFor(lang),
  lang: () => lang,
  stop: () => lenis.stop(),
  start: () => {
    if (entered) lenis.start();
  },
  goto: (id) => {
    const y = sceneStart(id);
    if (y != null) lenis.scrollTo(y, { duration: 2.2 });
  },
  current: () => railStage,
  pulse: () => {
    closePanel();
    setTimeout(openPulse, 350);
  },
});
initPulse({
  X: () => extraFor(lang),
  stop: () => lenis.stop(),
  start: () => {
    if (entered) lenis.start();
  },
  restoreBpm: () => setBpm(sceneBpm, 2.4),
  current: () => railStage,
  openNote: (n) => openPractice(n),
});
initAgent({
  lang: () => lang,
  stop: () => lenis.stop(),
  start: () => {
    if (entered) lenis.start();
  },
  stage: (n) => ({ title: locales[lang].stages[n - 1].title.split('.')[0], question: extraFor(lang).practice[n - 1] ?? '' }),
  current: () => railStage,
  saveNote: (stage, text) => {
    const k = stage >= 1 && stage <= 7 ? String(stage) : 'letter';
    const old = getNotes()[k] ?? '';
    setNote(k, old ? `${old}\n\n${text}` : text);
  },
});
initGlossaryDismiss();
app.addEventListener('click', (e) => {
  const t = (e.target as HTMLElement).closest<HTMLElement>('[data-practice], [data-listen], [data-diary], [data-map], [data-pulse-open], [data-agent]');
  if (!t) return;
  if (t.dataset.agent) openAgent(Number(t.dataset.agent));
  else if (t.dataset.practice) openPractice(Number(t.dataset.practice));
  else if (t.dataset.diary !== undefined) openDiary();
  else if (t.dataset.map !== undefined) openMap();
  else if (t.dataset.pulseOpen !== undefined) openPulse();
  else if (t.dataset.listen) {
    const n = Number(t.dataset.listen);
    const st = locales[lang].stages[n - 1];
    const X = extraFor(lang).ui;
    toggleSpeech(t, [st.title, ...(st.q ? [st.q] : []), ...st.p], lang, [X.listen, X.stopListen]);
  }
});
document.getElementById('map-btn')?.addEventListener('click', () => openMap());
document.getElementById('agent-btn')?.addEventListener('click', () => openAgent());
document.getElementById('pulse-btn')?.addEventListener('click', () => openPulse());
document.getElementById('soft-btn')?.addEventListener('click', () => void toggleSoft());
if (!speechSupported) document.documentElement.classList.add('no-speech');

/* ---------------- cursor light ---------------- */
{
  const beam = $('#beam i');
  registerPulse(beam, 0.04, true, [0.62, 0.38]);
  const fine = matchMedia('(pointer: fine)').matches;
  gsap.set(beam, { x: innerWidth * 0.5, y: innerHeight * 0.45 });
  if (fine) {
    const qx = gsap.quickTo(beam, 'x', { duration: 1.1, ease: 'power3' });
    const qy = gsap.quickTo(beam, 'y', { duration: 1.1, ease: 'power3' });
    addEventListener('pointermove', (e) => {
      qx(e.clientX);
      qy(e.clientY);
    });
  }
}

/* ---------------- preloader ---------------- */
function waitImg(img: HTMLImageElement): Promise<void> {
  img.loading = 'eager';
  if (img.complete && img.naturalWidth) return Promise.resolve();
  return new Promise((res) => {
    img.addEventListener('load', () => res(), { once: true });
    img.addEventListener('error', () => res(), { once: true });
  });
}

async function preload(): Promise<void> {
  const critical = Array.from(app.querySelectorAll<HTMLImageElement>(touchDevice ? '.hero img' : '.hero img, #heart-1 img'));
  const fonts = ['700 40px "Cinzel Decorative"', '700 20px Montserrat', '500 16px "Libre Franklin"'].map((f) =>
    document.fonts.load(f, 'Opus Magnum').catch(() => undefined),
  );
  const tasks: Promise<unknown>[] = [...critical.map(waitImg), ...fonts];
  const state = { p: 0 };
  let done = 0;
  const pct = $('#pre-pct');
  const paint = () => (pct.textContent = String(Math.round(state.p)));
  tasks.forEach((t) =>
    t.then(() => {
      done++;
      gsap.to(state, { p: (done / tasks.length) * 100, duration: 0.7, ease: 'power2.out', onUpdate: paint });
    }),
  );
  await Promise.all([Promise.all(tasks), new Promise((r) => setTimeout(r, 1700))]);
  gsap.to(state, { p: 100, duration: 0.3, onUpdate: paint });
}

function prefetchRest() {
  // phones: keep images lazy — decoding every frame up front exhausts memory and the browser reloads the page
  if (touchDevice) return;
  const imgs = Array.from(app.querySelectorAll<HTMLImageElement>('img[loading="lazy"]'));
  let i = 0;
  const step = () => {
    for (let k = 0; k < 2 && i < imgs.length; k++, i++) imgs[i].loading = 'eager';
    if (i < imgs.length) setTimeout(step, 450);
    else prefetched = true;
  };
  setTimeout(step, 1200);
}

async function enter(fast = false) {
  if (entered) return;
  entered = true;
  const pre = $('#preloader');
  startBeat();
  if (fast) {
    // the page was reloaded mid-journey: no intro, straight back to where the visitor was
    pre.remove();
    playIntro();
    lenis.start();
    prefetchRest();
    return;
  }
  void startAudio();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  gsap.to('.pre__content', { opacity: 0, scale: 1.06, duration: 0.7, ease: 'power2.in' });
  if (reduce) {
    gsap.to(pre, { opacity: 0, duration: 0.8, delay: 0.3, onComplete: () => pre.remove() });
  } else {
    pre.classList.add('opening');
    gsap.fromTo(pre, { '--r': '0%' }, { '--r': '90%', duration: 2.4, delay: 0.35, ease: 'power3.inOut', onComplete: () => pre.remove() });
  }
  setTimeout(() => playIntro(), 500);
  setTimeout(() => lenis.start(), 2400);
  prefetchRest();
}

async function boot() {
  addEventListener('soundchange', (e) => paintSoundLabel((e as CustomEvent<boolean>).detail));
  void initAudio();
  bindSoundButton();
  // the heartbeat sounds from the intro on (at the first gesture where autoplay is blocked); music is the visitor's choice
  primeSound();
  buildLangButtons();
  buildRail();
  paintPreloaderText();
  mount();
  // the intro already breathes: the title and the Enter button pulse on the heartbeat clock
  startBeat();
  registerPulse($('.pre__t'), 0.02, true);
  registerGlow($('.pre__g'), 0.28, 0.62, true);
  registerPulse($('#pre-enter'), 0.03, true);
  registerGlow($('.pre__ring'), 0.22, 0.72, true);
  $('#grain').style.backgroundImage = `url(${import.meta.env.BASE_URL}img/grain.png)`;
  setSoft(isSoft());
  setSoftVolume(isSoft());
  await preload();
  const ui = $('#pre-ui');
  ui.setAttribute('aria-hidden', 'false');
  ui.classList.add('show');
  gsap.to('.pre__pct', { opacity: 0, duration: 0.5 });
  gsap.to(ui, { opacity: 1, height: 'auto', duration: 0.9, ease: 'power2.out' });
  const btn = $<HTMLButtonElement>('#pre-enter');
  const back = savedScroll();
  if (back != null && back > 300) {
    void enter(true);
    setTimeout(() => {
      ScrollTrigger.refresh();
      lenis.scrollTo(back, { immediate: true, force: true });
      ScrollTrigger.update();
    }, 250);
    return;
  }
  btn.addEventListener('click', () => void enter());
  btn.focus({ preventScroll: true });
}

// remember where we are (cheap, throttled) so a browser reload never throws the visitor back to the intro
{
  let t = 0;
  addEventListener(
    'scroll',
    () => {
      if (!entered || t) return;
      t = window.setTimeout(() => {
        t = 0;
        saveScroll(scrollY);
      }, 400);
    },
    { passive: true },
  );
}
// taps on the artwork ripple; the first heart answers with a beat
initTouchPlay(
  app,
  () => getComputedStyle(root).getPropertyValue('--accent').trim() || '#ff7a3c',
  () => {
    const h = document.querySelector<HTMLElement>('.hero__heart');
    if (h) gsap.fromTo(h, { scale: 1.08 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1,0.4)', overwrite: 'auto' });
    softTick();
  },
);
void clearScroll;
history.scrollRestoration = 'manual';
scrollTo(0, 0);
void scenes;
boot();
