# Visualizer World Reference Set — 13 Worlds

**Status:** active implementation set — WORLD_01–06 implemented; WORLD_03/04 motion corrected and WORLD_05/06 candidate active  
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
| 01 | Prism Stage Beams | `01_prism_stage_beams.png` | Central stage-light hub emitting thick volumetric rainbow/RGB shafts through haze; strong bloom and dark negative space. | shader beam density, haze/gobo complexity, fixture apertures | bass→beam width+bloom; energy→brightness; transient→flare surge | **Implemented — GPU shader v2** |
| 02 | Laser Canopy Grid | `02_laser_canopy_grid.png` | Thin crisp red/cyan/green lasers from overhead rig to floor hit-points; geometric canopy, black room, minimal haze. | analytic ray count, emitter count, floor/detail density | bass→canopy spread/floor glow; treble→shimmer; transient→burst brightness | **Implemented — GPU shader v2** |
| 03 | Disco Mirrorball Room | `03_disco_mirrorball_room.png` | Central mirrored disco ball inside an enclosed dark room with hundreds of colored square reflections on walls/floor/ceiling. | spherical facet density, reflection-grid density, room depth layers | music→lighting/specular only; rotation/geometry remain mechanical | **Implemented — GPU shader, motion-corrected** |
| 04 | Neon Energy Burst Tunnel | `04_neon_energy_burst_tunnel.png` | Explosive central neon warp tunnel with outward speed streaks and electric scribble lines in magenta/blue/gold. | radial streak density, tunnel ribs, electric filaments, ejecta | transient edge→one-way outward burst; audio never reverses flow | **Implemented — GPU shader, motion-corrected** |
| 05 | Fractal Hex Spiral Mosaic | `05_fractal_hex_spiral_mosaic.png` | Graphic cellular/hex tessellation recursively spiraling into multiple sinks; thick dark outlines and rainbow cells. | cell density, sink compression, inset-cell detail | mids/highs→color/light accent; geometry stays continuous | **Implemented — GPU shader candidate** |
| 06 | Soft Hex Cell Field | `06_soft_hex_cell_field.png` | Large pastel hex cells over black gaps, soft bevel/shading, foreground/background depth. | cell density, near/far layers, variable cell size, facet highlights | music→light/glint only; geometry never pulses | **Implemented — GPU shader candidate** |
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

The initial Graphics prototype was rejected as insufficiently cinematic. The current implementation is a full-screen custom Pixi GPU shader with analytic beam cones, procedural density/haze, spectral color, integrated apertures, anamorphic flare and filmic exposure compression.

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

The initial CPU Graphics line prototype was replaced by a full-screen analytic GPU shader. Segment-distance fields create the laser cores/glow, while the same pass renders rig apertures, floor impacts, perspective depth and restrained haze.


## WORLD_03 — Disco Mirrorball Room

### Visual identity

This world must read as an **enclosed mirrored-light room**, not a generic particle field with a sphere pasted on top.

Required:

- one dominant faceted mirrorball with visible tile structure;
- dark room depth with floor/ceiling/side-wall separation;
- hundreds of small square/rectangular colored reflections distributed through that room volume;
- reflections that feel projected and mobile rather than static confetti;
- cool metallic facet shading with selective magenta/cyan/gold/violet light pickup;
- bright but controlled specular glints on transient peaks;
- enough negative space that lyrics remain readable.

### Motion

- mirrorball rotation is slow and continuous;
- projected reflection fields drift with the ball rather than teleporting;
- mirrorball rotation is strictly motorized/time-driven at a constant rate;
- sphere radius and reflection-tile geometry do not react to raw audio;
- bass/energy/treble/transient are smoothed and affect lighting/specular response only;
- transients produce brief specular/halo lifts, not full-screen white flashes.

### Current implementation

`packages/renderer-pixi/src/effects/backgrounds/DiscoMirrorballRoomWorld.ts`

The candidate is a single full-screen custom GPU shader. It analytically shades a sphere, quantizes spherical coordinates into mirror facets, layers several perspective-biased square reflection fields across the room, and adds metallic Fresnel/specular response, a hanging cable, restrained dust and filmic exposure compression.

Three.js was explicitly evaluated for this world. The current reference does not require physically correct scene reflections or arbitrary camera movement, so the shader prototype is materially simpler and lower-risk. If local fidelity acceptance shows the room still reads too flat, WORLD_03 remains the first candidate for a true 3D renderer comparison.

## WORLD_04 — Neon Energy Burst Tunnel

### Visual identity

This world is a **high-velocity neon warp event**, not a circular spectrum or radial gradient.

Required:

- a deep bright central aperture;
- compressed perspective tunnel ribs;
- dense outward photographic speed streaks;
- broken electric/scribble filaments that are visibly less regular than the streak field;
- magenta / electric blue / cyan / gold light language;
- center bloom plus restrained anamorphic flare;
- high-detail operation that can become intentionally overwhelming at 200–300%.

### Motion

- baseline travel is permanently outward;
- a rising transient edge starts a positive burst envelope and outward shock front;
- burst energy may accelerate the already-outward flow, but can never reverse/retract it;
- energy thickens/brights the tunnel and streak field;
- treble increases fine streaks and electric filament complexity.

### Current implementation

`packages/renderer-pixi/src/effects/backgrounds/NeonEnergyBurstTunnelWorld.ts`

The implementation uses logarithmic radial depth, polar-coordinate tunnel ribs, dense stable angular streak cells, fBm/noise modulation, signed angular-distance electric filaments, broken arc sparks, central aperture bloom and filmic compression. Radial travel is now integrated monotonically on the CPU from authoritative playback time, and transient rising edges drive a decaying one-way burst/shock envelope so the tunnel surges outward instead of expanding/retracting.


## WORLD_05 — Fractal Hex Spiral Mosaic

### Visual identity

This is a **graphic recursive cellular spiral**, not a plain honeycomb texture.

Required:

- large rainbow polygon/hex cells with heavy black separation;
- multiple spiral sinks visible in one frame;
- cell density increasing toward sink centers so the field feels recursively subdivided;
- small inset hex details inside many cells;
- slight screen-print / extruded-poster shading rather than photoreal material;
- cyan / mint / yellow / pink / violet color travel.

### Motion

- spiral centers drift extremely slowly and continuously;
- cell geometry must never jump/pulse from raw audio;
- music affects color/light accents only;
- transient emphasis is local to high-density sink regions.

### Current implementation

`packages/renderer-pixi/src/effects/backgrounds/FractalHexSpiralMosaicWorld.ts`

The candidate is a custom GPU shader with reusable analytic hex-grid coordinates, three recursive vortex warps, sink-dependent local density, thick graphic outlines, inset center hexes, bevel/highlight bands and rainbow screen-print color logic.

## WORLD_06 — Soft Hex Cell Field

### Visual identity

This is a **soft layered macro cell field** with real black gaps, not a rigid technical grid.

Required:

- large pastel hex/polygon cells of visibly different sizes;
- black negative-space channels between cells;
- foreground and background cell layers;
- soft bevel shading and occasional white facet highlights;
- mint / lemon / peach / pink / lilac / sky palette;
- enough variation that the frame feels packed/organic rather than tiled wallpaper.

### Motion

- near and far layers drift at different slow rates;
- subtle domain warp prevents mechanical tiling;
- music changes illumination/highlight response only;
- no bass-driven scale breathing.

### Current implementation

`packages/renderer-pixi/src/effects/backgrounds/SoftHexCellFieldWorld.ts`

The candidate layers two analytic variable-size hex fields at different scales/depths, adds per-cell pastel variation, dark/muted cells, beveled edge shading, selective facet glints, slow parallax and true black gaps.

## Research notes

The implementation direction is cross-checked against GPU rendering practice rather than treated as a tracing exercise. WORLD_01/02 use continuous shader fields instead of primitive drawing; WORLD_03 uses spherical/facet coordinate quantization plus layered reflection fields; WORLD_04 uses polar/logarithmic depth and procedural noise; WORLD_05/06 use analytic hex-grid coordinates, procedural domain warping and layered shading. Motion/audio mapping follows `docs/WORLD_MOTION_AUDIO_REACTIVITY.md`.

No third-party image asset or code is bundled. The worlds are original procedural implementations using the existing PixiJS stack. Rendering-technology research and the current decision not to add Three.js prematurely are documented in `docs/WORLD_RENDERING_TECH_RESEARCH.md`.

## Integration status

WORLD_01–06 are registered as first-class `BackgroundPresetId` values:

- `prism-stage-beams`
- `laser-canopy-grid`
- `disco-mirrorball-room`
- `neon-energy-burst-tunnel`
- `fractal-hex-spiral-mosaic`
- `soft-hex-cell-field`

They are:

- selectable manually in Director → World;
- represented by dedicated Director miniatures;
- available to unrestricted AUTO routing;
- driven by the shared World Power / World Detail controls;
- rendered as specialized worlds that suppress generic legacy background layers.
