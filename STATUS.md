# Project Status

**Last updated:** 2026-09-25  
**Last known good merged baseline:** `bc96436c24971820d785e5374e0bed13423c5106`  
**Active candidate:** `feature/liquid-spectrum-v0.7`  
**Current phase/milestone:** v0.7 visualization-engine expansion

## Current objective

Finish the graphics/lyrics visualization engine before editor work. Typography and background preset routing are now generalized; the active work adds reusable procedural-liquid and full-spectrum visualization primitives.

## Current state

- React/Vite web shell, shared Node runtime, Electron desktop foundation and `emo.project/v1` are merged.
- The compositor baseline is merged: RenderTexture composition, deterministic feedback, displacement, velocity smear, threshold bloom and cinematic post-FX.
- Typography selector engine is merged and CI-verified.
- Eight typography presets are merged: Impact, Cascade, Wave, Scatter, Elastic, Outline, Tunnel and Glitch.
- Independent background preset engine is merged and CI-verified with Cinematic, Nebula, Grid, Starfield, Rays, Vortex and Minimal.
- Typography/background AUTO selection is deterministic by scene family + cue index; both can be overridden independently.
- The active candidate adds:
  - logarithmically distributed reusable FFT spectrum sampling;
  - Spectrum ribbon background driven by 64 audio-spectrum samples;
  - procedural GPU Liquid background using deterministic FBM/domain-warp style noise;
  - Liquid/Spectrum renderer, React and `emo.project/v1` preset routing;
  - feedback reset on manual typography/background preset changes.

## Last verified checks

- Typography v0.7: Linux install/typecheck/build/tests/audit — passed; Windows build/NSIS/portable/artifact upload — passed.
- Background presets v0.7: Linux install/typecheck/build/tests/audit — passed; Windows build/NSIS/portable/artifact upload — passed.
- Liquid/Spectrum candidate requires its own Linux + Windows gates before merge.

## Next concrete action

1. Land Liquid/Spectrum after green CI.
2. Add deterministic sparks/trails and recursive background-lyric layers.
3. Add remaining typography primitives: soft-3D/inflate, stroke/brush reveal and dissolve/smear exits.
4. Add scene-stack serialization with per-section typography/background/camera/post-FX selection.
5. Only then begin the timeline/editor UI.

## Do not redo

- Do not reintroduce GSAP without reopening ADR-003.
- Do not move frame-critical rendering/audio timing into React/Zustand/TanStack.
- Do not restart Pixi's independent automatic ticker for engine rendering.
- Do not make visual randomness wall-clock/history dependent.
- Do not add FFmpeg/video-export dependencies before a dedicated export/license milestone.

## Important context

- Live playback remains driven by the HTML-audio-backed clock.
- FFT spectrum sampling reuses a preallocated Float32Array and the already captured analyser bins.
- Liquid animation derives entirely from supplied playback time + audio bands.
- The current priority is visualization-engine breadth/quality, not editor chrome.

For deeper continuation context, read `docs/HANDOVER.md`, `docs/PROJECT_FORMAT.md` and `docs/PLATFORM_ARCHITECTURE.md`.
