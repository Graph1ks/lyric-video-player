# Project Status

**Last updated:** 2026-09-25  
**Last known good implementation commit:** `dd8e9fdfd5efd9dd75c9ca907fd07401a9c250c0`  
**Current phase/milestone:** v0.3.0 alpha bootstrap / milestone 0.4 post-FX

## Current objective

Get pull request #1 green under the repository's required `validate` check while continuing the first serious GPU post-processing layer. After merge, build the RenderTexture composition/feedback graph.

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

- Strict TypeScript source was checked locally with a temporary Pixi API stub — passed.
- Source/dependency scan confirmed no GSAP or Three.js runtime import remains.
- GitHub repository settings were read through authenticated tooling and match the public owner-controlled model.
- GitHub Actions run #1 reached dependency installation and failed because `typescript@5.9.0` does not exist. The pin has been corrected to the published stable `5.9.3`.
- The dependency-backed PixiJS typecheck/Vite build must now be re-evaluated by the next CI run.

## Current blocker

No unresolved architectural blocker. The immediate gate is the next `validate` CI result. The current execution environment cannot reliably reach npm, so GitHub Actions is the authoritative dependency-backed build environment.

## Next concrete action

Inspect the newest `validate` run on pull request #1. Fix any real PixiJS API/type/build issue it exposes. Once green, merge the bootstrap and continue with RenderTexture composition plus ping-pong feedback.

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
