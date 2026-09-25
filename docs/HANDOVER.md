# Handover

**Last updated:** 2026-09-25  
**Merged implementation baseline:** `d4f1d30d5f6db8203a6fec95656f813b96752e9a`  
**Current phase/milestone:** E-MO-Engine platform architecture freeze

## Current objective

Replatform the existing v0.3 browser baseline into stable cross-platform package boundaries before continuing major post-FX/editor work.

## What was just completed

- The first E-MO realtime baseline was merged with fully green CI.
- Product identity was changed from the earlier E-MOE-CHAIN working name to **E-MO-Engine — Extensive Motion Engine for Enhanced LRC files**.
- RhymeLab's current application and shared-core architecture was reviewed as the reference stack.
- The cross-platform baseline was selected and documented in `docs/PLATFORM_ARCHITECTURE.md`.
- Desktop packaging decision: Electron + electron-builder.
- Hosted runtime decision: Node.js standard HTTP/filesystem APIs first.
- UI decision: React + TypeScript + Vite + Base UI + Motion + Zustand + TanStack Query; TanStack Virtual where justified.
- Renderer decision remains PixiJS + custom timestamp motion/shaders.
- React/UI libraries are explicitly excluded from frame-critical rendering ownership.

## Current implementation state

The merged code is still a single Vite/Pixi browser application. Do not expand that single-app shape further. Preserve its working behavior while extracting it into the new package/application boundaries.

Current visual behavior includes:

- local audio playback and Web Audio analysis;
- Enhanced LRC parsing and fallback timing;
- deterministic timestamp-derived word/glyph motion;
- Auto Director;
- Poster/Neon/Vortex scene families;
- camera impulses;
- procedural particles/geometry;
- custom scene-aware GPU post-FX;
- high-end HUD with `Ctrl + Shift + H` visibility control.

## Important files / entry points

| Path | Why it matters |
|---|---|
| `docs/PLATFORM_ARCHITECTURE.md` | authoritative cross-platform stack and boundaries |
| `docs/DECISIONS.md` | ADRs, including platform decision |
| `src/main.ts` | current monolithic app orchestration to be split |
| `src/audio/AudioEngine.ts` | current browser audio adapter |
| `src/lyrics/ELRCParser.ts` | first engine-core extraction candidate |
| `src/core/MasterClock.ts` | evolve behind a generic Clock contract |
| `src/core/SceneDirector.ts` | engine-core candidate |
| `src/render/EngineRenderer.ts` | renderer-pixi entry candidate |
| `src/render/CinematicPostFX.ts` | renderer-pixi custom filter |
| `src/effects/typography/KineticLyrics.ts` | renderer-pixi typography |
| `src/effects/backgrounds/CinematicBackground.ts` | renderer-pixi backgrounds |

## Decisions already made

- ADR-001: playback clock owns synchronized live time.
- ADR-002: PixiJS owns frame-critical rendering; UI framework stays outside.
- ADR-003: GSAP is not an engine dependency.
- ADR-004: licensing mirrors RhymeLab.
- ADR-005: React/Vite + PixiJS + Node + Electron cross-platform baseline.

## Target package/app shape

```text
apps/
  web/
  desktop/
  server/

packages/
  engine-core/
  renderer-pixi/
  audio-web/
  platform-web/
  platform-node/
  app-contracts/
```

This migration should be incremental. Do not perform a large rewrite that loses the already verified v0.3 behavior.

## Next concrete work

1. Add npm workspaces and scaffold the package/app boundaries.
2. Pin the React app stack to the RhymeLab baseline where compatible.
3. Move Enhanced LRC types/parser, math, timing contracts and SceneDirector into `engine-core`.
4. Move Pixi renderer/effects into `renderer-pixi`.
5. Wrap HTMLAudio/Web Audio as `audio-web`.
6. Define `AssetSource`, `ProjectSource`, `Clock`, and typed platform contracts.
7. Build the hosted Node project-root adapter.
8. Build the secure Electron main/preload directory adapter.
9. Resume render-graph/editor work only after the same baseline runs through the new boundaries.

## Verification

During extraction, every migration chunk must keep:

```text
npm run typecheck
npm run build
python scripts/repo_audit.py
```

Add package tests as modules move. Visual smoke tests must still cover audio/LRC load, seek, mode switching, post-FX, fullscreen, and `Ctrl + Shift + H`.

## Important context / traps

- Electron renderer must not have `nodeIntegration`; use typed preload IPC.
- Server/Electron filesystem reads must be confined below a configured root.
- React/Zustand/TanStack are control-plane/application tools, not a 60-FPS render state bus.
- Motion is for UI transitions, not lyric/camera/particle animation.
- Do not introduce Next.js/Tauri/Tailwind/FFmpeg/Three.js as baseline dependencies without reopening the corresponding architecture decision.

## Resume instruction

Read in order:

1. `AGENTS.md`
2. `PROJECT.md`
3. `STATUS.md`
4. this file
5. `docs/PLATFORM_ARCHITECTURE.md`
6. `docs/DECISIONS.md`

Then inspect current branches/CI before moving code.
