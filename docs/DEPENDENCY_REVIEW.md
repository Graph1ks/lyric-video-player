# Dependency Review

Current dependency decisions for E-MOE-CHAIN. Version authority is `package.json`; a lockfile should be committed once dependency installation is available in the development environment.

## PixiJS 8.21.0 — approved

**Purpose:** realtime WebGL scene graph, text, graphics, particles, render-texture/compositing foundation.  
**Alternatives considered:** Canvas2D/in-house renderer, Three.js for all rendering.  
**Why existing platform APIs are insufficient:** implementing performant scene graph, text batching, masking, filters, texture lifecycle, and GPU abstraction from scratch is disproportionate.

**Cost:** no required paid account/service.  
**License:** MIT License, verified from the upstream `pixijs/pixijs` repository.  
**Commercial use / redistribution:** allowed under MIT conditions.  
**Notices:** preserve upstream copyright/license notice as required.  
**Decision:** approved.

## Vite 7.1.0 — approved build dependency

**Purpose:** local dev server and production bundling.  
**Cost:** zero required production/development fee.  
**License:** MIT License, verified from the upstream `vitejs/vite` repository.  
**Decision:** approved.

## TypeScript 5.9.0 — approved build dependency

**Purpose:** static typing/compiler.  
**Cost:** zero.  
**License:** Apache License 2.0, verified from the upstream `microsoft/TypeScript` repository.  
**Decision:** approved.

## GSAP 3.15.0 — rejected for this product scope

**Purpose considered:** high-level animation/timeline/easing utilities.  
**Cost:** the current Standard "No Charge" License permits commercial projects at no charge for permitted uses.  
**License:** Webflow/GSAP Standard "No Charge" License; the package itself points to `https://gsap.com/standard-license/`.  
**Scope concern:** the license defines prohibited uses involving tools that enable visual animation building without code in competition with Webflow's visual animation capabilities. The E-MOE-CHAIN roadmap includes a visual scene/effect editor, so adopting GSAP would create an unnecessary future product-scope constraint.  
**Decision:** rejected. Use small in-house timestamp/easing/impulse primitives instead.

## Three.js — deferred

**Purpose considered:** true 3D scenes.  
**Decision:** not a dependency until a concrete 3D scene requires it. Review the then-current version/license before adoption.
