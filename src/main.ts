import '@fontsource/cinzel-decorative/latin-400.css';
import '@fontsource/cinzel-decorative/latin-700.css';
import '@fontsource/montserrat/latin-500.css';
import '@fontsource/montserrat/latin-600.css';
import '@fontsource/montserrat/latin-700.css';
import '@fontsource/montserrat/cyrillic-500.css';
import '@fontsource/montserrat/cyrillic-600.css';
import '@fontsource/montserrat/cyrillic-700.css';
import '@fontsource/libre-franklin/latin-500.css';
import '@fontsource/libre-franklin/latin-600.css';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/cormorant-garamond/latin-500-italic.css';
import '@fontsource/cormorant-garamond/cyrillic-500.css';
import '@fontsource/cormorant-garamond/cyrillic-500-italic.css';
import 'lenis/dist/lenis.css';
import './styles/main.css';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

import { detectLang, locales, order, saveLang } from './i18n';
import { startBeat, setBpm, registerPulse, registerGlow } from './core/beat';
import { Particles } from './core/particles';
import { bindSoundButton, initAudio, startAudio } from './core/audio';
import { renderApp } from './scenes/render';
import { destroyScenes, initScenes, playIntro, sceneStart, type Hooks } from './scenes/animate';
import { scenes, type Mood } from './scenes/config';

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
const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, smoothWheel: true });
lenis.stop();
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
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
function paintRail(n: number) {
  railStage = n;
  railItems.forEach((li, i) => {
    li.classList.toggle('on', i + 1 === n);
    li.classList.toggle('done', i + 1 < n);
  });
}

function buildLangButtons() {
  const html = order
    .map((c) => `<button type="button" data-lang="${c}" aria-pressed="${c === lang}" lang="${c}" title="${locales[c].name}">${locales[c].label}</button>`)
    .join('');
  $('#lang').innerHTML = html;
  const pl = document.getElementById('pre-langs');
  if (pl) pl.innerHTML = html;
  document.querySelectorAll<HTMLButtonElement>('[data-lang]').forEach((b) =>
    b.addEventListener('click', () => switchLang(b.dataset.lang!)),
  );
}

function paintPreloaderText() {
  const L = locales[lang];
  const label = document.getElementById('pre-label');
  const enterLabel = document.querySelector('#pre-enter .pre__label');
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
    setBpm(m.bpm);
    particles.setMode(m.particles);
    root.style.setProperty('--accent', m.accent);
    if (el.id !== 'finale') setUi(m.ui);
    if (def.type === 'stage') paintRail(def.n);
    else if (def.type === 'epilogue') paintRail(8);
    else if (def.type === 'hero') paintRail(0);
  },
};

function mount() {
  app.innerHTML = renderApp(locales[lang]);
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
  const keep = currentId;
  await gsap.to(app, { opacity: 0, duration: 0.35, ease: 'power1.in' });
  destroyScenes();
  mount();
  const y = sceneStart(keep);
  if (y != null) lenis.scrollTo(y, { immediate: true, force: true });
  ScrollTrigger.update();
  gsap.to(app, { opacity: 1, duration: 0.6, ease: 'power1.out' });
}

/* ---------------- overall progress bar ---------------- */
ScrollTrigger.create({
  trigger: document.body,
  start: 0,
  end: 'max',
  onUpdate: (s) => $('#rail').style.setProperty('--p', s.progress.toFixed(4)),
});

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
  const critical = Array.from(app.querySelectorAll<HTMLImageElement>('.hero img, #heart-1 img'));
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
  const imgs = Array.from(app.querySelectorAll<HTMLImageElement>('img[loading="lazy"]'));
  let i = 0;
  const step = () => {
    for (let k = 0; k < 2 && i < imgs.length; k++, i++) imgs[i].loading = 'eager';
    if (i < imgs.length) setTimeout(step, 450);
    else prefetched = true;
  };
  setTimeout(step, 1200);
}

async function enter() {
  if (entered) return;
  entered = true;
  const pre = $('#preloader');
  startBeat();
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
  void initAudio();
  bindSoundButton((on) => (on ? 'Sound on' : 'Sound off'));
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
  await preload();
  const ui = $('#pre-ui');
  ui.setAttribute('aria-hidden', 'false');
  ui.classList.add('show');
  gsap.to('.pre__pct', { opacity: 0, duration: 0.5 });
  gsap.to(ui, { opacity: 1, height: 'auto', duration: 0.9, ease: 'power2.out' });
  const btn = $<HTMLButtonElement>('#pre-enter');
  btn.addEventListener('click', enter);
  btn.focus({ preventScroll: true });
}

history.scrollRestoration = 'manual';
scrollTo(0, 0);
void scenes;
boot();
