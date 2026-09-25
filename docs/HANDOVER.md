# Handover

**Last updated:** 2026-09-25  
**Merged baseline:** `34e75eb43a1eba6498dd3a3fc777072acc7e1e64`  
**Active candidate:** `feature/background-presets-v0.7`  
**Current phase/milestone:** v0.7 visualization-engine expansion

## Current objective

Complete the graphics/lyrics visualization primitive set before scene-editor work. Typography is now selector-driven; the active work generalizes backgrounds into independent deterministic presets.

## Current implementation state

### Typography

Merged:

- glyph-level selector context;
- range selector;
- ordered/random stagger selector;
- wave selector;
- deterministic interpolated wiggle;
- deterministic random weighting;
- audio weighting;
- selector blend helpers;
- Impact / Cascade / Wave / Scatter / Elastic / Outline / Tunnel / Glitch presets;
- React preset control;
- renderer preset API/listener;
- `emo.project/v1` typography default;
- keyboard `T` cycling.

All primary typography motion remains a deterministic function of supplied lyric/audio time.

### Background candidate

The current branch generalizes `CinematicBackground` into seven selectable families without adding another clock:

- Cinematic — existing scene-family baseline;
- Nebula — blob/particle-heavy drifting field;
- Grid — perspective grid with restrained particles;
- Starfield — depth-like radial hyperspace motion;
- Rays — radial geometry, beams and rings;
- Vortex — spiral particles/rings and radial spokes;
- Minimal — sparse dark motion field.

AUTO selects from a scene-compatible preset table using cue index. Manual background selection overrides AUTO.

The candidate also adds:

- renderer background preset API/listener;
- React Visual Director background grid;
- keyboard `B` cycling;
- `emo.project/v1` background default + validation;
- quality-aware particle/blob/ring/beam visibility budgets.

## Important files / entry points

| Path | Why it matters |
|---|---|
| `packages/engine-core/src/types.ts` | typography/background preset contracts |
| `packages/engine-core/src/typographySelectors.ts` | deterministic selector math |
| `packages/renderer-pixi/src/effects/typography/KineticLyrics.ts` | multi-preset glyph engine |
| `packages/renderer-pixi/src/effects/backgrounds/CinematicBackground.ts` | active background preset engine |
| `packages/renderer-pixi/src/render/EngineRenderer.ts` | visual preset orchestration |
| `apps/web/src/App.tsx` | Visual Director controls |
| `packages/platform-node/src/index.ts` | manifest preset validation |
| `docs/PROJECT_FORMAT.md` | project defaults contract |

## Known risks / pending acceptance

- Background families require human visual tuning against real tracks after build validation.
- Starfield is currently a deterministic 2.5D illusion, not true 3D geometry.
- Procedural liquid/noise, waveform ribbons, recursive text backgrounds and sparks/trails are still pending.
- Soft-3D/inflate, handwritten stroke reveal and particle dissolve typography are still pending.
- Electron artifacts remain mechanically tested; human Windows visual smoke testing is still valuable.
- Root legacy UI remains pending React acceptance.

## Verification

Repository gate:

```text
npm install --ignore-scripts --no-audit --no-fund
npm run typecheck
npm run build
npm test
python scripts/repo_audit.py
```

Windows gate:

```text
npm install
npm run build
npm --workspace @graph1ks/emo-desktop run dist
```

Visual acceptance should explicitly cycle `T` and `B` while testing seek, scene AUTO and Performance/Cinema modes.

## Next concrete work

1. Merge background presets after Linux + Windows gates.
2. Add procedural liquid/noise GPU background pass.
3. Add spectrum/waveform ribbons driven by audio-band data.
4. Add sparks/trails and recursive background lyric layers.
5. Add soft-3D/stroke/dissolve typography primitives.
6. Stabilize scene-stack JSON before building timeline/editor UI.

## Resume instruction

Read `AGENTS.md`, `PROJECT.md`, `STATUS.md`, this file, `ROADMAP.md`, `docs/PROJECT_FORMAT.md`, `docs/PLATFORM_ARCHITECTURE.md` and `docs/DECISIONS.md`. Then inspect current main/branch CI before changing render timing or project contracts.
