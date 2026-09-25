# Handover

**Last updated:** 2026-09-25  
**Merged baseline:** `7dc366a61fbe941b9b6973e8ee988fe856620ea3`  
**Active candidate:** PR #9 — `feature/render-graph-v0.6`  
**Current phase/milestone:** v0.6 compositor / render graph

## Current objective

Land the first explicit GPU composition boundary, then build deterministic ping-pong feedback and dedicated post-processing passes on top of it.

## Current implementation state

### Platform/runtime

- React 19 / Vite 8 application shell is merged.
- Node `EmoServer` is shared by hosted and Electron loopback modes.
- `emo.project/v1` is merged.
- Hosted HTTP integration exercises the real compiled server, manifest project path and byte-range media semantics.
- Electron Windows NSIS and portable x64 packaging is exercised in CI.

### Renderer candidate

PR #9 changes the renderer from direct scene-to-canvas rendering to:

```text
Audio/LRC clock evaluation
        |
        v
Background + Typography + Camera
        |
        v
Scene RenderTexture
        |
        +--> additive blurred bloom presentation
        |
        +--> sharp CinematicPostFX presentation
                    |
                    v
                 Canvas
```

The Pixi application ticker is disabled for this path. `EngineRenderer.update()` performs scene evaluation, scene capture and final canvas render in one explicit frame step.

Camera transforms now pivot around viewport center. Backward-time/seek delta handling is also clamped safely.

## Important files / entry points

| Path | Why it matters |
|---|---|
| `packages/renderer-pixi/src/render/SceneRenderGraph.ts` | RenderTexture capture + presentation layers |
| `packages/renderer-pixi/src/render/EngineRenderer.ts` | explicit frame orchestration/manual Pixi render |
| `packages/renderer-pixi/src/render/CameraRig.ts` | centered camera pivot and impulses |
| `packages/renderer-pixi/src/render/CinematicPostFX.ts` | current sharp-layer custom GPU pass |
| `packages/renderer-pixi/src/effects/typography/KineticLyrics.ts` | timestamp-derived lyric motion |
| `apps/web/src/App.tsx` | audio-clock driven renderer update path |
| `tests/server-integration.test.mjs` | hosted runtime end-to-end contract |
| `docs/PROJECT_FORMAT.md` | current project schema |

## Known risks / pending acceptance

- The new scene RenderTexture/bloom path is type/build validated but still requires visual browser/Desktop acceptance.
- No frame-feedback buffer exists yet.
- Current bloom is a duplicated blurred presentation layer, not a thresholded multi-pass bloom.
- Current CinematicPostFX is still one custom shader pass.
- Electron artifacts are mechanically packaged but still need human runtime/visual smoke testing.
- Root legacy UI remains until React acceptance.

## Verification

Repository gate:

```text
npm install --ignore-scripts --no-audit --no-fund
npm run typecheck
npm run build
npm test
python scripts/repo_audit.py
```

Renderer acceptance after merge should verify:

- no double-render/ticker drift;
- seek backward/forward repeatedly;
- camera punch remains centered;
- Cinema/Performance resolution switches remain stable;
- bloom does not make lyrics unreadable;
- fullscreen and `Ctrl + Shift + H` still work.

## Next concrete work

1. Merge PR #9 after green CI.
2. Add a two-buffer feedback stage with explicit reset on project load/large seek.
3. Add a displacement pass with scene/audio uniforms.
4. Add velocity/directional smear as a separate quality-budgeted pass.
5. Replace simple bloom with thresholded bloom only if profiling/visual gain justifies it.
6. Resume selector-driven typography after the compositor is stable.

## Resume instruction

Read `AGENTS.md`, `PROJECT.md`, `STATUS.md`, this file, `docs/PLATFORM_ARCHITECTURE.md`, `docs/PROJECT_FORMAT.md`, and `docs/DECISIONS.md`. Then inspect PR #9/current main CI before changing render targets or clock ownership.
