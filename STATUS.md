# Project Status

**Last updated:** 2026-09-25  
**Last known good implementation commit:** `82bf437328143c2a2173abfb2e34c85928d96b94`  
**Current phase/milestone:** v0.3.0 alpha bootstrap / repository validation

## Current objective

Land the first real E-MOE-CHAIN player/renderer baseline through the repository's required pull-request workflow, then continue with the RenderTexture/post-FX graph.

## Current state

- v0.3 engine source exists on branch `build/emoe-chain-v0.3`.
- Audio playback, Enhanced LRC parsing, timestamp-driven glyph motion, Auto Director, virtual camera, audio-reactive backgrounds, drag/drop, sync trim, fullscreen, and the high-end HUD are implemented.
- `Ctrl + Shift + H` hides/shows the full player HUD and is a preserved product shortcut.
- PixiJS 8.21.0 is the only runtime package dependency.
- GSAP was deliberately rejected after license review because the planned visual-editor scope could intersect its visual-animation-builder restriction.
- The RhymeLab source-available / separate-commercial-license model is mirrored in the repository license files.
- A `validate` GitHub Actions job is being added because repository rules require PR-based changes plus the `validate` status check.

## Last verified checks

- TypeScript source was checked with strict compiler settings and a temporary local Pixi API stub — passed.
- Source/dependency scan confirmed no GSAP or Three.js runtime import remains.
- GitHub repository settings were read through authenticated tooling and match the public owner-controlled model.
- Full `npm install` / `npm run build` has not yet been verified in the local execution environment because package-registry access timed out; CI is the next authoritative dependency-backed build check.

## Current blocker

Local package installation is blocked by network timeout in the current execution environment. The repository PR/CI path must perform the real dependency-backed typecheck and Vite production build.

## Next concrete action

Run the new pull request through the required `validate` check. If it passes, merge the bootstrap and begin the RenderTexture/post-FX composition layer; if it fails, fix the concrete CI/build error before adding more effects.

## Do not redo

- Do not reintroduce GSAP without reopening ADR-003 and reviewing the then-current license against the visual-editor scope.
- Do not move frame-critical rendering or the audio master clock into React.
- Do not replace audio time with an independent wall-clock animation timeline.
- Do not redo the repository visibility/collaboration-mode decision; public + owner-controlled + collaborator-only PR creation is already verified.

## Important context

- The main branch is rule-protected: changes must go through a pull request and the required status check is named `validate`.
- No commercial media, lyric corpus, or font pack is bundled.
- A package lockfile is still absent because package installation was unavailable in the current execution environment.

For deeper continuation context, read `docs/HANDOVER.md`.
