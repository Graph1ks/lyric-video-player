# PROJECT.md

## Product

**Name:** E-MO-Engine — Extensive Motion Engine for Enhanced LRC files  
**One-line purpose:** Cross-platform realtime motion engine and player/editor that synchronizes audio with Enhanced LRC and renders high-end kinetic typography plus audio-reactive motion graphics.  
**Primary users:** Artists, music producers, lyric-video creators, motion designers, and developers embedding the engine.  
**Project stage:** alpha  
**Target platforms:** hosted web/browser, Windows standalone desktop application, reusable engine packages  
**Versioning/release model:** SemVer  
**Changelog:** enabled

## Repository mode

**Repository visibility:** public  
**Collaboration mode:** owner-controlled  
**External pull requests:** collaborators-only; unsolicited external PRs are not accepted  
**Issues:** enabled  
**Projects:** disabled  
**Discussions:** disabled  
**Community inbox behavior:** user-triggered only  
**Wiki:** disabled  
**Pages:** disabled  
**Fork policy:** allowed (public repository)  
**Repository settings verified:** yes  
**Verified on/by:** 2026-09-25 / authenticated GitHub tooling

## Scope

### In scope

- Local MP3/M4A/AAC playback.
- Enhanced LRC line and word timing, offsets, seeking, and manual sync trim.
- Realtime GPU lyric rendering, kinetic typography, background motion graphics, particles, compositing, post-FX, virtual camera, and audio reactivity.
- Deterministic scene direction and seek-safe timestamp-derived visual motion.
- React-based application/editor shell around a framework-independent render engine.
- Hosted Node.js mode serving projects from a configured directory.
- Windows Electron application that can select/target a local project directory.
- Future scene/preset project format and visual editor.

### Explicitly out of scope for the current alpha

- Mandatory telemetry, accounts, paid services, or automatic remote uploads.
- Multi-tenant SaaS storage/authentication without an explicit later design.
- Bundled copyrighted music or third-party lyric catalogs.
- React in the frame-critical renderer.
- Video export/FFmpeg until a separate export milestone and license review.

## Engineering targets

**Primary quality target:** deterministic audiovisual sync plus high visual quality.  
**Performance targets:** 1920×1080 at 60 FPS on a capable desktop GPU; adaptive Performance mode for lower-power hardware; no second animation clock that can drift from audio.  
**Availability target:** local desktop/server operation without mandatory external services.  
**Data-size assumptions:** project directories containing audio, Enhanced LRC, project metadata, presets, and lightweight visual assets.  
**Supported environments:** Electron/Chromium desktop first; current Chromium/Firefox hosted browser clients; Safari compatibility remains a later device-tested target.

## Architecture

**Runtime/language:** TypeScript 5.9.x; Node.js 22.12+ for server/desktop platform code  
**Application/UI:** React 19.3.x + Vite 8.3.x + Base UI + Motion + Zustand + TanStack Query; TanStack Virtual where justified  
**Primary render framework:** PixiJS 8.21.x plus custom E-MO timestamp motion and shaders  
**Audio:** HTMLAudioElement/Web Audio adapter for live browser/Electron playback  
**Server:** Node `node:http` plus explicit sanitized filesystem/project-root adapters  
**Desktop:** Electron main/preload/renderer boundary; electron-builder packaging  
**Styling:** CSS Modules + CSS custom properties/OKLCH design tokens  
**Testing:** Vitest plus existing repository build/audit gates  
**Storage:** project-directory source adapters; browser files/handles only where applicable  
**Packaging/distribution:** hosted static React build + Node server; Windows Electron installer/portable executable; source distributed in this repository

Detailed platform boundaries are authoritative in `docs/PLATFORM_ARCHITECTURE.md`.

### Architecture constraints

- Audio/playback time remains the live source of truth; timing is exposed behind an engine `Clock` interface so future fixed-frame export remains possible.
- Lyric motion should be derivable from lyric/audio timestamps where practical so seeking is reproducible.
- Keep engine-core independent from React, Electron, Node filesystem APIs, and UI DOM.
- Keep rendering/timing independent from the React editor shell.
- Use deterministic seeded randomness for seek-sensitive generated visuals.
- Required production path must remain zero-cost.
- Desktop/server filesystem access must go through typed platform adapters and be confined to an explicitly selected/configured root.
- Do not add a visual-animation dependency whose license could restrict a future visual editor.

## Cost policy

**Required production cost target:** zero.

| Integration | Required? | Cost model | Free production path? | Notes |
|---|---:|---|---:|---|
| Hosted third-party services | No | N/A | Yes | Self-hosted Node server is sufficient. |
| Electron desktop runtime | Yes for desktop distribution | Open-source packaging | Yes | No mandatory paid service. |

## Licensing strategy

**Source model:** source-available  
**Commercial model:** public non-commercial terms; separate written commercial licenses may be offered by Graph1ks  
**Deployment/distribution:** distributed source, hosted self-managed server, distributed desktop binaries  
**Copyleft posture:** permissive third-party dependencies preferred; custom/source-available dependencies require explicit review

### Code

**Chosen code license/terms:** PolyForm Noncommercial License 1.0.0 plus the same project-specific monetization condition used by Graph1ks RhymeLab; separate commercial license policy in `COMMERCIAL_LICENSE.md`.  
**Why it fits:** preserves public source visibility while reserving monetized use for separately negotiated Graph1ks commercial licensing.  
**Patent considerations:** no project-specific patent grant beyond the applicable public terms; authorized contributors grant the patent rights defined in `CLA.md`.  
**Attribution/NOTICE requirements:** required Graph1ks copyright notice plus all third-party notices.

### Data / models / assets

**Dataset/corpus license or terms:** none bundled  
**Model/weights license or terms:** none  
**Fonts/media/assets license or terms:** no commercial media/fonts bundled; user-loaded media remains external  
**Documentation license:** same Graph1ks Material terms unless a file says otherwise

### Contribution model

**External contributions accepted?** no unsolicited contributions; explicitly authorized contributions only  
**Contributor mechanism:** CLA  
**Why:** the source-available model and possible separate commercial licensing require Graph1ks to retain sufficient rights to dual-license authorized contributions.

## Dependency policy

- Runtime dependencies should be minimal and directly justified.
- Reuse the proven RhymeLab application baseline where it fits: React, TypeScript, Vite, Base UI, Motion, TanStack Query, Zustand, TanStack Virtual, Vitest.
- MIT/BSD/ISC/Apache-2.0 dependencies are preferred when technically suitable.
- Electron is the selected desktop shell; Tauri is not the current target.
- Any custom/source-available license receives explicit product-scope review before adoption.
- GSAP remains intentionally excluded under ADR-003.
- Do not add optional 3D or video-export dependencies until a concrete requirement exists.

## Data sources

No bundled external data source is currently required. Demo lyrics in `public/demo.lrc` are project-authored test content.

## Security/privacy

**Sensitive data handled:** local project/media files selected by the user or exposed under an explicitly configured server root  
**Secrets used:** none required by the core runtime  
**Network exposure:** hosted mode may bind a Node server; desktop mode remains local unless explicitly configured otherwise  
**Important threat assumptions:** local audio/LRC/project files are untrusted input; server routes must prevent path traversal; Electron renderer must not receive unrestricted Node/filesystem access.

## QA / release gate

Minimum checks:

- `npm run typecheck`
- `npm run build`
- browser smoke test with MP3/M4A plus Enhanced LRC
- seek/pause/resume/sync-trim verification
- `Ctrl + Shift + H` hide/show verification
- Performance/Cinema mode verification
- server-root traversal/security tests once server adapter lands
- Electron IPC/root-boundary tests once desktop adapter lands
- `python scripts/repo_audit.py`
- dependency license/cost review for every new dependency
- privacy/path-leak check

## Continuity

Operational state lives in `STATUS.md`. Detailed continuation context lives in `docs/HANDOVER.md`. Durable decisions live in `docs/DECISIONS.md`.

## Current priorities

1. Scaffold the accepted cross-platform workspace/application boundaries.
2. Extract engine-core and renderer-pixi without changing current visual behavior.
3. Add Node server and Electron directory adapters before resuming major render-graph/editor expansion.
