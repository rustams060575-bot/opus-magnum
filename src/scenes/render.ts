import type { Locale } from '../i18n';
import { img, ROMAN, scenes, type SceneDef, type HeartLayer } from './config';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function hero(s: Extract<SceneDef, { type: 'hero' }>, L: Locale): string {
  return `
<section class="hero scene" id="${s.id}" data-scene="${s.id}">
  <div class="hero__bg"><img src="${img('title-parchment')}" alt="" decoding="async" fetchpriority="high"></div>
  <canvas class="hero__smoke" aria-hidden="true"></canvas>
  <div class="hero__redpulse"></div>
  <div class="hero__shade"></div>
  <div class="hero__ripples" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
  <div class="hero__heartwrap"><div class="hero__heart"><img class="hh-base" src="${img('heart-lava')}" alt="" decoding="async"><img class="hh-lava" src="${img('heart-lava')}" alt="" decoding="async"></div></div>
  <div class="hero__flash"></div>
  <div class="hero__flood"></div>
  <div class="hero__cv">
    <div class="hero__content">
      <p class="hero__tagline">${esc(L.hero.tagline)}</p>
      <h1 class="hero__title">Opus Magnum</h1>
      <blockquote class="hero__quote">
        <p>${esc(L.hero.quote)}</p>
        <cite>${esc(L.hero.cite)}</cite>
      </blockquote>
    </div>
  </div>
  <div class="hero__hint"><span>${esc(L.ui.scroll)}</span><i></i></div>
</section>`;
}

function heartLayer(l: HeartLayer, i: number): string {
  const behind = l.behind ? `<img class="hl__behind" src="${img(l.behind)}" alt="" loading="lazy" decoding="async">` : '';
  return `
<figure class="hl hl--${l.kind}" data-i="${i}" style="--glow:${l.glow}">
  ${behind}
  <div class="hl__pulse">
    <i class="hl__halo"></i>
    <div class="hl__frame"><img src="${img(l.src)}" alt="" loading="lazy" decoding="async"></div>
    <i class="hl__ring"></i>
  </div>
</figure>`;
}

function heart(s: Extract<SceneDef, { type: 'heart' }>): string {
  const smoke = s.smoke ? `<img class="hs__smoke" src="${img('smoke')}" alt="" decoding="async">` : '';
  return `
<section class="hs scene" id="${s.id}" data-scene="${s.id}">
  <div class="hs__bg">${smoke}</div>
  <div class="hs__layers">${s.layers.map(heartLayer).join('')}</div>
</section>`;
}

/** Per-stage background + art markup. Positioning lives in CSS (.s1-… .s7-…). */
const STAGE_ART: Record<number, { bg: string; art: string }> = {
  1: {
    bg: `<img class="bgimg" src="${img('nigredo-parchment')}" alt="" loading="lazy" decoding="async"><div class="st__vig"></div>`,
    art: `<div class="s1-book" data-par><img src="${img('nigredo-book')}" alt="" loading="lazy" decoding="async"><i class="s1-glow"></i></div>`,
  },
  2: {
    bg: `<img class="bgimg" src="${img('foil')}" alt="" loading="lazy" decoding="async"><div class="st__scrim st__scrim--l"></div>`,
    art: `<div class="s2-wrap"><div class="s2-oval"><img src="${img('face')}" alt="" loading="lazy" decoding="async"></div><div class="s2-circle"><img src="${img('yinyang')}" alt="" loading="lazy" decoding="async"></div><i class="s2-ring"></i></div>`,
  },
  3: {
    bg: `<img class="bgimg" src="${img('grunge')}" alt="" loading="lazy" decoding="async"><div class="st__scrim st__scrim--l"></div>`,
    art: `<div class="s3-hands"><i class="s3-aura"></i><img src="${img('hands')}" alt="" loading="lazy" decoding="async"></div>`,
  },
  4: {
    bg: `<img class="bgimg" src="${img('mountain')}" alt="" loading="lazy" decoding="async"><div class="st__scrim st__scrim--r st__scrim--blue"></div>`,
    art: `<i class="mist m1"></i><i class="mist m2"></i>`,
  },
  5: {
    bg: `<div class="s5-sky"></div><div class="st__scrim st__scrim--l st__scrim--navy"></div>`,
    art: `<img class="s5-horizon" src="${img('horizon-blue')}" alt="" loading="lazy" decoding="async"><div class="s5-star"><img src="${img('star')}" alt="" loading="lazy" decoding="async"></div>`,
  },
  6: {
    bg: `<div class="s6-black"></div>`,
    art: `<div class="s6-flare"><img src="${img('void-flare')}" alt="" loading="lazy" decoding="async"></div><i class="s6-line"></i>`,
  },
  7: {
    bg: `<div class="s7-sky"></div><div class="st__scrim st__scrim--l st__scrim--navy"></div>`,
    art: `<div class="s7-man"><div class="s7-oval"><img src="${img('mandala')}" alt="" loading="lazy" decoding="async"></div>${rings()}</div>`,
  },
};

function rings(): string {
  const c = (r: number, dash: string, w = 0.6) =>
    `<circle cx="100" cy="100" r="${r}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-dasharray="${dash}"/>`;
  return `<svg class="s7-rings" viewBox="0 0 200 200" aria-hidden="true">
    <g class="r1">${c(98, '1 3', 0.9)}${c(92, '30 6 2 6')}</g>
    <g class="r2">${c(86, '8 10')}${c(80, '1 2', 0.8)}</g>
    <g class="r3">${c(74, '40 8 6 8 2 8')}</g>
  </svg>`;
}

function stage(s: Extract<SceneDef, { type: 'stage' }>, L: Locale): string {
  const t = L.stages[s.n - 1];
  const a = STAGE_ART[s.n];
  const q = t.q ? `<p class="st__q">${esc(t.q)}</p>` : '';
  const ps = t.p.map((p) => `<p class="st__p">${esc(p)}</p>`).join('');
  const cite = t.cite ? `<p class="st__cite">${esc(t.cite)}</p>` : '';
  return `
<section class="st st--${s.n} st--${s.side} scene" id="${s.id}" data-scene="${s.id}" data-stage="${s.n}">
  <div class="st__bg">${a.bg}</div>
  <div class="st__art">${a.art}</div>
  <div class="st__cv">
    <div class="st__text">
      <h2 class="st__title">${esc(L.ui.stage)} ${ROMAN[s.n - 1]}: ${esc(t.title)}</h2>
      ${q}${ps}${cite}
    </div>
  </div>
</section>`;
}

function epilogue(L: Locale): string {
  const e = L.epilogue;
  return `
<section class="epi scene" id="epilogue" data-scene="epilogue" data-stage="8">
  <div class="epi__glow"></div>
  <div class="epi__body">
    <h2 class="st__title">${esc(L.ui.epilogue)}: ${esc(e.title)}</h2>
    <p class="st__q">${esc(e.q)}</p>
    ${e.p.map((p) => `<p class="st__p">${esc(p)}</p>`).join('')}
  </div>
</section>
<section class="fin scene" id="finale" data-scene="finale">
  <div class="fin__light"></div>
  <svg class="fin__rings" viewBox="0 0 200 200" aria-hidden="true">
    <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" stroke-width=".3"/>
    <circle cx="100" cy="100" r="76" fill="none" stroke="currentColor" stroke-width=".3" stroke-dasharray="1 3"/>
    <circle cx="100" cy="100" r="56" fill="none" stroke="currentColor" stroke-width=".3"/>
    <circle cx="100" cy="100" r="36" fill="none" stroke="currentColor" stroke-width=".3" stroke-dasharray="4 4"/>
  </svg>
  <div class="fin__inner">
    <p class="fin__text">${esc(e.finale)}</p>
    <footer class="fin__foot">
      <p class="fin__brand">AR&nbsp;Design</p>
      <p class="fin__credit">${esc(L.ui.credit)}</p>
      <p class="fin__note">${esc(L.ui.footerNote)}</p>
    </footer>
  </div>
</section>`;
}

export function renderApp(L: Locale): string {
  return scenes
    .map((s) => {
      switch (s.type) {
        case 'hero':
          return hero(s, L);
        case 'heart':
          return heart(s);
        case 'stage':
          return stage(s, L);
        case 'epilogue':
          return epilogue(L);
      }
    })
    .join('');
}
