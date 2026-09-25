# Handover

**Last updated:** 2026-09-25  
**Merged baseline:** `000b6ddd04a0e08b1724ab98e900796056ed52a3`  
**Active candidate:** `feature/project-manifest-v1`  
**Current phase/milestone:** v0.5 project model stabilization

## Current objective

Finish the first stable E-MO project schema so browser/server/Desktop loading can address explicit nested assets and reproduce player defaults without weakening filesystem confinement.

## Current implementation state

### Merged platform

- React 19 / Vite 8 application shell is merged.
- PixiJS remains outside React's frame-critical state path.
- Node `EmoServer` serves the React build, project metadata and byte-range media.
- Electron starts the same server on loopback with a sandboxed renderer and typed preload folder picker.
- Windows packaging CI successfully produced NSIS and portable x64 artifacts.

### Project manifest candidate

`feature/project-manifest-v1` adds:

- `emo.project/v1` typed contracts;
- explicit audio and lyrics paths;
- optional nested assets and preset files;
- optional project display name;
- optional visual mode, intensity, quality and sync defaults;
- manifest path validation against absolute paths and traversal;
- manifest-aware project discovery;
- React application of manifest defaults during project load;
- Node tests covering nested assets, defaults and traversal rejection.

Convention-mode folders remain supported and require no manifest.

## Important files / entry points

| Path | Why it matters |
|---|---|
| `docs/PROJECT_FORMAT.md` | authoritative `emo.project/v1` schema |
| `packages/app-contracts/src/index.ts` | shared manifest/project DTOs |
| `packages/platform-node/src/index.ts` | validation, discovery and root confinement |
| `apps/web/src/App.tsx` | applies project defaults on load |
| `apps/server/src/server.ts` | serves discovered project/asset IDs |
| `tests/workspace-boundaries.test.mjs` | manifest/security regression tests |
| `apps/desktop/src/main.ts` | Electron project-root selection |
| `packages/renderer-pixi/src/render/EngineRenderer.ts` | frame-critical renderer |

## Known risks / pending acceptance

- Manifest schema is intentionally small; scene timelines/effect graphs are not yet represented.
- A malformed manifest currently makes discovery fail loudly rather than silently falling back to convention mode.
- Electron artifacts are mechanically packaged but still need human runtime/visual smoke testing on Windows.
- React HUD still needs owner visual acceptance.
- Safari/M4A behavior remains real-device work.
- The root legacy Vite app is still present as a temporary compatibility surface.

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

Manifest regression coverage must include valid nested files/defaults plus traversal rejection.

## Next concrete work

1. Merge the manifest candidate only after green Linux validation.
2. Load a real manifest project in hosted mode and Electron.
3. Complete owner visual/interaction acceptance of the React cutover.
4. Retire the root legacy UI in its own cleanup PR.
5. Add project-owned scene/effect data only when the editor/render-graph model is ready.
6. Resume RenderTexture composition and selector-driven typography.

## Resume instruction

Read `AGENTS.md`, `PROJECT.md`, `STATUS.md`, this file, `docs/PROJECT_FORMAT.md`, `docs/PLATFORM_ARCHITECTURE.md`, and `docs/DECISIONS.md`. Then inspect current main/PR CI before changing project or renderer contracts.
