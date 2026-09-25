# Handover

**Last updated:** 2026-09-25  
**Merged baseline:** `fdb8889d6898e34c2c6094baebddbe5e9eab726e`  
**Active candidate:** none  
**Current phase/milestone:** v0.8 lyric-scene composition + color direction

## Current objective

Build Step 3 composition-level motion grammar on top of the merged typography-composition and OKLCH palette contracts.

## Current implementation state

### Existing merged engine

- deterministic Enhanced LRC/audio clock;
- selector-driven glyph typography;
- RenderTexture compositor + feedback/displacement/smear/bloom;
- advanced background families including Liquid, Spectrum, Sparks and Recursive Lyrics;
- React Visual Director and project defaults;
- hosted/desktop project runtime and Windows packaging gates.

### Step 1 merged — Typography Composition Engine

New pure engine-core planner returns per-word:

- x/y stage placement;
- fixed layout rotation;
- layout scale;
- entry x/y vector;
- entry scale;
- entry rotation;
- emphasis weight.

Initial layouts:

- `center-stack`
- `directional-stage`
- `editorial`
- `vertical-accent`
- `split-stage`
- `crossword`

AUTO layout is deterministic by scene family + cue index. KineticLyrics consumes the composition plan while its existing glyph selector/motion presets continue to run inside each word container.

Renderer, React and `emo.project/v1` expose typography layout controls. Keyboard `L` cycles layouts.

### Step 2 merged — OKLCH Palette Director

New engine-core color system provides:

- OKLCH → sRGB conversion;
- chroma reduction for sRGB gamut;
- relative-luminance/contrast calculation;
- Split Complement / Analogous / Complement / Triad / Tetrad / Monochrome;
- deterministic AUTO harmony;
- semantic roles for background, surface, text, accents, glow and muted values;
- contrast-adjusted primary/secondary lyric colors.

KineticLyrics consumes text/accent roles. CinematicBackground consumes generated background/accent roles. React exposes harmony selection and a live palette swatch preview. Keyboard `C` cycles harmonies. `emo.project/v1` can persist the default.

## Important files / entry points

| Path | Why it matters |
|---|---|
| `docs/LYRIC_VISUALIZATION_ENGINE_PLAN.md` | authoritative visual-engine implementation order |
| `packages/engine-core/src/typographyComposition.ts` | pure word composition planner |
| `packages/engine-core/src/colorHarmony.ts` | OKLCH conversion + palette director |
| `packages/renderer-pixi/src/effects/typography/KineticLyrics.ts` | composition + glyph-motion consumer |
| `packages/renderer-pixi/src/effects/backgrounds/CinematicBackground.ts` | palette/background consumer |
| `packages/renderer-pixi/src/render/EngineRenderer.ts` | composition/palette orchestration |
| `apps/web/src/App.tsx` | Visual Director controls |
| `docs/PROJECT_FORMAT.md` | persisted layout/harmony defaults |

## Known risks / pending acceptance

- Mixed word compositions require real-track tuning for very long words/lines and small mobile viewports.
- The baseline palette is wired into primary text/background/geometry; some specialist shader worlds still retain internal scene-specific shading and should migrate to palette uniforms in Step 4.
- The Visual Director is increasingly dense; a later UI pass should group controls without hiding the engine features.
- Real browser/Desktop visual acceptance remains required even after compile/CI validation.

## Verification

```text
npm install --ignore-scripts --no-audit --no-fund
npm run typecheck
npm run build
npm test
python scripts/repo_audit.py
```

Windows packaging remains a separate required gate.

## Next concrete work

1. Implement composition-level motion grammar.
2. Migrate specialist background shaders to full palette-role uniforms.
3. Complete remaining typography primitives.
4. Stabilize scene-stack serialization before timeline/editor work.

## Resume instruction

Read `AGENTS.md`, `PROJECT.md`, `STATUS.md`, this file, `docs/LYRIC_VISUALIZATION_ENGINE_PLAN.md`, `ROADMAP.md`, `docs/PROJECT_FORMAT.md`, `docs/PLATFORM_ARCHITECTURE.md` and `docs/DECISIONS.md`.
