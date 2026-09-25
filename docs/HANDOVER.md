# Handover

**Last updated:** 2026-09-25  
**Merged baseline:** `ae49c1cd761266d48f2cd296bd28e0f86b8d39dc`  
**Active candidate:** PR #4 — `architecture/react-electron-v0.5`  
**Current phase/milestone:** v0.5 cross-platform application cutover

## Current objective

Finish and accept the React/server/Electron platform cutover without changing frame-critical motion semantics. After visual/Desktop acceptance, remove the temporary legacy root application and return to RenderTexture/post-FX/editor work.

## What is implemented

### Shared packages

- `packages/engine-core`: Enhanced LRC, cue/visual types, deterministic Scene Director, math/easing primitives, generic Clock and FixedFrameClock.
- `packages/audio-web`: local/URL audio loading, Web Audio analysis and HtmlAudioClock.
- `packages/renderer-pixi`: Pixi renderer, camera, typography, backgrounds and cinematic post-FX.
- `packages/app-contracts`: shared project/runtime/Desktop bridge contracts.
- `packages/platform-node`: root-confined project discovery.
- `packages/platform-web`: hosted project client, media URLs, lyric fetch and dropped-file classification.

### Hosted runtime

`apps/server` now exports reusable `EmoServer` plus a CLI entry point. It serves the built app, runtime/project metadata and range-capable media from a configured project root.

### React application

`apps/web` is the new application shell using the same dependency family already proven in RhymeLab:

- React 19.3.0;
- Vite 8.3.0;
- Zustand 5.0.15;
- TanStack Query 5.103.1;
- Motion 13.4.0;
- Base UI 1.8.0 available for accessible primitives;
- TanStack Virtual available for future measured large-list needs;
- Vitest 5.0.1.

The existing player/HUD has been ported. Per-frame audio/renderer work remains imperative and bypasses React state.

### Electron desktop

`apps/desktop` starts the same E-MO server on an ephemeral loopback port and loads the same built React app. Security configuration:

- `contextIsolation: true`;
- `nodeIntegration: false`;
- renderer sandbox enabled;
- native directory selection only through preload IPC.

The directory picker updates the server's project root and returns the new discovered project list. Packaging config defines Windows NSIS and portable x64 targets.

## Important files / entry points

| Path | Why it matters |
|---|---|
| `apps/web/src/App.tsx` | React player/app orchestration |
| `apps/web/src/store.ts` | low-frequency UI/session state only |
| `apps/server/src/server.ts` | shared hosted/Desktop loopback server |
| `apps/desktop/src/main.ts` | Electron privileged process |
| `apps/desktop/src/preload.ts` | narrow typed Desktop bridge |
| `packages/engine-core/src/clock.ts` | live/export timing abstraction |
| `packages/platform-node/src/index.ts` | root confinement/project discovery |
| `packages/renderer-pixi/src/render/EngineRenderer.ts` | frame-critical rendering |
| `docs/PLATFORM_ARCHITECTURE.md` | authoritative architecture |

## Known risks / pending acceptance

- Electron packaging configuration compiles but a real Windows NSIS/portable artifact still requires a packaging smoke test.
- The React HUD needs owner visual acceptance; automated type/build tests do not prove presentation quality.
- Safari and codec-specific M4A behavior remain real-device work.
- The legacy root Vite app remains intentionally until the React cutover is accepted.
- No lockfile is committed yet.
- Current post-FX remains single-pass; ping-pong feedback/RenderTexture composition is postponed until platform cutover acceptance.

## Verification

Automated repository gate:

```text
npm install --ignore-scripts --no-audit --no-fund
npm run typecheck
npm run build
npm test
python scripts/repo_audit.py
```

Hosted smoke flow:

```text
npm run build
node apps/server/dist/index.js --root /path/to/projects
```

Then open the printed loopback URL and verify project discovery/media seeking.

Desktop development flow after a normal install that permits Electron's install script:

```text
npm run build
npm --workspace @graph1ks/emo-desktop start -- --root /path/to/projects
```

Windows packaging target:

```text
npm run desktop:dist
```

## Next concrete work

1. Merge PR #4 after final green CI.
2. Visual/browser acceptance of React player.
3. Windows Electron packaging smoke test.
4. Make React/server surfaces canonical and delete old root UI only in a dedicated cleanup.
5. Resume multi-pass RenderTexture/post-FX architecture.
6. Begin editor/timeline work only on top of the accepted app/platform boundaries.

## Resume instruction

Read `AGENTS.md`, `PROJECT.md`, `STATUS.md`, this file, `docs/PLATFORM_ARCHITECTURE.md`, and `docs/DECISIONS.md`. Then inspect PR #4/current main CI before changing code.
