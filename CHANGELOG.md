# Changelog

Git history remains the complete technical history. This file records meaningful product, compatibility, licensing, and architecture changes.

## Unreleased

### Architecture

- Renamed the product to **E-MO-Engine — Extensive Motion Engine for Enhanced LRC files**.
- Accepted the cross-platform baseline: React/TypeScript/Vite app shell, PixiJS renderer, Node hosted runtime, Electron desktop runtime, and shared engine/platform package boundaries modeled after the current RhymeLab architecture.
- Extracted `engine-core`, `audio-web`, `renderer-pixi`, `app-contracts`, `platform-node`, and `platform-web` workspace packages.
- Refactored the hosted runtime into reusable `EmoServer` shared by server mode and Electron loopback mode.
- Pixi automatic rendering is disabled for the engine path; live frames are evaluated, captured and presented explicitly from the audio/LRC update loop.

### Added

- React 19 / Vite 8 application shell preserving the E-MO player HUD and `Ctrl + Shift + H`.
- Hosted project-root discovery and byte-range media serving.
- Server project browser that loads Enhanced LRC and audio directly into the engine.
- Electron 44 main/preload desktop shell with sandboxed renderer and native project-root selection.
- electron-builder Windows NSIS and portable x64 targets plus Windows packaging CI.
- Generic `Clock` contract and deterministic `FixedFrameClock` groundwork for future offline export.
- Versioned `emo.project/v1` project manifest with nested audio/LRC/assets and reproducible visual defaults.
- Hosted HTTP integration coverage for runtime/project APIs, LRC/media delivery, byte ranges, HEAD ranges and SPA fallback.
- Explicit Pixi RenderTexture scene compositor with sharp and additive bloom presentation paths.
- Deterministic Cinema-mode ping-pong frame feedback with reset semantics.
- Scene-aware audio-reactive displacement.
- Dedicated seven-tap velocity smear.
- Reactive threshold bright-pass bloom.
- Deterministic typography selector engine and eight typography preset families.
- Independent deterministic background preset engine.
- Reusable logarithmic FFT spectrum resampling for graphics.
- Procedural GPU liquid background and mirrored spectrum-ribbon background.
- Word-level typography composition engine with six deterministic layout families.
- OKLCH palette director with harmony generation, gamut reduction, semantic color roles and contrast checks.
- Deterministic composition-motion grammar with Handoff, Conveyor, Anchor Build, Collapse, Takeover, Flip, Camera Handoff, Portal and Panel families.
- Lyric-oriented color moods: Tender, Heartbreak, Longing, Euphoria, Rage, Dream, Tension and Calm.
- Slow timestamp-derived Rainbow Drift for restrained spectrum movement.
- Central lyric attention field and collision-aware composition stabilization.
- Dedicated Step 4 art-direction worlds: Editorial, Print, Architecture and Aurora.
- Color Canvas polarity modes: Night, Paper, Color Field and Poster, plus deterministic AUTO chapters.
- Root development orchestrator that starts/health-checks the Node runtime before Vite.
- Phrase-level cinematic direction groundwork with coherent AUTO typography/layout/motion bundles and Establish/Develop/Accent/Release roles.
- Kinetic readability pressure analysis with adaptive nonzero motion budgets for rapid and burst lyric timing.
- Persistent multi-cue typography scenes with Spiral Depth and Hero/Echo rendering.
- Shape Build calligrams with deterministic frame/ring variants and stable phrase slots.
- Ribbon Path sequences with continuous S-curve word handoffs.
- Elastic Tether word arrivals with directional stretch/squash, overshoot and damped settle.
- Phrase/shot/focus-driven cinematic camera planning with bounded audio micro-response.
- Redesigned Visual Director workspace with semantic effect preview cards and task-oriented navigation.
- Synchronized browser/Electron Director popout for second-screen live control.
- Session cue-plan workspace for timestamped visual-look capture and live recall.
- Manual Director controls for Spiral Depth, Hero/Echo, Shape Build and Ribbon Path persistent sequences.
- Detached-Director operator transport for playback, seek, volume, loading and player fullscreen.
- English/German Director and player-shell localization.
- Ten-style Lower Third system with artist/title metadata overrides and optional artist portrait URL/upload.
- Global shared measured typography spatial model for collision-aware layouts.
- Shape Fill occupancy packing based on real word geometry rather than anonymous slots.
- Progressive editorial Manifesto page build with immutable future-slot reservation.
- Measured collision separation for Spiral Depth and Ribbon Path.
- Shape Fill persistent grammar with Tree, Star and Human/Figure packed word silhouettes.
- Manifesto Wall persistent grammar with progressive editorial-page writing, rigid snap-ins, moderate hierarchy and occasional vertical bracket words.
- Editable Director Performance Presets that constrain AUTO scene/type/sequence/layout/motion/world/color pools, with curated emotion + pace profiles and local custom-preset persistence.
- Lower Third scheduling with Off / Scheduled / Always modes, configurable start/duration, optional pre-outro trigger and an immediate Director trigger.
- Professional web-player and detached-Director control surfaces with persistent transport, large playhead counters, session readouts and monitoring controls.
- Explicit Visual FX Rack for camera motion, impact/pulse, displacement, smear, bloom, temporal feedback, cinematic post FX, world power/detail and DOM screen finishing.
- **Prism Stage Beams** world with a visible central fixture hub, multi-layer volumetric rainbow/RGB beams, haze, hot cores and audio-reactive flare.
- **Laser Canopy Grid** world with an overhead rig, crisp red/cyan/mint laser architecture, floor hit-points and audio-reactive canopy sweeps.
- **Disco Mirrorball Room** shader world with spherical mirror facets, metallic/specular response and dense moving room reflections.
- **Neon Energy Burst Tunnel** shader world with logarithmic tunnel depth, dense radial streaks, electric filaments, arc sparks and central energy bloom.
- **Fractal Hex Spiral Mosaic** rebuilt from a rejected flat warp shader into projected 3D moving hex prisms with real z-depth, three spiral sinks, perspective parallax, depth sorting and visible extrusion.
- **Soft Hex Cell Field** rebuilt from rejected screen-space masks into a mathematically packed axial 3D hex-prism surface with controlled gaps, camera perspective, relief, occlusion and bevel/highlight geometry.
- **Particle Spiral Vortex** world with projected 3D particle arms, real z-depth, autonomous inward funnel travel, warm outer particles and a bright spectral vortex core.
- **Minimal Rainbow Waveform** world driven by the live resampled spectrum with per-bin smoothing, mirrored rainbow spikes, fine transient needles and large negative space.
- User-authored-only Performance Presets; the previously shipped emotion/pace preset library is removed.
- FX Rack factory reset that restores the original pre-exposure renderer/compositor balance.

### Changed

- React is the application control plane while PixiJS remains the frame-critical renderer.
- Hosted and Desktop modes share one Node server/project-root implementation.
- Manifest-backed projects select media explicitly and can apply visual/sync defaults on load.
- Virtual-camera rotation and zoom pivot around viewport center.
- Primary lyric entry and word-punch motion remains evaluated analytically from lyric timestamps.
- Manual typography/background preset changes reset temporal feedback to prevent stale visual history.
- Typography composition is now independent from glyph animation, allowing fixed 90°/editorial stage layouts while glyph effects continue inside each word.
- Primary lyric and background layers now share one generated OKLCH palette contract.
- Whole-layout motion is separated from fixed composition targets and glyph animation; all three layers remain independently selectable and timestamp-driven.
- Night palette backgrounds use near-neutral low chroma to avoid muddy brown fields; Paper, Color Field and Poster deliberately introduce light and chromatic canvases instead of forcing every scene into dark mode.
- AUTO word layouts preserve LTR row progression and limit vertical words to logical edge accents instead of arbitrary zig-zag cue paths.
- Dedicated art-direction worlds suppress generic ambient particle/blob/ring/beam layers so their large-scale composition remains visually distinct.
- Root `npm run dev` no longer starts Vite before its `/api` runtime dependency is available; `npm run dev:web` preserves the explicit web-only workflow.
- AUTO typography direction is becoming phrase-stable instead of independently rotating preset/layout/motion each lyric line.
- Fast lyric passages reduce large spatial excursions and competing clutter while retaining visible local kinetic motion.
- Persistent typography AUTO shots replace, rather than overlay, ordinary current-line typography while active.
- Shape/Ribbon structural geometry is preserved under readability pressure while local motion remains adaptive.
- Background/world rendering is screen-anchored outside the lyric camera so camera motion cannot expose transparent black edges.
- Fullscreen/viewport changes explicitly reflow Pixi and render-target dimensions.
- Screen FX use output overscan and primary lyric textures use elevated raster resolution for cleaner edges.
- The main player becomes a clean output monitor while the detached Director is present.
- Director typography sizing is raised for professional readability instead of micro-label density.
- Shape Build UI/AUTO semantics are corrected from frame/ring paths to true interior Shape Fill; legacy `shape-build` remains an internal alias.
- Background/filter edge safety now combines source bleed, shader edge guards, opaque final output and DOM overlay edge fades.
- Cinematic camera consumes the actually resolved/manual persistent grammar instead of the AUTO bundle's nominated grammar.
- AUTO can now be intentionally narrowed by an active Performance Preset instead of drawing from the complete visual catalog; manual axis overrides remain available.
- Performance Preset pools may now be left empty to mean unrestricted ANY; compositor/screen FX use explicit 0–300% amounts where 0% is fully off.
- Curated emotion/pace presets were tightened into smaller visual vocabularies and now include explicit renderer FX racks instead of inheriting hidden effects.
- Background World Power and World Detail now span from effectively absent through deliberately extreme performance-showpiece ranges, with density affecting actual structural detail.
- Prism Stage Beams and Laser Canopy Grid are upgraded from primitive Graphics prototypes to dedicated full-screen GPU shader worlds.
- Detached Director transport uses a two-row responsive control bar so playback, seek, metadata and volume are no longer crushed by operator actions.
- GSAP remains excluded because the planned visual-editor direction could intersect its visual-animation-builder restriction.

### Fixed

- Explicitly destroy transient high-resolution Pixi lyric glyph/echo resources when a lyric line or echo treatment is rebuilt, preventing detached Text textures from accumulating over long playback sessions.
- Recursive Lyrics backdrop text is now lazy: it is allocated only while that background is actually active, reused for an unchanged visual key, and explicitly destroyed when replaced.
- Full-frame displacement, velocity-smear and cinematic post filters no longer request transparent Pixi filter padding; the compositor also keeps an unfiltered current-frame safety plane beneath filtered output.
- Procedural Liquid now guarantees an opaque background output so downstream warps cannot expose the canvas clear color.
- Player HUD text button now owns an explicit auto-width border box instead of inheriting the square icon-button width.
- Detached Director playback telemetry no longer depends on the main Pixi requestAnimationFrame loop; media events plus a transport heartbeat keep playback time/duration current, while the Director interpolates its visible playhead locally.
- Scheduled Lower Third timing therefore continues to advance even when the detached Director has focus and the main renderer window is background-throttled.
- FX exposure no longer reduces the default cinematic look: factory values match the original authored 1.0 strength, background Impact/Pulse is no longer applied twice, and DOM screen FX retain their original audio-reactive behavior.
- CinematicPostFX restores its missing source sample before the true-bypass blend, preventing the post shader from compiling with an undefined variable at runtime.
- Performance Preset deletion now requires an explicit second click instead of deleting on the first action.
- Disco Mirrorball Room no longer maps raw music energy into ball radius/rotation speed; its motor motion is constant and audio drives smoothed lighting/specular response only.
- Neon Energy Burst Tunnel no longer multiplies absolute phase time by raw bass. Travel is monotonic/outward and transient rising edges trigger a decaying outward burst shock instead of expand/retract oscillation.

### Security / Privacy

- Electron renderer runs with context isolation, no Node integration and sandboxing; privileged folder selection is exposed only through a narrow preload bridge.
- Server project access is confined below the configured root and media is addressed through discovered project/asset IDs.
- Manifest paths reject absolute paths, drive prefixes, dot/dot-dot traversal and null-byte values before filesystem resolution.
- Invalid or unsatisfiable media ranges return HTTP 416 instead of being clamped to valid bytes.
- Core runtime retains a zero-required-service path with no mandatory uploads, accounts or telemetry.
