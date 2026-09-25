# Third-Party Notices

Third-party code is not relicensed by the Graph1ks project license. Version authority is the applicable workspace `package.json`.

## Runtime / application dependencies

### PixiJS 8.21.0

Purpose: realtime 2D/WebGL rendering, text, scene graph, RenderTextures and GPU effects.  
License: MIT License.  
Upstream: https://github.com/pixijs/pixijs

### React 19.3.0 / React DOM 19.3.0

Purpose: E-MO application/editor shell. React does not own frame-critical renderer state.  
License: MIT License.  
Upstream: https://github.com/facebook/react

### Base UI 1.8.0

Purpose: accessible unstyled application UI primitives.  
License: MIT License.  
Upstream: https://github.com/mui/base-ui

### Motion 13.4.0

Purpose: application-shell and panel transitions only.  
License: MIT License.  
Upstream: https://github.com/motiondivision/motion

### TanStack Query 5.103.1

Purpose: asynchronous runtime/project metadata state.  
License: MIT License.  
Upstream: https://github.com/TanStack/query

### TanStack Virtual 3.14.13

Purpose: virtualization for future large project/asset/timeline lists where needed.  
License: MIT License.  
Upstream: https://github.com/TanStack/virtual

### Zustand 5.0.15

Purpose: ephemeral React application/session state.  
License: MIT License.  
Upstream: https://github.com/pmndrs/zustand

### Electron 44.3.0

Purpose: standalone desktop shell using the same Chromium/Web Audio/WebGL runtime assumptions as the hosted player.  
License: MIT License.  
Upstream: https://github.com/electron/electron

Electron branding/trademarks are not granted by the MIT software license; upstream trademark rules remain applicable.

## Development / build dependencies

### Vite

- Legacy compatibility build: 7.1.0
- React web application: 8.3.0

Purpose: local development server and production bundling.  
License: MIT License.  
Upstream: https://github.com/vitejs/vite

### TypeScript 5.9.3

Purpose: language compiler/type checker.  
License: Apache License 2.0.  
Upstream: https://github.com/microsoft/TypeScript

### Vitest 5.0.1

Purpose: React/application unit tests.  
License: MIT License.  
Upstream: https://github.com/vitest-dev/vitest

### electron-builder 26.15.3

Purpose: Windows installer/portable application packaging.  
License: MIT License.  
Upstream: https://github.com/electron-userland/electron-builder

### @types/node 22.20.4

Purpose: Node.js TypeScript declarations.  
License: MIT License.  
Upstream: https://github.com/DefinitelyTyped/DefinitelyTyped

## Deliberately not adopted

GSAP was evaluated but is not a dependency. Its current Standard "No Charge" License contains restrictions for certain visual animation builders. Because E-MO-Engine is expected to expose a visual motion editor, the engine uses its own timestamp-driven motion primitives instead of accepting that future product-scope constraint.

Three.js is not currently a dependency. A 3D renderer will only be introduced when a concrete scene requires it and after the dependency is reviewed at that time.

FFmpeg is not currently a dependency. Offline/video export will receive a separate binary/distribution/license review before adoption.

## User-provided media

No bundled song, commercial font, image library, video footage, or third-party lyric corpus is required by the repository. Audio/LRC/assets opened by a user remain external user-provided material and are not relicensed by this repository.

When additional assets, shaders, fonts, plugins, sample media, binaries, or data sources are introduced, their provenance and applicable licensing requirements must be recorded before distribution.
