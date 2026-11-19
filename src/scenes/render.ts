import { extraFor, type Locale } from '../i18n';
import { agentFor } from '../i18n/agent';
import { jfor } from '../journey/content';
import { img, frameUrl, frameBg, cutUrl, bgUrl, cutAspect, ROMAN, scenes, type SceneDef, type HeartLayer } from './config';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const STAR = `<svg class="s5-svg" viewBox="-300 -300 600 600" aria-hidden="true">
  <defs>
    <radialGradient id="st-g"><stop offset="0" stop-color="#fff"/><stop offset=".1" stop-color="#d8ecff"/><stop offset=".3" stop-color="#5aa6ff" stop-opacity=".6"/><stop offset=".7" stop-color="#1b4fd0" stop-opacity=".16"/><stop offset="1" stop-color="#0a2a8a" stop-opacity="0"/></radialGradient>
    <linearGradient id="st-r" x1="0" x2="1"><stop offset="0" stop-color="#9fd0ff" stop-opacity="0"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#9fd0ff" stop-opacity="0"/></linearGradient>
    <filter id="st-b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>
  </defs>
  <circle r="296" fill="url(#st-g)"/>
  <g class="s5-spin" opacity=".55">
    <polygon points="-250,0 0,-3 250,0 0,3" fill="url(#st-r)" transform="rotate(22)"/>
    <polygon points="-250,0 0,-3 250,0 0,3" fill="url(#st-r)" transform="rotate(67)"/>
    <polygon points="-250,0 0,-3 250,0 0,3" fill="url(#st-r)" transform="rotate(112)"/>
    <polygon points="-250,0 0,-3 250,0 0,3" fill="url(#st-r)" transform="rotate(157)"/>
  </g>
  <g class="s5-rays">
    <polygon points="-296,0 0,-7 296,0 0,7" fill="url(#st-r)"/>
    <polygon points="-296,0 0,-7 296,0 0,7" fill="url(#st-r)" transform="rotate(90)"/>
    <polygon points="-170,0 0,-4 170,0 0,4" fill="url(#st-r)" transform="rotate(45)"/>
    <polygon points="-170,0 0,-4 170,0 0,4" fill="url(#st-r)" transform="rotate(135)"/>
  </g>
  <circle r="46" fill="#bfe0ff" opacity=".8" filter="url(#st-b)"/>
  <circle r="15" fill="#fff"/>
</svg>`;

function hero(s: Extract<SceneDef, { type: 'hero' }>, L: Locale): string {
  return `
<section class="hero scene" id="${s.id}" data-scene="${s.id}">
  <div class="hero__bg"><img src="${img('title-parchment')}" alt="" decoding="async" fetchpriority="high"></div>
  <canvas class="hero__smoke" aria-hidden="true"></canvas>
  <div class="hero__redpulse"></div>
  <div class="hero__shade"></div>
  <div class="hero__ripples" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
  <div class="hero__halo" aria-hidden="true"></div>
  <div class="hero__heartwrap"><div class="hero__heart">
    <img class="hh-base" src="${cutUrl('hero-heart')}" alt="" decoding="async">
    <img class="hh-lava" src="${cutUrl('hero-heart-glow')}" alt="" decoding="async">
  </div></div>
  <div class="hero__flash"></div>
  <div class="hero__flood"></div>
  <div class="hero__cv">
    <div class="hero__content">
      <p class="hero__tagline">${esc(L.hero.tagline)}</p>
      <h1 class="hero__title">
        <span class="hero__tg" aria-hidden="true"><span class="hero__titleglow">Opus Magnum</span></span>
        <span class="hero__tt">Opus Magnum</span>
      </h1>
      <blockquote class="hero__quote">
        <p>${esc(L.hero.quote)}</p>
        <cite>${esc(L.hero.cite)}</cite>
      </blockquote>
    </div>
  </div>
  <div class="hero__bar hero__bar--t" aria-hidden="true"></div>
  <div class="hero__bar hero__bar--b" aria-hidden="true"></div>
  <div class="hero__hint"><span>${esc(L.ui.scroll)}</span><i></i></div>
</section>`;
}

function heartLayer(l: HeartLayer, i: number): string {
  if (l.kind === 'cut') {
    const ar = cutAspect(l.src);
    return `
<figure class="hl hl--cut${l.nobg ? ' hl--clean' : ''}" data-i="${i}" style="--glow:${l.glow};--bg:${frameBg(l.src)};--ar:${ar}">
  ${l.nobg ? '' : `<img class="hc-bg" src="${bgUrl(l.src)}" alt="" loading="lazy" decoding="async">`}
  <i class="hc-halo"></i>
  <div class="hc-rig"><img class="hc-heart" src="${cutUrl(l.src)}" alt="" loading="lazy" decoding="async"></div>
  <i class="hc-vig"></i>
</figure>`;
  }
  if (l.kind === 'frame') {
    return `
<figure class="hl hl--frame" data-i="${i}" style="--glow:${l.glow};--bg:${frameBg(l.src)};--ms:${l.ms ?? 1}">
  <img class="hf" src="${frameUrl(l.src)}" alt="" loading="lazy" decoding="async">
  <i class="hl__bloom"></i>
</figure>`;
  }
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
  return `
<section class="hs scene" id="${s.id}" data-scene="${s.id}">
  <div class="hs__bg" style="background:${frameBg(s.layers[0].src)}"></div>
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
    art: `<img class="s5-horizon" src="${img('horizon-blue')}" alt="" loading="lazy" decoding="async"><div class="s5-wrap"><div class="s5-grow">${STAR}</div></div>`,
  },
  6: {
    bg: `<div class="s6-black"></div>`,
    art: `<div class="s6-wrap"><div class="s6-grow"><div class="s6-flare"><img src="${img('void-flare')}" alt="" loading="lazy" decoding="async"></div><i class="s6-line"></i></div></div>`,
  },
  7: {
    bg: `<div class="s7-sky"></div><div class="st__scrim st__scrim--l st__scrim--navy"></div>`,
    art: `<div class="s7-wrap"><div class="s7-grow"><div class="s7-man"><div class="s7-oval"><img src="${img('mandala')}" alt="" loading="lazy" decoding="async"></div>${rings()}</div></div></div>`,
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
  const X = extraFor(L.code);
  const act = `<div class="st__act"><button type="button" class="act act--r" data-ritual="${s.n}"><i></i>${esc(jfor(L.code).ui.ritual)}</button><button type="button" class="act act--p" data-practice="${s.n}"><i></i>${esc(X.ui.practice)}</button><button type="button" class="act act--l" data-agent="${s.n}"><i></i>${esc(agentFor(L.code).ui.open)}</button></div>`;
  return `
<section class="st st--${s.n} st--${s.side} scene" id="${s.id}" data-scene="${s.id}" data-stage="${s.n}">
  <div class="st__bg">${a.bg}</div>
  <div class="st__art">${a.art}</div>
  <div class="st__cv">
    <div class="st__text">
      <h2 class="st__title">${esc(L.ui.stage)} ${ROMAN[s.n - 1]}: ${esc(t.title)}</h2>
      ${q}${ps}${cite}${act}
    </div>
  </div>
</section>`;
}

function epilogue(L: Locale, z: number, dwell: number): string {
  const e = L.epilogue;
  return `
<section class="epi scene" id="epilogue" data-scene="epilogue" data-stage="8" style="--z:${z}">
  <div class="epi__glow"></div>
  <div class="epi__body">
    <h2 class="st__title">${esc(L.ui.epilogue)}: ${esc(e.title)}</h2>
    <p class="st__q">${esc(e.q)}</p>
    ${e.p.map((p) => `<p class="st__p">${esc(p)}</p>`).join('')}
    <div class="st__act st__act--c"><button type="button" class="act act--p" data-diary><i></i>${esc(extraFor(L.code).ui.diary)}</button><button type="button" class="act act--l" data-map><i></i>${esc(extraFor(L.code).ui.map)}</button><button type="button" class="act act--l" data-pulse-open><i></i>${esc(extraFor(L.code).ui.pulseBtn)}</button><button type="button" class="act act--l" data-agent="8"><i></i>${esc(agentFor(L.code).ui.open)}</button><button type="button" class="act act--r" data-cons><i></i>${esc(jfor(L.code).ui.consTitle)}</button></div>
  </div>
</section>
${stack('finale', 'finale', dwell, z + 1, `<section class="fin scene" id="finale" data-scene="finale">
  <div class="fin__light"></div>
  <div class="fin__orb" aria-hidden="true"><div class="fin__orb-in"><i class="fo-core"></i><i class="fo-r fo-m" style="--i:0"></i><i class="fo-r fo-m" style="--i:1"></i><i class="fo-r fo-m" style="--i:2"></i><i class="fo-r fo-m" style="--i:3"></i><i class="fo-r fo-m" style="--i:4"></i><i class="fo-r fo-m" style="--i:5"></i><i class="fo-r fo-l" style="--k:-1"></i><i class="fo-r fo-l" style="--k:0"></i><i class="fo-r fo-l" style="--k:1"></i></div></div>
  <div class="fin__inner">
    <p class="fin__text">${e.finale.split(/(?<=[.!?])\s+/).map((t, i) => `<span class="fin__l fin__l${i + 1}"><span class="fin__g">${esc(t)}</span></span>`).join(' ')}</p>
    <footer class="fin__foot">
      <p class="fin__brand">AR&nbsp;Design</p>
      <p class="fin__credit">${esc(L.ui.credit)}</p>
      <p class="fin__note">${esc(L.ui.footerNote)}</p>
    </footer>
  </div>
</section>`, true)}`;
}

/** Every scene sits in a tall `.stack` wrapper; the scene itself is sticky inside it,
 *  and the next wrapper is pulled up by one screen so it slides OVER the previous scene. */
function stack(kind: string, id: string, dwell: number, z: number, inner: string, last = false): string {
  return `<div class="stack stack--${kind}${last ? ' stack--last' : ''}" data-dwell="${dwell}" style="--dwell:${dwell};--z:${z}">${inner}</div>`;
}

export function renderApp(L: Locale): string {
  let z = 1;
  return scenes
    .map((s) => {
      const zi = z++;
      switch (s.type) {
        case 'hero':
          return stack('hero', s.id, s.dwell, zi, hero(s, L));
        case 'heart':
          return stack('heart', s.id, s.dwell, zi, heart(s));
        case 'stage':
          return stack('stage', s.id, s.dwell, zi, stage(s, L));
        case 'epilogue':
          return epilogue(L, zi, s.dwell);
      }
    })
    .join('');
}
