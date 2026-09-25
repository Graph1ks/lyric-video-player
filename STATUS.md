# Project Status

**Last updated:** 2026-09-25  
**Last known good merged baseline:** `df5e5c34f2ddf5de2ddec5e6fe7dad6da01592f1`  
**Active candidate:** none  
**Current phase/milestone:** WORLD_05–08 visual acceptance

## Current objective

Visually accept the projected-3D WORLD_05/06 rebuild and merged WORLD_07 Particle Spiral Vortex / WORLD_08 Minimal Rainbow Waveform while preparing the next WORLD_09/10 pair.

## Current state

- **Merged PR #61 repairs a real post-FX regression:** the CinematicPostFX shader's final true-bypass blend referenced an undefined `source` sample. The shader now explicitly samples the untouched frame before processing.
- Exposed FX factory defaults are restored to the pre-exposure authored balance: every formerly implicit renderer/compositor/screen layer is 100% at factory reset.
- Background Impact/Pulse no longer gets multiplied once before `CinematicBackground` and a second time inside it.
- DOM bloom/scanlines/grain again retain their original audio reactivity; the FX rack scales those authored behaviors instead of replacing them with static opacity.
- Built-in Performance Presets are removed. Storage migration drops the retired built-in IDs and preserves user-created presets only.
- Preset deletion is two-stage in the Director: Delete → Confirm Delete.
- WORLD_01 Prism Stage Beams and WORLD_02 Laser Canopy Grid are rebuilt as full-screen custom GPU shaders. The first Graphics prototypes are superseded.
- Pixi-vs-Three research is durable in `docs/WORLD_RENDERING_TECH_RESEARCH.md`: current conclusion is that Pixi custom Filters/Mesh are not the fidelity bottleneck; Three.js should be introduced only for worlds that measurably require a true second 3D scene/depth pipeline.

- **WORLD_03 / WORLD_04 merged baseline (PR #63):** `disco-mirrorball-room` and `neon-energy-burst-tunnel` are first-class Background presets, Director-selectable, included in unrestricted AUTO and rendered as specialized GPU worlds.
- WORLD_03 motion correction: mirrorball radius and angular velocity are now strictly time-driven/mechanical; raw audio cannot resize or accelerate the ball. Audio is smoothed and restricted to lighting/specular response.
- WORLD_04 motion correction: radial travel is monotonically outward. Raw bass is removed from phase multipliers; rising transient edges now trigger a decaying positive burst envelope and outward shock front instead of expand/retract oscillation.
- WORLD_05/06 first implementations were rejected in local acceptance and replaced in merged PR #67 with explicit projected 3D geometry benchmarked against the Graph1ks/website background architecture.
- WORLD_05 now uses moving 3D hex prisms, three logarithmic sinks, real z-depth, perspective/parallax, occlusion/depth sorting and visible extrusion.
- WORLD_06 now uses mathematically packed axial hex placement, real prism heights, look-at camera projection, controlled narrow gaps, depth sorting and side/top geometry.
- WORLD_07 Particle Spiral Vortex is merged in PR #68 and uses projected 3D particles moving autonomously inward/deeper along several spiral arms.
- WORLD_08 Minimal Rainbow Waveform is merged in PR #68 and consumes the real renderer spectrum buffer, applies per-bin smoothing and draws mirrored rainbow spikes with restrained glow.
- Durable 3D architecture is now captured in `docs/3D_WORLD_RENDERING_ARCHITECTURE.md`: world-space state, camera projection, perspective, depth sorting, Graphics-vs-Mesh-vs-raymarch-vs-Three escalation, performance rules and concrete WORLD_09/10 plans.
- Motion/audio semantics are durable in `docs/WORLD_MOTION_AUDIO_REACTIVITY.md`.
- Rendering-tech research keeps both in Pixi custom shaders for now; WORLD_03 escalates to a Three.js comparison only if local acceptance still requires true projected-room geometry/parallax.
- **WORLD_01 / WORLD_02 merged baseline (PR #59):** `prism-stage-beams` and `laser-canopy-grid` are first-class Background presets, selectable in Director, exposed to AUTO/presets and rendered as specialized Pixi worlds that suppress generic legacy background layers.
- WORLD_01 uses broad additive volumetric beam polygons, hot cores, dark haze, visible fixture lenses and transient flares.
- WORLD_02 uses an overhead rig, thin laser core/glow passes, geometric canopy targeting, floor hit-points and restrained depth haze.
- The full 13-world target set, fidelity floor, detail axis and audio-reactive intent are durable in `docs/WORLD_REFERENCE_SET_13.md`. Reference images are not committed because redistribution rights are unknown.

- Merged PR #57 rebuilds the web-player and detached-Director chrome as one restrained production-console design system with persistent transport and large playhead counters.
- Director playback telemetry is decoupled from the main Pixi RAF: media events plus a 125 ms heartbeat sample the authoritative HTML audio clock; the visible detached playhead interpolates locally.
- This removes the same stale-time dependency that prevented Scheduled Lower Third windows from firing while the main player was background-throttled.
- A new engine-core `VisualFxRack` exposes camera motion, impact/pulse, displacement, velocity smear, bloom, temporal feedback, cinematic post FX, World Power/Detail and DOM screen bloom/scanlines/grain/vignette.
- FX use an explicit 0–300% range: 0% is OFF, 100% authored normal, 300% intentionally extreme.
- Performance Preset AUTO pools may be emptied: an empty row means ANY/unrestricted rather than an invalid preset. Presets therefore do not need to constrain or activate every family.
- Built-in Performance Presets are removed; presets are user-authored only, with retired built-in IDs stripped during storage migration.
- World Power/Detail now drive art-world alpha, audio response, particle/blob density, recursive lyrics, sparks, spectrum resolution and geometric detail instead of only slightly scaling a shared intensity.
- Design/research contract: `docs/PRO_CONTROL_SURFACE_FX_RACK.md`.

- Phrase-level cinematic direction + adaptive readability pressure are merged in `c58be3e`.
- The pure multi-cue typography window + Spiral Depth/Hero-Echo planners are merged in `7d9c657`.
- Persistent Pixi sequence rendering, Spiral Depth and Hero/Echo are merged in `019d5f3`.
- Pixi sequence state is disposable; the pure time-derived plan remains authoritative.
- Persistent history is phrase-scoped and manual Typography/Layout/Composition-Motion choices still disable sequence AUTO immediately.
- Legacy **Shape Build** frame/ring behavior remains documented as the earlier baseline, but its UI/AUTO semantic target is superseded by merged v0.11 **Shape Fill** interior silhouettes.
- **Ribbon Path** is merged as an S-curve trajectory where active/recent/history lyrics share one path and advance continuously across word handoffs.
- Shape/Ribbon structural geometry is preserved under rapid-lyric readability pressure; active micro-motion and history budgets still adapt.
- Rotated persistent words now fit against both viewport width and height, improving ring/frame side safety on narrow viewports.
- **Elastic Tether** is merged: whole words now follow their composition entry vector, stretch/squash along the pull direction, overshoot and settle with bounded deformation.
- Elastic glyph motion is now secondary follow-through; the large gesture belongs to the word/container level.
- Rapid/Burst readability budgets reduce tether travel/deformation without eliminating motion.
- **Cinematic Camera Plan** is merged: Establish/Develop/Accent/Release role + phrase progress + typography focus + persistent grammar + readability pressure determine base pan/scale/rotation and impulse budgets.
- Ordinary and persistent typography expose deterministic focus points. Current-line focus begins handing off toward the next word near cue end.
- CameraRig now treats bass/transient drift as bounded micro-response layered over the directed shot rather than the primary framing source.
- Shape Fill deliberately stays wider and follows focus less; Manifesto Wall follows active wall focus more strongly while keeping micro-motion bounded.
- Merged PR #55 adds a dedicated **Presets** section ahead of the existing Scene, Type, Motion, World, Color, Titles and System sections.
- Performance Presets constrain AUTO rather than freezing one look: permitted scene/type/sequence/layout/motion/world/mood/canvas/harmony pools remain deterministic and manually overridable.
- Performance Presets are user-authored only; the retired built-in emotion/pace library is removed and old built-in IDs are stripped during preference migration.
- User-created preset edits remain local browser/Electron preferences for this milestone, not yet part of `emo.project/v1`.
- The Visual Director uses preview cards and task-oriented sections: Presets, Scene, Type, Motion, World, Color, Titles and System.
- Effect cards expose a semantic miniature, name, short behavioral explanation, selected state and AUTO-resolved LIVE state.
- The resolved live stack is continuously visible above the Director controls.
- Main player and detached Director use the same `VisualDirector` component and shared control state.
- Browser popout uses `?director=1`; Electron exposes a dedicated sandboxed/context-isolated Director BrowserWindow.
- Same-origin BroadcastChannel synchronization shares Director controls, resolved renderer telemetry, playback/audio telemetry and cue-plan drafts without duplicating the Pixi renderer/audio engine.
- Detached Director provides LIVE and PLAN workspaces.
- PLAN can capture timestamped complete look snapshots, show them on a rail and recall them live; cues are explicitly session-only until project scene serialization lands.
- Visual Director design/architecture contract is `docs/VISUAL_DIRECTOR_WORKSPACE.md`.
- Merged PR #46 separates the screen-anchored background/world from the typography camera so lyric/camera travel cannot expose black render-target edges.
- Merged PR #46 adds ResizeObserver + fullscreenchange + VisualViewport handling and explicitly resizes Pixi/render targets to the final host bounds.
- DOM screen FX now overscan beyond the output edge and are clipped by the shell.
- Primary/persistent lyric Text textures use a minimum 3× internal raster resolution (4× cap) to keep large zooms substantially crisper.
- Persistent sequences are manually selectable in the Director: Auto, Off/Classic, Spiral Depth, Hero/Echo, Shape Fill, Manifesto Wall and Ribbon Path.
- When the detached Director is open, the player becomes a clean output monitor; transport/file/fullscreen controls move to the Director topbar and command the main AudioEngine/Clock.
- Director UI has a DE/EN language switch and a professional readability pass replacing micro-font-heavy controls.
- Lower Thirds are a separate screen-space layer with ten visual presets, metadata overrides and optional linked/uploaded artist image.
- Merged PR #55 replaces Intro/Rotate scheduling with Off / Scheduled / Always. Scheduled defaults to a configurable appearance around 10s into the song, supports configurable visible duration, optional pre-outro replay, and a manual Show Now trigger.
- Output/operator contract is `docs/OPERATOR_OUTPUT_LOWER_THIRDS.md`.
- Merged PR #48 adds **Shape Fill**: phrase-stable packed silhouettes using Tree, Star and Human/Figure masks. Words occupy interior slots rather than tracing a border.
- Shape Fill slots expose explicit text-fit boxes so Pixi can respect actual font metrics while the layout remains pure and deterministic.
- Legacy `shape-build` remains an internal compatibility alias, but Director/AUTO use `shape-fill`.
- Merged PR #51 corrects **Manifesto Wall** from the initial masonry interpretation into a progressive editorial/book-page build: the page begins empty and words reveal into immutable pre-reserved positions.
- Manifesto is mostly horizontal with occasional ±90° editorial brackets and moderate anchor hierarchy; old words persist rather than aging out.
- Merged PR #51 introduces shared measured typography geometry (width/height/advance/ascent/descent/padding) plus rotated spatial boxes and collision helpers.
- Spatial ownership and non-regression rules are documented in `docs/TYPOGRAPHY_SPATIAL_SYSTEM.md`.
- Shape Fill uses real measured extents, occupied-space collision checks and deterministic shrink/retry rather than anonymous slots.
- Current-line composition consumes per-word measured width **and height**, improving collision resolution across ordinary/Vortex layouts.
- Spiral Depth and Ribbon Path now use measured screen-space collision to move older words farther along their path instead of allowing overlap.
- Manifesto camera framing blends active-word focus with the revealed-page envelope and adds only subtle bounded skew/rotation.
- Poster AUTO direction now exposes Hero/Echo, Manifesto Wall, Shape Fill and classic outline-panel families.
- Edge safety v0.11 adds 12% opaque world bleed, shader edge guards for displacement/smear/barrel/chroma and opaque final post-FX output.
- Real-display acceptance exposed a remaining compositor-level edge fault: nonzero Pixi filter padding creates transparent input gutters outside a full-frame Sprite, which warped taps can pull into the visible frame as black.
- Merged PR #53 removes padding from full-frame spatial filters, keeps an unfiltered current-frame safety Sprite beneath the filtered presentation and makes Liquid background output explicitly opaque.
- Long-play acceptance also exposed a renderer resource-lifetime fault: ordinary glyph/echo Text objects and Recursive Lyrics backdrop Text objects were detached with `removeChildren()` without being destroyed. Merged PR #53 explicitly destroys those transient Pixi resources and does not build Recursive Lyrics text while that background is inactive.
- DOM bloom/scanline/grain treatment now fades before the physical output edge while remaining overscanned.
- Design/implementation contract is `docs/SHAPE_FILL_MANIFESTO_EDGE_SAFETY.md`.
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
- Operator Output + Lower Thirds (PR #46): Linux typecheck/build/tests/publication audit — passed.
- Operator Output + Lower Thirds (PR #46): Windows Node 22/24 launcher smokes + full build/NSIS/portable/artifact upload — passed.
- Shape Fill + Manifesto Wall + Edge Safety (PR #48): Linux typecheck/build/tests/publication audit — passed.
- Shape Fill + Manifesto Wall + Edge Safety (PR #48): Windows Node 22/24 launcher smokes + full build/NSIS/portable/artifact upload — passed.
- Spatial Typography + Progressive Manifesto (PR #51): Linux typecheck/build/tests/publication audit — passed.
- Spatial Typography + Progressive Manifesto (PR #51): Windows Node 22/24 launcher smokes + full build/NSIS/portable/artifact upload — passed.

## Next concrete action

1. Continue in a fresh thread with **WORLD_09 Neon Equalizer Grid City** and **WORLD_10 Holographic Audio Terrain**.
2. Read `docs/3D_WORLD_RENDERING_ARCHITECTURE.md` before implementation; do not restart the Pixi-vs-Three research.
3. WORLD_09 should begin as projected/batched 3D equalizer geometry sharing one perspective camera with its floor grid.
4. WORLD_10 should begin as a dynamic Pixi Mesh/Geometry heightfield driven by live spectrum/history.
5. User feedback for WORLD_05–08 can arrive asynchronously and should be folded into later tuning.

For the next thread, start with the resume protocol plus `docs/3D_WORLD_RENDERING_ARCHITECTURE.md`.

### Previous visual-acceptance queue

1. Visually verify Shape Fill collision-free packing with short/long words plus the previously failing Vortex/Spiral overlaps.
2. Check progressive Manifesto reveal, 12-line manual page chapters, page stability and camera reading flow at 1080p/1440p/4K.
3. Re-test edge guards under the original fullscreen/CRT/smear failure cases.
4. Stress-test Rapid/Burst passages and narrow/mobile viewports for conservative AABB spacing.
5. Continue section-level tension/release + shot-size sequencing after spatial typography is accepted.

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
