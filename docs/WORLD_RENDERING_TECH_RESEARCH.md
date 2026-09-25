# World Rendering Technology Research

**Status:** accepted direction for the 13-world expansion  
**Decision:** keep PixiJS as the primary renderer for full-screen procedural worlds; do **not** add Three.js merely to fix WORLD_01/WORLD_02 fidelity.

## Why the first WORLD_01 / WORLD_02 pass looked primitive

The limitation was the implementation, not PixiJS.

The first pass used high-level `Graphics` polygons, circles and line strokes. That is useful for composition prototypes, but it cannot by itself reproduce the continuous density, scattering, optical falloff, haze, bloom and fine geometric precision visible in the references.

The rewrite therefore moves both worlds into custom GPU fragment shaders.

## What PixiJS v8 already gives us

PixiJS v8 `Filter` supports custom GPU programs and ordered post-processing. The official docs explicitly describe custom GLSL filters for blur, noise, displacement and arbitrary shader effects.

PixiJS v8 `Mesh` exposes geometry, UVs, indices, shaders and GPU state. Its own documentation describes it as sufficient for arbitrary WebGL/WebGPU visuals, including advanced distortion and perspective work.

Primary references:

- https://pixijs.download/v8.17.0/docs/filters.html
- https://pixijs.com/8.x/guides/components/scene-objects/mesh
- https://pixijs.com/8.x/examples/filters-advanced/custom
- https://pixijs.com/examples/mesh-and-shaders/shared-shader/

This means E-MO can implement:

- full-screen signed-distance-field worlds;
- procedural noise/fBm;
- volumetric-looking light shafts;
- analytic laser lines;
- custom bloom/threshold passes;
- feedback;
- chromatic treatment;
- perspective meshes;
- GPU particle/vertex systems;

without replacing the renderer.

## Volumetric-light research

The key visual lesson from real-time volumetric-light techniques is that convincing shafts need more than translucent triangles:

- spatially continuous scattering;
- smooth distance decay;
- density variation;
- bright emissive source regions;
- additive accumulation;
- controlled exposure/tone mapping;
- optionally radial or screen-space sampling when scene occlusion is available.

NVIDIA GPU Gems 3, Chapter 13 describes real-time volumetric light scattering as a pixel/post-process problem and uses additive sampling with exposure, weight and decay controls.

Reference:

- https://developer.nvidia.com/gpugems/gpugems3/part-ii-light-and-shadows/chapter-13-volumetric-light-scattering-post-process

WORLD_01 does not currently have an occlusion/depth pre-pass, so its v2 shader uses analytic cone fields, procedural density variation, source bloom and filmic compression. If later worlds introduce real geometry/depth, an occlusion-aware scattering pass can be added.

## Three.js evaluation

Three.js is technically suitable and MIT licensed.

It provides:

- true perspective cameras and 3D scene graphs;
- `ShaderMaterial` for custom GPU materials;
- `EffectComposer` for chained post-processing;
- `UnrealBloomPass` with a multiscale mip-chain bloom implementation.

References:

- https://threejs.org/docs/pages/ShaderMaterial.html
- https://threejs.org/docs/pages/EffectComposer.html
- https://threejs.org/docs/pages/UnrealBloomPass.html
- https://threejs.org/license/

### Why not add it now

Adding Three.js beside Pixi would create a second renderer with its own:

- WebGL context / render-target ownership;
- resize/resolution lifecycle;
- memory/resource lifecycle;
- post-processing chain;
- edge-safety rules;
- synchronization and compositing boundary.

That complexity is not justified for full-screen shader worlds that Pixi already handles directly.

### When Three.js becomes justified

Re-evaluate Three.js when a world genuinely benefits from true 3D geometry/depth rather than a full-screen shader or Pixi mesh.

Likely candidates after current prototyping:

- WORLD_03 Disco Mirrorball Room — **evaluated now**. The first candidate uses an analytic Pixi GPU shader because the supplied reference can be reproduced without arbitrary camera/depth interaction. Escalate to true 3D only if local acceptance still reads too flat.
- WORLD_09 Neon Equalizer Grid City — real perspective skyline can benefit;
- WORLD_10 Holographic Audio Terrain — true displaced terrain mesh is a strong candidate.

Before adding Three.js, prototype those with Pixi `Mesh`/custom shaders and compare:

1. fidelity;
2. GPU cost;
3. implementation complexity;
4. memory overhead;
5. renderer/compositor integration risk.

## Website renderer benchmark

The user's `Graph1ks/website` background stack was used as an internal quality benchmark after WORLD_05/06 failed visual acceptance.

Relevant implementation patterns from that repository:

- the Circuit Grid owns a real world graph, per-node relief, a 3D camera projection and perspective scaling;
- fullscreen WebGL effects use custom shaders for structure, depth and raymarched/volumetric material rather than simply distorting a flat image;
- visual motion is autonomous and continuous, with effects controlling geometry/material intentionally.

The resulting E-MO rule is stricter: a reference that visually depends on depth must use one of **projected 3D geometry, raymarched volume/surface, or a true 3D renderer**. A 2D domain warp is not an acceptable substitute.

## Motion/audio-reactivity finding

The visual renderer is not the only fidelity boundary: **motion semantics matter as much as shading**.

WORLD_03/04 local acceptance exposed two failure modes:

- direct audio in mirrorball radius/angular velocity makes a mechanically continuous object stutter;
- multiplying absolute time by raw audio in tunnel phase terms creates discontinuous phase jumps that can look like direction reversal.

The durable contract is now `docs/WORLD_MOTION_AUDIO_REACTIVITY.md`: mechanical motion stays time-driven, one-way flows keep monotonic phase, and true bursts use positive event envelopes rather than inhale/exhale oscillation.

## Current implementation direction

### WORLD_01 Prism Stage Beams v2

Replaced `Graphics` beam polygons and white fixture circles with one full-screen GPU shader.

The shader now owns:

- analytic volumetric cone fields;
- soft/hot beam cores;
- procedural haze and gobo-like density modulation;
- rainbow spectral coloring;
- source bloom;
- anamorphic horizontal flare;
- vertical flare;
- dark truss silhouette;
- narrow fixture apertures;
- filmic exposure compression.

### WORLD_02 Laser Canopy Grid v2

Replaced CPU line/point drawing with one analytic GPU shader.

The shader now owns:

- signed-distance segment lasers;
- thin white-hot cores;
- colored glow envelopes;
- overhead rig;
- narrow fixture apertures;
- animated canopy targets;
- floor impact halos/hotspots;
- subtle perspective floor;
- suspended haze specks;
- filmic exposure compression.

### WORLD_03 Disco Mirrorball Room candidate

Technique: **full-screen analytic sphere + procedural room reflection shader**.

Why this before Three.js:

- the visual target is dominated by one sphere and projected reflection fields rather than free camera motion;
- spherical normals/facets can be reconstructed analytically per pixel;
- layered screen/perspective reflection grids can create the required hundreds of room light patches without per-object allocation;
- this preserves one renderer, one render-target lifecycle and the existing edge-safety compositor.

The shader implements spherical-coordinate facet quantization, metallic/Fresnel response, multiple moving color-reflection layers, room depth masks, specular glints and filmic compression.

Escalation criterion: if real-display acceptance requires physically coherent wall projection, moving camera parallax or actual mirror reflection geometry, prototype the same scene in Three.js and compare fidelity/GPU/memory before merging a second renderer.

### WORLD_04 Neon Energy Burst Tunnel — motion-corrected

Technique: **full-screen polar/log-depth procedural shader**.

The shader combines:

- logarithmic radial depth for compressed tunnel ribs;
- polar angular cells for dense stable speed streaks;
- fBm/noise modulation for irregular density;
- signed angular-distance electric filaments;
- broken arc sparks/ejecta;
- central aperture bloom and flare;
- power/detail scaling without per-streak display objects.

The original candidate incorrectly multiplied absolute time by raw bass in several phase terms. That caused phase jumps and visible expand/retract motion. The corrected implementation integrates a monotonically increasing travel phase and uses transient rising edges to start a positive one-way burst/shock envelope.

This is a direct fit for a Pixi custom Filter; a 3D scene graph adds no useful capability for the supplied target.

### WORLD_05 Fractal Hex Spiral Mosaic — rebuilt after rejection

Rejected technique: **flat fullscreen hex-grid + domain warp**.

Accepted candidate technique: **projected 3D moving hex-prism vortex**.

The current renderer now owns:

- deterministic world-space prism instances;
- three independent spiral sinks;
- real z-depth per tile;
- perspective scale and parallax;
- back-to-front depth sorting;
- visible extruded side faces;
- independent autonomous tile travel into the sinks;
- slow camera orbit;
- inset cap geometry and graphic rainbow treatment.

Audio does not drive prism geometry. It is smoothed and affects lighting/specular accents only.

### WORLD_06 Soft Hex Cell Field — rebuilt after rejection

Rejected technique: **layered screen-space analytic hex masks**.

Accepted candidate technique: **packed axial 3D hex-prism surface**.

The current renderer now owns:

- mathematically correct pointy-top axial hex placement;
- narrow controlled footprint variance so gaps remain small;
- autonomous per-cell relief;
- explicit look-at camera and perspective projection;
- depth sorting and six visible prism side faces;
- pastel/muted material palette;
- bevel rings and selective facet highlights;
- slow camera/field motion independent from music.

Audio changes illumination/highlights only; it never changes the grid topology or spacing.

## Rule for the remaining 7 worlds

Do not prototype a reference-grade world using only primitive `Graphics` shapes unless the reference itself is graphic/flat.

Choose the rendering technique from the target:

- **full-screen procedural shader** — light, plasma, waveforms, bokeh, fractals;
- **Pixi Mesh + shader** — terrain, perspective surfaces, ribbons, displaced geometry;
- **GPU particles / batched mesh** — dense particle vortices/starfields;
- **multi-pass render texture/post-FX** — bloom, feedback, light scattering;
- **Three.js candidate** — true scene-depth/reflective 3D worlds only when measurable benefit justifies the second renderer.
