# Project Status

**Last updated:** 2026-09-25  
**Last known good merged baseline:** `df04c773b08c19b80e4f1b823ba60acc817b0b69`  
**Active candidate:** `feature/art-direction-worlds-v0.8`  
**Current phase/milestone:** v0.8 lyric-scene composition + color direction

## Current objective

Land the first genuinely distinct Step 4 art-direction worlds on top of the merged readability, composition-motion and color-direction contracts.

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
- v0.8 now includes a merged **central lyric attention field** inside title-safe space and deterministic collision resolution.
- LTR AUTO layouts now preserve readable row order; vertical words are limited to logical edge accents instead of arbitrary mid-sequence rotations.
- Split Stage no longer alternates consecutive cues left/right across the frame.
- Color Director adds lyric-oriented mood presets: Tender, Heartbreak, Longing, Euphoria, Rage, Dream, Tension and Calm.
- Dark background roles are now deliberately near-neutral/low-chroma to prevent persistent muddy brown fields.
- Optional Rainbow Drift rotates hue slowly from explicit lyric time while primary text/background remain restrained.
- Active Step 4 candidate adds four large-scale **Art Direction Worlds**:
  - Editorial — asymmetric plates, bars and framing marks;
  - Print — halftone field, print bands and registration-like texture;
  - Architecture — nested frames, vanishing-point guides and pillars;
  - Aurora — layered edge ribbons, horizon glow and sparse motes.
- Art worlds consume semantic OKLCH palette roles and preserve a quiet central lyric region.
- Selecting an art world suppresses generic blob/particle/ring/beam layers so the new worlds do not collapse back into the same ambient-particle look.
- AUTO background routing now gives the new worlds first-class exposure in Poster/Neon/Vortex families.

## Last verified checks

- v0.8 Composition + Palette: Linux install/typecheck/build/tests/publication audit — passed.
- v0.8 Composition + Palette: Windows full build, NSIS packaging, portable x64 packaging and artifact upload — passed.
- Composition Motion: Linux install/typecheck/build/tests/publication audit — passed.
- Composition Motion: Windows full build, NSIS packaging, portable x64 packaging and artifact upload — passed.
- Readability + Mood Color Direction: Linux install/typecheck/build/tests/publication audit — passed.
- Readability + Mood Color Direction: Windows full build, NSIS packaging, portable x64 packaging and artifact upload — passed.

## Next concrete action

1. Get the four-world Step 4 candidate green on Linux + Windows and visually accept it on real tracks.
2. Tune composition/layout/grammar combinations on real Enhanced LRC tracks and narrow/mobile viewports.
3. Add only genuinely distinct next worlds (volumetric light, collage/cutout, 2.5D/image treatment) after the first four pass visual acceptance.
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
- Composition plans and composition-motion frames are pure/testable engine-core output; Pixi only consumes them.
- Palette AUTO and Composition AUTO are deterministic by cue index.
- Primary text contrast is measured against the generated background before a palette is exposed.
- There is no claimed scientific "golden center"; E-MO uses a deliberate central attention field informed by title-safe practice and documented center-bias research.
- Current layout baseline is Latin/LTR. Full bidi/RTL typography remains future work.
- See `docs/VISUAL_READABILITY_COLOR_RULES.md` for source-backed rules and product decisions.

For implementation order, read `docs/LYRIC_VISUALIZATION_ENGINE_PLAN.md`.
