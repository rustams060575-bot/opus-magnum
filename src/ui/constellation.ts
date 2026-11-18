import gsap from 'gsap';
import { chime } from '../core/audio';
import { addLight, isDone, journey, PALETTE, repair, setTomorrow } from '../journey/state';
import { jfor } from '../journey/content';
import { goldBurst } from './ritual';

/**
 * "Your constellation": every ritual you lived through is a star, every small step you chose is its light.
 * From here the visitor can keep a card, set a one-minute reminder for tomorrow, and give some good back
 * (a warm word for someone, a light). Everything stays on this device.
 */
export interface ConsCtx {
  lang: () => string;
  stop: () => void;
  start: () => void;
  stageTitle: (n: number) => string;
  openRitual: (n: number) => void;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
let c: ConsCtx;
let root: HTMLElement | null = null;
let lastFocus: HTMLElement | null = null;

export function initConstellation(ctx: ConsCtx): void {
  c = ctx;
  addEventListener('keydown', (e) => {
    if (root && e.key === 'Escape') closeConstellation();
  });
}

export function closeConstellation(): void {
  if (!root) return;
  const node = root;
  root = null;
  node.classList.remove('on');
  c.start();
  setTimeout(() => node.remove(), 450);
  lastFocus?.focus?.({ preventScroll: true });
}

/** node positions: a path that rises from lower left to upper right */
const POS = [
  [34, 176],
  [78, 150],
  [118, 166],
  [160, 120],
  [200, 138],
  [240, 84],
  [276, 52],
];

function skySvg(): string {
  const T = jfor(c.lang());
  void T;
  const J = journey();
  let lines = '';
  for (let i = 0; i < 6; i++) {
    const both = isDone(i + 1) && isDone(i + 2);
    lines += `<line x1="${POS[i][0]}" y1="${POS[i][1]}" x2="${POS[i + 1][0]}" y2="${POS[i + 1][1]}" class="cs-l${both ? ' on' : ''}"/>`;
  }
  const stars = POS.map(([x, y], i) => {
    const n = i + 1;
    const d = isDone(n);
    const chosen = J.done[String(n)] >= 0;
    const t = J.tomorrow === n;
    return `<g class="cs-n${d ? ' on' : ''}${chosen ? ' chosen' : ''}${t ? ' tom' : ''}" data-n="${n}" tabindex="0" role="button" aria-label="${esc(c.stageTitle(n))}" transform="translate(${x} ${y})">
  <circle class="cs-h" r="${d ? 17 : 12}"/><circle class="cs-c" r="${d ? 5.5 : 3.6}"/>
  ${d ? `<path d="M0 -11 V11 M-11 0 H11" class="cs-r"/>` : ''}
  <text y="${y > 110 ? 28 : -20}" text-anchor="middle" class="cs-t">${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][i]}</text>
</g>`;
  }).join('');
  return `<svg class="cs-sky" viewBox="0 0 310 210" role="group">${lines}${stars}</svg>`;
}

export function openConstellation(): void {
  if (root) return;
  const T = jfor(c.lang());
  lastFocus = document.activeElement as HTMLElement | null;
  root = document.createElement('div');
  root.id = 'cons';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', T.ui.consTitle);
  root.innerHTML = `<div class="cs__card">
  <button class="cs__x" type="button" aria-label="${esc(T.ui.close)}"><i></i><i></i></button>
  <p class="cs__eyebrow">${esc(T.ui.heart)}</p>
  <h3 class="cs__h">${esc(T.ui.consTitle)}</h3>
  <p class="cs__sub">${esc(T.ui.consSub)}</p>
  <div class="cs__sky"></div>
  <p class="cs__step" aria-live="polite"></p>
  <div class="cs__heart"><div class="cs__bar"><i></i></div><div class="cs__petals"></div></div>
  <div class="cs__row">
    <button type="button" class="cs__btn" data-card>${esc(T.ui.card)}</button>
    <button type="button" class="cs__btn cs__btn--ghost" data-remind>${esc(T.ui.remind)}</button>
  </div>
  <p class="cs__msg" aria-live="polite"></p>
  <div class="cs__give">
    <h4>${esc(T.ui.giveTitle)}</h4>
    <p class="cs__sub">${esc(T.ui.giveSub)}</p>
    <div class="cs__warm">${T.warm.map((w, i) => `<button type="button" class="cs__w" data-w="${i}">${esc(w)}</button>`).join('')}</div>
    <div class="cs__row"><button type="button" class="cs__btn cs__btn--ghost" data-light>${esc(T.ui.light)}</button><span class="cs__lights" aria-live="polite"></span></div>
  </div>
  <p class="cs__tiny">${esc(T.ui.privacy)}</p>
</div>`;
  document.body.appendChild(root);
  c.stop();
  requestAnimationFrame(() => root?.classList.add('on'));
  const q = <E extends HTMLElement>(s: string) => root!.querySelector<E>(s)!;
  q('.cs__x').addEventListener('click', closeConstellation);
  root.addEventListener('pointerdown', (e) => {
    if (e.target === root) closeConstellation();
  });
  const sky = q('.cs__sky');
  const stepEl = q('.cs__step');
  const msg = q('.cs__msg');

  const stepText = (n: number): string => {
    const i = journey().done[String(n)];
    return i >= 0 ? T.steps[n - 1][i] : '';
  };
  const paint = () => {
    sky.innerHTML = skySvg();
    const done = journey().done;
    const any = Object.keys(done).length;
    const tom = journey().tomorrow;
    stepEl.textContent = tom && stepText(tom) ? `${T.ui.tomorrow}: ${stepText(tom)}` : any ? T.ui.tomorrowNone : T.ui.consEmpty;
    (q('.cs__bar i') as HTMLElement).style.transform = `scaleX(${repair()})`;
    q('.cs__petals').innerHTML = Array.from({ length: 7 }, (_, i) => {
      const p = journey().petals[i];
      return `<i style="--c:${p >= 0 && p != null ? PALETTE[p] : 'transparent'}" class="${p >= 0 && p != null ? 'on' : ''}"></i>`;
    }).join('');
    const lights = journey().lights;
    q('.cs__lights').textContent = lights ? '✦'.repeat(Math.min(lights, 24)) : '';
    sky.querySelectorAll<SVGGElement>('.cs-n').forEach((g) => {
      const n = Number(g.dataset.n);
      const act = () => {
        if (isDone(n)) {
          if (stepText(n)) {
            setTomorrow(journey().tomorrow === n ? null : n);
            chime(n + 1);
            paint();
          }
        } else {
          closeConstellation();
          setTimeout(() => c.openRitual(n), 480);
        }
      };
      g.addEventListener('click', act);
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          act();
        }
      });
    });
    gsap.fromTo(sky.querySelectorAll('.cs-n.on .cs-h'), { opacity: 0.2 }, { opacity: 0.9, duration: 0.8, stagger: 0.08 });
  };
  paint();

  q('[data-card]').addEventListener('click', () => void downloadCard(c.lang()));
  q('[data-remind]').addEventListener('click', () => {
    reminder(c.lang());
    msg.textContent = T.ui.reminded;
  });
  root.querySelectorAll<HTMLButtonElement>('[data-w]').forEach((b) =>
    b.addEventListener('click', async () => {
      const text = T.warm[Number(b.dataset.w)];
      try {
        // phones open the share sheet; on a computer the word is simply copied
        if (navigator.share && matchMedia('(pointer: coarse)').matches) await navigator.share({ text });
        else {
          await navigator.clipboard.writeText(text);
          msg.textContent = T.ui.copied;
        }
      } catch {
        /* cancelled */
      }
    }),
  );
  q('[data-light]').addEventListener('click', (e) => {
    addLight();
    chime(7);
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    goldBurst(r.left + r.width / 2, r.top + r.height / 2, 14);
    msg.textContent = T.ui.lightDone;
    paint();
  });
  q('.cs__x').focus({ preventScroll: true });
}

/* ---------------------------- keepsakes ---------------------------- */
function reminder(lang: string) {
  const T = jfor(lang);
  const J = journey();
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  const f = (x: Date) => x.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const end = new Date(d.getTime() + 10 * 60000);
  const clean = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  const step = J.tomorrow && J.done[String(J.tomorrow)] >= 0 ? T.steps[J.tomorrow - 1][J.done[String(J.tomorrow)]] : '';
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AR Design//Opus Magnum//EN',
    'BEGIN:VEVENT',
    `UID:opus-tomorrow-${Date.now()}@opus-magnum`,
    `DTSTAMP:${f(new Date())}`,
    `DTSTART:${f(d)}`,
    `DTEND:${f(end)}`,
    `SUMMARY:${clean('Opus Magnum · 1 min')}`,
    `DESCRIPTION:${clean(step || T.ui.consSub)}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${clean(step || 'Opus Magnum')}`,
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  save(new Blob([ics], { type: 'text/calendar;charset=utf-8' }), 'opus-magnum-tomorrow.ics');
}

function save(blob: Blob, name: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const w of text.split(/\s+/).filter(Boolean)) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

/** the visitor's card: their constellation, their mandala colours and the step they carry into tomorrow */
async function downloadCard(lang: string) {
  const T = jfor(lang);
  const J = journey();
  try {
    await Promise.all([document.fonts.load('italic 600 40px "Cormorant Garamond"'), document.fonts.load('600 24px Inter')]);
  } catch {
    /* system fonts */
  }
  const W = 1080;
  const H = 1350;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const x = cv.getContext('2d')!;
  const bg = x.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0b0a10');
  bg.addColorStop(1, '#2a1c12');
  x.fillStyle = bg;
  x.fillRect(0, 0, W, H);
  // stars
  const sx = 80;
  const sy = 330;
  const sc = 3.1;
  const P = POS.map(([px, py]) => [sx + px * sc, sy + (py - 50) * sc * 0.9]);
  x.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    const on = isDone(i + 1) && isDone(i + 2);
    x.strokeStyle = on ? 'rgba(255,210,119,.9)' : 'rgba(180,160,130,.25)';
    x.beginPath();
    x.moveTo(P[i][0], P[i][1]);
    x.lineTo(P[i + 1][0], P[i + 1][1]);
    x.stroke();
  }
  P.forEach(([px, py], i) => {
    const d = isDone(i + 1);
    const g = x.createRadialGradient(px, py, 0, px, py, d ? 46 : 22);
    g.addColorStop(0, d ? 'rgba(255,226,154,.95)' : 'rgba(200,190,170,.35)');
    g.addColorStop(1, 'rgba(255,200,100,0)');
    x.fillStyle = g;
    x.beginPath();
    x.arc(px, py, d ? 46 : 22, 0, 7);
    x.fill();
    x.fillStyle = d ? '#fff3c9' : '#8d857a';
    x.beginPath();
    x.arc(px, py, d ? 11 : 6, 0, 7);
    x.fill();
  });
  // mandala of petals
  const cx = W / 2;
  const cy = 860;
  for (let i = 0; i < 7; i++) {
    const a = (i * Math.PI * 2) / 7 - Math.PI / 2;
    const p = J.petals[i];
    x.save();
    x.translate(cx, cy);
    x.rotate(a + Math.PI / 2);
    x.beginPath();
    x.ellipse(0, -92, 34, 78, 0, 0, 7);
    x.fillStyle = p >= 0 && p != null ? PALETTE[p] + 'cc' : 'rgba(255,240,200,.05)';
    x.strokeStyle = p >= 0 && p != null ? PALETTE[p] : 'rgba(255,230,170,.4)';
    x.lineWidth = 2;
    x.fill();
    x.stroke();
    x.restore();
  }
  x.fillStyle = '#fff0c0';
  x.beginPath();
  x.arc(cx, cy, 24, 0, 7);
  x.fill();
  // words
  x.textAlign = 'center';
  x.fillStyle = '#f5e9cf';
  x.font = '600 26px Inter, system-ui, sans-serif';
  x.fillText(T.ui.cardTitle.toUpperCase(), W / 2, 150);
  const tom = J.tomorrow;
  const step = tom && J.done[String(tom)] >= 0 ? T.steps[tom - 1][J.done[String(tom)]] : '';
  if (step) {
    x.fillStyle = '#ffd98a';
    x.font = '600 22px Inter, sans-serif';
    x.fillText(T.ui.tomorrow.toUpperCase(), W / 2, 1100);
    x.fillStyle = '#f5e9cf';
    let size = 46;
    let ls: string[] = [];
    for (; size >= 30; size -= 4) {
      x.font = `italic 600 ${size}px "Cormorant Garamond", Georgia, serif`;
      ls = wrap(x, step, W - 220);
      if (ls.length <= 3) break;
    }
    ls.slice(0, 3).forEach((l, i) => x.fillText(l, W / 2, 1160 + i * size * 1.25));
  }
  x.fillStyle = '#b99452';
  x.font = '700 22px Inter, sans-serif';
  x.fillText('OPUS MAGNUM  ·  AR DESIGN', W / 2, H - 60);
  cv.toBlob((b) => b && save(b, 'opus-magnum-my-path.png'), 'image/png');
}
