# Project Status

**Last updated:** 2026-09-25  
**Last known good merged baseline:** `659008d754fc3f4eab921e3b3241ee8d9d79abdb`  
**Active candidate:** none  
**Current phase/milestone:** v0.7 visualization-engine expansion

## Current objective

Finish the remaining typography primitives and then stabilize the serializable scene/effect stack before editor work.

## Current state

- React/Vite web shell, shared Node runtime, Electron desktop foundation and `emo.project/v1` are merged.
- Compositor baseline is merged: RenderTexture composition, deterministic feedback, displacement, velocity smear, threshold bloom and cinematic post-FX.
- Typography selector engine and eight typography families are merged.
- Background engine now includes Cinematic, Nebula, Grid, Starfield, Rays, Vortex, Liquid, Spectrum and Minimal.
- Full-spectrum audio transport uses allocation-stable logarithmic resampling.
- Procedural Liquid and Spectrum ribbons passed Linux + Windows CI before merge.
- Deterministic Sparks/Trails and Recursive Lyrics backgrounds are merged, including scene-specific Poster / Neon / Vortex layouts, quality budgets, React controls, AUTO routing and `emo.project/v1` support.

## Last verified checks

- Liquid/Spectrum: Linux install/typecheck/build/tests/audit — passed.
- Liquid/Spectrum: Windows full build, NSIS, portable x64 and artifact upload — passed.
- Visual Accents: Linux install/typecheck/build/tests/audit — passed.
- Visual Accents: Windows full build, NSIS, portable x64 and artifact upload — passed.

## Next concrete action

1. Add remaining typography families: soft-3D/inflate, brush/stroke reveal and dissolve/smear exit.
2. Add scene-stack serialization with per-section visual directives.
3. Perform a dedicated real-track visual tuning pass across the complete preset matrix.
4. Only then begin timeline/editor UI.

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
