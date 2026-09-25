# Project Status

**Last updated:** 2026-09-25  
**Last known good merged baseline:** `ae49c1cd761266d48f2cd296bd28e0f86b8d39dc`  
**Active candidate:** PR #4 — React web shell + Electron desktop runtime  
**Current phase/milestone:** v0.5 cross-platform application cutover

## Current objective

Land the shared React/server/desktop product surface while preserving the already verified E-MO rendering/timing engine, then retire the temporary root/legacy application surface after visual/device acceptance.

## Current state

- Product identity is **E-MO-Engine — Extensive Motion Engine for Enhanced LRC files**.
- v0.4 workspace extraction is merged: engine-core, audio-web, renderer-pixi, app-contracts, platform-node and the reusable Node server are separated.
- Current PR #4 adds the React 19 / TypeScript / Vite 8 application shell.
- The React UI preserves local file/drop ingestion, transport, Visual Director controls, manual sync, fullscreen and `Ctrl + Shift + H`.
- React/Zustand do not own the frame loop: audio analysis, cue lookup, renderer updates, meters and seek/time display remain imperative/ref-driven.
- Hosted mode discovers projects below a configured root and serves audio/video with HTTP byte ranges.
- Desktop mode uses Electron main/preload security boundaries and starts the exact same loopback E-MO server/React client.
- Desktop folder selection changes the project root through typed preload IPC.
- Windows packaging is configured for NSIS and portable x64 targets.
- The old root Vite UI remains as a temporary compatibility surface until React visual/browser acceptance is completed.

## Last verified checks

- PR #3 workspace extraction: typecheck, build, tests and publication audit — passed.
- PR #4 initial candidate: dependency installation and strict TypeScript — passed.
- PR #4 initial candidate: React + workspace + Electron compilation/build — passed.
- PR #4 initial candidate: Node/workspace and React tests — passed.
- PR #4 initial candidate: publication audit — passed.
- A documentation/dependency-notice commit follows, so the final PR check must be re-confirmed before merge.

## Current blocker

No known source/build blocker. Remaining gate is final CI after documentation updates, followed by real visual/Desktop packaging acceptance.

## Next concrete action

1. Get final PR #4 CI green and merge.
2. Run the React app as the default development surface against the Node project server.
3. Perform owner visual/interaction acceptance of the React HUD, especially fullscreen, drag/drop, seek, project loading and `Ctrl + Shift + H`.
4. Produce and smoke-test the first Windows installer/portable artifact.
5. Only then remove the root legacy application surface and resume major RenderTexture/editor expansion.

## Do not redo

- Do not reintroduce GSAP without reopening ADR-003.
- Do not move frame-critical rendering/audio timing into React/Zustand/TanStack.
- Do not give the Electron renderer Node integration or unrestricted filesystem access.
- Do not choose Tauri unless ADR-005 is explicitly reopened with a concrete product reason.
- Do not add FFmpeg/video-export dependencies before a dedicated export/license milestone.

## Important context

- Hosted and desktop modes execute the same React application and E-MO server/project semantics.
- The desktop app starts its server on loopback and uses the preload bridge only for privileged native actions such as folder selection.
- Server asset access is confined to a configured root and project media is addressed by discovered project/asset IDs rather than arbitrary paths.
- A committed npm lockfile remains a follow-up; CI currently verifies the pinned workspace manifests directly.

For deeper continuation context, read `docs/HANDOVER.md` and `docs/PLATFORM_ARCHITECTURE.md`.
