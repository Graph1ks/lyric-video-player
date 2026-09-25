# Project Status

**Last updated:** 2026-09-25  
**Last known good merged baseline:** `d4f1d30d5f6db8203a6fec95656f813b96752e9a`  
**Current phase/milestone:** E-MO-Engine platform architecture freeze

## Current objective

Freeze the cross-platform application architecture before adding more renderer/editor features, then restructure incrementally around stable engine/platform boundaries.

## Current state

- Product identity is now **E-MO-Engine — Extensive Motion Engine for Enhanced LRC files**.
- The v0.3 realtime baseline is merged and its required `validate` CI passed typecheck, production build, and publication audit.
- Current engine capabilities include Enhanced LRC parsing, timestamp-driven glyph motion, deterministic scene direction, audio analysis, PixiJS rendering, camera motion, procedural backgrounds, and the first custom GPU post-FX pass.
- The platform baseline is now selected: React/TypeScript/Vite application shell, PixiJS engine, Node hosted runtime, Electron desktop runtime.
- The selected React UI stack deliberately matches current RhymeLab experience: Base UI, Motion, Zustand, TanStack Query, TanStack Virtual where needed, CSS Modules/custom properties, Vitest.
- React/UI state is explicitly prohibited from owning frame-critical renderer state.
- Server and Electron modes will share root-confined Node filesystem/project adapters rather than giving the browser renderer raw filesystem access.

## Last verified checks

- PR #1 `validate`: dependency install — pass.
- PR #1 `validate`: strict TypeScript — pass.
- PR #1 `validate`: Vite production build — pass.
- PR #1 `validate`: publication audit — pass.
- RhymeLab architecture review completed against `apps/studio-react/package.json`, `docs/REACT_STUDIO_REPLATFORM.md`, and `docs/SHARED_CORE_ARCHITECTURE.md`.

## Current blocker

None. The next work is architectural extraction/scaffolding, not more visual feature growth.

## Next concrete action

Create the npm-workspace/app/package scaffold, extract current LRC/timing/director logic into framework-independent `engine-core`, and extract current Pixi code into `renderer-pixi` without behavior changes.

## Do not redo

- Do not reintroduce GSAP without reopening ADR-003.
- Do not move frame-critical rendering/audio timing into React/Zustand.
- Do not choose Tauri unless the Electron decision is explicitly reopened with a concrete product reason.
- Do not add a larger Node web framework until the server surface actually outgrows the standard library.
- Do not add FFmpeg/video-export dependencies before a dedicated export milestone/license review.

## Important context

- Hosted mode and desktop mode must execute the same engine/project semantics.
- Desktop targeting is by explicitly selected/configured project root, via Electron main/preload IPC.
- Server asset access is confined to an explicitly configured root and must reject traversal.
- The former `build/render-graph-v0.4` branch was created before this platform-architecture decision; do not continue feature work there until architecture extraction is complete.

For deeper continuation context, read `docs/HANDOVER.md` and `docs/PLATFORM_ARCHITECTURE.md`.
