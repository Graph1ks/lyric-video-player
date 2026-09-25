# Engineering Decisions

## ADR-001 — Audio clock owns visual time

**Status:** accepted  
**Date:** 2026-09-25

### Context

A lyric-video renderer must remain synchronized across pause, resume, seek, LRC offsets, and manual sync correction. Independent wall-clock animation timelines can drift or reconstruct the wrong state after seeking.

### Decision

The HTML audio element is the master clock. Lyric entry, word progression, and primary typography transforms are evaluated from audio/LRC timestamps. Stateful effects may use impulses, but seek-sensitive visuals should move toward deterministic timestamp/seed evaluation.

### Why

This keeps lyric timing reproducible and makes direct seeking a first-class operation rather than an animation edge case.

### Consequences

Effect APIs must accept explicit time. Random visual systems need deterministic seeds. A future export renderer can evaluate the same scene at arbitrary timestamps.

---

## ADR-002 — PixiJS renderer; editor framework stays outside the render loop

**Status:** accepted  
**Date:** 2026-09-25

### Context

The product needs large numbers of animated glyphs, particles, masks, render textures, filters, and post-processing while retaining a sophisticated application UI later.

### Decision

Use PixiJS for the realtime GPU renderer and a separate DOM UI shell. React is not part of the frame-critical rendering/timing architecture. A future editor may use React for panels, project state, timeline controls, and inspectors while communicating with the engine through explicit commands/state boundaries.

### Why

This avoids coupling 60-FPS render state to a component reconciliation loop and keeps the renderer embeddable.

### Consequences

The renderer must expose stable imperative APIs. UI frameworks can be replaced without rewriting the graphics engine.

---

## ADR-003 — Do not adopt GSAP for the engine

**Status:** accepted  
**Date:** 2026-09-25

### Context

GSAP 3.15.0 is technically strong and its Standard "No Charge" License permits commercial use for permitted uses. The same license also defines prohibited use around tools that let users build visual animations without code in ways that compete with Webflow's visual animation capabilities. E-MO-Engine's roadmap includes a possible visual motion editor.

### Decision

Do not ship GSAP as an engine dependency. Implement the required easing, interpolation, impulse, and timestamp-motion primitives inside E-MO-Engine. Revisit only if product scope or license terms materially change.

### Why

Accepting a future product-scope restriction now would conflict with the intended editor direction and Graph1ks' separate commercial licensing model. The currently required motion primitives are small enough to own safely.

### Cost / licensing impact

Removes a custom-license dependency and leaves PixiJS (MIT) as the only current runtime package dependency.

### Consequences

More animation primitives are maintained in-house, but the engine gains deterministic seek semantics and avoids license coupling to future editor design.

---

## ADR-004 — Mirror the RhymeLab source-available licensing model

**Status:** accepted  
**Date:** 2026-09-25

### Decision

Graph1ks Material uses PolyForm Noncommercial 1.0.0 plus the same project-specific monetization restriction used by RhymeLab. Monetized/commercial use requires a separate written commercial license. Third-party material remains under its upstream terms. Explicitly authorized external contributions require `CLA.md` acceptance.

### Why

This preserves public source access while retaining Graph1ks' ability to offer separately negotiated commercial rights and matches the owner's existing RhymeLab licensing strategy.


---

## ADR-005 — Cross-platform application baseline: React/Vite + PixiJS + Node + Electron

**Status:** accepted  
**Date:** 2026-09-25

### Context

E-MO-Engine must run as a hosted browser application and as a standalone desktop application that can target a local directory. The project should reuse the stack and architectural boundaries already proven in RhymeLab instead of introducing a second unrelated application ecosystem.

RhymeLab's current frontend uses React + TypeScript + Vite with Base UI, Motion, TanStack Query, Zustand, TanStack Virtual and Vitest. Its Shared Core architecture already defines replaceable web/desktop platform adapters and explicitly identifies Electron IPC/filesystem as the desktop boundary.

### Decision

Adopt the following platform baseline:

- framework-independent TypeScript engine core;
- PixiJS for realtime rendering and custom shaders;
- React + TypeScript + Vite for application/editor UI;
- Base UI for accessible primitives;
- Motion for shell/UI transitions only;
- Zustand for ephemeral application/session state;
- TanStack Query for async project/server/desktop requests;
- TanStack Virtual only where large lists/timelines justify it;
- Node.js for the hosted server and shared filesystem platform code;
- Electron for the standalone desktop shell;
- electron-builder for Windows installer/portable packaging;
- CSS Modules + CSS custom properties/OKLCH design tokens;
- Vitest for package/UI tests.

React state must never become frame-critical renderer state. The engine is isolated behind platform interfaces such as Clock, AssetSource and ProjectSource.

### Why Electron instead of Tauri

The renderer already depends on Chromium/WebGL/Web Audio semantics and the wider project is Node/TypeScript-centric. Electron reuses those assumptions and allows the same renderer/application bundle to run in desktop and hosted modes. Tauri would introduce a Rust toolchain and OS-WebView variance without a current product requirement that offsets that complexity.

### Server decision

Use Node's standard HTTP/filesystem APIs first. The current server scope is static assets, project discovery/metadata and sanitized media access under a configured root. A larger web framework is deferred until route/service complexity actually requires it.

### Consequences

The repository should move incrementally to npm-workspace boundaries for engine, renderer, platform adapters and apps before major editor/render-graph expansion continues. Desktop/server filesystem access must be root-confined and unavailable directly to the React renderer.

See `docs/PLATFORM_ARCHITECTURE.md`.
