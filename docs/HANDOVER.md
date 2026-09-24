# Handover

**Last updated:** 2026-09-25  
**Implementation baseline commit:** `82bf437328143c2a2173abfb2e34c85928d96b94`  
**Current phase/milestone:** v0.3.0 alpha bootstrap / CI validation

## Current objective

Establish the first production-shaped E-MOE-CHAIN renderer/player baseline in GitHub, validate it through the repository's mandatory PR check, then proceed directly into the RenderTexture/post-FX graph.

## What was just completed

- Replaced the template project shell with the v0.3 E-MOE-CHAIN implementation.
- Added local MP3/M4A/AAC loading and drag/drop ingestion.
- Added Enhanced LRC line/word parsing, LRC offset support, line-only fallback word timing, seek, and manual sync trim.
- Added audio FFT bands and transient envelope.
- Added PixiJS scene rendering with glyph-level kinetic lyrics, Poster/Neon/Vortex scene families, particles, rings, beams, geometry, and a dedicated virtual camera rig.
- Added a deterministic Auto Director based on lyric structure/repeated hooks.
- Added the high-end glass/HUD player shell, fullscreen, keyboard transport, Cinema/Performance modes, and `Ctrl + Shift + H` full-HUD visibility control.
- Mirrored the Graph1ks RhymeLab source-available/public-noncommercial plus separate-commercial-license structure.
- Reviewed dependencies and rejected GSAP for this product scope rather than inheriting a visual-animation-builder licensing constraint.
- Added a GitHub Actions `validate` job to satisfy repository rules and run the real dependency-backed typecheck/build/audit.

## Current implementation state

The browser application is Vite + TypeScript with PixiJS as the single runtime package dependency. The HTML audio element owns authoritative playback time. Lyrics and primary typography transforms are evaluated from LRC/audio timestamps, so seek semantics do not depend on a second animation timeline.

The UI is a lightweight DOM/CSS shell. React is intentionally absent from the frame-critical renderer. A future editor may use React for panels/timeline/project state while calling stable imperative engine APIs.

The first background and typography systems are procedural and audio-reactive, but the actual multi-pass post-processing/render-texture graph is not implemented yet. That is the next visual-quality step.

## Important files / entry points

| Path | Why it matters |
|---|---|
| `src/main.ts` | application orchestration, local file ingestion, transport, keyboard/HUD UX |
| `src/audio/AudioEngine.ts` | playback graph plus FFT/transient analysis |
| `src/lyrics/ELRCParser.ts` | Enhanced LRC parser and fallback word timing |
| `src/core/MasterClock.ts` | audio-backed master time |
| `src/core/SceneDirector.ts` | deterministic scene selection |
| `src/render/EngineRenderer.ts` | Pixi root/render orchestration |
| `src/render/CameraRig.ts` | camera impulses/drift/audio reactions |
| `src/effects/typography/KineticLyrics.ts` | glyph/word kinetic typography |
| `src/effects/backgrounds/CinematicBackground.ts` | current procedural backgrounds |
| `src/core/math.ts` | in-house easing/interpolation/seed primitives |
| `src/styles.css` | player HUD and screen treatments |
| `docs/DECISIONS.md` | accepted architecture/licensing decisions |
| `docs/DEPENDENCY_REVIEW.md` | dependency cost/license review |

## Decisions already made

- Audio time is the single source of truth for synchronized visuals. See ADR-001.
- PixiJS owns frame-critical GPU rendering; a future editor framework stays outside the render loop. See ADR-002.
- GSAP is not used because the roadmap includes a visual motion editor and the current GSAP Standard License contains a relevant visual-builder restriction. See ADR-003.
- Licensing mirrors RhymeLab: PolyForm Noncommercial 1.0.0 plus Graph1ks monetization restriction, separate commercial licensing, third-party exclusions, CLA for authorized contributions. See ADR-004.

## Known problems / risks

- Full dependency-backed `npm run typecheck` and `npm run build` were not available locally because npm package installation timed out. Treat GitHub CI as the next authoritative build result.
- No `package-lock.json` exists yet for the same reason; create and commit one once dependency installation is available.
- Stateful particle/camera impulses are deterministic enough for live playback but are not yet fully reconstructible from an arbitrary timestamp. Primary lyric motion is timestamp-derived. Future export-grade seeking should make all seek-sensitive effects reproducible from scene seed + time.
- Safari/M4A codec behavior requires real-device testing.
- The current screen bloom/grain treatment is CSS overlay; true post-FX need RenderTextures/filters.

## Next concrete work

1. Get the bootstrap PR green under the required `validate` status check and merge it.
2. Implement a RenderTexture composition graph separating background, typography, foreground, and post-FX stages.
3. Add first post-FX modules: RGB split, displacement, directional/velocity smear, feedback echo, bloom/glow.
4. Add effect quality budgets and verify 1080p Performance/Cinema behavior.
5. Continue selector-based typography only after the composition graph is stable.

## Verification

### Commands

```text
npm install --ignore-scripts --no-audit --no-fund
npm run typecheck
npm run build
python scripts/repo_audit.py
```

Browser smoke test after build:

- load MP3 or M4A and Enhanced LRC;
- play/pause/seek repeatedly;
- verify word sync and manual +/- sync trim;
- switch Auto/Poster/Neon/Vortex;
- switch Performance/Cinema;
- verify fullscreen;
- verify `Ctrl + Shift + H` hides and restores the entire HUD;
- verify drag/drop of audio + LRC.

### Expected result

No type/build/audit errors, stable playback after seeks, visually continuous scene changes, and no loss of HUD control when hidden.

## Important context / traps

- Do not add GSAP casually; the rejection is a product-license decision, not a technical preference.
- Do not let UI state become the renderer's timing source.
- Keep imported media local; there is no upload backend in the core architecture.
- Do not bundle commercial fonts/audio/lyrics without explicit provenance/license review.
- The repository requires changes through pull requests and expects a status check named `validate`.

## Local / generated state

- `node_modules/`, `dist/`, local user media, and future generated caches remain untracked.
- No generated database or remote user-data state exists.

## Resume instruction

A new agent/user should:

1. read `AGENTS.md`;
2. read `PROJECT.md`;
3. read `STATUS.md`;
4. read this file;
5. inspect the current branch/PR and `validate` result;
6. read `docs/DECISIONS.md` and `docs/DEPENDENCY_REVIEW.md` before changing architecture/dependencies;
7. reconcile stale documentation against repository state and reproducible checks before continuing.
