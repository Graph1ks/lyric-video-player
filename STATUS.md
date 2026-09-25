# Project Status

**Last updated:** 2026-09-25  
**Last known good merged baseline:** `99f8ecf0946ccd2f46852b78eba130e8355fd9d1`  
**Active candidate:** `feature/visual-accents-v0.7`  
**Current phase/milestone:** v0.7 visualization-engine expansion

## Current objective

Finish the graphics/lyrics visualization engine before editor work. The current candidate adds deterministic spark/trail motion and recursive lyric-background typography on top of the merged Liquid/Spectrum infrastructure.

## Current state

- React/Vite web shell, shared Node runtime, Electron desktop foundation and `emo.project/v1` are merged.
- Compositor baseline is merged: RenderTexture composition, deterministic feedback, displacement, velocity smear, threshold bloom and cinematic post-FX.
- Typography selector engine and eight typography families are merged.
- Background engine now includes Cinematic, Nebula, Grid, Starfield, Rays, Vortex, Liquid, Spectrum and Minimal.
- Full-spectrum audio transport uses allocation-stable logarithmic resampling.
- Procedural Liquid and Spectrum ribbons passed Linux + Windows CI before merge.
- Active visual-accents candidate adds:
  - deterministic radial sparks with analytic trails;
  - recursive current-line typography as a background family;
  - scene-specific Poster / Neon / Vortex recursive-text layouts;
  - quality-aware spark/text budgets;
  - `sparks` and `lyrics` background routing in React and `emo.project/v1`.

## Last verified checks

- Liquid/Spectrum: Linux install/typecheck/build/tests/audit — passed.
- Liquid/Spectrum: Windows full build, NSIS, portable x64 and artifact upload — passed.
- Visual-accents candidate still requires Linux + Windows gates.

## Next concrete action

1. Land Sparks/Lyrics backgrounds after green CI.
2. Add remaining typography families: soft-3D/inflate, brush/stroke reveal and dissolve/smear exit.
3. Add scene-stack serialization with per-section visual directives.
4. Perform a dedicated real-track visual tuning pass across the complete preset matrix.
5. Only then begin timeline/editor UI.

## Do not redo

- Do not reintroduce GSAP without reopening ADR-003.
- Do not move frame-critical rendering/audio timing into React/Zustand/TanStack.
- Do not use stateful random particle spawning that breaks deterministic seek.
- Do not restart Pixi's independent automatic ticker.
- Do not add FFmpeg/video-export dependencies before a dedicated export/license milestone.

## Important context

- Sparks are analytically reconstructed from playback time, cue index and stable seeds; they do not depend on historical spawn state.
- Recursive lyric backgrounds use the current Enhanced LRC line but remain visually behind the primary KineticLyrics layer.
- AUTO background routing can select the new families deterministically by cue index.

For deeper continuation context, read `docs/HANDOVER.md`, `docs/PROJECT_FORMAT.md` and `docs/PLATFORM_ARCHITECTURE.md`.
