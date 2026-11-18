import gsap from 'gsap';
import type { Locale } from '../i18n';
import type { Extra } from '../i18n/extra';
import { ROMAN } from '../scenes/config';
import { getNotes, setNote } from './store';

/**
 * One overlay for everything the visitor does themselves: the practice (question + breathing + note),
 * "My path" (notes, letter to self, quote card, share) and the map of the journey.
 * Notes never leave the device.
 */
export interface PanelCtx {
  L: () => Locale;
  X: () => Extra;
  lang: () => string;
  stop: () => void;
  start: () => void;
  goto: (sceneId: string) => void;
  /** 0 = hero, 1..7 = stages, 8 = epilogue */
  current: () => number;
  pulse: () => void;
}

let c: PanelCtx;
let root: HTMLElement;
let isOpen = false;
let lastFocus: HTMLElement | null = null;
let breath: gsap.core.Timeline | null = null;
let saveT = 0;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

const HEART = 'M50 90 C19 67 6 49 6 32 C6 17 18 8 31 8 C40 8 47 13 50 21 C53 13 60 8 69 8 C82 8 94 17 94 32 C94 49 81 67 50 90Z';

export function initPanel(ctx: PanelCtx): void {
  c = ctx;
  root = document.createElement('div');
  root.id = 'panel';
  root.hidden = true;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  document.body.appendChild(root);
  root.addEventListener('pointerdown', (e) => {
    if (e.target === root) close();
  });
  addEventListener('keydown', (e) => {
    if (isOpen && e.key === 'Escape') close();
  });
}

function show(inner: string, cls = ''): void {
  lastFocus = (document.activeElement as HTMLElement) || null;
  root.className = cls;
  root.innerHTML = `<div class="pn__card"><button class="pn__x" type="button" aria-label="${esc(c.X().ui.close)}"><i></i><i></i></button>${inner}</div>`;
  root.hidden = false;
  isOpen = true;
  c.stop();
  root.querySelector('.pn__x')!.addEventListener('click', close);
  requestAnimationFrame(() => root.classList.add('on'));
  root.querySelector<HTMLElement>('textarea, .pn__x')?.focus({ preventScroll: true });
}

export function close(): void {
  if (!isOpen) return;
  isOpen = false;
  breath?.kill();
  breath = null;
  root.classList.remove('on');
  c.start();
  setTimeout(() => {
    if (!isOpen) {
      root.hidden = true;
      root.innerHTML = '';
    }
  }, 450);
  lastFocus?.focus?.({ preventScroll: true });
}

/* ------------------------------ practice ------------------------------ */
export function openPractice(n: number): void {
  const L = c.L();
  const X = c.X();
  const saved = getNotes()[String(n)] ?? '';
  show(
    `<p class="pn__eyebrow">${esc(L.ui.stage)} ${ROMAN[n - 1]} · ${esc(X.ui.practiceTitle)}</p>
<p class="pn__q">${esc(X.practice[n - 1] ?? '')}</p>
<div class="pn__breath">
  <svg class="pn__orb" viewBox="0 0 100 100" aria-hidden="true"><defs><radialGradient id="pg" cx="50%" cy="40%" r="65%"><stop offset="0" stop-color="#ffcf7a"/><stop offset="1" stop-color="#e2452a"/></radialGradient></defs><path d="${HEART}" fill="url(#pg)"/></svg>
  <p class="pn__bl" aria-live="polite">${esc(X.ui.inhale)}</p>
</div>
<div class="pn__row" style="justify-content:center"><button class="pn__btn pn__pulse" type="button" id="pn-pulse">${esc(X.ui.pulseBtn)}</button></div>
<p class="pn__hint">${esc(X.ui.breathHint)}</p>
<textarea class="pn__ta" rows="4" maxlength="2000" placeholder="${esc(X.ui.notePh)}">${esc(saved)}</textarea>
<p class="pn__saved" aria-live="polite"></p>`,
    'pn--practice',
  );
  root.querySelector('#pn-pulse')!.addEventListener('click', () => c.pulse());
  const orb = root.querySelector<SVGElement>('.pn__orb')!;
  const lab = root.querySelector<HTMLElement>('.pn__bl')!;
  const setLab = (t: string) => () => {
    lab.textContent = t;
  };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('soft');
  gsap.set(orb, { scale: 0.6, transformOrigin: '50% 55%' });
  breath = gsap.timeline({ repeat: -1 });
  breath
    .call(setLab(X.ui.inhale), [], 0)
    .to(orb, { scale: 1, duration: 4, ease: 'sine.inOut' }, 0)
    .call(setLab(X.ui.hold), [], 4)
    .to(orb, { scale: 1.02, duration: 1, ease: 'none' }, 4)
    .call(setLab(X.ui.exhale), [], 5)
    .to(orb, { scale: 0.6, duration: 6, ease: 'sine.inOut' }, 5);
  if (reduce) breath.timeScale(0.8);
  const ta = root.querySelector<HTMLTextAreaElement>('.pn__ta')!;
  const msg = root.querySelector<HTMLElement>('.pn__saved')!;
  ta.addEventListener('input', () => {
    clearTimeout(saveT);
    saveT = window.setTimeout(() => {
      setNote(String(n), ta.value);
      msg.textContent = X.ui.saved;
    }, 400);
  });
}

/* -------------------------------- diary -------------------------------- */
export function openDiary(): void {
  const L = c.L();
  const X = c.X();
  const notes = getNotes();
  const items = L.stages
    .map((s, i) => ({ s, i, t: notes[String(i + 1)] }))
    .filter((x) => x.t)
    .map(
      (x) =>
        `<li><b>${esc(L.ui.stage)} ${ROMAN[x.i]} · ${esc(x.s.title.split('.')[0])}</b><p>${esc(x.t!).replace(/\n/g, '<br>')}</p></li>`,
    )
    .join('');
  show(
    `<p class="pn__eyebrow">${esc(X.ui.diary)}</p>
<h3 class="pn__h">${esc(X.ui.diaryTitle)}</h3>
${items ? `<ul class="pn__notes">${items}</ul>` : `<p class="pn__empty">${esc(X.ui.diaryEmpty)}</p>`}
<div class="pn__sec">
  <h4>${esc(X.ui.letterTitle)}</h4>
  <p class="pn__hint">${esc(X.ui.letterText)}</p>
  <textarea class="pn__ta" id="pn-letter" rows="5" maxlength="3000" placeholder="${esc(X.ui.letterPh)}">${esc(notes.letter ?? '')}</textarea>
  <div class="pn__row">
    <button class="pn__btn" type="button" id="pn-ics">${esc(X.ui.letterBtn)}</button>
    <button class="pn__btn pn__btn--ghost" type="button" id="pn-card">${esc(X.ui.card)}</button>
    <button class="pn__btn pn__btn--ghost" type="button" id="pn-share">${esc(X.ui.share)}</button>
  </div>
  <p class="pn__saved" id="pn-msg" aria-live="polite"></p>
</div>`,
    'pn--diary',
  );
  const letter = root.querySelector<HTMLTextAreaElement>('#pn-letter')!;
  const msg = root.querySelector<HTMLElement>('#pn-msg')!;
  letter.addEventListener('input', () => {
    clearTimeout(saveT);
    saveT = window.setTimeout(() => {
      setNote('letter', letter.value);
      msg.textContent = X.ui.saved;
    }, 400);
  });
  root.querySelector('#pn-ics')!.addEventListener('click', () => {
    setNote('letter', letter.value);
    downloadICS(letter.value, X.ui.letterTitle);
  });
  root.querySelector('#pn-card')!.addEventListener('click', () => void downloadCard());
  root.querySelector('#pn-share')!.addEventListener('click', async () => {
    const url = location.origin + location.pathname;
    const data = { title: 'Opus Magnum — AR Design', text: L.hero.tagline, url };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(url);
        msg.textContent = X.ui.copied;
      }
    } catch {
      /* cancelled */
    }
  });
}

/** A calendar event one month from now that carries the letter in its description (no server involved). */
function downloadICS(text: string, title: string): void {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  d.setHours(10, 0, 0, 0);
  const f = (x: Date) => x.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const end = new Date(d.getTime() + 30 * 60000);
  const clean = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AR Design//Opus Magnum//EN',
    'BEGIN:VEVENT',
    `UID:opus-${Date.now()}@opus-magnum`,
    `DTSTAMP:${f(new Date())}`,
    `DTSTART:${f(d)}`,
    `DTEND:${f(end)}`,
    `SUMMARY:${clean(title)} — Opus Magnum`,
    `DESCRIPTION:${clean(text || '')}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${clean(title)}`,
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  save(new Blob([ics], { type: 'text/calendar;charset=utf-8' }), 'letter-to-myself.ics');
}

function save(blob: Blob, name: string): void {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/* ------------------------------ quote card ------------------------------ */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const w of text.split(/\s+/)) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

async function downloadCard(): Promise<void> {
  const L = c.L();
  const n = Math.min(7, Math.max(1, c.current() || 1));
  const st = L.stages[n - 1];
  const quote = (st.q ?? st.p[0].split(/(?<=[.!?])\s/)[0]).replace(/^[«“"„]|[»”"“]$/g, '');
  const cite = st.q ? st.cite ?? '' : `${L.ui.stage} ${ROMAN[n - 1]} · ${st.title.split('.')[0]}`;
  try {
    await Promise.all([document.fonts.load('italic 600 60px "Cormorant Garamond"'), document.fonts.load('600 28px Inter')]);
  } catch {
    /* fall back to system fonts */
  }
  const W = 1080;
  const H = 1350;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const x = cv.getContext('2d')!;
  // the dark → light arc of the journey, in one picture
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#07070b');
  g.addColorStop(0.55, '#2a1812');
  g.addColorStop(1, '#f0c27a');
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);
  const r = x.createRadialGradient(W / 2, H * 1.02, 40, W / 2, H * 1.02, H * 0.7);
  r.addColorStop(0, 'rgba(255,232,170,0.85)');
  r.addColorStop(1, 'rgba(255,200,120,0)');
  x.fillStyle = r;
  x.fillRect(0, 0, W, H);
  x.textAlign = 'center';
  x.fillStyle = '#f6ead2';
  let size = 72;
  let lines: string[] = [];
  for (; size >= 40; size -= 4) {
    x.font = `italic 600 ${size}px "Cormorant Garamond", Georgia, serif`;
    lines = wrap(x, `“${quote}”`, W - 220);
    if (lines.length * size * 1.22 < H * 0.5) break;
  }
  const lh = size * 1.22;
  let y = H * 0.4 - (lines.length * lh) / 2;
  for (const ln of lines) {
    x.fillText(ln, W / 2, (y += lh));
  }
  x.font = '600 28px Inter, system-ui, sans-serif';
  x.fillStyle = 'rgba(246,234,210,0.75)';
  const cl = wrap(x, cite, W - 260);
  cl.forEach((ln, i) => x.fillText(ln, W / 2, y + 70 + i * 40));
  x.font = '700 24px Inter, system-ui, sans-serif';
  x.fillStyle = '#2a1812';
  x.fillText('OPUS MAGNUM  ·  AR DESIGN', W / 2, H - 70);
  cv.toBlob((b) => b && save(b, 'opus-magnum-quote.png'), 'image/png');
}

/* ---------------------------------- map ---------------------------------- */
/** Split a long stage name into at most two balanced lines. */
function lab2(name: string): string[] {
  if (name.length <= 18 || !name.includes(' ')) return [name];
  const mid = name.length / 2;
  let best = -1;
  for (let i = 0; i < name.length; i++) if (name[i] === ' ' && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  return [name.slice(0, best), name.slice(best + 1)];
}

export function openMap(): void {
  const L = c.L();
  const X = c.X();
  const cur = c.current();
  const names = [...L.stages.map((s) => s.title.split('.')[0]), L.epilogue.title];
  const W = 1080;
  const H = 520;
  const pts = names.map((_, i) => ({ x: 80 + (i * (W - 200)) / 7, y: H / 2 + (i % 2 ? -1 : 1) * (70 + (i % 3) * 18) * (i === 7 ? 0 : 1) }));
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1];
    const q = pts[i];
    const mx = (p.x + q.x) / 2;
    d += ` C ${mx} ${p.y}, ${mx} ${q.y}, ${q.x} ${q.y}`;
  }
  const nodes = pts
    .map((p, i) => {
      const n = i + 1;
      const state = n < cur ? 'done' : n === cur ? 'now' : 'next';
      const lab = i === 7 ? '∞' : ROMAN[i];
      const up = p.y < H / 2;
      return `<g class="mp__n mp__n--${state}" data-go="${i < 7 ? `stage-${n}` : 'epilogue'}" tabindex="0" role="button" aria-label="${esc(names[i])}" transform="translate(${p.x} ${p.y})">
  <circle class="mp__halo" r="30"/><circle class="mp__dot" r="20"/>
  <text class="mp__num" y="6" text-anchor="middle">${lab}</text>
  <text class="mp__lab" y="${up ? -38 - (lab2(names[i]).length - 1) * 17 : 52}" text-anchor="middle">${lab2(names[i]).map((t, k) => `<tspan x="0" dy="${k ? 17 : 0}">${esc(t)}</tspan>`).join('')}</text>
</g>`;
    })
    .join('');
  show(
    `<p class="pn__eyebrow">${esc(X.ui.mapTitle)}</p>
<p class="pn__hint">${esc(X.ui.mapHint)}</p>
<svg class="mp" viewBox="0 0 ${W} ${H}" role="group">
  <defs><linearGradient id="mpg" x1="0" x2="1"><stop offset="0" stop-color="#a02a18"/><stop offset=".5" stop-color="#e8a24a"/><stop offset="1" stop-color="#ffe6a8"/></linearGradient></defs>
  <path class="mp__path" d="${d}"/>
  <path class="mp__lit" id="mp-lit" d="${d}" pathLength="1"/>
  ${nodes}
</svg>`,
    'pn--map',
  );
  const lit = root.querySelector<SVGPathElement>('#mp-lit')!;
  const frac = Math.max(0, Math.min(1, (cur - 1) / 7));
  lit.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(0.2, 0.8, 0.2, 1)';
  requestAnimationFrame(() => requestAnimationFrame(() => (lit.style.strokeDashoffset = String(1 - frac))));
  root.querySelectorAll<SVGGElement>('.mp__n').forEach((g) => {
    const go = () => {
      const id = g.dataset.go!;
      close();
      setTimeout(() => c.goto(id), 200);
    };
    g.addEventListener('click', go);
    g.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') go();
    });
  });
}
