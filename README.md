# E-MO-Engine — Extensive Motion Engine for Enhanced LRC files

E-MO-Engine is a realtime motion-graphics player/engine for MP3/M4A/AAC audio synchronized to Enhanced LRC. It combines deterministic lyric timing with PixiJS typography, camera motion, audio-reactive backgrounds and GPU post-processing.

## Current status — v0.5 alpha

The project now has three product surfaces backed by the same engine:

- **React web app** — the main application/editor shell.
- **Node server** — serves the web app and projects from a configured directory.
- **Electron desktop** — starts the same server locally, loads the same React app, and can target a directory through a native folder picker.

Frame-critical motion remains outside React. PixiJS, Web Audio and the E-MO clock/cue system own realtime rendering.

## Implemented

- MP3 / M4A / AAC playback
- local drag-and-drop audio + Enhanced LRC
- server/Desktop project loading from a configured directory\n- optional `emo.project/v1` manifest with nested media/assets and reproducible visual defaults
- Enhanced LRC line timestamps, word timestamps, offsets and line-only fallback timing
- manual live lyric-sync trim
- bass / mid / treble / energy / transient analysis
- deterministic timestamp-driven glyph/word motion
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

1. visual/browser acceptance of the React cutover
2. real Windows NSIS + portable packaging smoke test
3. retire the temporary root legacy UI
4. multi-pass RenderTexture compositor and ping-pong feedback
5. displacement, velocity smear and stronger bloom/glow
6. selector-driven typography system
7. timeline/editor surfaces on top of the new `emo.project/v1` project schema
8. offline fixed-frame rendering/export architecture

## Licensing

E-MO-Engine uses the same licensing model as Graph1ks RhymeLab: **source-available, not OSI Open Source**.

Graph1ks Material is governed by `LICENSE` and `COMMERCIAL_LICENSE.md`. Third-party material retains its own license and attribution requirements.

See `LICENSE`, `COMMERCIAL_LICENSE.md`, `LICENSES.md`, `COPYRIGHT`, and `THIRD_PARTY_NOTICES.md`.
