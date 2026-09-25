# E-MO-Engine Platform Architecture

**Product:** E-MO-Engine — Extensive Motion Engine for Enhanced LRC files  
**Decision date:** 2026-09-25  
**Status:** accepted platform baseline

## 1. Product targets

E-MO-Engine must support the same motion engine and project semantics in three product surfaces:

1. **Web / hosted:** a browser client served from a normal Node.js server.
2. **Desktop:** a standalone Windows application that can target a local directory containing audio, Enhanced LRC, project metadata, and visual assets.
3. **Engine/library:** framework-independent timing/rendering packages that can later support export or embedding without rewriting product logic.

The architecture must remain zero-cost for the required production path and preserve the repository's source-available/commercial-licensing model.

## 2. Baseline stack

The application stack deliberately follows the current RhymeLab React/TypeScript platform because it is already familiar and has established architecture/testing patterns.

### Application/UI

- **React 19.3.x** — application shell, editor, inspectors, project browser, timeline controls.
- **TypeScript 5.9.x** — all new application, platform, and engine code.
- **Vite 8.3.x** — web/renderer development and production build.
- **Base UI 1.8.x** — accessible unstyled primitives for dialogs, menus, popovers, selects, tooltips, drawers.
- **Motion 13.4.x** — application-shell transitions and UI motion only.
- **Zustand 5.0.x** — ephemeral application/session state.
- **TanStack Query 5.103.x** — asynchronous server/desktop platform requests and project metadata.
- **TanStack Virtual 3.14.x** — large project/asset/timeline lists when virtualization is actually needed.
- **CSS Modules + CSS custom properties / OKLCH tokens** — product styling. No Tailwind requirement.
- **Vitest 5.x** — package and UI unit/integration tests.

### Motion/render engine

- **PixiJS 8.21.x** — realtime GPU scene graph, text/glyph rendering, particles, RenderTextures, filters and post-processing.
- **Custom timestamp/easing/shader code** — deterministic E-MO motion semantics.
- **Web Audio API** — browser/Electron playback analysis and reactive audio bands.

React, Motion, Zustand and TanStack must not own frame-critical render state. PixiJS and the engine clock remain authoritative for visuals.

### Runtime/server

- **Node.js 22.12+** — shared server/desktop runtime baseline.
- **node:http + node:fs/node:path** — initial HTTP/static/media API and directory access. A larger server framework is not required for the current scope.
- Server mode serves the same built React client and exposes only sanitized project-root APIs/media URLs.

### Desktop

- **Electron** — desktop shell.
- **electron-builder** — Windows packaging, including normal installer and portable executable targets.
- Secure Electron boundary: main process + preload + renderer; `contextIsolation: true`; no renderer `nodeIntegration`; typed IPC only.
- Native folder selection and CLI `--root` support target a project directory.
- Local media should be exposed through a controlled custom protocol or typed IPC-derived URL, not unrestricted `file://` access.

Electron is chosen over Tauri because E-MO already depends on Chromium/Web Audio/WebGL behavior and the project is TypeScript/Node-centric. Tauri would introduce a Rust toolchain and OS-WebView variation without a current product benefit.

## 3. Repository shape

Move toward npm workspaces with these boundaries:

```text
apps/
  web/                    React application for hosted/browser use
  desktop/                Electron main + preload; reuses the web renderer
  server/                 Node HTTP/static/project-directory runtime

packages/
  engine-core/            Enhanced LRC, clocks, cue model, scene/project model, director
  renderer-pixi/          Pixi render graph, typography, camera, particles, shaders, post-FX
  audio-web/              HTMLAudio/Web Audio playback-analysis adapter
  platform-web/           browser File/File System Access adapters
  platform-node/          filesystem/project-root discovery shared by server/Electron
  app-contracts/          typed platform/project messages and DTOs
```

The exact folder migration can be incremental; package boundaries are architectural, not a requirement to perform a risky one-shot rewrite.

## 4. Shared-core rule

The core engine must not depend on:

- React;
- Electron;
- Node filesystem APIs;
- browser DOM UI;
- server routing;
- concrete local filesystem paths.

Use interfaces/adapters for platform-specific behavior.

Important abstractions:

- `Clock` — current time, duration, play/pause/seek semantics.
- `AssetSource` — resolve/list/read project assets without exposing arbitrary paths to engine code.
- `AudioAnalysisSource` — bass/mid/treble/energy/transient samples.
- `ProjectSource` — discover an E-MO project from browser files, a server root, or an Electron-selected folder.
- `RenderTarget` / render configuration — browser canvas now; future export adapter later.

Normal browser/Electron playback uses an HTML-audio-backed clock. A future offline exporter may use a fixed-frame clock without changing scene semantics.

## 5. State ownership

| State | Owner |
|---|---|
| audio time / active cue / deterministic motion evaluation | engine |
| Pixi objects, particles, shader uniforms, render targets | renderer-pixi |
| current project/session UI state | Zustand |
| async project lists, metadata, server/IPC requests | TanStack Query |
| dialogs, menus, selection widgets | React + Base UI |
| shell/panel transitions | Motion |
| local directory/filesystem access | platform-node via server or Electron IPC |
| browser local file handles | platform-web |

Never publish per-frame FFT values, glyph transforms, particle state, or camera matrices through React/Zustand.

## 6. Directory-oriented product model

Desktop/server modes operate against a configured root directory. The future project contract should support deterministic discovery such as:

```text
project-folder/
  emo.project.json        optional explicit project manifest
  track.mp3               or .m4a/.aac
  lyrics.lrc              Enhanced LRC
  assets/
  presets/
```

Before a formal manifest exists, auto-discovery must be conservative and deterministic. The engine itself receives logical asset identifiers, not unrestricted absolute paths.

## 7. Server mode

Initial hosted mode is intentionally simple:

```text
Browser React UI
      |
      | HTTP
      v
Node server
      |
      +-- static built app
      +-- project list / metadata API
      +-- sanitized media/LRC asset routes
      +-- configured project root
```

The server must reject path traversal and may only resolve assets below its configured root. Binding publicly, authentication, upload/edit permissions, and multi-user storage are separate explicit product decisions; they are not silently enabled by the initial server.

## 8. Desktop mode

```text
Electron main
   |
   +-- folder picker / CLI --root
   +-- filesystem + project discovery
   +-- controlled media protocol
   +-- typed IPC
   |
preload bridge
   |
React renderer
   |
E-MO engine + PixiJS
```

The same React application and engine packages are reused. Desktop-only code must stay in platform/desktop boundaries.

## 9. Explicit non-choices

For the current architecture:

- **No Next.js** — SSR/server components do not improve the motion-engine use case and would split desktop/web assumptions.
- **No Tauri** — Rust + platform WebView variation is unnecessary for the current TypeScript/Chromium-heavy product.
- **No React-based frame renderer** — React owns controls/editor chrome, not the visual engine.
- **No GSAP** — retained ADR-003 licensing/product-scope decision.
- **No Three.js as the primary renderer** — PixiJS remains the 2D/2.5D engine; add a 3D package only for a concrete scene requirement.
- **No Tailwind requirement** — existing CSS-token/CSS-Modules approach gives direct control over a graphics-heavy interface.
- **No FFmpeg dependency yet** — video export is a separate milestone with explicit LGPL/GPL/redistribution review.

## 10. Next architecture work

Before expanding visual effects further:

1. scaffold npm workspaces and the React/Vite app using the RhymeLab dependency baseline;
2. extract current timing/LRC/director logic into `engine-core`;
3. extract Pixi code into `renderer-pixi`;
4. define `Clock`, `AssetSource`, and project-source contracts;
5. add the Node server surface against a configured root;
6. add the Electron main/preload shell and secure folder-targeting adapter;
7. only then continue the RenderTexture/post-FX/editor expansion on top of those stable boundaries.
