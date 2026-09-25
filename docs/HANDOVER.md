# Handover

**Last updated:** 2026-09-25  
**Merged baseline:** `bc96436c24971820d785e5374e0bed13423c5106`  
**Active candidate:** `feature/liquid-spectrum-v0.7`  
**Current phase/milestone:** v0.7 visualization-engine expansion

## Current objective

Complete the graphics/lyrics visualization primitive set before scene-editor work. Typography and background routing are generalized; the active candidate adds procedural GPU liquid and spectrum-ribbon primitives.

## Current implementation state

### Merged typography

- deterministic range / stagger / wave / wiggle / random / audio selectors;
- Impact / Cascade / Wave / Scatter / Elastic / Outline / Tunnel / Glitch;
- React preset controls and keyboard `T`;
- renderer preset API/listener;
- `emo.project/v1` typography default.

### Merged backgrounds

- Cinematic;
- Nebula;
- Grid;
- Starfield;
- Rays;
- Vortex;
- Minimal;
- deterministic scene-compatible AUTO routing;
- React preset controls and keyboard `B`;
- renderer preset API/listener;
- `emo.project/v1` background default;
- quality-aware particle/blob/ring/beam budgets.

### Active Liquid/Spectrum candidate

Audio analysis adds a reusable logarithmic spectrum sampler. `bands()` captures the current AnalyserNode FFT bins and `spectrum()` downsamples the same frame into a reused Float32Array.

The renderer passes the spectrum into the background engine. New families:

- **Liquid** — fullscreen Pixi filter using deterministic FBM/value-noise domain warping, scene-family palette and bass/mid/energy/transient uniforms.
- **Spectrum** — mirrored spectrum ribbons with scene-family colors, quality-dependent sample counts and audio-reactive amplitude.

Both remain functions of supplied playback time/audio data; there is no independent animation clock.

Manual typography/background preset changes now clear temporal feedback to prevent stale trails from the previous visual state.

## Important files / entry points

| Path | Why it matters |
|---|---|
| `packages/audio-web/src/index.ts` | FFT capture + reusable spectrum resampling |
| `packages/renderer-pixi/src/effects/backgrounds/ProceduralLiquidFX.ts` | procedural GPU liquid shader |
| `packages/renderer-pixi/src/effects/backgrounds/CinematicBackground.ts` | background preset orchestration + spectrum ribbons |
| `packages/renderer-pixi/src/render/EngineRenderer.ts` | spectrum transport / explicit frame orchestration |
| `packages/renderer-pixi/src/effects/typography/KineticLyrics.ts` | selector-driven lyric engine |
| `apps/web/src/App.tsx` | Visual Director + frame analysis transport |
| `packages/platform-node/src/index.ts` | manifest preset validation |
| `docs/PROJECT_FORMAT.md` | project defaults contract |

## Known risks / pending acceptance

- The procedural shader is build/type validated only until real browser/Desktop visual acceptance.
- Spectrum ribbons depend on the Web Audio analyser graph being active; before playback they intentionally render near zero.
- Full-spectrum sampling is logarithmic for useful musical distribution, not intended as metrology-grade FFT visualization.
- Sparks/trails and recursive background lyrics remain pending.
- Soft-3D/inflate, stroke reveal and dissolve typography remain pending.
- Root legacy UI remains pending React acceptance.

## Verification

Repository gate:

```text
npm install --ignore-scripts --no-audit --no-fund
npm run typecheck
npm run build
npm test
python scripts/repo_audit.py
```

Windows gate:

```text
npm install
npm run build
npm --workspace @graph1ks/emo-desktop run dist
```

Visual acceptance should cycle Background → Liquid/Spectrum in Poster, Neon and Vortex, switch Performance/Cinema, seek repeatedly and confirm `Ctrl + Shift + H` remains unchanged.

## Next concrete work

1. Merge Liquid/Spectrum after CI.
2. Add deterministic sparks/trails.
3. Add recursive lyric-background typography.
4. Add soft-3D/inflate, brush/stroke and dissolve typography.
5. Stabilize scene-stack JSON before editor/timeline work.

## Resume instruction

Read `AGENTS.md`, `PROJECT.md`, `STATUS.md`, this file, `ROADMAP.md`, `docs/PROJECT_FORMAT.md`, `docs/PLATFORM_ARCHITECTURE.md` and `docs/DECISIONS.md`. Then inspect main/current branch CI before changing render timing or project contracts.
