# Graph1ks Lyric Video Player — E-MOE-CHAIN Engine

Local-first realtime kinetic-lyrics and motion-graphics player for MP3/M4A/AAC audio plus Enhanced LRC.

The render engine is framework-independent: PixiJS owns GPU rendering, Web Audio provides music analysis, and E-MOE-CHAIN evaluates lyric motion analytically from the audio clock. The player UI is a lightweight DOM shell rather than a React render loop.

## Current status — v0.3.0 alpha

Implemented:

- MP3 / M4A / AAC local loading
- drag-and-drop ingestion for audio + `.lrc`
- Enhanced LRC parsing
  - `[mm:ss.xxx]` line timestamps
  - `<mm:ss.xxx>` word timestamps
  - `[offset:+/-ms]`
  - fallback word timing for line-only LRC
- audio as the single master clock
- manual live lyric-sync trim from `-1500 ms` to `+1500 ms`
- Web Audio FFT bands: bass / mid / treble / energy / transient
- PixiJS realtime renderer
- deterministic timestamp-driven word/glyph motion without a second animation clock
- glyph-level lyric rendering and word-level kinetic hits
- audio-reactive particles, rings, beams, geometry and scene palettes
- deterministic Auto Director based on lyric structure and repeated hook lines
- dedicated camera rig with line hits, word hits, drift, bass zoom and transient rotation
- first custom GPU post-FX pass: scene-aware chromatic split, transient smear, local glow, barrel warp, scanlines, grain and vignette
- Poster / Neon / Vortex visual families
- responsive glass/HUD player shell
- fullscreen mode
- Cinema / Performance render quality modes
- UI visibility hotkey: **Ctrl + Shift + H**

## Keyboard

| Key | Action |
| --- | --- |
| `Space` | play / pause |
| `Ctrl + Shift + H` | hide / show the complete HUD |
| `F` | fullscreen |
| `M` | mute |
| `←` / `→` | seek 5 seconds |
| `Shift + ←` / `Shift + →` | seek 15 seconds |
| `0` | Auto Director |
| `1` / `2` / `3` | Poster / Neon / Vortex |
| `,` / `.` | lyric sync -/+ 50 ms |
| `Esc` | restore hidden HUD |

## Run

Requirements: Node.js 22.5+.

```bash
npm install
npm run dev
```

Production verification:

```bash
npm run typecheck
npm run build
```

## Architecture

```text
HTML player shell
        │
        ├── local audio file
        │       ↓
        │   Web Audio analysis
        │       ↓
        ├── MasterClock ───────┐
        │                      │
Enhanced LRC                   │
        ↓                      │
cue / word timing              │
        ↓                      │
SceneDirector                  │
        ↓                      │
PixiJS render graph ← CameraRig┘
        ↓
KineticLyrics + CinematicBackground
        ↓
CinematicPostFX
        ↓
E-MOE timestamp motion + audio reactions
```

The HTML audio element is the timing source of truth. Lyric entry and word-punch transforms are calculated from timestamps, so seeking does not start or depend on a second wall-clock animation timeline.

## Near-term build plan

1. RenderTexture composition graph and feedback ping-pong buffers
2. dedicated displacement / velocity-smear / bloom passes (the first single-pass cinematic shader is already in)
3. selector system inspired by After Effects text animators
4. additional background families: fluid/noise, star tunnel, ribbons, typography feedback
5. scene JSON project format
6. section-level art direction for verse / chorus / bridge
7. optional 3D renderer after a concrete scene requires it
8. editor surface after the player/render engine is stable

React is not part of the render engine. A future editor may use React as a UI shell, but rendering and timing remain independent.

## Licensing

This project uses the same licensing model as Graph1ks RhymeLab: **source-available, not OSI Open Source**.

Graph1ks Material is governed by `LICENSE` and `COMMERCIAL_LICENSE.md`. Third-party material retains its own license and attribution requirements and is not relicensed by the repository root license.

See `LICENSE`, `COMMERCIAL_LICENSE.md`, `LICENSES.md`, `COPYRIGHT`, and `THIRD_PARTY_NOTICES.md`.
