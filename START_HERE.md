# START HERE

Project: **Graph1ks Lyric Video Player / E-MOE-CHAIN Engine**

Current baseline: **v0.3.0 alpha**

For repository work, follow `AGENTS.md`, `PROJECT.md`, `STATUS.md`, and `docs/HANDOVER.md`.

Core invariants:

1. Audio time is the single master clock.
2. Preserve `Ctrl + Shift + H` as the HUD hide/show shortcut.
3. Preserve deterministic seek behavior: scene selection and timestamp motion must not depend on wall-clock randomness.
4. Keep frame-critical rendering outside a future React editor layer.
5. Keep local-first audio/LRC ingestion; no mandatory upload service.
6. Required production path must remain zero-cost.

Next engineering slice: RenderTexture/post-FX graph with RGB split, directional smear, feedback echo, displacement and scene-level color treatment.
