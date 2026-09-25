# Handover

**Last updated:** 2026-09-25  
**Merged baseline:** `6bde1cca0db795c8b7f6faae6772eeb4ae899520`  
**Current phase/milestone:** compositor baseline complete / typography selector foundation next

## Current objective

Keep the merged compositor stable and begin the reusable glyph-selector architecture that will power higher-end kinetic typography without adding a second animation clock.

## Current implementation state

### Platform/runtime

- React 19 / Vite 8 application shell is merged.
- Node `EmoServer` is shared by hosted and Electron loopback modes.
- `emo.project/v1` is merged.
- Hosted HTTP integration covers the compiled server and range-capable media path.
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
           reactive bright-pass threshold
           blur
           additive composite
    |
    v
Canvas
```

The Pixi automatic ticker is disabled. `EngineRenderer.update()` evaluates and presents exactly one frame for the supplied playback time.

### Compositor status

- RenderTexture scene composition — merged.
- Deterministic feedback ping-pong — merged.
- Scene-aware displacement — merged.
- Dedicated velocity smear — merged.
- Reactive threshold bloom — merged and CI-verified.
- Performance/Cinema budgets exist across feedback and post-FX.

## Important files / entry points

| Path | Why it matters |
|---|---|
| `packages/renderer-pixi/src/render/SceneRenderGraph.ts` | scene capture, feedback, sharp/bloom presentation |
| `packages/renderer-pixi/src/render/ReactiveDisplacementFX.ts` | scene-aware displacement |
| `packages/renderer-pixi/src/render/ReactiveVelocitySmearFX.ts` | dedicated motion-smear pass |
| `packages/renderer-pixi/src/render/ReactiveBloomThresholdFX.ts` | bright-pass bloom extraction |
| `packages/renderer-pixi/src/render/CinematicPostFX.ts` | final cinematic shader |
| `packages/renderer-pixi/src/render/EngineRenderer.ts` | explicit frame orchestration |
| `packages/renderer-pixi/src/effects/typography/KineticLyrics.ts` | current glyph engine; next refactor target |
| `apps/web/src/App.tsx` | audio-clock-driven renderer update path |

## Known risks / pending acceptance

- The full compositor stack still needs human visual tuning on real tracks.
- Current typography behaviors remain hard-coded by scene family.
- There is no general range/stagger/wiggle selector system yet.
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

- no ticker drift or duplicate frame evaluation;
- seek resets remove stale feedback trails;
- Poster remains crisp;
- Neon bloom is visible but not washed out;
- Vortex feedback does not run away in brightness;
- Performance mode materially reduces temporal/post-FX cost;
- fullscreen and `Ctrl + Shift + H` remain unchanged.

## Next concrete work

1. Add reusable selector weights for glyph ranges.
2. Add deterministic stagger ordering.
3. Add deterministic wiggle/noise selector weights.
4. Apply selector outputs to glyph position, scale, rotation, opacity and color.
5. Build outline-stack and recursive/tunnel typography presets using selectors.

## Resume instruction

Read `AGENTS.md`, `PROJECT.md`, `STATUS.md`, this file, `docs/PLATFORM_ARCHITECTURE.md`, `docs/PROJECT_FORMAT.md`, and `docs/DECISIONS.md`. Then inspect main/current CI before changing clock, render-target or platform ownership.
