# 3D World Rendering Architecture

**Status:** accepted architecture note for E-MO world development  
**Last updated:** 2026-09-25  
**Primary scope:** WORLD_05 onward; WORLD_09 / WORLD_10 resume after legacy background rehabilitation

This document captures the reusable 3D findings behind the WORLD_05/06 rebuild and the rendering benchmark taken from `Graph1ks/website`. It exists so future world work does not rediscover the same distinction between **real spatial geometry** and a flat image that merely looks distorted.

## Core rule

When a reference depends on spatial depth, E-MO must own spatial depth.

A depth-dependent world must use at least one of:

1. explicit world-space geometry + perspective projection;
2. Pixi `Mesh` / custom vertex geometry;
3. raymarched / volumetric shader structure;
4. a true 3D renderer when the scene genuinely needs depth-buffered 3D.

A 2D texture/domain warp is not an acceptable substitute for:

- parallax;
- occlusion;
- perspective scale;
- object thickness;
- independently moving objects;
- camera movement through a scene;
- physically readable foreground/background relationships.

WORLD_05 v1 failed exactly because it violated this rule.

---

## What was learned from `Graph1ks/website`

The website repository was reviewed as an internal rendering benchmark. The important result is architectural: **its stronger backgrounds do not depend on Three.js to achieve convincing depth**.

### Circuit Grid

`src/lib/background/circuit-grid.ts` owns a real scene model:

- graph nodes exist in world coordinates;
- 3D mode derives a relief `z` value from the world position and time;
- rotation and tilt are applied before projection;
- camera distance determines perspective scale;
- projected screen coordinates are calculated from the transformed 3D point;
- geometry, runners and tiles therefore move in a coherent world rather than independently in screen space;
- a separate lower-resolution glow buffer supplies bloom without changing the source geometry.

The key lesson is not the exact projection formula. It is that **world coordinates are authoritative and screen coordinates are only the final projection**.

### Full-screen WebGL worlds

The website also contains full-screen custom WebGL effects. These demonstrate the complementary path:

- structural shader geometry for architecture and layered depth;
- procedural noise/fBm;
- implicit fields;
- raymarched smooth-union liquid bodies;
- normal reconstruction and specular lighting;
- filmic/tone-mapped output.

The liquid background in particular raymarches an implicit 3D field built from multiple smooth-union bodies. That is genuine volumetric/surface reasoning despite being rendered as one fullscreen pass.

### Resulting E-MO rule

Do not choose a renderer by label.

Choose the cheapest technique that produces the required spatial evidence:

- real projection when the scene is made of objects;
- mesh geometry when the scene is a surface;
- raymarching when the scene is an implicit volume/material;
- fullscreen analytic shaders when the target is fundamentally optical/field-based;
- a full 3D renderer only when those techniques stop being sufficient.

No source code from the website needs to be copied into E-MO. The reusable value is the rendering architecture.

---

## E-MO projected-3D object model

WORLD_05, WORLD_06 and WORLD_07 establish the first reusable projected-3D pattern in E-MO.

A projected object has four distinct layers.

### 1. World-space state

Each object owns spatial state before rendering:

- `position: { x, y, z }`;
- local geometry;
- optional rotation;
- size / scale;
- material or palette seed;
- deterministic motion seed.

The object is not authored in pixels.

### 2. Camera transform

The camera owns:

- position or orbit;
- target / look direction;
- right/up/forward basis;
- perspective focal length;
- optional yaw/pitch.

The object is transformed into camera/view space before screen projection.

### 3. Perspective projection

Projection converts world/view coordinates into screen coordinates:

- nearer geometry becomes larger;
- farther geometry becomes smaller;
- camera movement creates real parallax;
- z-depth remains available as a sort key.

For the current CPU-projected Graphics worlds, objects behind the camera are rejected before drawing.

### 4. Visibility / occlusion

Pixi `Graphics` does not provide a 3D depth buffer for these manually projected faces.

The current contract is therefore:

- compute one depth value per independent object/face group;
- sort far-to-near;
- draw side faces before top/front faces where appropriate;
- keep geometry convex/simple enough for painter-order rendering to remain visually correct.

This is suitable for independent prisms, particles and similar objects.

It is **not** the correct end state for arbitrary interpenetrating geometry.

---

## Real 3D evidence checklist

A world should not be called 3D merely because it uses perspective-looking colors or warping.

For depth-dependent references, acceptance should show several of these simultaneously:

- perspective scale changes;
- occlusion;
- visible side/back faces;
- camera parallax;
- z-dependent fog/exposure;
- foreground/background motion separation;
- independent object movement;
- coherent vanishing direction;
- relief or surface height;
- lighting that responds to surface orientation.

A paused frame should already communicate some depth. Motion should strengthen the depth rather than be the only thing creating it.

---

## Technique ladder

Use this order before introducing another renderer.

### A. Full-screen procedural shader

Best for:

- beams;
- haze;
- tunnels;
- plasma;
- bokeh;
- analytic lasers;
- implicit optical fields;
- effects with no meaningful object hierarchy.

Strengths:

- one pass;
- low display-object overhead;
- excellent continuous detail;
- easy integration with the existing compositor.

Weakness:

- not naturally suited to many independently moving physical objects.

### B. CPU-projected world geometry + Pixi Graphics

Best for:

- tens to hundreds of simple 3D primitives;
- prisms;
- tiles;
- simple particles;
- scenes where painter-order depth is sufficient;
- rapid prototyping of real spatial composition.

Current examples:

- WORLD_05 projected hex prisms;
- WORLD_06 projected packed hex-prism surface;
- WORLD_07 projected particle funnel.

Strengths:

- no new dependency;
- explicit camera/depth semantics;
- easy integration with current Pixi scene ownership;
- excellent for proving composition and motion grammar.

Weaknesses:

- CPU projection and per-frame Graphics command construction;
- painter sorting instead of a real depth buffer;
- weak fit for dense shared-vertex surfaces;
- not ideal for thousands of independently transformed objects.

### C. Pixi Mesh / Geometry + custom shader

Preferred next escalation for:

- terrain;
- perspective surfaces;
- ribbons;
- grids;
- dense connected geometry;
- shared vertices;
- displaced surfaces;
- GPU-side vertex motion.

This should be tested before Three.js for WORLD_09/10.

A mesh avoids rebuilding hundreds of Graphics paths when the world is fundamentally one connected surface.

### D. GPU particle / batched geometry path

Use when particle count becomes the dominant requirement.

The desired architecture is:

- stable particle seed/state buffer;
- GPU or batched vertex expansion;
- shader-driven size/color/material response;
- limited CPU work per frame.

WORLD_07 currently proves the spatial grammar with CPU-projected particles; it can migrate to a batched/GPU implementation if profiling shows the current object count is too expensive.

### E. Raymarched surface / volume

Best for:

- metaballs;
- fog volumes;
- liquid;
- soft implicit forms;
- volumetric light/material where explicit polygons are inconvenient.

Raymarching provides true surface normals and depth-like structure inside a fullscreen pass, but cost scales with samples/steps.

### F. Three.js / true second 3D renderer

Three.js remains a valid option, but it is an escalation, not the default.

Introduce it only when a world materially needs several of:

- a real depth buffer;
- arbitrary interpenetrating geometry;
- reusable mesh hierarchies;
- perspective-correct vertex interpolation;
- instancing at large object counts;
- normals/materials across real meshes;
- multiple dynamic lights;
- real scene cameras;
- shadows;
- reflective/refractive scene relationships;
- complex model transforms;
- geometry that would otherwise require reimplementing a substantial 3D engine layer.

Adding it also means owning:

- another renderer/context boundary;
- render-target integration;
- resize/resolution synchronization;
- GPU memory/resource lifecycle;
- compositor handoff;
- fullscreen/edge safety;
- Electron/web parity;
- another dependency surface.

Therefore the next rule is:

> If Pixi Mesh/Geometry can hit the visual target cleanly, stay in Pixi.  
> If the implementation starts recreating a general 3D engine, stop and compare Three.js.

---

## World Power / World Detail contract for 3D scenes

The controls must not collapse into two brightness sliders.

### World Power

Power should drive primarily:

- opacity/exposure;
- glow;
- material response;
- audio-reactive amplitude;
- optional bounded motion emphasis;
- transient strength.

### World Detail

Detail should change real structure:

- object count;
- vertex/subdivision count;
- number of depth layers;
- particle count;
- prism/facet density;
- terrain samples;
- floor/grid density;
- secondary reflection/detail passes.

At 200–300%, the scene should become structurally richer, not just brighter.

### Quality mode

Quality is separate from authored Detail.

Quality may reduce:

- maximum object count;
- mesh resolution;
- shader iterations;
- bloom resolution;
- far/secondary layers.

It must preserve the same visual identity.

---

## Motion + audio ownership

3D geometry follows `docs/WORLD_MOTION_AUDIO_REACTIVITY.md`.

The important spatial rule is:

**audio is not the camera or physics engine.**

Use absolute lyric/audio time for deterministic motion.

Allowed audio mappings include:

- material brightness;
- glow;
- surface displacement within a bounded envelope;
- particle apparent size;
- crest height;
- transient accents;
- positive speed boosts for one-way flow.

Avoid raw audio directly controlling:

- camera position;
- object rotation speed multiplied by absolute time;
- world-space topology;
- sign/direction of travel;
- whole-scene scale.

---

## Performance contract

The product target remains realtime 1080p60.

Do not invent a fixed object-count budget without measurement.

For new 3D worlds:

1. build the correct spatial grammar;
2. profile CPU frame time, renderer/GPU cost and memory;
3. identify whether CPU projection, path construction, fill rate or post-FX is dominant;
4. migrate only the expensive layer to Mesh/GPU/batching;
5. preserve visual identity in Performance quality.

Important likely pressure points:

- per-frame temporary arrays;
- per-face Graphics commands;
- depth sorting;
- high object counts;
- additive overdraw/glow;
- large RenderTextures at high DPR.

Prefer stable buffers/arrays and reusable geometry when a world becomes permanent.

---

## WORLD_09 — Neon Equalizer Grid City direction

Reference requirement: a 3D neon equalizer skyline over a reflective perspective grid.

Recommended first architecture:

**Pixi Mesh/Geometry or batched projected boxes**, not a flat equalizer shader.

Spatial model:

- x = frequency band;
- z = row/depth lane;
- y = audio-driven bar height;
- angled perspective camera;
- floor grid in the same camera space;
- optional mirrored/faded bar geometry below the floor plane for a reflection-like treatment;
- background bokeh/light rain as a separate non-geometric layer.

Detail should change:

- bar columns;
- depth rows;
- floor grid subdivisions;
- secondary skyline/bokeh density.

Escalate to Three.js only if real depth-buffered boxes, camera travel, reflection or lighting complexity materially outgrow Pixi Mesh.

---

## WORLD_10 — Holographic Audio Terrain direction

Reference requirement: neon waveform mountains over a perspective grid with vertical background streaks.

Recommended architecture:

**dynamic heightfield Mesh**.

Spatial model:

- x = frequency;
- z = historical/depth slice;
- y = smoothed amplitude;
- shared grid vertices;
- triangle surface plus wireframe/edge treatment;
- newest audio row enters near/front and history travels backward in z;
- camera remains coherent with the grid floor.

This is a stronger Pixi `Mesh` candidate than a Graphics candidate because neighboring terrain cells share vertices and update every frame.

Detail should change:

- x samples;
- historical z rows;
- wireframe subdivision;
- secondary contour layers;
- background streak density.

If the terrain needs true normals, multiple lights, depth-buffered geometry and complex camera movement beyond what a custom Pixi mesh cleanly supports, WORLD_10 becomes the strongest current Three.js comparison point.

---

## Continuation rule

WORLD_09/10 are intentionally deferred until the legacy world/background rehabilitation in `docs/WORLD_BACKGROUND_REHABILITATION_PLAN.md` establishes the shared motion/color/readability contracts.

For the thread that eventually resumes 3D expansion, read in this order:

1. `AGENTS.md`
2. `PROJECT.md`
3. `STATUS.md`
4. `docs/HANDOVER.md`
5. `docs/WORLD_BACKGROUND_REHABILITATION_PLAN.md`
6. `docs/3D_WORLD_RENDERING_ARCHITECTURE.md`
7. `docs/WORLD_RENDERING_TECH_RESEARCH.md`
8. `docs/WORLD_REFERENCE_SET_13.md`
9. `docs/WORLD_MOTION_AUDIO_REACTIVITY.md`

Do not restart the Pixi-vs-Three debate from zero, and do not skip the legacy rehabilitation milestone.

The accepted default is:

- Pixi remains the primary renderer;
- real spatial references require real spatial evidence;
- Pixi Mesh/Geometry is the next escalation for WORLD_09/10;
- Three.js is introduced only if that comparison demonstrates a material fidelity/complexity win.
