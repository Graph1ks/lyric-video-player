# Handover

**Last updated:** 2026-09-25  
**Merged baseline:** `99f8ecf0946ccd2f46852b78eba130e8355fd9d1`  
**Active candidate:** `feature/visual-accents-v0.7`  
**Current phase/milestone:** v0.7 visualization-engine expansion

## Current objective

Complete the final major background primitives, then close the remaining typography families before scene-stack/editor work.

## Current implementation state

Merged visual engine includes:

- deterministic typography selectors;
- Impact / Cascade / Wave / Scatter / Elastic / Outline / Tunnel / Glitch;
- RenderTexture compositor + temporal feedback;
- displacement / velocity smear / threshold bloom / cinematic post-FX;
- Cinematic / Nebula / Grid / Starfield / Rays / Vortex / Liquid / Spectrum / Minimal backgrounds;
- logarithmic FFT spectrum sampling and mirrored spectrum ribbons;
- procedural GPU liquid flow;
- React/project preset controls.

### Active visual-accents candidate

**Sparks**

A single deterministic Graphics layer analytically reconstructs radial sparks/trails from playback time, cue index and stable hashes. Transient/treble/impact values change length and brightness without creating historical particle state.

**Recursive lyrics**

The current Enhanced LRC line is rendered into a low-alpha background typography stack. Poster uses stacked rows, Neon uses diagonal drifting repetitions and Vortex uses recursive scale/rotation depth. Text is rebuilt only on line, mode, preset, quality or resize changes.

New selectable background IDs:

- `sparks`
- `lyrics`

Both participate in deterministic AUTO routing and project defaults.

## Important files / entry points

| Path | Why it matters |
|---|---|
| `packages/renderer-pixi/src/effects/backgrounds/CinematicBackground.ts` | all deterministic background families + active accents |
| `packages/renderer-pixi/src/effects/backgrounds/ProceduralLiquidFX.ts` | GPU liquid flow |
| `packages/audio-web/src/index.ts` | band + logarithmic spectrum analysis |
| `packages/renderer-pixi/src/effects/typography/KineticLyrics.ts` | primary selector-driven lyric typography |
| `packages/renderer-pixi/src/render/EngineRenderer.ts` | explicit frame/preset orchestration |
| `apps/web/src/App.tsx` | Visual Director |
| `docs/PROJECT_FORMAT.md` | project preset contract |

## Known risks / pending acceptance

- Recursive text density and spark brightness still need real-track visual tuning.
- Procedural Liquid shader has CI build validation but still needs human browser/GPU acceptance.
- Remaining typography work: inflate/soft-3D, brush/stroke reveal, dissolve/smear exit.
- Root legacy UI remains pending React acceptance.
- Safari/M4A remains real-device work.

## Verification

```text
npm install --ignore-scripts --no-audit --no-fund
npm run typecheck
npm run build
npm test
python scripts/repo_audit.py
```

Windows packaging remains a separate required CI gate.

## Next concrete work

1. Merge visual accents after green gates.
2. Implement remaining typography families.
3. Stabilize a serializable scene/effect stack.
4. Run visual tuning/acceptance across real Enhanced LRC tracks.
5. Begin editor/timeline only after the engine contracts stop moving.

## Resume instruction

Read `AGENTS.md`, `PROJECT.md`, `STATUS.md`, this file, `ROADMAP.md`, `docs/PROJECT_FORMAT.md`, `docs/PLATFORM_ARCHITECTURE.md` and `docs/DECISIONS.md`.
