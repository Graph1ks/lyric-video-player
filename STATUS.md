# Project Status

**Last updated:** 2026-09-25  
**Last known good merged baseline:** `4e0e30d09596a57ed628ddbf9827f4850c4be7fc`  
**Active candidate:** `feature/composition-palette-v0.8`  
**Current phase/milestone:** v0.8 lyric-scene composition + color direction

## Current objective

Move E-MO from "animated text over effects" toward designed lyric-video scenes. The active candidate implements the first two steps of `docs/LYRIC_VISUALIZATION_ENGINE_PLAN.md`: word-level typography composition and a shared OKLCH palette/contrast director.

## Current state

- React/Vite web shell, shared Node runtime, Electron desktop foundation and `emo.project/v1` are merged.
- Compositor baseline is merged: RenderTexture composition, deterministic feedback, displacement, velocity smear, threshold bloom and cinematic post-FX.
- Selector-driven typography and the existing typography/background visual families are merged.
- Visual Accents (Sparks/Trails + Recursive Lyrics) are merged and CI-verified.
- Active v0.8 candidate adds a **Typography Composition Engine**:
  - Center Stack
  - Directional Stage
  - Editorial
  - Vertical Accent
  - Split Stage
  - Crossword
- Composition operates above glyph effects: complete words receive independent placement, orientation, scale and entry vectors. 90° words and mixed directional/zoom entrances are first-class.
- Layout AUTO is deterministic from scene family + cue index.
- Active v0.8 candidate also adds an **OKLCH Palette Director**:
  - Split Complement
  - Analogous
  - Complement
  - Triad
  - Tetrad
  - Monochrome
- Generated palettes expose semantic background/text/accent/glow/muted roles and enforce minimum lyric/background contrast.
- Primary typography and background layers share the same palette.
- Composition and harmony are controllable from React, keyboard and `emo.project/v1`.

## Last verified checks

- Main before v0.8: Linux validation and Windows packaging are green through Visual Accents.
- v0.8 candidate requires fresh Linux + Windows gates before merge.

## Next concrete action

1. Get v0.8 composition/palette CI green and merge.
2. Build Step 3: word/layout-level motion grammar (push, handoff, takeover, collapse, flip, portal).
3. Expand Step 4 art-direction worlds using the palette-role contract rather than hard-coded scene colors.
4. Finish remaining typography primitives.
5. Stabilize serializable scene-stack directives before editor work.

## Do not redo

- Do not collapse composition back into glyph animation; layout and motion are separate layers.
- Do not use HSL/random RGB for automatic scene color decisions where the OKLCH director applies.
- Do not move frame-critical rendering/audio timing into React/Zustand/TanStack.
- Do not introduce history-dependent random layout choices.
- Do not restart Pixi's independent automatic ticker.
- Do not add FFmpeg/video-export dependencies before a dedicated export/license milestone.

## Important context

- The audio/LRC clock remains the only motion-time source.
- Composition plans are pure/testable engine-core output; Pixi only consumes them.
- Palette AUTO and Composition AUTO are deterministic by cue index.
- Primary text contrast is measured against the generated background before a palette is exposed.

For implementation order, read `docs/LYRIC_VISUALIZATION_ENGINE_PLAN.md`.
