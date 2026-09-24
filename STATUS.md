# Project Status

**Last updated:** 2026-09-25  
**Last known good implementation commit:** `dd8e9fdfd5efd9dd75c9ca907fd07401a9c250c0`  
**Current phase/milestone:** v0.3.0 alpha bootstrap / milestone 0.4 post-FX

## Current objective

Get pull request #1 fully green under the repository's required `validate` check, merge the baseline, then continue the RenderTexture composition/feedback graph.

## Current state

- v0.3 engine source exists on branch `build/emoe-chain-v0.3` and pull request #1 is open.
- Audio playback, Enhanced LRC parsing, timestamp-driven glyph motion, Auto Director, virtual camera, audio-reactive backgrounds, drag/drop, sync trim, fullscreen, and the high-end HUD are implemented.
- `Ctrl + Shift + H` hides/shows the full player HUD and is a preserved product shortcut.
- The first custom PixiJS/WebGL post-FX pass is implemented: scene-aware RGB split, audio/transient smear, glow taps, barrel warp, scanlines, procedural grain, and vignette.
- PixiJS 8.21.0 is the only runtime package dependency.
- GSAP was deliberately rejected after license review because the planned visual-editor scope could intersect its visual-animation-builder restriction.
- The RhymeLab source-available / separate-commercial-license model is mirrored in the repository license files.
- Repository rules require all main-branch changes through a pull request and a required check named `validate`.

## Last verified checks

- Latest dependency-backed GitHub Actions run successfully installed dependencies.
- `npm run typecheck` passed against the real PixiJS 8.21.0 types.
- `npm run build` passed with Vite 7.1.0; 734 modules transformed and production assets emitted successfully.
- Publication audit found one README false positive because the Enhanced LRC word-timestamp example used angle brackets that matched the template-placeholder scanner. The README wording has now been changed to avoid that scanner collision.
- Source/dependency scan confirmed no GSAP or Three.js runtime import remains.

## Current blocker

Only CI revalidation remains after the README audit fix. No current TypeScript or production-build blocker is known.

## Next concrete action

Inspect the newest `validate` run on pull request #1. If green, merge the bootstrap. Then implement RenderTexture composition plus ping-pong feedback; if it fails, fix only the concrete reported issue before expanding the effect stack.

## Do not redo

- Do not reintroduce GSAP without reopening ADR-003 and reviewing the then-current license against the visual-editor scope.
- Do not move frame-critical rendering or the audio master clock into React.
- Do not replace audio time with an independent wall-clock animation timeline.
- Do not redo the repository visibility/collaboration-mode decision; public + owner-controlled + collaborator-only PR creation is already verified.
- Do not revert TypeScript to 5.9.0; that version is not published.

## Important context

- No commercial media, lyric corpus, or font pack is bundled.
- A package lockfile is still absent because package installation was unavailable in the current local execution environment.
- Current post-FX is a single filter pass. True feedback, displacement, multi-pass bloom, and render-target composition are still pending.

For deeper continuation context, read `docs/HANDOVER.md`.
