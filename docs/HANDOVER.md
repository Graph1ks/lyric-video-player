# Handover

**Last updated:** 2026-09-25  
**Merged baseline:** `0e8847d6eb431193f947e3ed4adb50ac0254abfd`  
**Current phase/milestone:** v0.5 project/runtime acceptance

## Current objective

Exercise the merged project model through the real hosted/Desktop runtime path, finish React visual acceptance, and then retire the temporary legacy application before returning to deeper renderer/editor work.

## Current implementation state

### Application/platform

- React 19 / Vite 8 is the main application shell.
- PixiJS remains outside React's frame-critical state path.
- Node `EmoServer` serves the React build, project metadata and byte-range media.
- Electron starts the same server on loopback with a sandboxed renderer and typed preload folder picker.
- Windows packaging CI produces NSIS and portable x64 artifacts.

### Project model

`emo.project/v1` is merged and supports:

- explicit project display name;
- explicit nested audio and Enhanced LRC paths;
- optional auxiliary assets and preset files;
- optional visual mode, intensity, render quality and lyric-sync defaults;
- strict rejection of absolute, drive-prefixed, dot/dot-dot and null-byte paths;
- manifest-aware project discovery;
- React application of manifest defaults on project load.

Convention-mode folders remain supported and require no manifest.

## Important files / entry points

| Path | Why it matters |
|---|---|
| `docs/PROJECT_FORMAT.md` | authoritative `emo.project/v1` schema |
| `packages/app-contracts/src/index.ts` | shared manifest/project DTOs |
| `packages/platform-node/src/index.ts` | validation, discovery and root confinement |
| `packages/platform-web/src/index.ts` | hosted project/media client |
| `apps/server/src/server.ts` | hosted/Desktop HTTP runtime |
| `apps/web/src/App.tsx` | loads projects and applies manifest defaults |
| `apps/desktop/src/main.ts` | Electron project-root selection |
| `tests/workspace-boundaries.test.mjs` | engine/project/security regression tests |
| `packages/renderer-pixi/src/render/EngineRenderer.ts` | frame-critical renderer |

## Known risks / pending acceptance

- Manifest schema is intentionally small; scene timelines/effect graphs are not represented yet.
- A malformed manifest fails discovery loudly instead of silently falling back to convention mode.
- Electron artifacts are mechanically packaged but still need a human runtime/visual smoke test on Windows.
- React HUD still needs owner visual acceptance.
- Safari/M4A behavior remains real-device work.
- The root legacy Vite app is still present as a temporary compatibility surface.
- Current post-FX remains a single custom pass; ping-pong feedback/RenderTexture composition is not yet implemented.

## Verification

Repository gate:

```text
npm install --ignore-scripts --no-audit --no-fund
npm run typecheck
npm run build
npm test
python scripts/repo_audit.py
```

Windows packaging gate:

```text
npm install
npm run build
npm --workspace @graph1ks/emo-desktop run dist
```

The next automated acceptance layer should instantiate `EmoServer` against a temporary manifest project and verify runtime metadata, project discovery, lyric/media loading and HTTP range behavior.

## Next concrete work

1. Add hosted-server integration coverage for manifest-backed projects and byte-range media.
2. Smoke a real project in hosted and Electron modes.
3. Complete owner visual/interaction acceptance of the React cutover.
4. Retire the root legacy UI in its own cleanup PR.
5. Resume multi-pass RenderTexture composition and selector-driven typography.
6. Add project-owned scene/effect data only when the editor/render-graph model is ready.

## Resume instruction

Read `AGENTS.md`, `PROJECT.md`, `STATUS.md`, this file, `docs/PROJECT_FORMAT.md`, `docs/PLATFORM_ARCHITECTURE.md`, and `docs/DECISIONS.md`. Then inspect current main CI before changing runtime, project or renderer contracts.
