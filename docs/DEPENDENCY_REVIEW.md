# Dependency Review

Current dependency decisions for E-MO-Engine. Version authority is the applicable workspace `package.json`. Dependencies are pinned deliberately; changes require build/behavior and licensing review.

## Rendering/runtime

### PixiJS 8.21.0 — approved

**Purpose:** realtime WebGL scene graph, text, graphics, particles, render-texture/compositing foundation.  
**Alternatives considered:** Canvas2D/in-house renderer, Three.js for all rendering.  
**Cost:** no required paid account/service.  
**License:** MIT.  
**Decision:** approved as the frame-critical renderer.

### Web platform APIs — approved

HTMLAudioElement, Web Audio, File/Blob URLs, requestAnimationFrame and standard browser APIs provide playback, analysis and local-file ingestion without a paid runtime dependency.

## Application shell — RhymeLab-aligned baseline

### React 19.3.0 / React DOM 19.3.0 — approved

**Purpose:** application/editor shell only.  
**License:** MIT.  
**Boundary:** React must not own per-frame FFT, glyph, particle, shader or camera state.  
**Decision:** approved.

### Base UI 1.8.0 — approved

**Purpose:** accessible unstyled UI primitives for future dialogs, menus, popovers, selects and drawers.  
**License:** MIT.  
**Decision:** approved.

### Motion 13.4.0 — approved with scope boundary

**Purpose:** panel/presence/layout transitions in application chrome.  
**License:** MIT.  
**Boundary:** not used as the lyric/camera/particle timing engine.  
**Decision:** approved.

### Zustand 5.0.15 — approved

**Purpose:** ephemeral application/session UI state.  
**License:** MIT.  
**Boundary:** no high-frequency renderer state.  
**Decision:** approved.

### TanStack Query 5.103.1 — approved

**Purpose:** async project/runtime metadata and server/desktop requests.  
**License:** MIT.  
**Decision:** approved.

### TanStack Virtual 3.14.13 — approved, demand-driven use

**Purpose:** large project/asset/timeline lists when measurement shows normal rendering is insufficient.  
**License:** MIT.  
**Decision:** approved but not required for simple surfaces.

## Hosted/server runtime

### Node.js standard library — approved

**Purpose:** static web serving, sanitized project discovery and range-capable media delivery.  
**Decision:** approved. No Express/Fastify dependency is currently required.

### @types/node 22.20.4 — approved development dependency

**License:** MIT.  
**Decision:** approved.

## Desktop

### Electron 44.3.0 — approved

**Purpose:** standalone Chromium desktop runtime, secure main/preload boundary and native folder picker.  
**Alternatives considered:** Tauri/system WebView.  
**Why Electron:** E-MO relies heavily on Chromium/WebGL/Web Audio behavior and the project is TypeScript/Node-centric. Keeping desktop and hosted rendering on the same Chromium assumptions is more valuable than a smaller executable.  
**Security boundary:** `contextIsolation: true`, `nodeIntegration: false`, sandboxed renderer, typed preload IPC; filesystem access remains in Node/main process.  
**Cost:** zero required runtime fee.  
**License:** MIT; upstream trademark terms remain separate.  
**Decision:** approved.

### electron-builder 26.15.3 — approved build dependency

**Purpose:** Windows NSIS and portable executable packaging.  
**Cost:** zero required packaging service.  
**License:** MIT.  
**Decision:** approved.

## Toolchain

### Vite 8.3.0 — approved for React application

**Purpose:** React web/renderer development and production build.  
**License:** MIT.  
**Decision:** approved. The old root compatibility build remains temporarily on Vite 7.1.0 until the React cutover is accepted.

### TypeScript 5.9.3 — approved

**Purpose:** static typing/compiler.  
**License:** Apache-2.0.  
**Decision:** approved.

### Vitest 5.0.1 — approved

**Purpose:** React/application unit and integration tests.  
**License:** MIT.  
**Decision:** approved.

## Explicitly rejected/deferred

### GSAP 3.15.0 — rejected for this product scope

GSAP is technically strong, but its current Standard "No Charge" License defines prohibited uses around certain competing visual animation builders. E-MO's roadmap includes a visual motion editor. Adopting GSAP would create an unnecessary product-scope constraint. E-MO therefore owns the small deterministic timestamp/easing/impulse primitives it requires.

### Three.js — deferred

Not required by the present 2D/2.5D compositor. Review the then-current version/license only when a concrete true-3D scene justifies adoption.

### FFmpeg — deferred

Video export is a separate milestone. Binary redistribution, codecs, LGPL/GPL configuration and packaging requirements must be reviewed before adding it.
