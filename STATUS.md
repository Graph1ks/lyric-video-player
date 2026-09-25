# Project Status

**Last updated:** 2026-09-25  
**Last known good merged baseline:** `000b6ddd04a0e08b1724ab98e900796056ed52a3`  
**Active candidate:** `feature/project-manifest-v1`  
**Current phase/milestone:** v0.5 project model stabilization

## Current objective

Stabilize a versioned project format that gives the hosted and desktop runtimes explicit, reproducible asset selection and visual defaults before expanding the editor/render graph.

## Current state

- React/Vite web shell, shared Node runtime and Electron desktop foundation are merged.
- Windows CI successfully produced and uploaded both NSIS and portable x64 artifacts.
- The engine remains split across `engine-core`, `audio-web`, `renderer-pixi`, `app-contracts`, `platform-web` and `platform-node`.
- Convention-based projects still work when a folder contains one supported audio file and one LRC file.
- The active manifest candidate adds `emo.project/v1` with explicit audio/LRC paths, auxiliary assets/presets, display name and player defaults.
- Manifest paths are confined to the project directory and continue through the server's root-confinement layer.
- React applies manifest visual mode, intensity, render quality and sync defaults when loading a project.
- The old root Vite UI remains a temporary compatibility surface pending owner visual acceptance of the React app.

## Last verified checks

- v0.5 React/Electron platform PR: dependency install, strict TypeScript, build, tests and publication audit — passed.
- Windows desktop packaging PR: normal Windows install, full build, electron-builder NSIS + portable x64 packaging and artifact upload — passed.
- Project-manifest candidate still requires its own final CI before merge.

## Next concrete action

1. Land `emo.project/v1` after green CI.
2. Use manifest-backed sample projects to perform hosted and Electron project-loading acceptance.
3. Perform owner visual acceptance of the React player and `Ctrl + Shift + H` HUD behavior.
4. Make the React/server surface canonical and remove the legacy root UI in a dedicated cleanup.
5. Resume multi-pass RenderTexture/post-FX and editor timeline work on the stable project model.

## Do not redo

- Do not reintroduce GSAP without reopening ADR-003.
- Do not move frame-critical rendering/audio timing into React/Zustand/TanStack.
- Do not expose arbitrary paths from the browser/Electron renderer to Node.
- Do not loosen manifest or server root-confinement rules for convenience.
- Do not add FFmpeg/video-export dependencies before a dedicated export/license milestone.

## Important context

- Hosted and desktop modes execute the same React application and server/project semantics.
- Desktop native folder selection only chooses the root; project resolution remains on the Node side.
- Manifest defaults are application defaults, not a second render clock or animation timeline.
- Windows packaging is now mechanically validated, but end-user visual/runtime smoke testing is still required.

For deeper continuation context, read `docs/HANDOVER.md`, `docs/PROJECT_FORMAT.md` and `docs/PLATFORM_ARCHITECTURE.md`.
