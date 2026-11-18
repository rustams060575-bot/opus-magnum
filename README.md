# Opus Magnum — AR Design

An immersive, multilingual (EN · RU · ES) scroll experience about Jungian individuation and alchemy:
seven stages from the Nigredo to the Mandala of Wholeness, plus an epilogue.
Vite + TypeScript, GSAP ScrollTrigger, Lenis. No framework.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the build
```

## How it is built

| Path | What |
| --- | --- |
| `src/i18n/*.ts` | All copy per language (`en`, `ru`, `es`). |
| `src/scenes/config.ts` | The journey, in order: hero → heart interludes → stages → epilogue. Per scene: heartbeat BPM, particle mood, accent colour. |
| `src/scenes/render.ts` | Turns config + locale into HTML. |
| `src/scenes/animate.ts` | Scroll choreography (pinned scenes, word-by-word "reading light", heart crossfades, finale). |
| `src/core/beat.ts` | The global heartbeat clock. Everything that pulses subscribes to it; BPM slows from 92 → 50 across the journey. |
| `src/core/particles.ts` | Ambient canvas particles (embers, ash, snow, stars, gold dust). |
| `src/styles/main.css` | All styling. Stage art is `.s1-…` to `.s7-…`. |
| `assets-src/` | Raw images exported from Figma. |
| `scripts/optimize_images.py` | `python scripts/optimize_images.py` → WebP in `public/img/`. |

## Add a language

1. Copy `src/i18n/en.ts` to `src/i18n/fr.ts`, translate, change `code`, `label`, `name`.
2. Register it in `src/i18n/index.ts` (`locales = { en, ru, es, fr }`).

The switch buttons, `<html lang>`, saved choice and `?lang=fr` all pick it up automatically.

## Add a heart interlude

1. Put the picture in `assets-src/`, add it to `MAP` in `scripts/optimize_images.py`, run the script.
2. Add a `heart` entry to `scenes` in `src/scenes/config.ts`. Two layers = the heart transforms into the next one while scrolling.
   `kind: 'portal'` (glowing oval, for light backgrounds) or `'soft'` (feathered edges, for dark backgrounds).

## Behaviour notes

- Desktop: scenes are pinned and scrubbed. Mobile (< 900px): native scroll, art on top, text below.
- `prefers-reduced-motion`: no pinning or scrubbing, all text visible.
- The build uses relative asset paths (`base: './'`), so it works on Vercel and on GitHub Pages sub-paths.

## Deploy

Vercel: import the repo, framework preset *Vite*, build `npm run build`, output `dist`.
GitHub Pages: publish the `dist` folder (e.g. with a Pages workflow).

## Motion design notes

- **Stacked scenes.** Every scene is a `position: sticky` layer; the next one slides over it while the previous sinks back and darkens
  (`--cover`), with layered parallax (background, artwork and text travel at different speeds as a scene lands).
- **Layered hearts.** `python scripts/make_cutouts.py` cuts each heart out of its frame (rembg) and builds a blurred ambient copy:
  ambient light → glow → heart cut-out → vignette. Pairs transform through an iris that opens from the heart's centre.
- **Performance rule.** Nothing animates anything except `transform` and `opacity` (the heartbeat included).
  Filters, shadows and blend modes are never driven per frame. Only scenes near the viewport get `will-change`.
- **Type.** Titles rise out of overflow-hidden slots (masked words / letters); body copy lights up word by word and leaves in the same order.
- **Pipeline:** `prepare_frames.py` (frames from Figma exports) → `make_cutouts.py` (cut-outs + ambient) → `optimize_images.py` (other art).

## Useful layer (v3)

- `src/i18n/extra.ts` — glossary terms, practice questions, UI copy for the visitor's tools (per language, English fallback).
  Languages: EN · RU · ES · UK · FR · DE · PT. Arabic/Hebrew (right-to-left) is not supported yet: stage layout is built on a left-to-right design canvas.
- `src/ui/panel.ts` — practice (question + breathing heart + private note), "My path" (notes, letter-to-self `.ics`, quote card PNG, share), map of the journey.
- `src/ui/glossary.ts` — tooltips on the first occurrence of each term per stage.
- `src/ui/speech.ts` — "Listen" via the browser's speech synthesis (no audio files).
- Gentle mode (`src/core/prefs.ts`): no motion, larger text, quieter music — reuses the reduced-motion build.
- "Light conquers darkness": `#dawn` warms the screen and the music low-pass filter opens as scroll progress grows.
- Notes live in `localStorage` only; nothing is sent anywhere.

## v3.2 (local branch `v3.2-mobile-agent`)

- **Phones:** native scrolling, no 3D flips, images are loaded only near the viewport and released again (`src/core/memory.ts`), half-size hands frames (`public/img/frames-m`), no particles; the scroll position survives a browser reload (`src/core/session.ts`) so the visitor never lands back on the intro. Text is fully lit, ≥19.5 px on a solid surface.
- **One flowing heart:** a single heart interlude (chained → caged → hall → gold) instead of three; the hands interlude closes the journey.
- **Parallax** on phones (art and background drift against the page) and the existing pointer parallax on desktop; tap ripples + haptic ticks (`src/ui/touch.ts`).
- **The guide (agent-psychologist):** `src/agent/` + `src/ui/agent.ts` + `src/i18n/agent.ts`. Built-in scripted guide today, pluggable agent later: see `docs/AGENT_INTEGRATION.md`.
