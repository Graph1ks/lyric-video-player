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

## Cross-cutting — Cinematic Sequence Direction — active

- research-backed temporal direction contract — documented
- phrase-level cinematic grouping — complete baseline
- coherent AUTO typography/layout/motion bundles — complete baseline
- Establish / Develop / Accent / Release shot roles — complete baseline
- cue-density readability pressure + adaptive motion budget — complete baseline
- fast passages remain kinetic while reducing travel/rotation/overshoot/clutter — complete baseline
- persistent multi-cue typography scene model + stable word IDs — complete baseline
- Spiral Depth pure placement grammar + Pixi integration — complete baseline
- Hero / Echo Field pure placement grammar + Pixi integration — complete baseline
- bounded persistent Pixi word cache driven by pure time-derived plan — complete baseline
- phrase-scoped sequence history + manual AUTO fallback contract — complete baseline
- Shape Build / frame + ring calligrams — historical baseline; superseded by v0.11 Shape Fill semantics
- Ribbon / Path S-curve composition — complete baseline
- Elastic Tether / directional stretch-squeeze + overshoot/settle — complete baseline
- continuity-aware camera trajectory / eye-trace handoff — complete baseline
- section-level tension/release and shot-scale rhythm — planned
- serializable sequence directives — planned

See `docs/CINEMATIC_TYPOGRAPHY_DIRECTION.md`.

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
- Color Canvas Night / Paper / Color Field / Poster — complete baseline
- chapter-stable Color Canvas AUTO routing — complete baseline
- local runtime-before-Vite dev orchestration — complete baseline
- color/world acceptance remains required; cinematic sequence direction is the current higher-priority visual-engine track

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

## Cross-cutting v0.10 — Visual Director Workspace — complete baseline

- semantic effect cards with visual mini-previews — complete baseline
- task-based Scene / Type / Motion / World / Color / System navigation — complete baseline
- selected vs AUTO-resolved LIVE state — complete baseline
- shared docked/detached Director component — complete baseline
- browser second-window Director — complete baseline
- Electron native Director BrowserWindow — complete baseline
- BroadcastChannel live state/telemetry synchronization — complete baseline
- session cue-plan capture + live recall — complete baseline
- cue plan automatic playback execution — planned with serialized scene directives
- per-project/per-song plan persistence — planned with scene/project format
- playlist-to-song Director plan mapping — planned after playlist support

See `docs/VISUAL_DIRECTOR_WORKSPACE.md`.

## Cross-cutting v0.10.1 — Operator Output + Presentation — complete baseline

- screen-anchored background independent from lyric camera — complete baseline
- host/fullscreen/VisualViewport render-target reflow — complete baseline
- screen-FX overscan / no visible effect boundaries — complete baseline
- high-resolution Pixi text raster baseline for hero zooms — complete baseline
- explicit Spiral / Hero-Echo / Shape Fill / Manifesto Wall / Ribbon Path Director controls — complete baseline
- detached Director owns player transport while open — complete baseline
- clean-output player mode while Director is detached — complete baseline
- professional readable Director type scale — complete baseline
- English / German control-plane localization — complete baseline
- Lower Third screen-space presentation layer — complete baseline
- ten Lower Third looks + Auto rotation — complete baseline
- artist/title metadata overrides + optional portrait URL/upload — complete baseline
- project persistence for Lower Third config/assets — planned with scene/project directives
- playlist-per-song presentation plans — planned after playlist support

See `docs/OPERATOR_OUTPUT_LOWER_THIRDS.md`.

## Cross-cutting v0.11 — Shape Fill + Manifesto Wall + Edge Safety — complete baseline

- replace perimeter Shape Build semantics with packed interior Shape Fill — complete baseline
- Tree / Star / Human-Figure silhouette packers — complete baseline
- stable phrase-scope text-fit slots using real renderer font metrics — complete baseline
- legacy shape-build compatibility alias — complete baseline
- Manifesto Wall phrase-wide masonry subdivision — complete baseline
- rigid snap/slotted word arrival — complete baseline
- 90° bracket/column word slots — complete baseline
- variable anchor / connector block hierarchy — complete baseline
- Manifesto-aware camera following with bounded micro-motion — complete baseline
- 12% opaque background/liquid source bleed — complete baseline
- displacement/smear/post-FX physical-edge guards — complete baseline
- opaque final post-FX output — complete baseline
- DOM bloom/scanline/grain edge fade — complete baseline
- custom uploaded SVG/PNG silhouette masks — future
- dedicated guillotine/slice word fracture accent — future after Manifesto visual acceptance

See `docs/SHAPE_FILL_MANIFESTO_EDGE_SAFETY.md`.

## Milestone 0.9 — Editor
- scene browser
- effect inspector
- timeline
- preset save/load
- live performance HUD
- React may be used for the editor shell only; renderer stays framework-independent
