# Project Status

**Last updated:** 2026-09-25  
**Last known good merged baseline:** `6bde1cca0db795c8b7f6faae6772eeb4ae899520`  
**Current phase/milestone:** compositor baseline complete / typography selector foundation next

## Current objective

Visually validate the completed v0.6 compositor, then move into the typography selector engine: reusable range, stagger and wiggle weighting at glyph level instead of hard-coded per-scene transforms.

## Current state

- React/Vite web shell, shared Node runtime, Electron desktop foundation and `emo.project/v1` are merged.
- Hosted HTTP integration verifies runtime/project APIs, manifest defaults, LRC/media delivery, byte ranges, HTTP 416 behavior, HEAD ranges, SPA fallback and security headers.
- Windows CI packages NSIS and portable x64 artifacts.
- The compositor baseline on main now includes:
  - explicit RenderTexture scene capture;
  - manual audio/LRC-clock-owned Pixi rendering;
  - centered virtual camera;
  - Cinema-mode deterministic ping-pong frame feedback with reset semantics;
  - scene-aware audio-reactive displacement;
  - dedicated seven-tap velocity smear;
  - reactive bright-pass threshold bloom;
  - cinematic chromatic/glow/grain/vignette treatment.
- Threshold bloom passed Linux typecheck/build/tests/audit and Windows build/package/upload before merge.
- The old root Vite UI remains a temporary compatibility surface pending owner visual acceptance of the React app.

## Last verified checks

- Linux repository gate: install, strict TypeScript, production build, tests and publication audit — passed for the threshold-bloom candidate.
- Windows gate: full build, NSIS packaging, portable x64 packaging and artifact upload — passed for the threshold-bloom candidate.
- Threshold bloom merged as `6bde1cca0db795c8b7f6faae6772eeb4ae899520`.

## Next concrete action

1. Perform visual acceptance of Poster / Neon / Vortex across Performance / Cinema.
2. Start the general typography selector API.
3. Route glyph position, opacity, scale, rotation and related properties through selector weights.
4. Build outline-stack and recursive/tunnel typography presets on that API.
5. Retire the temporary root legacy UI after React acceptance.

## Do not redo

- Do not reintroduce GSAP without reopening ADR-003.
- Do not move frame-critical rendering/audio timing into React/Zustand/TanStack.
- Do not restart Pixi's independent automatic ticker for the engine rendering path.
- Do not allow feedback buffers to persist across discontinuous seeks, project changes or scene-family changes.
- Do not add FFmpeg/video-export dependencies before a dedicated export/license milestone.

## Important context

- Live playback remains driven by the HTML-audio-backed clock.
- The render graph changes composition only; it does not create another animation clock.
- Temporal feedback is Cinema-only and disabled in Performance mode.
- Bloom now extracts bright pixels before blur rather than blurring the whole frame.

For deeper continuation context, read `docs/HANDOVER.md`, `docs/PROJECT_FORMAT.md` and `docs/PLATFORM_ARCHITECTURE.md`.
