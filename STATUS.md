# Project Status

**Last updated:** 2026-09-25  
**Last known good merged baseline:** `2d5b9b75cbcbd124ac2a1768bb3bcc36157d5809`  
**Active candidate:** reactive threshold bloom on `feature/threshold-bloom-v0.6`  
**Current phase/milestone:** v0.6 compositor / post-FX stabilization

## Current objective

Finish the first serious compositor stack before moving into the typography selector engine. The renderer should have explicit frame ownership, temporal feedback, displacement, velocity smear and thresholded bloom while remaining seek-safe and quality-budgeted.

## Current state

- React/Vite web shell, shared Node runtime, Electron desktop foundation and `emo.project/v1` are merged.
- Hosted HTTP integration verifies runtime/project APIs, manifest defaults, LRC/media delivery, byte ranges, HTTP 416 behavior, HEAD ranges, SPA fallback and security headers.
- Windows CI packages NSIS and portable x64 artifacts.
- The renderer now has:
  - explicit RenderTexture scene capture;
  - manual audio/LRC-clock-owned Pixi rendering;
  - centered virtual camera;
  - Cinema-mode deterministic ping-pong frame feedback with seek/project/scene reset;
  - scene-aware audio-reactive displacement;
  - dedicated seven-tap velocity smear;
  - existing cinematic chromatic/glow/grain/vignette pass.
- The active threshold-bloom candidate replaces the old indiscriminate blurred duplicate with a bright-pass filter before blur. Threshold/gain react to scene family, quality, intensity, energy and transients.
- The old root Vite UI remains a temporary compatibility surface pending owner visual acceptance of the React app.

## Last verified checks

- Hosted HTTP integration — Linux validate passed; Windows package/build/upload passed.
- Explicit render graph — Linux validate and Windows packaging passed.
- Ping-pong feedback, displacement and velocity-smear commits are merged on main.
- The threshold-bloom candidate still requires its own Linux/Windows CI before merge.

## Next concrete action

1. Get threshold-bloom CI green and merge it.
2. Perform visual acceptance of the compositor in Poster / Neon / Vortex and Performance / Cinema.
3. Start Milestone 0.5 selector-driven typography: range, stagger and wiggle selectors operating on glyph properties.
4. Add outline-stack and recursive/tunnel typography presets on top of the selector system.
5. Retire the temporary root legacy UI after React acceptance.

## Do not redo

- Do not reintroduce GSAP without reopening ADR-003.
- Do not move frame-critical rendering/audio timing into React/Zustand/TanStack.
- Do not restart Pixi's independent automatic ticker for the engine rendering path.
- Do not allow feedback buffers to accumulate across discontinuous seeks, project changes or scene-family changes.
- Do not add FFmpeg/video-export dependencies before a dedicated export/license milestone.

## Important context

- Live playback remains driven by the HTML-audio-backed clock.
- The render graph changes composition only; it does not create another animation clock.
- Temporal feedback is Cinema-only and intentionally disabled in Performance mode.
- Thresholded bloom is implemented as a bright-pass filter followed by Pixi blur on the dedicated additive bloom layer.

For deeper continuation context, read `docs/HANDOVER.md`, `docs/PROJECT_FORMAT.md` and `docs/PLATFORM_ARCHITECTURE.md`.
