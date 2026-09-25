# Project Status

**Last updated:** 2026-09-25  
**Last known good merged baseline:** `da1def09667a4c87a91240bfcf996705e2b424ef`  
**Active candidate:** `feat/operator-render-lower-thirds-v0.10` / PR #46  
**Current phase/milestone:** cinematic sequence direction + temporal readability

## Current objective

Close the current presentation/operation gaps: edge-safe fullscreen rendering, crisp zoom typography, detached-Director transport ownership, explicit persistent-sequence controls, readable DE/EN Director UI and a ten-style Lower Third system.

## Current state

- Phrase-level cinematic direction + adaptive readability pressure are merged in `c58be3e`.
- The pure multi-cue typography window + Spiral Depth/Hero-Echo planners are merged in `7d9c657`.
- Persistent Pixi sequence rendering, Spiral Depth and Hero/Echo are merged in `019d5f3`.
- Pixi sequence state is disposable; the pure time-derived plan remains authoritative.
- Persistent history is phrase-scoped and manual Typography/Layout/Composition-Motion choices still disable sequence AUTO immediately.
- **Shape Build** is merged with deterministic Frame/Square and Ring/Circle calligram variants. Stable phrase ordinals keep already-placed words fixed while the shape grows.
- **Ribbon Path** is merged as an S-curve trajectory where active/recent/history lyrics share one path and advance continuously across word handoffs.
- Shape/Ribbon structural geometry is preserved under rapid-lyric readability pressure; active micro-motion and history budgets still adapt.
- Rotated persistent words now fit against both viewport width and height, improving ring/frame side safety on narrow viewports.
- **Elastic Tether** is merged: whole words now follow their composition entry vector, stretch/squash along the pull direction, overshoot and settle with bounded deformation.
- Elastic glyph motion is now secondary follow-through; the large gesture belongs to the word/container level.
- Rapid/Burst readability budgets reduce tether travel/deformation without eliminating motion.
- **Cinematic Camera Plan** is merged: Establish/Develop/Accent/Release role + phrase progress + typography focus + persistent grammar + readability pressure determine base pan/scale/rotation and impulse budgets.
- Ordinary and persistent typography expose deterministic focus points. Current-line focus begins handing off toward the next word near cue end.
- CameraRig now treats bass/transient drift as bounded micro-response layered over the directed shot rather than the primary framing source.
- Shape Build deliberately stays wider and follows focus less; Hero/Spiral/Ribbon receive stronger eye-trace following.
- The Visual Director now uses preview cards and six task-oriented sections: Scene, Type, Motion, World, Color and System.
- Effect cards expose a semantic miniature, name, short behavioral explanation, selected state and AUTO-resolved LIVE state.
- The resolved live stack is continuously visible above the Director controls.
- Main player and detached Director use the same `VisualDirector` component and shared control state.
- Browser popout uses `?director=1`; Electron exposes a dedicated sandboxed/context-isolated Director BrowserWindow.
- Same-origin BroadcastChannel synchronization shares Director controls, resolved renderer telemetry, playback/audio telemetry and cue-plan drafts without duplicating the Pixi renderer/audio engine.
- Detached Director provides LIVE and PLAN workspaces.
- PLAN can capture timestamped complete look snapshots, show them on a rail and recall them live; cues are explicitly session-only until project scene serialization lands.
- Visual Director design/architecture contract is `docs/VISUAL_DIRECTOR_WORKSPACE.md`.
- Active candidate separates the screen-anchored background/world from the typography camera so lyric/camera travel cannot expose black render-target edges.
- Active candidate adds ResizeObserver + fullscreenchange + VisualViewport handling and explicitly resizes Pixi/render targets to the final host bounds.
- DOM screen FX now overscan beyond the output edge and are clipped by the shell.
- Primary/persistent lyric Text textures use a minimum 3× internal raster resolution (4× cap) to keep large zooms substantially crisper.
- Persistent sequences are now manually selectable in the Director: Auto, Off/Classic, Spiral Depth, Hero/Echo, Shape Build and Ribbon Path.
- When the detached Director is open, the player becomes a clean output monitor; transport/file/fullscreen controls move to the Director topbar and command the main AudioEngine/Clock.
- Director UI has a DE/EN language switch and a professional readability pass replacing micro-font-heavy controls.
- Lower Thirds are a separate screen-space layer with ten visual presets, Intro/Rotate scheduling, metadata overrides and optional linked/uploaded artist image.
- Output/operator contract is `docs/OPERATOR_OUTPUT_LOWER_THIRDS.md`.
- Phrase-level cinematic direction keeps AUTO typography preset, layout and composition motion in coherent phrase-stable bundles instead of independently cycling every line.
- Phrases expose Establish / Develop / Accent / Release shot roles for the next sequence/camera layer.
- Kinetic readability pressure uses line duration, words/s, chars/s and shortest word duration.
- Rapid/Burst timing reduces long travel, rotation, scale excursion, floating and echo clutter but deliberately keeps nonzero motion and stronger visibility floors.
- Repeated lyric motifs create phrase boundaries so hook detection remains first-class rather than being swallowed by phrase grouping.
- Persistent multi-cue typography is now a dedicated seek-safe sequence path; ordinary `KineticLyrics` remains the fallback for non-persistent/manual compositions.
- Research/design contract is `docs/CINEMATIC_TYPOGRAPHY_DIRECTION.md`.
- React/Vite web shell, shared Node runtime, Electron desktop foundation and `emo.project/v1` are merged.
- Compositor baseline is merged: RenderTexture composition, deterministic feedback, displacement, velocity smear, threshold bloom and cinematic post-FX.
- Selector-driven typography and the existing typography/background visual families are merged.
- Visual Accents (Sparks/Trails + Recursive Lyrics) are merged and CI-verified.
- v0.8 adds a merged **Typography Composition Engine**:
  - Center Stack
  - Directional Stage
  - Editorial
  - Vertical Accent
  - Split Stage
  - Crossword
- Composition operates above glyph effects: complete words receive independent placement, orientation, scale and entry vectors. 90° words and mixed directional/zoom entrances are first-class.
- Layout AUTO is deterministic from scene family + cue index.
- v0.8 also adds a merged **OKLCH Palette Director**:
  - Split Complement
  - Analogous
  - Complement
  - Triad
  - Tetrad
  - Monochrome
- Generated palettes expose semantic background/text/accent/glow/muted roles and enforce minimum lyric/background contrast.
- Primary typography and background layers share the same palette.
- Composition and harmony are controllable from React, keyboard and `emo.project/v1`.
- Step 3 adds a merged **Composition Motion Grammar** above glyph animation:
  - Handoff
  - Conveyor
  - Anchor Build
  - Collapse
  - Takeover
  - Flip
  - Camera Handoff
  - Portal
  - Panel
- Grammar evaluation is pure/timestamp-driven from Enhanced LRC time and produces whole-stage + per-word transforms.
- `camera-handoff` currently moves the typography stage only; global background/camera motion remains owned by CameraRig.
- Motion AUTO is deterministic from scene family + cue index.
- v0.8 now includes a merged **central lyric attention field** inside title-safe space and deterministic collision resolution.
- LTR AUTO layouts now preserve readable row order; vertical words are limited to logical edge accents instead of arbitrary mid-sequence rotations.
- Split Stage no longer alternates consecutive cues left/right across the frame.
- Color Director adds lyric-oriented mood presets: Tender, Heartbreak, Longing, Euphoria, Rage, Dream, Tension and Calm.
- Dark background roles are now deliberately near-neutral/low-chroma to prevent persistent muddy brown fields.
- Optional Rainbow Drift rotates hue slowly from explicit lyric time.
- **Color Canvas** styles are merged: Night, Paper, Color Field and Poster.
- Color Canvas AUTO changes only in stable three-line chapters, giving obvious dark/light/chromatic variation without flickering every cue.
- Paper/Poster use dark colored typography on light/chromatic fields; Night/Color Field use light tinted typography with the same contrast contract.
- Rainbow Drift becomes canvas-aware: Night stays restrained while Paper/Color Field/Poster can shift the coherent background field itself.
- Root `npm run dev` owns runtime startup, waits for `/api/runtime`, then starts Vite; this removes the normal `ECONNREFUSED 127.0.0.1:3040` startup race.
- Windows/Node 24 Vite child startup is fixed by avoiding direct `npm.cmd` spawning; Windows launcher smoke coverage now runs on Node 22 + 24.
- Default server mode creates the repository `projects/` root when no explicit project root is configured.
- Step 4 now includes four merged large-scale **Art Direction Worlds**:
  - Editorial — asymmetric plates, bars and framing marks;
  - Print — halftone field, print bands and registration-like texture;
  - Architecture — nested frames, vanishing-point guides and pillars;
  - Aurora — layered edge ribbons, horizon glow and sparse motes.
- Art worlds consume semantic OKLCH palette roles and preserve a quiet central lyric region.
- Selecting an art world suppresses generic blob/particle/ring/beam layers so the new worlds do not collapse back into the same ambient-particle look.
- AUTO background routing now gives the new worlds first-class exposure in Poster/Neon/Vortex families.
- Reusable composition assessment (bounds, overflow, collision pairs, overlap ratio) and a viewport stress matrix cover desktop, laptop, portrait and mobile classes.

## Last verified checks

- Art Direction Worlds: Linux install/typecheck/build/tests/publication audit — passed.
- Art Direction Worlds: Windows full build, NSIS packaging, portable x64 packaging and artifact upload — passed.
- Visual Readability Matrix: Linux install/typecheck/build/tests/publication audit — passed.
- Visual Readability Matrix: Windows full build, NSIS packaging, portable x64 packaging and artifact upload — passed.

- v0.8 Composition + Palette: Linux install/typecheck/build/tests/publication audit — passed.
- v0.8 Composition + Palette: Windows full build, NSIS packaging, portable x64 packaging and artifact upload — passed.
- Composition Motion: Linux install/typecheck/build/tests/publication audit — passed.
- Composition Motion: Windows full build, NSIS packaging, portable x64 packaging and artifact upload — passed.
- Readability + Mood Color Direction: Linux install/typecheck/build/tests/publication audit — passed.
- Readability + Mood Color Direction: Windows full build, NSIS packaging, portable x64 packaging and artifact upload — passed.
- Dev Runtime + Color Canvas Variety: Linux install/typecheck/build/tests/publication audit — passed.
- Dev Runtime + Color Canvas Variety: Windows full build, NSIS packaging, portable x64 packaging and artifact upload — passed.
- Windows Node 24 Dev Launcher (PR #35): Linux validation — passed.
- Windows Node 24 Dev Launcher (PR #35): Windows launcher smoke on Node 22 — passed.
- Windows Node 24 Dev Launcher (PR #35): Windows launcher smoke on Node 24 — passed.
- Persistent Spiral/Hero Rendering (PR #39): Linux validation + Windows build/package/artifacts — passed.
- Shape Build + Ribbon Path (PR #40): Linux typecheck/build/82 tests/publication audit — passed.
- Shape Build + Ribbon Path (PR #40): Windows Node 22/24 launcher smokes + full build/NSIS/portable/artifact upload — passed.
- Elastic Tether + Camera Continuity (PR #42): Linux typecheck/build/tests/publication audit — passed.
- Elastic Tether + Camera Continuity (PR #42): Windows Node 22/24 launcher smokes + full build/NSIS/portable/artifact upload — passed.
- Visual Director Workspace (PR #44): Linux typecheck/build/tests/publication audit — passed.
- Visual Director Workspace (PR #44): Windows Node 22/24 launcher smokes + full build/NSIS/portable/artifact upload — passed.

## Next concrete action

1. Get PR #46 green on Linux and Windows packaging.
2. Manually verify fullscreen/edge safety, high-zoom type fidelity and Director operator mode at 1080p/1440p/4K.
3. Visually accept all ten Lower Third presets and manual Spiral/Hero/Shape/Ribbon controls.
4. Return to real-track cinematic acceptance and section-level tension/release + shot-size sequencing.
5. Attach Director PLAN + Lower Third persistence/runtime execution to serialized scene/project directives, then map that contract per song when playlist support lands.

## Do not redo

- Do not collapse composition back into glyph animation; layout and motion are separate layers.
- Do not use HSL/random RGB for automatic scene color decisions where the OKLCH director applies.
- Do not move frame-critical rendering/audio timing into React/Zustand/TanStack.
- Do not introduce history-dependent random layout choices.
- Do not implement cinematic continuity as a stateful tween history that cannot be reconstructed after seek.
- Do not solve fast lyrics by making them static; reduce motion distance/complexity while preserving local kinetic emphasis.
- Do not add another background/effect family before the multi-cue sequence foundation unless it closes a specific accepted visual grammar gap.
- Do not restart Pixi's independent automatic ticker.
- Do not add FFmpeg/video-export dependencies before a dedicated export/license milestone.

## Important context

- The audio/LRC clock remains the only motion-time source.
- Composition plans and composition-motion frames are pure/testable engine-core output; Pixi only consumes them.
- Palette AUTO and Composition AUTO are deterministic by cue index.
- Primary text contrast is measured against the generated background before a palette is exposed.
- There is no claimed scientific "golden center"; E-MO uses a deliberate central attention field informed by title-safe practice and documented center-bias research.
- Current layout baseline is Latin/LTR. Full bidi/RTL typography remains future work.
- See `docs/VISUAL_READABILITY_COLOR_RULES.md` for source-backed rules and product decisions.
- See `docs/DEVELOPMENT_RUNTIME.md` for the runtime/Vite startup contract and the meaning of proxy `ECONNREFUSED`.

For implementation order, read `docs/LYRIC_VISUALIZATION_ENGINE_PLAN.md`.
