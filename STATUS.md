# Project Status

**Last updated:** 2026-09-25  
**Last known good merged baseline:** `7d9c6570868198b2e7cfa159ba70a3b03376dccc`  
**Active candidate:** `feat/render-persistent-typography-sequences-v0.9`  
**Current phase/milestone:** cinematic sequence direction + temporal readability

## Current objective

Render the merged seek-safe multi-cue model as actual cinematic AUTO shots: Spiral Depth and Hero/Echo first, with phrase-scoped history and explicit manual-control fallback.

## Current state

- Phrase-level cinematic direction + adaptive readability pressure are merged in `c58be3e`.
- The pure multi-cue typography window + Spiral Depth/Hero-Echo planners are merged in `7d9c657`.
- Active candidate adds a bounded Pixi word cache driven by the pure plan; Pixi state remains disposable and non-authoritative.
- Spiral Depth and Hero/Echo become real AUTO sequence shots and replace, rather than overlay, normal current-line typography while active.
- Persistent history is scoped to the current directed phrase.
- Any manual Typography, Composition or Composition Motion selection disables the persistent AUTO grammar immediately and restores the explicit current-line composition.
- Active candidate introduces phrase-level cinematic direction: AUTO typography preset, layout and composition motion are selected as coherent bundles and held across a phrase instead of independently cycling every line.
- Phrases expose Establish / Develop / Accent / Release shot roles for the next sequence/camera layer.
- Active candidate adds kinetic readability pressure from line duration, words/s, chars/s and shortest word duration.
- Rapid/Burst timing reduces long travel, rotation, scale excursion, floating and echo clutter but deliberately keeps nonzero motion and stronger visibility floors.
- Repeated lyric motifs create phrase boundaries so hook detection remains first-class rather than being swallowed by phrase grouping.
- Current architectural blocker for Spiral Depth / Hero Echo / Shape Build is explicit: `KineticLyrics` still rebuilds the current lyric scene per line. The next slice is a deterministic persistent multi-cue typography scene graph.
- Research/design contract is `docs/CINEMATIC_TYPOGRAPHY_DIRECTION.md`.
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
- Optional Rainbow Drift rotates hue slowly from explicit lyric time.
- Active candidate adds independent **Color Canvas** styles: Night, Paper, Color Field and Poster.
- Color Canvas AUTO changes only in stable three-line chapters, giving obvious dark/light/chromatic variation without flickering every cue.
- Paper/Poster use dark colored typography on light/chromatic fields; Night/Color Field use light tinted typography with the same contrast contract.
- Rainbow Drift becomes canvas-aware: Night stays restrained while Paper/Color Field/Poster can shift the coherent background field itself.
- Root `npm run dev` owns runtime startup, waits for `/api/runtime`, then starts Vite; this removes the normal `ECONNREFUSED 127.0.0.1:3040` startup race.
- Windows/Node 24 Vite child startup is fixed by avoiding direct `npm.cmd` spawning; Windows launcher smoke coverage now runs on Node 22 + 24.
- Default server mode creates the repository `projects/` root when no explicit project root is configured.
- Step 4 now includes four merged large-scale **Art Direction Worlds**:
  - Editorial — asymmetric plates, bars and framing marks;
  - Print — halftone field, print bands and registration-like texture;
  - Architecture — nested frames, vanishing-point guides and pillars;
  - Aurora — layered edge ribbons, horizon glow and sparse motes.
- Art worlds consume semantic OKLCH palette roles and preserve a quiet central lyric region.
- Selecting an art world suppresses generic blob/particle/ring/beam layers so the new worlds do not collapse back into the same ambient-particle look.
- AUTO background routing now gives the new worlds first-class exposure in Poster/Neon/Vortex families.
- Reusable composition assessment (bounds, overflow, collision pairs, overlap ratio) and a viewport stress matrix cover desktop, laptop, portrait and mobile classes.

## Last verified checks

- Art Direction Worlds: Linux install/typecheck/build/tests/publication audit — passed.
- Art Direction Worlds: Windows full build, NSIS packaging, portable x64 packaging and artifact upload — passed.
- Visual Readability Matrix: Linux install/typecheck/build/tests/publication audit — passed.
- Visual Readability Matrix: Windows full build, NSIS packaging, portable x64 packaging and artifact upload — passed.

- v0.8 Composition + Palette: Linux install/typecheck/build/tests/publication audit — passed.
- v0.8 Composition + Palette: Windows full build, NSIS packaging, portable x64 packaging and artifact upload — passed.
- Composition Motion: Linux install/typecheck/build/tests/publication audit — passed.
- Composition Motion: Windows full build, NSIS packaging, portable x64 packaging and artifact upload — passed.
- Readability + Mood Color Direction: Linux install/typecheck/build/tests/publication audit — passed.
- Readability + Mood Color Direction: Windows full build, NSIS packaging, portable x64 packaging and artifact upload — passed.
- Dev Runtime + Color Canvas Variety: Linux install/typecheck/build/tests/publication audit — passed.
- Dev Runtime + Color Canvas Variety: Windows full build, NSIS packaging, portable x64 packaging and artifact upload — passed.
- Windows Node 24 Dev Launcher (PR #35): Linux validation — passed.
- Windows Node 24 Dev Launcher (PR #35): Windows launcher smoke on Node 22 — passed.
- Windows Node 24 Dev Launcher (PR #35): Windows launcher smoke on Node 24 — passed.

## Next concrete action

1. Get visible Spiral/Hero renderer integration green in Linux + Windows CI.
2. Visually calibrate Spiral Depth and Hero/Echo on real Enhanced LRC tracks, including dense passages and mobile.
3. Add Shape Build / Ribbon Path.
4. Add Elastic Tether, then continuity-aware camera direction.
5. Extend the cinematic acceptance matrix with gaze continuity, sequence persistence and shot-scale variation.

## Do not redo

- Do not collapse composition back into glyph animation; layout and motion are separate layers.
- Do not use HSL/random RGB for automatic scene color decisions where the OKLCH director applies.
- Do not move frame-critical rendering/audio timing into React/Zustand/TanStack.
- Do not introduce history-dependent random layout choices.
- Do not implement cinematic continuity as a stateful tween history that cannot be reconstructed after seek.
- Do not solve fast lyrics by making them static; reduce motion distance/complexity while preserving local kinetic emphasis.
- Do not add another background/effect family before the multi-cue sequence foundation unless it closes a specific accepted visual grammar gap.
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
- See `docs/DEVELOPMENT_RUNTIME.md` for the runtime/Vite startup contract and the meaning of proxy `ECONNREFUSED`.

For implementation order, read `docs/LYRIC_VISUALIZATION_ENGINE_PLAN.md`.
