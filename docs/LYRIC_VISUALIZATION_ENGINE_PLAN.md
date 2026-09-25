# Lyric Visualization Engine Implementation Plan

**Status:** active  
**Started:** 2026-09-25  
**Goal:** make E-MO generate designed lyric-video scenes, not merely animated glyphs on ambient backgrounds.

## Design principle

E-MO's visual stack is split into four independent but coordinated layers:

```text
LYRIC VISUAL SCENE
│
├── 1. TYPOGRAPHY COMPOSITION
│      word placement / hierarchy / orientation / frame usage
│
├── 2. TYPOGRAPHY MOTION
│      glyph selectors / reveals / punches / waves / distortion
│
├── 3. VISUAL WORLD
│      background / geometry / textures / particles / footage / 2.5D
│
└── 4. COLOR DIRECTOR
       OKLCH harmony / semantic palette roles / contrast guarantees
```

The audio/LRC clock remains authoritative. All automatic layout, palette and motion decisions must be deterministic from project data, cue index, scene family and supplied playback time.

## Step 1 — Typography Composition Engine — complete baseline

**Problem:** the existing lyric engine animates words/glyphs well, but most lines still occupy the frame like centered subtitles.

**Deliverables:**

- reusable composition planner in `engine-core`;
- word-level placements independent from glyph animation;
- deterministic AUTO layout selection by scene family + cue index;
- initial layout families:
  - Center Stack
  - Directional Stage
  - Editorial
  - Vertical Accent
  - Split Stage
  - Crossword;
- per-word position, orientation, scale and entry vector;
- whole-word 90° orientation and independent directional entrances;
- renderer API, React controls, keyboard cycling and project defaults;
- layout decisions remain seek-safe and testable without Pixi.

**Implemented baseline:** pure deterministic composition planning, six layout families, AUTO routing, 90° words, independent entry vectors/scales, renderer/UI/project controls and regression tests.

**Acceptance:** the same lyric line can visibly occupy the frame in substantially different compositions while retaining the existing glyph animation presets.

## Step 2 — OKLCH Palette Director + Contrast Roles — complete baseline

**Problem:** backgrounds and typography currently use mostly hard-coded scene colors and do not share an explicit color/contrast contract.

**Deliverables:**

- OKLCH → sRGB conversion with gamut reduction;
- harmony families:
  - Split Complement
  - Analogous
  - Complement
  - Triad
  - Tetrad
  - Monochrome;
- semantic palette roles:
  - background
  - surface
  - textPrimary
  - textSecondary
  - accentA
  - accentB
  - glow
  - muted;
- minimum text/background contrast checks;
- deterministic AUTO harmony selection;
- primary typography/background layers consume one shared palette;
- React harmony controls + palette preview;
- project default serialization.

**Implemented baseline:** OKLCH conversion/gamut reduction, six harmony families, semantic palette roles, contrast checks, shared primary typography/background palette, React preview/control, project defaults and tests.

**Acceptance:** changing harmony changes the whole scene coherently while primary lyric text remains clearly readable against the generated background.

## Step 3 — Composition Motion Grammar — complete baseline

Build transitions above glyph effects:

- directional handoff;
- push / conveyor;
- anchored build;
- layout collapse;
- takeover word;
- 90° flip;
- camera handoff;
- portal/zoom-through;
- editorial page/panel transition.

These operate on word/layout containers rather than individual glyphs.

**Implemented baseline:**

- pure timestamp-driven evaluator in `engine-core`;
- deterministic AUTO routing by scene family + cue index;
- `handoff`, `conveyor`, `anchor-build`, `collapse`, `takeover`, `flip`, `camera-handoff`, `portal` and `panel`;
- whole-stage and per-word transform outputs;
- nested transform ownership in KineticLyrics so composition, grammar and glyph animation remain independent;
- React Visual Director control + keyboard `G`;
- `emo.project/v1` persistence;
- regression coverage for deterministic and representative transforms.

**Acceptance:** switching grammar must visibly change the motion logic of the complete composition without changing its authored layout or breaking glyph-level typography effects.

## Step 4 — Visual World Expansion

Move from effect variants to distinct art-direction worlds:

- editorial color blocks;
- gradient/mesh fields;
- poster/print/halftone texture;
- geometric architecture;
- volumetric rays/fog;
- collage/cutout primitives;
- 2.5D parallax planes;
- audio-shape compositions;
- recursive typography worlds;
- optional image/video treatment.

Every world must declare which palette roles it consumes and its readability budget.

## Step 5 — Semantic Visual Director

Use lyric structure rather than random cycling:

- repeated hook/refrain awareness;
- word emphasis from timing/duration/repetition;
- short-line takeover logic;
- long-line editorial/grid logic;
- section-level visual continuity;
- contrast between verse / pre-chorus / chorus / bridge.

No language-model dependency is required for the baseline; deterministic structural heuristics remain the default.

## Step 6 — Remaining Typography Primitives

Complete the type rendering vocabulary:

- soft-3D / inflate;
- brush/stroke reveal;
- dissolve / particle exit;
- stretch / squeeze;
- mask wipe;
- perspective slam;
- variable-width/weight hooks when supported by the selected font pipeline.

## Step 7 — Serializable Scene Stack

Extend project data with explicit section/cue visual directives:

```text
scene
  composition
  typography motion
  background world
  palette/harmony
  camera
  post-FX
  transition
```

AUTO output and manually authored output must use the same serializable contract.

## Step 8 — Visual Acceptance + Performance Matrix

Before editor work:

- test real Enhanced LRC tracks;
- evaluate every composition × typography × background family;
- reject combinations that reduce readability;
- establish Performance/Cinema budgets;
- verify deterministic seeking;
- verify Desktop/Web parity;
- retain `Ctrl + Shift + H` behavior.

## Editor gate

The timeline/editor starts only after Steps 1–8 provide stable engine contracts. React remains the control/editor plane; Pixi and engine-core retain frame-critical ownership.
