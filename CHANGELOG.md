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
- Reactive threshold bright-pass bloom candidate.

### Changed

- React is the application control plane while PixiJS remains the frame-critical renderer.
- Hosted and Desktop modes share one Node server/project-root implementation.
- Manifest-backed projects select media explicitly and can apply visual/sync defaults on load.
- Virtual-camera rotation and zoom pivot around viewport center.
- Primary lyric entry and word-punch motion remains evaluated analytically from lyric timestamps.
- GSAP remains excluded because the planned visual-editor direction could intersect its visual-animation-builder restriction.

### Security / Privacy

- Electron renderer runs with context isolation, no Node integration and sandboxing; privileged folder selection is exposed only through a narrow preload bridge.
- Server project access is confined below the configured root and media is addressed through discovered project/asset IDs.
- Manifest paths reject absolute paths, drive prefixes, dot/dot-dot traversal and null-byte values before filesystem resolution.
- Invalid or unsatisfiable media ranges return HTTP 416 instead of being clamped to valid bytes.
- Core runtime retains a zero-required-service path with no mandatory uploads, accounts or telemetry.
