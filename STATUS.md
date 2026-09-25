# Project Status

**Last updated:** 2026-09-25  
**Last known good merged baseline:** `7dc366a61fbe941b9b6973e8ee988fe856620ea3`  
**Active candidate:** PR #9 — explicit Pixi scene render graph  
**Current phase/milestone:** v0.6 compositor / render graph

## Current objective

Move E-MO from direct scene rendering to an explicit GPU composition pipeline that can support feedback, displacement, velocity smear and layer-specific post-FX without breaking deterministic audio/LRC timing.

## Current state

- React/Vite web shell, shared Node runtime, Electron desktop foundation and `emo.project/v1` are merged.
- Hosted HTTP integration now verifies runtime metadata, manifest project discovery, LRC delivery, byte-range/suffix-range media, HTTP 416 behavior, HEAD ranges, SPA fallback and security headers.
- Windows CI packages and uploads NSIS and portable x64 artifacts.
- PR #9 introduces the first explicit Pixi render graph:
  - motion scene captured into a dedicated RenderTexture;
  - separate sharp presentation and blurred additive bloom layers;
  - existing CinematicPostFX remains on the sharp layer;
  - Cinema/Performance modes use separate composition-resolution budgets;
  - Pixi's automatic ticker is disabled so the audio/lyric update path owns scene evaluation and final rendering;
  - camera pivot/impulses are centered on the viewport.
- The old root Vite UI remains a temporary compatibility surface pending owner visual acceptance of the React app.

## Last verified checks

- Hosted HTTP integration PR: Linux typecheck/build/tests/audit — passed; Windows build/package/upload — passed.
- Render-graph PR #9: strict TypeScript, build, tests and publication audit — passed on Linux for the current renderer code.
- Final Windows packaging result for the current render-graph candidate must still be confirmed after this documentation update.

## Next concrete action

1. Merge PR #9 after final Linux + Windows gates are green.
2. Add ping-pong feedback RenderTextures with deterministic scene-reset behavior.
3. Add true displacement and velocity-smear passes with Performance/Cinema budgets.
4. Complete owner visual acceptance of the React player, fullscreen/seek/drop behavior and `Ctrl + Shift + H`.
5. Retire the temporary root legacy UI after React acceptance.

## Do not redo

- Do not reintroduce GSAP without reopening ADR-003.
- Do not move frame-critical rendering/audio timing into React/Zustand/TanStack.
- Do not restart Pixi's independent automatic ticker for the engine rendering path.
- Do not expose arbitrary filesystem paths to browser/Electron renderer code.
- Do not add FFmpeg/video-export dependencies before a dedicated export/license milestone.

## Important context

- The RenderTexture scene capture is a deliberate composition boundary, not a cache of static content.
- Live playback remains driven by the HTML-audio-backed clock; the render graph only changes where/how a evaluated frame is composited.
- Manual Pixi rendering is required so future feedback buffers and fixed-frame export can evaluate one explicit frame at a time.
- Windows packaging is mechanically validated, but end-user visual/runtime smoke testing is still required.

For deeper continuation context, read `docs/HANDOVER.md`, `docs/PROJECT_FORMAT.md` and `docs/PLATFORM_ARCHITECTURE.md`.
