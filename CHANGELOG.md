# Changelog

Git history remains the complete technical history. This file records meaningful product, compatibility, licensing, and architecture changes.

## Unreleased

### Architecture

- Renamed the product to **E-MO-Engine — Extensive Motion Engine for Enhanced LRC files**.
- Accepted the cross-platform baseline: React/TypeScript/Vite app shell, PixiJS renderer, Node hosted runtime, Electron desktop runtime, and shared engine/platform package boundaries modeled after the current RhymeLab architecture.
- Extracted `engine-core`, `audio-web`, `renderer-pixi`, `app-contracts`, `platform-node`, and `platform-web` workspace packages.
- Refactored the hosted runtime into a reusable `EmoServer` shared by normal server mode and Electron loopback mode.

### Added

- React 19 / Vite 8 application shell preserving the E-MO player HUD and `Ctrl + Shift + H`.
- Hosted project-root discovery and byte-range media serving.
- Server project browser that loads Enhanced LRC and audio directly into the existing engine.
- Electron 44 main/preload desktop shell with sandboxed renderer and native project-root selection.
- electron-builder Windows NSIS and portable x64 targets.
- Generic `Clock` contract plus deterministic `FixedFrameClock` groundwork for future offline export.
- Local and URL-backed AudioEngine loading.
- Automated workspace boundary, path-security, deterministic timing and React store tests.
- v0.3 E-MO-Engine realtime renderer foundation and cinematic single-pass GPU post-FX.\n- Versioned `emo.project/v1` project manifest with explicit nested audio/LRC/assets and reproducible player defaults.
- Hosted HTTP integration coverage for runtime/project APIs, LRC/media delivery and byte-range behavior.
- Explicit Pixi RenderTexture scene compositor with separate sharp/post-FX and additive bloom presentation layers.\n- Windows CI packaging gate that builds and uploads NSIS and portable x64 desktop artifacts.

### Changed

- React is now the selected application control plane while PixiJS remains the frame-critical renderer.
- Hosted and Desktop modes now share one Node server/project-root implementation.\n- Manifest-backed projects now select media explicitly instead of relying on directory ordering and can apply visual/sync defaults on load.
- Pixi automatic rendering is disabled for the engine path; each live frame is now evaluated, captured and presented explicitly from the audio/LRC update loop.
- Virtual-camera rotation/zoom now pivots around viewport center.
- Primary lyric entry and word-punch motion remains evaluated analytically from lyric timestamps so seek behavior does not depend on a second animation timeline.
- GSAP remains excluded because the planned visual-editor direction could intersect its visual-animation-builder restriction.

### Security / Privacy

- Electron renderer runs with context isolation, no Node integration and sandboxing; privileged folder selection is exposed only through a narrow preload bridge.
- Server project access is confined below the configured root and media is addressed through discovered project/asset IDs.\n- Manifest paths reject absolute paths, drive prefixes, dot/dot-dot traversal and null-byte values before filesystem resolution.
- Media range handling now returns HTTP 416 for invalid or unsatisfiable byte ranges instead of clamping invalid starts.
- Core runtime retains a zero-required-service path with no mandatory uploads, accounts or telemetry.
