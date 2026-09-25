# E-MO-Engine — Extensive Motion Engine for Enhanced LRC files

E-MO-Engine is a realtime motion-graphics player/engine for MP3/M4A/AAC audio synchronized to Enhanced LRC. It combines deterministic lyric timing with PixiJS typography, camera motion, audio-reactive backgrounds and GPU post-processing.

## Current status — v0.8 alpha

The project now has three product surfaces backed by the same engine:

- **React web app** — the main application/editor shell.
- **Node server** — serves the web app and projects from a configured directory.
- **Electron desktop** — starts the same server locally, loads the same React app, and can target a directory through a native folder picker.

Frame-critical motion remains outside React. PixiJS, Web Audio and the E-MO clock/cue system own realtime rendering.

## Implemented

- MP3 / M4A / AAC playback
- local drag-and-drop audio + Enhanced LRC
- server/Desktop project loading from a configured directory
- optional `emo.project/v1` manifest with nested media/assets and reproducible visual defaults
- Enhanced LRC line timestamps, word timestamps, offsets and line-only fallback timing
- manual live lyric-sync trim
- bass / mid / treble / energy / transient analysis
- deterministic timestamp-driven glyph/word motion
- deterministic typography selector engine: range, stagger, wave, wiggle, random and audio weighting
- eight typography motion presets: Impact, Cascade, Wave, Scatter, Elastic, Outline, Tunnel and Glitch
- word-level typography compositions: Center Stack, Directional Stage, Editorial, Vertical Accent, Split Stage and Crossword
- composition motion grammar: Handoff, Conveyor, Anchor Build, Collapse, Takeover, Flip, Camera Handoff, Portal and Panel
- OKLCH palette director with Split Complement, Analogous, Complement, Triad, Tetrad and Monochrome harmonies
- lyric mood palettes: Tender, Heartbreak, Longing, Euphoria, Rage, Dream, Tension and Calm
- slow deterministic Rainbow Drift for coherent hue movement
- Color Canvas modes: Auto, Night, Paper, Color Field and Poster
- central attention-field composition with collision-aware readable word placement
- background presets: Cinematic, Nebula, Grid, Starfield, Rays, Vortex, Liquid, Spectrum, Sparks, Recursive Lyrics, Minimal, Editorial, Print, Architecture and Aurora
- Poster / Neon / Vortex visual families
- deterministic Auto Director
- virtual camera impulses
- audio-reactive particles, geometry and backgrounds
- custom GPU post-FX with RGB split, transient smear, glow sampling, barrel warp, scanlines, grain and vignette
- responsive HUD
- fullscreen
- Cinema / Performance quality
- **Ctrl + Shift + H** full-HUD hide/show

## Architecture

```text
                 React / TypeScript / Vite
                         control plane
                              |
             +----------------+----------------+
             |                                 |
       local browser                     server / desktop
             |                                 |
      platform-web                    Node project server
             |                                 |
             +---------------+-----------------+
                             |
                        engine-core
                   LRC / Clock / Director
                             |
                     renderer-pixi
                 PixiJS / shader / camera
                             |
                        audio-web
                  Web Audio / HTMLAudio
```

Workspace layout:

```text
apps/
  web/        React application
  server/     hosted/root-targeting Node runtime
  desktop/    Electron main + preload

packages/
  engine-core/
  renderer-pixi/
  audio-web/
  platform-web/
  platform-node/
  app-contracts/
```

See `docs/PLATFORM_ARCHITECTURE.md` and `docs/DECISIONS.md`.

## Keyboard

| Key | Action |
| --- | --- |
| `Space` | play / pause |
| `Ctrl + Shift + H` | hide / show complete HUD |
| `F` | fullscreen |
| `M` | mute |
| `←` / `→` | seek 5 seconds |
| `Shift + ←` / `Shift + →` | seek 15 seconds |
| `0` | Auto Director |
| `1` / `2` / `3` | Poster / Neon / Vortex |
| `T` | cycle typography motion preset |
| `L` | cycle typography composition |
| `G` | cycle composition motion grammar |
| `B` | cycle background preset |
| `C` | cycle OKLCH color harmony |
| `E` | cycle lyric color mood |
| `V` | cycle Color Canvas (Night / Paper / Color Field / Poster) |
| `R` | toggle slow Rainbow Drift |
| `,` / `.` | lyric sync -/+ 50 ms |
| `Esc` | restore hidden HUD |

## Install and verify

Node.js 22.12+ is the current baseline.

```bash
npm install
npm run typecheck
npm run build
npm test
```

## Local development

Normal development starts the **Node runtime first**, waits for `/api/runtime`, and only then starts Vite:

```bash
npm run dev
```

Default addresses:

```text
runtime  http://127.0.0.1:3040
web      http://127.0.0.1:5173
```

The default `projects/` directory is created automatically. `npm run dev:web` is intentionally web-only and requires an already-running runtime; using it alone will produce Vite proxy `ECONNREFUSED` messages.

See `docs/DEVELOPMENT_RUNTIME.md` for root overrides and split-process commands.

## Hosted project-root mode

After building:

```bash
node apps/server/dist/index.js --root /path/to/projects
```

A project root can either itself contain a project or contain project directories. Automatic discovery recognizes audio + Enhanced LRC. For explicit/nested projects, `emo.project.json` now supports the versioned `emo.project/v1` schema.

Example:

```text
projects/
  song-a/
    track.m4a
    lyrics.lrc
    assets/
```

The server confines reads to the configured root and serves media with byte-range support for seeking. See `docs/PROJECT_FORMAT.md` for the manifest schema and path-security rules.

## Desktop

Development after a normal install:

```bash
npm run build
npm --workspace @graph1ks/emo-desktop start -- --root /path/to/projects
```

Windows packaging:

```bash
npm run desktop:dist
```

The desktop renderer has no Node integration. Native directory selection is exposed through a narrow preload bridge, while project/media serving stays behind the shared loopback E-MO server.

## Near-term work

1. visually validate Color Canvas AUTO transitions + mood/rainbow color direction on real tracks
2. visually accept the new Editorial / Print / Architecture / Aurora art-direction worlds on real tracks
3. complete the remaining typography families: soft-3D/inflate, brush/stroke reveal and dissolve/smear exits
4. add scene-stack serialization and per-section visual directives
5. visually tune typography/background preset combinations on real tracks
6. retire the temporary root legacy UI after React acceptance
7. optional true-3D layer only where a concrete scene requires it
8. timeline/editor surfaces on top of the stable visualization contracts
9. offline fixed-frame rendering/export architecture

## Licensing

E-MO-Engine uses the same licensing model as Graph1ks RhymeLab: **source-available, not OSI Open Source**.

Graph1ks Material is governed by `LICENSE` and `COMMERCIAL_LICENSE.md`. Third-party material retains its own license and attribution requirements.

See `LICENSE`, `COMMERCIAL_LICENSE.md`, `LICENSES.md`, `COPYRIGHT`, and `THIRD_PARTY_NOTICES.md`.
