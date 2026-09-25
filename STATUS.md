# Project Status

**Last updated:** 2026-09-25  
**Last known good merged baseline:** `ce612363c52bf4067927cabc5d6d37ad1f883c12`  
**Active candidate:** none  
**Current phase/milestone:** v0.8 lyric-scene composition + color direction

## Current objective

Move into Step 4: distinct art-direction/background worlds built on the merged composition, motion and OKLCH contracts.

## Current state

- React/Vite web shell, shared Node runtime, Electron desktop foundation and `emo.project/v1` are merged.
- Compositor baseline is merged: RenderTexture composition, deterministic feedback, displacement, velocity smear, threshold bloom and cinematic post-FX.
- Selector-driven typography and the existing typography/background visual families are merged.
- Visual Accents (Sparks/Trails + Recursive Lyrics) are merged and CI-verified.
- v0.8 adds a merged **Typography Composition Engine**:
  - Center Stack
  - Directional Stage
  - Editorial
  - Vertical Accent
  - Split Stage
  - Crossword
- Composition operates above glyph effects: complete words receive independent placement, orientation, scale and entry vectors. 90° words and mixed directional/zoom entrances are first-class.
- Layout AUTO is deterministic from scene family + cue index.
- v0.8 also adds a merged **OKLCH Palette Director**:
  - Split Complement
  - Analogous
  - Complement
  - Triad
  - Tetrad
  - Monochrome
- Generated palettes expose semantic background/text/accent/glow/muted roles and enforce minimum lyric/background contrast.
- Primary typography and background layers share the same palette.
- Composition and harmony are controllable from React, keyboard and `emo.project/v1`.
- Step 3 adds a merged **Composition Motion Grammar** above glyph animation:
  - Handoff
  - Conveyor
  - Anchor Build
  - Collapse
  - Takeover
  - Flip
  - Camera Handoff
  - Portal
  - Panel
- Grammar evaluation is pure/timestamp-driven from Enhanced LRC time and produces whole-stage + per-word transforms.
- `camera-handoff` currently moves the typography stage only; global background/camera motion remains owned by CameraRig.
- Motion AUTO is deterministic from scene family + cue index.

## Last verified checks

- v0.8 Composition + Palette: Linux install/typecheck/build/tests/publication audit — passed.
- v0.8 Composition + Palette: Windows full build, NSIS packaging, portable x64 packaging and artifact upload — passed.
- Composition Motion: Linux install/typecheck/build/tests/publication audit — passed.
- Composition Motion: Windows full build, NSIS packaging, portable x64 packaging and artifact upload — passed.

## Next concrete action

1. Expand Step 4 art-direction worlds using the palette-role contract rather than hard-coded scene colors.
2. Finish remaining typography primitives.
3. Stabilize serializable scene-stack directives before editor work.

## Do not redo

- Do not collapse composition back into glyph animation; layout and motion are separate layers.
- Do not use HSL/random RGB for automatic scene color decisions where the OKLCH director applies.
- Do not move frame-critical rendering/audio timing into React/Zustand/TanStack.
- Do not introduce history-dependent random layout choices.
- Do not restart Pixi's independent automatic ticker.
- Do not add FFmpeg/video-export dependencies before a dedicated export/license milestone.

## Important context

- The audio/LRC clock remains the only motion-time source.
- Composition plans and composition-motion frames are pure/testable engine-core output; Pixi only consumes them.
- Palette AUTO and Composition AUTO are deterministic by cue index.
- Primary text contrast is measured against the generated background before a palette is exposed.

For implementation order, read `docs/LYRIC_VISUALIZATION_ENGINE_PLAN.md`.
