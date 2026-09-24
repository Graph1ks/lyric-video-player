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

GSAP 3.15.0 is technically strong and its Standard "No Charge" License permits commercial use for permitted uses. The same license also defines prohibited use around tools that let users build visual animations without code in ways that compete with Webflow's visual animation capabilities. E-MOE-CHAIN's roadmap includes a possible visual motion editor.

### Decision

Do not ship GSAP as an engine dependency. Implement the required easing, interpolation, impulse, and timestamp-motion primitives inside E-MOE-CHAIN. Revisit only if product scope or license terms materially change.

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
