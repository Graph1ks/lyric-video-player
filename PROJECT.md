# PROJECT.md

## Product

**Name:** Graph1ks Lyric Video Player — E-MOE-CHAIN Engine  
**One-line purpose:** Local-first realtime lyric-video renderer that synchronizes MP3/M4A/AAC playback with Enhanced LRC and produces high-end kinetic typography plus audio-reactive motion graphics.  
**Primary users:** Artists, music producers, lyric-video creators, motion designers, and developers embedding the renderer.  
**Project stage:** alpha  
**Target platforms:** modern desktop web browsers first; mobile browser support later  
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
- High-end player/HUD UX including keyboard control and full HUD hiding with `Ctrl + Shift + H`.
- Future scene/preset project format and an optional visual editor after the renderer is stable.

### Explicitly out of scope for the current alpha

- Mandatory cloud upload, telemetry, accounts, hosted processing, or paid runtime services.
- Server-side song/lyric storage.
- Bundled copyrighted music or third-party lyric catalogs.
- React in the frame-critical renderer. A future editor shell may use React without owning rendering/timing state.

## Engineering targets

**Primary quality target:** deterministic audiovisual sync plus high visual quality.  
**Performance targets:** 1920×1080 at 60 FPS on a capable desktop GPU; adaptive Performance mode for lower-power hardware; no second animation clock that can drift from audio.  
**Availability target:** local application; no hosted availability target.  
**Data-size assumptions:** one local audio track plus one LRC and lightweight visual presets/assets per session.  
**Supported environments:** current Chromium/Firefox desktop browsers; Safari compatibility is a target and requires device testing.

## Architecture

**Runtime/language:** TypeScript in the browser  
**Primary framework:** PixiJS 8.21.0 for GPU rendering; custom E-MOE timestamp motion; Web Audio API for analysis  
**Storage:** none required; local user-selected files stay in the browser session  
**Packaging/distribution:** Vite static web build; source distributed in this repository

### Architecture constraints

- The HTML audio element is the single timing source of truth.
- Lyric motion should be derivable from lyric/audio timestamps where practical so seeking is reproducible.
- Keep rendering/timing framework-independent from any future editor UI framework.
- Use deterministic seeded randomness for seek-sensitive generated visuals.
- Required production path must remain zero-cost and local-first.
- Do not add a visual-animation dependency whose license could restrict a future visual editor.

## Cost policy

**Required production cost target:** zero.

| Integration | Required? | Cost model | Free production path? | Notes |
|---|---:|---|---:|---|
| Hosted services | No | N/A | Yes | Core player is local-only. |

## Licensing strategy

**Source model:** source-available  
**Commercial model:** public non-commercial terms; separate written commercial licenses may be offered by Graph1ks  
**Deployment/distribution:** distributed source/static web build; local-only runtime by default  
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

- Runtime dependencies should be minimal and directly justified by rendering needs.
- MIT/BSD/ISC/Apache-2.0 dependencies are preferred when technically suitable.
- Any custom/source-available license receives explicit product-scope review before adoption.
- GSAP is intentionally not used because its current Standard License restricts certain competing visual animation builders; that conflicts with the project's possible future visual-editor scope.
- Do not add optional 3D dependencies until a concrete scene requires them.

## Data sources

No bundled external data source is currently required. Demo lyrics in `public/demo.lrc` are project-authored test content.

## Security/privacy

**Sensitive data handled:** none by design  
**Secrets used:** none  
**Network exposure:** local static web application; dependency installation/build may use normal package registries during development  
**Important threat assumptions:** local audio/LRC imports are untrusted input and must be parsed without executing content; media is not uploaded by the core application.

## QA / release gate

Minimum checks:

- `npm run typecheck`
- `npm run build`
- browser smoke test with MP3/M4A plus Enhanced LRC
- seek/pause/resume/sync-trim verification
- `Ctrl + Shift + H` hide/show verification
- Performance/Cinema mode verification
- `python scripts/repo_audit.py`
- dependency license/cost review for every new dependency
- privacy/path-leak check

## Continuity

Operational state lives in `STATUS.md`. Detailed continuation context lives in `docs/HANDOVER.md`. Durable decisions live in `docs/DECISIONS.md`.

## Current priorities

1. Finish the RenderTexture composition/post-FX graph.
2. Build the first serious post-FX pack: RGB split, displacement, directional smear, feedback, bloom/glow.
3. Expand the timestamp-driven typography selector system while preserving deterministic sync.
