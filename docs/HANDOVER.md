# Handover

**Last updated:** 2026-09-25  
**Merged baseline:** `2d5b9b75cbcbd124ac2a1768bb3bcc36157d5809`  
**Active candidate:** `feature/threshold-bloom-v0.6`  
**Current phase/milestone:** v0.6 compositor / post-FX stabilization

## Current objective

Land thresholded bloom, visually validate the compositor, then begin the typography selector engine without changing clock ownership or platform boundaries.

## Current implementation state

### Platform/runtime

- React 19 / Vite 8 application shell is merged.
- Node `EmoServer` is shared by hosted and Electron loopback modes.
- `emo.project/v1` is merged.
- Hosted HTTP integration covers the real compiled server and range-capable media path.
- Windows NSIS and portable x64 packaging is exercised in CI.

### Renderer

Current merged frame path:

```text
Audio/LRC clock
    |
    v
Background + KineticLyrics + centered CameraRig
    |
    v
Scene RenderTexture
    |
    v
Cinema feedback ping-pong (Performance bypasses)
    |
    +--> sharp layer:
    |      displacement
    |      velocity smear
    |      cinematic RGB/glow/grain/vignette
    |
    +--> bloom layer:
           [threshold candidate]
           blur
           additive composite
    |
    v
Canvas
```

The Pixi automatic ticker is disabled. `EngineRenderer.update()` evaluates and presents exactly one frame for the supplied playback time.

### Temporal feedback

- alternating RenderTextures;
- Cinema-only;
- recursive scene-family transform;
- no accumulation while audio time is stationary;
- reset on project load, scene-family change, large cue jumps and discontinuous seek.

### Active threshold-bloom candidate

`ReactiveBloomThresholdFX` extracts bright pixels before blur. Its threshold and gain react to scene family, quality, intensity, energy and transients. Performance mode uses a higher threshold/lower gain.

## Important files / entry points

| Path | Why it matters |
|---|---|
| `packages/renderer-pixi/src/render/SceneRenderGraph.ts` | scene capture, feedback, sharp/bloom presentation |
| `packages/renderer-pixi/src/render/ReactiveDisplacementFX.ts` | scene-aware displacement |
| `packages/renderer-pixi/src/render/ReactiveVelocitySmearFX.ts` | dedicated motion-smear pass |
| `packages/renderer-pixi/src/render/ReactiveBloomThresholdFX.ts` | active bright-pass bloom candidate |
| `packages/renderer-pixi/src/render/CinematicPostFX.ts` | final cinematic shader |
| `packages/renderer-pixi/src/render/EngineRenderer.ts` | explicit frame orchestration |
| `packages/renderer-pixi/src/effects/typography/KineticLyrics.ts` | current timestamp-derived glyph engine |
| `apps/web/src/App.tsx` | audio-clock-driven renderer update path |

## Known risks / pending acceptance

- The full compositor stack is build/type validated but still needs human visual acceptance.
- Threshold bloom may need tuning after real music/lyrics footage.
- Current typography effects are hard-coded scene behaviors; there is not yet a general range/stagger/wiggle selector system.
- Electron artifacts are mechanically packaged but still need a human runtime/visual smoke test on Windows.
- Root legacy UI remains until React acceptance.
- Safari/M4A remains real-device work.

## Verification

Repository gate:

```text
npm install --ignore-scripts --no-audit --no-fund
npm run typecheck
npm run build
npm test
python scripts/repo_audit.py
```

Visual compositor acceptance should verify:

- no double-render/ticker drift;
- repeated backward/forward seeks do not leave stale feedback trails;
- Poster text stays crisp enough under smear/bloom;
- Neon gets visible soft bloom without washing the frame;
- Vortex feedback stays energetic without runaway brightness;
- Performance mode materially reduces temporal/post-FX cost;
- fullscreen and `Ctrl + Shift + H` remain unchanged.

## Next concrete work

1. Merge threshold bloom after green CI.
2. Start a general typography selector API with range/stagger/wiggle weights.
3. Route position, opacity, scale, rotation, color and distortion through selector weights.
4. Build outline-stack and recursive tunnel presets using that API.
5. Add scene/project serialization only after selector/preset contracts settle.

## Resume instruction

Read `AGENTS.md`, `PROJECT.md`, `STATUS.md`, this file, `docs/PLATFORM_ARCHITECTURE.md`, `docs/PROJECT_FORMAT.md`, and `docs/DECISIONS.md`. Then inspect main/current CI before changing clock, render-target or platform ownership.
