# Project Status

**Last updated:** 2026-09-25  
**Last known good merged baseline:** `34e75eb43a1eba6498dd3a3fc777072acc7e1e64`  
**Active candidate:** `feature/background-presets-v0.7`  
**Current phase/milestone:** v0.7 visualization-engine expansion

## Current objective

Finish the graphics/lyrics visualization engine before editor work: broaden typography and background families, then add the remaining reusable visual primitives and scene-stack serialization.

## Current state

- React/Vite web shell, shared Node runtime, Electron desktop foundation and `emo.project/v1` are merged.
- The compositor baseline is merged: RenderTexture composition, deterministic feedback, displacement, velocity smear, threshold bloom and cinematic post-FX.
- Typography selector engine is merged and CI-verified.
- Typography now supports deterministic range, stagger, wave, wiggle, random and audio selector weights.
- Eight typography presets are merged: Impact, Cascade, Wave, Scatter, Elastic, Outline, Tunnel and Glitch.
- Typography preset selection is available in the React Visual Director, through keyboard `T`, via renderer API and through `emo.project/v1`.
- The active background candidate adds independent background presets:
  - Cinematic
  - Nebula
  - Grid
  - Starfield
  - Rays
  - Vortex
  - Minimal
- Background AUTO deterministically rotates compatible presets per line while preserving the active Poster / Neon / Vortex color family.
- The background candidate also exposes renderer/UI/project controls and keyboard `B`.

## Last verified checks

- Typography selector/preset merge: Linux install/typecheck/build/tests/audit — passed.
- Typography selector/preset merge: Windows full build, NSIS packaging, portable x64 packaging and artifact upload — passed.
- Background-preset candidate still requires its own Linux + Windows CI before merge.

## Next concrete action

1. Land the background-preset candidate after green CI.
2. Add procedural liquid/noise backgrounds.
3. Add spectrum/waveform ribbon primitives.
4. Add sparks/trails and recursive lyric-background layers.
5. Add remaining typography primitives: soft-3D/inflate, stroke reveal and dissolve exits.
6. Only after those contracts stabilize, build scene-stack serialization and then the editor.

## Do not redo

- Do not reintroduce GSAP without reopening ADR-003.
- Do not move frame-critical rendering/audio timing into React/Zustand/TanStack.
- Do not restart Pixi's independent automatic ticker for the engine rendering path.
- Do not make visual randomness wall-clock/history dependent.
- Do not add FFmpeg/video-export dependencies before a dedicated export/license milestone.

## Important context

- Live playback remains driven by the HTML-audio-backed clock.
- Typography/background AUTO selection is deterministic and derived from scene family + cue index.
- Manual typography and background presets can override AUTO independently.
- The user-facing goal is now breadth and quality of visualization primitives, not editor chrome.

For deeper continuation context, read `docs/HANDOVER.md`, `docs/PROJECT_FORMAT.md` and `docs/PLATFORM_ARCHITECTURE.md`.
