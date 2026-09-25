# START HERE

Project: **E-MO-Engine — Extensive Motion Engine for Enhanced LRC files**

Current baseline: **v0.8 composition + Color Canvas + art-direction worlds**

Read in this order before changing architecture or dependencies:

1. `AGENTS.md`
2. `PROJECT.md`
3. `STATUS.md`
4. `docs/HANDOVER.md`
5. `docs/PLATFORM_ARCHITECTURE.md`
6. `docs/DECISIONS.md`
7. `docs/DEPENDENCY_REVIEW.md`

Core invariants:

1. Playback/audio time is authoritative for live synchronized visuals.
2. Preserve `Ctrl + Shift + H` as the complete HUD hide/show shortcut.
3. Preserve deterministic seek behavior; primary motion must derive from time/seed rather than wall-clock animation state.
4. React/Zustand/TanStack are application control-plane tools, not the 60-FPS render bus.
5. PixiJS owns frame-critical graphics.
6. Server/Desktop filesystem access is restricted to an explicitly configured project root.
7. Electron renderer stays sandboxed with no Node integration.
8. Required production operation must have a zero-paid-service path.
9. Do not reintroduce GSAP without reopening the accepted licensing/product-scope decision.

Next engineering gate: real-track visual acceptance of Color Canvas AUTO + Editorial / Print / Architecture / Aurora, followed by dense narrow/mobile composition tuning.
