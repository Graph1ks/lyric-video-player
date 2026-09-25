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
- GSAP remains excluded because the planned visual-editor direction could intersect its visual-animation-builder restriction.

### Security / Privacy

- Electron renderer runs with context isolation, no Node integration and sandboxing; privileged folder selection is exposed only through a narrow preload bridge.
- Server project access is confined below the configured root and media is addressed through discovered project/asset IDs.
- Manifest paths reject absolute paths, drive prefixes, dot/dot-dot traversal and null-byte values before filesystem resolution.
- Invalid or unsatisfiable media ranges return HTTP 416 instead of being clamped to valid bytes.
- Core runtime retains a zero-required-service path with no mandatory uploads, accounts or telemetry.
