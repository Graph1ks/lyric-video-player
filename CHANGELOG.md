# Changelog

Git history remains the complete technical history. This file records meaningful product, compatibility, licensing, and architecture changes.

## Unreleased

### Added

- v0.3 E-MOE-CHAIN alpha engine foundation.
- Local MP3/M4A/AAC playback and drag/drop ingestion.
- Enhanced LRC parsing with line timing, word timing, offsets, and line-only fallback word timing.
- PixiJS realtime lyric renderer with Poster, Neon, and Vortex visual families.
- Deterministic Auto Director, virtual camera impulses, audio-reactive particles/geometry, manual sync trim, and Cinema/Performance modes.
- Full player HUD with fullscreen controls and `Ctrl + Shift + H` hide/show behavior.
- First custom PixiJS/WebGL post-FX shader with scene-aware RGB split, transient smear, glow sampling, barrel warp, scanlines, procedural grain, and vignette.
- Source-available licensing files aligned with the Graph1ks RhymeLab model.

### Changed

- Primary lyric entry and word-punch motion is evaluated analytically from lyric timestamps so seek behavior does not depend on a second animation timeline.
- GSAP was removed from the architecture after license review because the planned visual-editor direction could intersect its visual-animation-builder restriction.
- TypeScript was corrected to published stable version 5.9.3 after CI rejected the nonexistent 5.9.0 pin.

### Security / Privacy

- Core runtime remains local-first with no required uploads, accounts, telemetry, or hosted service.
