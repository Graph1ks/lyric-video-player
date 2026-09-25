# Handover

**Last updated:** 2026-09-25  
**Merged baseline:** `947d2c28c46c6898a6ca0e0b87eb154d971d8c7c`  
**Active candidate:** `feat/director-performance-presets`  
**Current phase/milestone:** curated AUTO Performance Presets + operator-control cleanup

## Current objective

Complete and verify the Performance Preset candidate: AUTO should draw only from the active preset's allowed visual/color pools, Lower Third scheduling must support permanent/scheduled/manual/outro use, and the detached Director transport/HUD controls must remain ergonomically correct.

## Merged baseline — Resource lifetime + physical-edge safety v0.11.2

The long-play memory growth is not caused by the bounded typography metric cache. The renderer was repeatedly detaching high-resolution Pixi `Text` display objects without destroying them:

- ordinary `KineticLyrics` creates one high-resolution `Text` per glyph plus multiple full-line echo textures on every lyric-line rebuild;
- `clear()` / echo rebuild previously used `removeChildren()` only;
- Recursive Lyrics also rebuilt 8–14 full-line `Text` objects even when that background was not active, and likewise detached old objects without explicit destruction.

PR #53 explicitly destroys outgoing word trees and echo `Text` resources, makes Recursive Lyrics allocation lazy/keyed, and destroys backdrop text/style resources when replaced. The expected acceptance behavior is a bounded plateau after warm-up rather than memory growth proportional to elapsed lyric lines.

The remaining physical-edge failure is compositor-level rather than world-geometry-level. The full-frame displacement/smear/post filters requested Pixi filter padding. Padding expands the filter input with transparent texels outside the actual scene Sprite; clamped warped samples can therefore still sample that transparent gutter and display it as black. PR #53:

- sets full-frame displacement, velocity-smear and post-FX padding to zero;
- retains existing UV clamp + shader edge guards;
- adds one unfiltered current-frame Sprite under the filtered output as a fail-closed presentation plane, without adding another RenderTexture;
- forces the generated Liquid background pass opaque.

Regression source-contract tests cover explicit text destruction, zero full-frame filter padding, the fallback presentation plane and opaque Liquid output.

## Active candidate — Director Performance Presets

The candidate adds `VisualAutoProfile` to engine-core. It is a set of allowed AUTO domains rather than a frozen scene snapshot.

Runtime ownership:

- `SceneDirector` constrains scene family plus coherent typography/layout/motion/sequence choices.
- `CinematicBackground` constrains automatic background worlds.
- `createVisualPalette()` constrains automatic mood, canvas and harmony.
- manual Director choices still override the corresponding AUTO axis;
- switching the axis back to AUTO returns it to the active preset;
- no active Performance Preset preserves the existing unrestricted AUTO behavior.

The React Director adds a dedicated Presets workspace with eight authored emotion/pace profiles. Built-in profiles can be edited and reset; custom profiles can be cloned, renamed and deleted. Each allowed pool retains at least one option. Edits persist locally under a versioned local-storage key; project serialization is intentionally deferred.

Lower Third presentation is changed from Intro/Rotate to Off/Scheduled/Always. Scheduled mode exposes song start seconds, visible duration, optional outro trigger and outro lead seconds. Show Now temporarily overrides every schedule mode.

The detached Director topbar is reflowed into operator actions + a full-width transport row so the existing player controls no longer collapse. The main HUD text button also receives an explicit text-sized border box.

Detailed contract: `docs/DIRECTOR_PERFORMANCE_PRESETS.md`.

## Current implementation state

## Merged baseline — Cinematic sequence direction

PR #37 is merged as `c58be3e` and changes the AUTO contract before adding more isolated effects.

**Phrase direction**

- SceneDirector groups adjacent lyric lines into deterministic phrases using timing gaps, punctuation, maximum phrase length and recurring lyric motifs.
- AUTO resolves a curated typography preset + layout + composition-motion bundle per phrase.
- The bundle remains stable through the phrase instead of cycling three independent axes each line.
- Phrase positions expose Establish / Develop / Accent / Release roles.
- Recurring motifs begin a new phrase and preserve hook routing.

**Temporal readability**

- `engine-core/kineticReadability.ts` computes line duration, words/s, chars/s and minimum word duration.
- It resolves Expressive / Balanced / Rapid / Burst pressure tiers.
- Higher pressure progressively reduces travel, rotation, scale excursion, float and echo density/alpha while increasing visibility floor.
- Motion is never intentionally reduced to zero: rapid lyrics should still pulse/snap/stretch locally.

**Structural finding**

True spiral, shape-build and hero/background lyric scenes require words from previous cues to persist. Current `KineticLyrics.setLine()` rebuilds the line scene, so cross-line composition cannot be implemented correctly as another layout preset.

The next architecture slice must derive a visible multi-cue lyric window from absolute LRC time and assign stable word IDs/roles. Pixi may cache display objects, but the rendered state must remain reconstructable from time after a seek.

See `docs/CINEMATIC_TYPOGRAPHY_DIRECTION.md`.

## Merged baseline — Persistent typography sequences

The merged `7d9c657` baseline creates the pure sequence model before Pixi caching/render integration.

- `deriveTypographySequenceWindow()` reconstructs visible lyric words from absolute lyric time.
- Stable IDs use line + word index; roles are `active`, `recent`, `history` and `incoming`.
- History is bounded by time and word count, with active content retained under pressure.
- `planTypographySequence()` adds two first spatial grammars:
  - **Spiral Depth** — newest lyrics are large/near; older lyrics follow the spiral inward, shrink and retire.
  - **Hero/Echo** — the current word becomes a solid foreground hero while history becomes lower-alpha outline structure.
- The planners are renderer-independent and deterministic under repeated evaluation / seeking.

Next, Pixi will diff/cache display objects as a performance layer over this plan. Cache history must never become the visual source of truth.

## Merged baseline — Visible persistent sequence rendering

- `PersistentTypographySequences` diffs a bounded map of Pixi Text nodes keyed by the pure stable word IDs.
- The pure time-derived window + plan is recomputed from lyric time; cached Pixi nodes are only render resources.
- Director bundles selectively nominate `spiral-depth` or `hero-echo`.
- Sequence history is phrase-scoped through explicit phrase start/end line bounds.
- Spiral depth uses continuous active-word progress so existing words do not snap when the next word becomes active.
- While a persistent grammar is active, normal `KineticLyrics` is hidden rather than double-rendered.
- Manual Typography/Layout/Composition-Motion choices immediately disable the AUTO sequence grammar; returning all three to AUTO restores it.
- Sequence styles use the shared semantic palette and bounded viewport fitting.

## Merged baseline — Shape Build + Ribbon Path

### Shape Build

- uses phrase-stable `scopeOrdinal` and `scopeWordCount` metadata from the pure sequence window;
- alternates deterministic **Frame/Square** and **Ring/Circle** calligrams by phrase scope;
- a word's slot does not move merely because later words appear;
- active/recent words are solid; deeper history becomes outline structure;
- incoming words may preview briefly at their final shape slot;
- renderer retains a larger but bounded phrase history for calligram integrity.

### Ribbon Path

- uses one S-curve trajectory instead of independent word entry vectors;
- active word occupies the focus region while recent/history words trail behind;
- active progress advances the trail continuously;
- the previous active word arrives at its next trail rank at the word boundary, avoiding a sequence snap;
- the next incoming word converges toward the same focus point during the short lead window.

### Shared renderer changes

- Shape/Ribbon positions are treated as structural geometry and are not collapsed inward by the rapid-lyrics travel budget;
- readability pressure still constrains active micro-motion, opacity floors and history density;
- rotated persistent text now uses both width and height fitting.


### Existing merged engine

- deterministic Enhanced LRC/audio clock;
- selector-driven glyph typography;
- RenderTexture compositor + feedback/displacement/smear/bloom;
- advanced background families including Liquid, Spectrum, Sparks and Recursive Lyrics;
- React Visual Director and project defaults;
- hosted/desktop project runtime and Windows packaging gates.

### Step 1 merged — Typography Composition Engine

New pure engine-core planner returns per-word:

- x/y stage placement;
- fixed layout rotation;
- layout scale;
- entry x/y vector;
- entry scale;
- entry rotation;
- emphasis weight.

Initial layouts:

- `center-stack`
- `directional-stage`
- `editorial`
- `vertical-accent`
- `split-stage`
- `crossword`

AUTO layout is deterministic by scene family + cue index. KineticLyrics consumes the composition plan while its existing glyph selector/motion presets continue to run inside each word container.

Renderer, React and `emo.project/v1` expose typography layout controls. Keyboard `L` cycles layouts.

### Step 2 merged — OKLCH Palette Director

New engine-core color system provides:

- OKLCH → sRGB conversion;
- chroma reduction for sRGB gamut;
- relative-luminance/contrast calculation;
- Split Complement / Analogous / Complement / Triad / Tetrad / Monochrome;
- deterministic AUTO harmony;
- semantic roles for background, surface, text, accents, glow and muted values;
- contrast-adjusted primary/secondary lyric colors.

KineticLyrics consumes text/accent roles. CinematicBackground consumes generated background/accent roles. React exposes harmony selection and a live palette swatch preview. Keyboard `C` cycles harmonies. `emo.project/v1` can persist the default.

### Step 3 merged — Composition Motion Grammar

The new pure evaluator in `engine-core` takes explicit LRC time, composition targets and cue timing and returns whole-stage + per-word transforms. It never owns an independent clock or stateful tween timeline.

Motion families:

- `handoff`
- `conveyor`
- `anchor-build`
- `collapse`
- `takeover`
- `flip`
- `camera-handoff`
- `portal`
- `panel`

KineticLyrics now applies transforms in three layers:

1. whole typography stage;
2. composition word slot;
3. existing word-local/glyph motion.

This keeps layout orientation/placement, composition motion and glyph effects independently composable.

React exposes **Composition Motion** and keyboard `G`; `M` remains mute. `emo.project/v1` can persist `defaults.compositionMotion`.

See `docs/COMPOSITION_MOTION_GRAMMAR.md` for the runtime contract and known tuning risks.

### Merged readability/color baseline

The candidate changes two foundational contracts before adding more visual worlds.

**Composition safety**

- default readable lyrics target a centered attention field (76% width × 62% height, center Y ≈ 46.5%);
- word bounds are estimated after scale/90° rotation;
- deterministic collision relaxation keeps words inside that field;
- lower-emphasis words scale down as a last resort instead of overlapping;
- LTR rows preserve left-to-right cue order and wrap top-to-bottom;
- Vertical Accent/Crossword may use one vertical word only at a logical sequence edge;
- Split Stage is now row-based rather than alternating every cue across left/right sides.

**Color direction**

- emotion-named creative presets: Tender, Heartbreak, Longing, Euphoria, Rage, Dream, Tension, Calm;
- harmony remains independent from mood;
- active candidate adds a third independent axis: **Color Canvas**;
- `night`: near-neutral dark field + light tinted type;
- `paper`: light softly tinted field + dark colored type;
- `color-field`: deep chromatic field + light tinted type;
- `poster`: brighter chromatic field + dark colored type;
- AUTO holds a canvas choice for three lyric lines before deterministic transition;
- Rainbow Drift rotates hue at 2.4°/s and now respects the chosen canvas polarity;
- UI/project defaults persist mood, harmony, canvas and flow independently.

Research and exact product rules are in `docs/VISUAL_READABILITY_COLOR_RULES.md`.

### Step 4 merged baseline — Art Direction Worlds

Four scene-scale visual grammars are implemented in a dedicated renderer module:

- `editorial`: edge plates, bars and framing/crop marks;
- `print`: halftone field, print bands and diagonal texture;
- `architecture`: nested frames, vanishing guides and side pillars;
- `aurora`: layered upper/lower ribbons, horizon glow and sparse motes.

These are deliberately **not** particle variants. When active, CinematicBackground suppresses generic particles, blobs, rings and beams and bypasses legacy geometry.

All four worlds consume the shared `VisualPalette`, remain timestamp/audio-driven and preserve central negative space for lyrics.

See `docs/ART_DIRECTION_WORLDS.md`.

### Merged visual-acceptance QA baseline

The candidate adds `assessTypographyComposition()` in engine-core. It exposes transformed word bounds, attention-field overflow, collision pairs and maximum overlap ratio without depending on Pixi.

`tests/visual-readability-matrix.test.mjs` exercises all six base layouts at desktop, laptop, portrait and mobile viewport classes.

This does **not** replace real visual acceptance. It catches geometric regressions and makes narrow-viewport layout failures visible in CI before they become aesthetic debugging sessions.

Manual acceptance is documented in `docs/VISUAL_ACCEPTANCE_MATRIX.md`.

### Merged local-development runtime baseline

The React app always probes `/api/runtime`. Vite proxies that to `127.0.0.1:3040`.

Previously root `npm run dev` only launched Vite, so a missing runtime caused:

```text
[vite] http proxy error: /api/runtime
Error: connect ECONNREFUSED 127.0.0.1:3040
```

The candidate changes root development orchestration:

1. build shared packages/server;
2. reuse an already-valid E-MO runtime if one exists;
3. otherwise start the Node runtime;
4. wait until `/api/runtime` is healthy;
5. then start Vite.

`npm run dev:web` remains intentionally web-only for split-process debugging. The default `projects/` root is created automatically when no explicit root is configured.

See `docs/DEVELOPMENT_RUNTIME.md`.

### Merged Windows Node 24 launcher fix

The runtime readiness gate itself is correct: server startup reaches `/api/runtime` successfully. The regression occurs one step later when the launcher tries to start Vite.

Directly spawning `npm.cmd` with `shell: false` is not a valid portable Windows child-process contract and manifests as `spawn EINVAL` on the reported Node 24 environment. The merged fix:

- prefers `npm_execpath` and launches npm's JavaScript CLI through `process.execPath`;
- falls back to explicit `cmd.exe` invocation when the script is run directly and `npm_execpath` is unavailable;
- keeps `shell: false` for the actual child spawn;
- adds an executable npm-child smoke test;
- runs that smoke on Windows Node 22 and Node 24.

## Merged baseline — Elastic Tether + Camera Continuity

**Elastic Tether**

- adds a pure `evaluateElasticTether()` motion primitive;
- word-level travel uses the composition entry vector instead of only per-glyph bounce;
- deformation is anisotropic along the pull direction, followed by bounded overshoot and damped settle;
- glyph-local elastic motion becomes secondary follow-through instead of owning the complete gesture;
- Rapid/Burst readability budgets reduce travel, rotation and deformation but do not make the word static.

**Camera continuity**

- adds a pure `evaluateCinematicCameraPlan()` in engine-core;
- inputs: Scene Mode, Establish/Develop/Accent/Release role, persistent grammar, phrase progress, active typography focus and readability pressure;
- output: normalized pan, shot scale, rotation, impulse budget and micro-motion budget;
- KineticLyrics provides a deterministic focus point with an end-of-word handoff toward the next word;
- persistent grammars expose their current hero/focus point;
- CameraRig applies the directed base shot first; bass/transient drift/impulses remain bounded micro-response;
- Shape Build deliberately follows focus less and stays wider so its calligram framing is not destroyed;
- Hero/Spiral/Ribbon can follow the active eye-trace more strongly.

## Merged baseline — Visual Director workspace

PR #44 changes the control plane, not the renderer contract.

**Docket UI**

- the previous homogeneous text-button matrix is replaced by semantic preview cards;
- navigation is task-oriented: Scene / Type / Motion / World / Color / System;
- cards include name + behavior description + category-specific miniature preview;
- AUTO request and resolved LIVE effect are distinct states;
- the current resolved Scene/Type/Layout/Motion/World stack remains visible above the controls;
- audio meter, intensity, sync, quality and keyboard shortcuts remain available.

**Second screen**

- the same `VisualDirector` component is used in the player dock and Director window;
- browser popout loads `?director=1`;
- Electron adds `DesktopBridge.openDirectorWindow()` and owns a reusable native BrowserWindow;
- the Director window never creates a Pixi renderer or audio engine;
- `directorSync.ts` uses BroadcastChannel to synchronize the two Zustand instances;
- resolved renderer state, playback and low-rate audio telemetry flow back from the main player.

**Planning foundation**

- detached Director has LIVE / PLAN workspaces;
- PLAN captures complete Director snapshots at timestamps and can APPLY them live for auditioning;
- planner drafts are session-only;
- automatic cue execution, project persistence and playlist-per-song plans are deferred to the authoritative scene/project serialization milestone.

See `docs/VISUAL_DIRECTOR_WORKSPACE.md`.

## Merged baseline — Operator output + Lower Thirds

**Output safety**

- `EngineRenderer` now keeps `CinematicBackground` outside `CameraRig`; only lyric layers move with the camera.
- RenderGraph captures the combined screen-anchored world + moving typography scene.
- Resize handling covers host ResizeObserver, window resize, fullscreenchange and VisualViewport.
- fullscreenchange gets a second next-frame resize to catch Chromium's settled fullscreen dimensions.
- screen FX overscan outside the shell so filter/overlay edges are not visible.
- current/persistent lyric text textures render at higher internal resolution for large-scale zoom fidelity.

**Operator mode**

- detached Director presence switches the main player to clean output mode.
- Director topbar sends transport commands to the main player through a dedicated BroadcastChannel.
- main player remains sole owner of audio, clock, fullscreen target and file loading.
- closing the Director returns player controls.
- operator language supports English and German.
- the Director readability scale no longer relies on 5–7px micro-labels.

**Persistent sequence control**

- new requested axis: `TypographySequenceMode = auto | off | spiral-depth | hero-echo | shape-build | ribbon-path`.
- Renderer exposes requested/resolved sequence state.
- Director Type workspace exposes all four persistent cinematic grammars.
- `S` cycles sequence mode.

**Lower Thirds**

- screen-space React layer above rendered lyric/post-FX output.
- modes: Off / Intro / Rotate.
- ten presets plus Auto Rotation.
- artist/title default from track/LRC metadata with manual overrides.
- optional artist image URL or local upload.
- manual seven-second preview.
- current upload is session data; project persistence should move the image into project assets later.

See `docs/OPERATOR_OUTPUT_LOWER_THIRDS.md`.

## Merged baseline — Shape Fill + Manifesto Wall + edge guards

**Shape semantics**

- old Shape Build frame/ring behavior was the wrong semantic target for the supplied references;
- new `shape-fill` uses the interior of Tree / Star / Figure silhouettes;
- phrase-scope ordinals map to deterministic packing slots with explicit fit boxes;
- Pixi fits measured text into those boxes;
- history stays solid so the aggregate mass reads as a shape;
- `shape-build` remains an internal alias only.

**Manifesto Wall**

- new `manifesto-wall` planner recursively subdivides one phrase-wide rectangle into stable masonry slots;
- narrow/tall cells rotate ±90°;
- slot-size variation creates headline anchors and connector words;
- active words use a short rigid snap-in then remain fixed;
- renderer disables normal active bounce/bass lift for this grammar;
- camera uses the actually active manual/resolved grammar rather than the AUTO direction's nominated grammar.

**Edge safety**

- background/flash/liquid surfaces receive 12% source bleed;
- displacement/smear/post FX use gradual edge guards;
- final post FX is opaque;
- DOM bloom/scanline/grain overlays fade before the physical output edge.

See `docs/SHAPE_FILL_MANIFESTO_EDGE_SAFETY.md`.
See `docs/TYPOGRAPHY_SPATIAL_SYSTEM.md` for the shared measurement/collision contract.

## Merged baseline — Spatial typography v0.11.1

PR #51 establishes one shared spatial contract rather than fixing overlap per effect.

- `typographySpatial.ts` defines measured geometry, rotated screen boxes, overlap checks and envelopes.
- `TypographyMetrics.ts` measures the actual Pixi style and supplements it with native Canvas ink bounds.
- sequence windows expose the complete phrase scope so future words can reserve invisible space without reflow.
- Shape Fill performs deterministic occupied-space packing with shrink/retry and never intentionally drops lyrics.
- Manifesto reserves a chronological editorial page, starts visually empty, and reveals words into immutable slots.
- current-line composition receives real per-word width + height.
- Spiral/Ribbon use measured collision boxes along their trajectories.
- static Shape/Manifesto phrase geometry is cached; only reveal/emphasis/camera state evaluates per frame.
- Manifesto camera follows active focus while respecting the envelope of revealed page content.

See `docs/SHAPE_FILL_MANIFESTO_EDGE_SAFETY.md`.

## Important files / entry points

| Path | Why it matters |
|---|---|
| `docs/LYRIC_VISUALIZATION_ENGINE_PLAN.md` | authoritative visual-engine implementation order |
| `docs/CINEMATIC_TYPOGRAPHY_DIRECTION.md` | research basis + sequence/readability/continuity contract |
| `packages/engine-core/src/director.ts` | phrase-level cinematic direction and coherent AUTO bundles |
| `packages/engine-core/src/kineticReadability.ts` | density analysis and adaptive motion budgets |
| `packages/engine-core/src/typographyComposition.ts` | pure word composition planner |
| `packages/engine-core/src/typographyMotionGrammar.ts` | pure timestamp-driven composition-motion evaluator |
| `docs/COMPOSITION_MOTION_GRAMMAR.md` | motion grammar contract, transform ownership and tuning notes |
| `packages/engine-core/src/colorHarmony.ts` | OKLCH conversion + harmony + mood + Color Canvas palette director |
| `docs/VISUAL_READABILITY_COLOR_RULES.md` | source-backed readability/color rules and non-goals |
| `packages/renderer-pixi/src/effects/typography/KineticLyrics.ts` | composition + glyph-motion consumer |
| `packages/renderer-pixi/src/effects/backgrounds/CinematicBackground.ts` | background routing / legacy layer coordination |
| `packages/renderer-pixi/src/effects/backgrounds/ArtDirectionWorlds.ts` | Step 4 Editorial/Print/Architecture/Aurora worlds |
| `docs/ART_DIRECTION_WORLDS.md` | world contracts, palette roles and readability budgets |
| `docs/VISUAL_ACCEPTANCE_MATRIX.md` | automated viewport matrix + real-track visual acceptance checklist |
| `packages/renderer-pixi/src/render/EngineRenderer.ts` | composition/palette orchestration |
| `apps/web/src/App.tsx` | Visual Director controls |
| `docs/PROJECT_FORMAT.md` | persisted layout/harmony/canvas defaults |
| `scripts/dev.mjs` | waits for runtime health before starting Vite |
| `docs/DEVELOPMENT_RUNTIME.md` | local runtime/Vite orchestration contract |

## Known risks / pending acceptance

- The new collision solver still requires real-track tuning for very long words/lines and small mobile viewports.
- The baseline palette is wired into primary text/background/geometry; some specialist shader worlds still retain internal scene-specific shading and should migrate to palette uniforms in Step 4.
- The Visual Director is increasingly dense; a later UI pass should group controls without hiding the engine features.
- Real browser/Desktop visual acceptance remains required even after compile/CI validation.
- Takeover/Portal can deliberately overscale active words; long words and narrow viewports need visual acceptance.
- AUTO compatibility constraints may be required after real-track testing if some layout × grammar × glyph combinations are systematically unreadable.

## Verification

```text
npm install --ignore-scripts --no-audit --no-fund
npm run typecheck
npm run build
npm test
python scripts/repo_audit.py
```

Windows packaging remains a separate required gate.

PR #51 Linux validation and Windows packaging passed: typecheck, build, tests, publication audit, Node 22/24 launcher smokes, NSIS, portable x64 and artifact upload.

## Next concrete work

1. Re-test the exact real-display edge failures that motivated PR #48.
2. Visually validate Shape Fill silhouette recognition and Manifesto progressive page rhythm on real tracks.
3. Check Rapid/Burst readability, anchor hierarchy, vertical brackets, 12-line manual page chapters and camera reading flow.
4. Resume section-level tension/release and shot-size sequencing after visual acceptance.
5. Integrate PLAN/Lower Third persistence with serialized sequence directives; playlist support should reference the same per-song plan contract.

## Resume instruction

Read `AGENTS.md`, `PROJECT.md`, `STATUS.md`, this file, `docs/LYRIC_VISUALIZATION_ENGINE_PLAN.md`, `ROADMAP.md`, `docs/PROJECT_FORMAT.md`, `docs/PLATFORM_ARCHITECTURE.md` and `docs/DECISIONS.md`.
