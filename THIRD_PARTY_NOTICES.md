# Third-Party Notices

Third-party code is not relicensed by the Graph1ks project license. The versions below are the versions currently declared in `package.json`.

## Runtime dependency

### PixiJS 8.21.0

Purpose: realtime 2D/WebGL rendering and scene graph.

License: MIT License.

Upstream: https://github.com/pixijs/pixijs

The upstream copyright and MIT permission notice apply to PixiJS and must be preserved as required by that license.

## Development/build dependencies

### Vite 7.1.0

Purpose: local development server and production bundling.

License: MIT License.

Upstream: https://github.com/vitejs/vite

### TypeScript 5.9.0

Purpose: language compiler/type checker.

License: Apache License 2.0.

Upstream: https://github.com/microsoft/TypeScript

## Deliberately not adopted

GSAP was evaluated but is not a dependency. Its current Standard "No Charge" License contains restrictions for certain visual animation builders. Because E-MOE-CHAIN may later expose a visual motion editor, the engine uses its own timestamp-driven motion primitives instead of accepting that future product-scope constraint.

Three.js is not currently a dependency. A 3D renderer will only be introduced when a concrete scene requires it and after the dependency is reviewed at that time.

## User-provided media

No bundled song, commercial font, image library, video footage, or third-party lyric corpus is required by the repository. Audio/LRC files opened by a user remain external user-provided material and are not relicensed by this repository.

When additional assets, shaders, fonts, plugins, sample media, or data sources are introduced, their provenance and applicable licensing requirements must be recorded before distribution.
