# E-MO-Engine Roadmap

## Milestone 0.1 — Foundation — complete
- audio file ingestion
- Enhanced LRC parsing
- word-level synchronization
- master clock
- Pixi render root
- initial audio-reactive visual system

## Milestone 0.2 — Player shell / visual families — complete baseline
- high-end glass/HUD player shell
- `Ctrl + Shift + H` HUD toggle
- fullscreen / keyboard transport
- Poster / Neon / Vortex families
- Cinema / Performance quality modes
- drag-and-drop ingestion

## Milestone 0.3 — Director + camera — active
- deterministic lyric-structure Auto Director
- repeated-hook detection
- line and word camera impulses
- manual lyric sync trim
- audio band meter
- frame-reactive screen treatment
- timestamp-derived lyric entry and punch motion
- GSAP removed to avoid future visual-editor licensing constraints

## Milestone 0.4 — Render Graph + Post FX — active
- first custom GPU filter pass: chromatic split / channel offsets — complete baseline
- audio/transient-directed multi-tap smear — complete baseline
- local glow approximation, barrel warp, scanline, grain and vignette — complete baseline
- explicit RenderTexture scene composition — complete baseline
- manual clock-owned Pixi frame rendering — complete baseline
- additive blurred bloom presentation layer — complete baseline
- centered virtual-camera composition — complete baseline
- deterministic frame-feedback ping-pong buffer — complete baseline
- scene-aware displacement pass — complete baseline
- dedicated velocity-smear pass — complete baseline
- thresholded multi-pass bloom — complete baseline
- per-effect quality budgets — active

## Milestone 0.5 — Typography Engine
- line / word / glyph hierarchy
- range, stagger and wiggle selector system
- outline stack
- inflated / soft-3D type
- tunnel and recursive copies
- handwritten / stroke reveal
- particle dissolve and smear exits

## Milestone 0.6 — Advanced backgrounds
- procedural noise / liquid flow
- particles / sparks / dust / trails
- grids and geometric repeaters
- waveform and spectrum ribbons
- recursive typography backgrounds
- starfield / hyperspace scenes

## Milestone 0.7 — Scene project format
- scene JSON
- section boundaries
- transition rules
- cue-triggered and beat-triggered effects
- per-scene typography / background / camera / post-FX stacks

## Milestone 0.8 — Optional 3D
- select a permissively licensed 3D renderer only when required
- perspective camera
- Z-space lyric tunnels
- 3D text planes
- star worlds / geometric scenes

## Milestone 0.9 — Editor
- scene browser
- effect inspector
- timeline
- preset save/load
- live performance HUD
- React may be used for the editor shell only; renderer stays framework-independent
