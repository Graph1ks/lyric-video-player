# Project Status

**Last updated:** 2026-09-25  
**Last known good merged baseline:** `0e8847d6eb431193f947e3ed4adb50ac0254abfd`  
**Current phase/milestone:** v0.5 project/runtime acceptance

## Current objective

Prove the merged React/server/Desktop project path end-to-end, complete visual acceptance of the React cutover, then make the React application canonical before resuming major renderer/editor expansion.

## Current state

- React/Vite web shell, shared Node runtime and Electron desktop foundation are merged.
- Windows CI successfully packages and uploads both NSIS and portable x64 artifacts.
- `emo.project/v1` is merged with explicit nested audio/LRC paths, optional assets/presets, project naming and reproducible player defaults.
- Convention-based one-audio/one-LRC folders remain supported.
- Manifest paths are confined to the project directory and continue through the server's configured-root confinement layer.
- React applies manifest visual mode, intensity, render quality and lyric-sync defaults when a project is loaded.
- The engine remains split across `engine-core`, `audio-web`, `renderer-pixi`, `app-contracts`, `platform-web` and `platform-node`.
- The old root Vite UI remains a temporary compatibility surface pending owner visual acceptance of the React app.

## Last verified checks

- React/Electron v0.5 platform: dependency install, strict TypeScript, build, tests and publication audit — passed.
- Windows desktop packaging gate: normal Windows install, full build, electron-builder NSIS + portable x64 packaging and artifact upload — passed.
- `emo.project/v1`: Linux validation passed; Windows build/package/upload also passed before merge.
- Manifest regression tests cover nested files/defaults, convention-mode compatibility and traversal rejection.

## Next concrete action

1. Add hosted-server integration tests that exercise project discovery, manifest defaults and byte-range media over HTTP.
2. Load a real manifest-backed project through hosted and Electron modes.
3. Perform owner visual acceptance of the React player, fullscreen/seek/drop behavior and `Ctrl + Shift + H`.
4. Make the React/server surface canonical and remove the legacy root UI in a dedicated cleanup.
5. Resume multi-pass RenderTexture/post-FX and selector-driven typography on the stable project model.

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
- Windows packaging is mechanically validated, but end-user visual/runtime smoke testing is still required.

For deeper continuation context, read `docs/HANDOVER.md`, `docs/PROJECT_FORMAT.md` and `docs/PLATFORM_ARCHITECTURE.md`.
