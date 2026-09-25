# Handover

**Last updated:** 2026-09-25  
**Merged baseline:** `df04c773b08c19b80e4f1b823ba60acc817b0b69`  
**Active candidate:** none  
**Current phase/milestone:** v0.8 lyric-scene composition + color direction

## Current objective

Continue Step 4 visual-world expansion on top of the merged readability/color stabilization layer.

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

### Step 3 merged — Composition Motion Grammar

The new pure evaluator in `engine-core` takes explicit LRC time, composition targets and cue timing and returns whole-stage + per-word transforms. It never owns an independent clock or stateful tween timeline.

Motion families:

- `handoff`
- `conveyor`
- `anchor-build`
- `collapse`
- `takeover`
- `flip`
- `camera-handoff`
- `portal`
- `panel`

KineticLyrics now applies transforms in three layers:

1. whole typography stage;
2. composition word slot;
3. existing word-local/glyph motion.

This keeps layout orientation/placement, composition motion and glyph effects independently composable.

React exposes **Composition Motion** and keyboard `G`; `M` remains mute. `emo.project/v1` can persist `defaults.compositionMotion`.

See `docs/COMPOSITION_MOTION_GRAMMAR.md` for the runtime contract and known tuning risks.

### Merged readability/color baseline

The candidate changes two foundational contracts before adding more visual worlds.

**Composition safety**

- default readable lyrics target a centered attention field (76% width × 62% height, center Y ≈ 46.5%);
- word bounds are estimated after scale/90° rotation;
- deterministic collision relaxation keeps words inside that field;
- lower-emphasis words scale down as a last resort instead of overlapping;
- LTR rows preserve left-to-right cue order and wrap top-to-bottom;
- Vertical Accent/Crossword may use one vertical word only at a logical sequence edge;
- Split Stage is now row-based rather than alternating every cue across left/right sides.

**Color direction**

- emotion-named creative presets: Tender, Heartbreak, Longing, Euphoria, Rage, Dream, Tension, Calm;
- darkest background colors use very low chroma so warm palettes no longer become persistent brown;
- harmony remains independent from mood;
- Rainbow Drift rotates hue at 2.4°/s from lyric time, preserves harmony, and keeps readable text/background restrained;
- UI exposes mood and Rainbow Drift; project defaults persist both.

Research and exact product rules are in `docs/VISUAL_READABILITY_COLOR_RULES.md`.

## Important files / entry points

| Path | Why it matters |
|---|---|
| `docs/LYRIC_VISUALIZATION_ENGINE_PLAN.md` | authoritative visual-engine implementation order |
| `packages/engine-core/src/typographyComposition.ts` | pure word composition planner |
| `packages/engine-core/src/typographyMotionGrammar.ts` | pure timestamp-driven composition-motion evaluator |
| `docs/COMPOSITION_MOTION_GRAMMAR.md` | motion grammar contract, transform ownership and tuning notes |
| `packages/engine-core/src/colorHarmony.ts` | OKLCH conversion + harmony + lyric mood palette director |
| `docs/VISUAL_READABILITY_COLOR_RULES.md` | source-backed readability/color rules and non-goals |
| `packages/renderer-pixi/src/effects/typography/KineticLyrics.ts` | composition + glyph-motion consumer |
| `packages/renderer-pixi/src/effects/backgrounds/CinematicBackground.ts` | palette/background consumer |
| `packages/renderer-pixi/src/render/EngineRenderer.ts` | composition/palette orchestration |
| `apps/web/src/App.tsx` | Visual Director controls |
| `docs/PROJECT_FORMAT.md` | persisted layout/harmony defaults |

## Known risks / pending acceptance

- The new collision solver still requires real-track tuning for very long words/lines and small mobile viewports.
- The baseline palette is wired into primary text/background/geometry; some specialist shader worlds still retain internal scene-specific shading and should migrate to palette uniforms in Step 4.
- The Visual Director is increasingly dense; a later UI pass should group controls without hiding the engine features.
- Real browser/Desktop visual acceptance remains required even after compile/CI validation.
- Takeover/Portal can deliberately overscale active words; long words and narrow viewports need visual acceptance.
- AUTO compatibility constraints may be required after real-track testing if some layout × grammar × glyph combinations are systematically unreadable.

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

1. Build genuinely distinct Step 4 visual worlds (editorial blocks, print/halftone, mesh/gradient, geometric architecture, volumetric light) on the palette-role contract.
2. Visually test dense Enhanced LRC lines at desktop + narrow/mobile sizes.
3. Migrate specialist shader colors to palette-role uniforms.
4. Complete remaining typography primitives.
5. Stabilize scene-stack serialization before timeline/editor work.

## Resume instruction

Read `AGENTS.md`, `PROJECT.md`, `STATUS.md`, this file, `docs/LYRIC_VISUALIZATION_ENGINE_PLAN.md`, `ROADMAP.md`, `docs/PROJECT_FORMAT.md`, `docs/PLATFORM_ARCHITECTURE.md` and `docs/DECISIONS.md`.
