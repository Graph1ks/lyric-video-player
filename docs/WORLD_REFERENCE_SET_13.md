# Visualizer World Reference Set — 13 Worlds

**Status:** active implementation set — WORLD_01 + WORLD_02 merged in PR #59  
**Reference origin:** user-supplied visual references. The reference images are intentionally **not committed** to this public repository because their redistribution/license status is unknown. A local reference ZIP uses the filenames below.

The goal is not literal screenshot recreation. Each reference defines a **rendering identity, depth language, motion grammar, audio-reactive behavior and fidelity floor**.

## Global fidelity contract

Every world must:

- remain full-frame and edge-safe under fullscreen/post-FX;
- support **World Power 0–300%** and **World Detail 0–300%**;
- be deterministic from time/audio inputs rather than stateful random history;
- preserve lyric readability by keeping the strongest visual mass away from the central title-safe region where practical;
- expose a recognizable identity even in a paused frame;
- scale down in Performance quality without collapsing into a different look;
- avoid generic fallback particles/rings/beams when a specialized world is active.

Interpretation of controls:

- **World Power** = opacity, amplitude, glow, travel, audio-response intensity.
- **World Detail** = structural density: beam count, particles, subdivisions, line count, tiles, reflections or waveform samples.
- **0% Power** = visually absent except the safe base canvas.
- **100%** = authored normal.
- **200–300%** = deliberate showpiece / extreme territory.

## World catalog

| ID | World | Reference file | Identity / required visual language | Detail axis | Primary audio response | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 01 | Prism Stage Beams | `01_prism_stage_beams.png` | Central stage-light hub emitting thick volumetric rainbow/RGB shafts through haze; strong bloom and dark negative space. | major/ghost beam count, fixture count, haze layers | bass→beam width+bloom; energy→brightness; transient→flare surge | **Implemented** |
| 02 | Laser Canopy Grid | `02_laser_canopy_grid.png` | Thin crisp red/cyan/green lasers from overhead rig to floor hit-points; geometric canopy, black room, minimal haze. | emitters, rays/emitter, floor points, sparkle density | bass→canopy spread/floor glow; treble→shimmer; transient→burst brightness | **Implemented** |
| 03 | Disco Mirrorball Room | `03_disco_mirrorball_room.png` | Central mirrored disco ball inside an enclosed dark room with hundreds of colored square reflections on walls/floor/ceiling. | mirror facets, reflected tiles, room light spots | bass→room pulse; highs→sparkle/twinkle; transient→ball flare | Planned |
| 04 | Neon Energy Burst Tunnel | `04_neon_energy_burst_tunnel.png` | Explosive central neon warp tunnel with outward speed streaks and electric scribble lines in magenta/blue/gold. | streak count, electric filaments, trail layers | bass→rush/line thickness; highs→scribble detail; transient→burst spikes | Planned |
| 05 | Fractal Hex Spiral Mosaic | `05_fractal_hex_spiral_mosaic.png` | Graphic cellular/hex tessellation recursively spiraling into multiple sinks; thick dark outlines and rainbow cells. | cell subdivision, spiral depth, secondary sinks | bass→field pulse; mids/highs→color ripple; transient→spiral accent | Planned |
| 06 | Soft Hex Cell Field | `06_soft_hex_cell_field.png` | Large pastel hex cells over black gaps, soft bevel/shading, foreground/background depth. | cell count, depth layers, highlight facets | bass→breathing scale; highs→glints; transient→depth pop | Planned |
| 07 | Particle Spiral Vortex | `07_particle_spiral_vortex.png` | Glowing circular particles forming several spiral arms and a clear inward vortex center on black. | particle count, arm count, depth layers | bass→particle size/pull; highs→sparkle; transient→burst density | Planned |
| 08 | Minimal Rainbow Waveform | `08_minimal_rainbow_waveform.png` | Clean horizontal center waveform with mirrored vertical spikes, rainbow gradient and large negative space. | spectral columns, fine spike density | bass→core glow/amplitude; highs→detail; transient→needle peaks | Spec/starter |
| 09 | Neon Equalizer Grid City | `09_neon_equalizer_grid_city.png` | 3D neon equalizer skyline rising from reflective grid floor with bokeh/light-rain depth. | bars, floor cells, bokeh/background columns | bass→bar height/floor glow; highs→secondary detail; transient→peak jumps | Planned |
| 10 | Holographic Audio Terrain | `10_holographic_audio_terrain.png` | Neon topographic waveform mountains over a grid floor with vertical background streaks. | terrain samples/layers, grid density, streak count | bass→terrain height; highs→edge/streak detail; transient→crest flashes | Planned |
| 11 | Neon Wave Ribbon | `11_neon_wave_ribbon.png` | Elegant overlapping neon spline/sine ribbons over a gradient field with sparse sparkles. | ribbon count, line subdivisions, particles | bass→amplitude; highs→shimmer/sparkle; transient→crest accents | Planned |
| 12 | Oscilloscope Energy Line | `12_oscilloscope_energy_line.png` | Dense horizontal signal composed of many overlapping luminous waveform filaments; richer than WORLD_08. | filament count, persistence/trail layers, sampling | bass→macro amplitude; highs→filament complexity; transient→sharp spikes | Planned |
| 13 | Multicolor Bokeh Starfield | `13_multicolor_bokeh_starfield.png` | Dense soft-focus festive bokeh field with multicolor glowing orbs, sparkle stars and depth/parallax. | particle count, focus layers, sparkle stars | bass→scale/density pulse; highs→twinkle; transient→spark flashes | Planned |

## WORLD_01 — Prism Stage Beams

### Visual identity

This is a **volumetric stage-light world**, not generic radial rays.

Required:

- a visible central emitter/fixture cluster;
- 8–18 strong broad beams plus optional ghost beams;
- different RGB/rainbow beam colors rather than one palette tint;
- broad soft outer volume + hotter inner beam core;
- central white/hued bloom and flare;
- a near-black room with subtle atmospheric haze.

### Motion

- slow beam targeting drift rather than frantic rotation;
- beam width and haze breathe with song energy;
- transients produce short flare/hot-core surges;
- fixture lenses sparkle subtly with high-frequency content.

### Current implementation

`packages/renderer-pixi/src/effects/backgrounds/PrismStageBeamsWorld.ts`

The implementation uses reusable Pixi `Graphics` layers only; no per-frame object allocation or external dependency.

## WORLD_02 — Laser Canopy Grid

### Visual identity

This is a **laser architecture world**, intentionally distinct from WORLD_01.

Required:

- overhead rig/truss;
- thin sub-pixel/1px class laser cores;
- red/cyan/green/white line palette;
- geometric crossing canopy;
- bright floor hit-points;
- sparse floor constellation and very restrained haze.

### Motion

- gentle scanning/sweeping of target points;
- bass expands or contracts the canopy;
- treble increases sparkle/flicker;
- transient hits brighten beams and floor contacts without turning them into thick spotlights.

### Current implementation

`packages/renderer-pixi/src/effects/backgrounds/LaserCanopyGridWorld.ts`

The implementation uses separate crisp core/glow passes so the lasers remain visually sharp while still reading in a dark scene.

## Research notes for the first two builds

The implementation direction was cross-checked against real concert/light-show imagery: broad stage-light beams rely on atmospheric volume and a visible source region, while laser shows read through thin geometric lines, ceiling/rig origin and depth-defining intersections/hit points.

No third-party image asset or code is bundled. The worlds are original procedural implementations using the existing PixiJS stack.

## Integration status

WORLD_01 and WORLD_02 are registered as first-class `BackgroundPresetId` values:

- `prism-stage-beams`
- `laser-canopy-grid`

They are:

- selectable manually in Director → World;
- represented by dedicated Director miniatures;
- available to unrestricted AUTO routing;
- included in energetic curated presets;
- driven by the shared World Power / World Detail controls;
- rendered as specialized worlds that suppress generic legacy background layers.
