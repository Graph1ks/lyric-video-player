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

## Milestone 0.5 — Typography Engine — active
- line / word / glyph hierarchy — complete baseline
- deterministic range / stagger / wave / wiggle / random / audio selector system — complete baseline
- Impact / Cascade / Wave / Scatter / Elastic presets — complete baseline
- outline stack — complete baseline
- tunnel and recursive copies — complete baseline
- glitch typography — complete baseline
- inflated / soft-3D type — next
- handwritten / stroke reveal — next
- particle dissolve and smear exits — next
- word-level composition planner — complete baseline
- Center Stack / Directional Stage / Editorial / Vertical Accent / Split Stage / Crossword — complete baseline

## Milestone 0.6 — Advanced backgrounds — active expansion
- preset routing independent from scene family — complete baseline
- Cinematic / Nebula / Grid / Starfield / Rays / Vortex / Minimal families — complete baseline
- deterministic particles / dust depth field — complete baseline
- grids and geometric repeaters — complete baseline
- starfield / hyperspace scenes — complete baseline
- procedural noise / liquid flow — complete baseline
- waveform and spectrum ribbons — complete baseline
- sparks / trails — complete baseline
- recursive typography backgrounds — complete baseline
- Editorial art-direction world — complete baseline
- Print / halftone art-direction world — complete baseline
- Architecture art-direction world — complete baseline
- Aurora ribbon art-direction world — complete baseline
- generic ambient particles suppressed for dedicated art worlds — complete baseline

## Cross-cutting v0.8 — Composition + Color Direction — complete baseline
- typography composition separated from glyph motion
- deterministic composition AUTO routing
- word placement / orientation / scale / entry vectors
- OKLCH palette generation + sRGB gamut reduction
- Split Complement / Analogous / Complement / Triad / Tetrad / Monochrome
- semantic background/text/accent/glow roles
- lyric/background contrast guarantees
- React controls + project defaults
- composition-level motion grammar — complete baseline
- Handoff / Conveyor / Anchor Build / Collapse / Takeover / Flip / Camera Handoff / Portal / Panel — complete baseline
- central lyric attention field + collision-safe placement — complete baseline
- LTR row-order constraints + edge-only vertical accents — complete baseline
- lyric mood color presets — complete baseline
- low-chroma dark background roles / brown-background fix — complete baseline
- deterministic Rainbow Drift — complete baseline
- next after merge: distinct art-direction worlds

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
