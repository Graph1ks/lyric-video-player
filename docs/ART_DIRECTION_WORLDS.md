# Art Direction Worlds

**Status:** rehabilitation candidate — draft PR #78  
**Last updated:** 2026-09-25

## Purpose

The Art Direction presets are now held to the same fidelity floor as the rehabilitated Nebula / Rays / Starfield / Grid / Cinematic / Liquid / Spectrum / Sparks / Lyrics / Minimal worlds.

The old shared `ArtDirectionWorlds.ts` Graphics implementation remains only as historical baseline code. It is no longer the active runtime owner for:

- `editorial`
- `print`
- `architecture`
- `aurora`

Each preset now owns a dedicated renderer and is routed through `CinematicBackground` as a specialized world.

## Non-negotiable contracts

Every Art Direction world must:

- have a recognizable paused-frame identity;
- consume semantic `VisualPalette` roles;
- keep continuous geometry, perspective, phase and camera/depth travel owned by playback time or deterministic line state;
- restrict smoothed audio to material, ink, emission or lighting response;
- preserve a deliberate lyric-safe composition rather than relying on generic blur or darkness;
- use World Power and World Detail to alter staging/material complexity, not merely opacity;
- preserve the same visual identity in Performance and Cinema;
- suppress unrelated generic blob / particle / ring / beam fallback layers.

## Editorial — `LegacyEditorialWorld`

**Rendering primitive:** fullscreen custom shader.

**Identity:**

- asymmetric edge plates;
- modular horizontal/vertical rule systems;
- registration cross;
- crop/corner marks;
- substrate/fibre detail in Cinema;
- deterministic layout variant by lyric-line index;
- protected central lyric field.

**Motion ownership:**

- plate drift and registration movement are time-owned;
- line-index changes can switch deterministic composition variants;
- audio only affects ink/material response.

**Palette roles:**

- `background`: substrate;
- `surface`: structural plates;
- `accentA/B`: primary/secondary graphic ink;
- `glow`: precision rules/crop emphasis;
- `muted`: secondary registration detail.

## Print — `LegacyPrintWorld`

**Rendering primitive:** fullscreen custom shader.

**Identity:**

- multiple rotated halftone screens;
- deterministic mechanical misregistration;
- print bands;
- registration furniture;
- diagonal process-line structure;
- substrate grain / wear;
- soft central readability attenuation rather than a hard cutout.

**Motion ownership:**

- screen offsets and registration drift are time-owned;
- audio cannot move dot coordinates or screen angle;
- smoothed audio only changes ink/material strength.

**Palette roles:**

- `background`: paper/substrate field;
- `surface`: print bands and substrate;
- `accentA/B`: separate ink screens;
- `glow`: fine registration/process lines;
- `muted`: tertiary ink screen.

## Architecture — `LegacyArchitectureWorld`

**Rendering primitive:** fullscreen perspective shader.

**Identity:**

- full perspective nave/corridor;
- time-owned depth travel;
- repeated projected structural frames;
- side pillars with near-field weight;
- pointed/arched crowns;
- floor and ceiling perspective structure;
- side recess/window parallax;
- central vanishing haze and controlled negative space.

This replaces the former flat nested-rectangle Graphics treatment.

**Motion ownership:**

- `worldZ` and camera travel derive only from playback time;
- perspective, corridor width and depth spacing never depend on audio;
- audio only changes lighting/material response.

**Palette roles:**

- `background`: room field;
- `surface`: pillars / structural masses / haze;
- `accentA/B`: frame and arch light;
- `glow`: vanishing-point and dust highlights;
- `muted`: floor/lane structure.

## Aurora — `LegacyAuroraWorld`

**Rendering primitive:** fullscreen procedural curtain shader.

**Identity:**

- multiple continuous FBM-warped curtain layers;
- folded/striated density;
- local density-gradient lighting;
- subtle horizon structure;
- sparse scale/depth stars;
- same curtain composition in Performance and Cinema with reduced detail budget.

This replaces the former top/bottom Graphics ribbon polygons.

**Motion ownership:**

- curtain phase, warp and fold travel are time-owned;
- audio does not alter curtain coordinates or topology;
- smoothed energy/mid/treble only alter emission and highlights.

**Palette roles:**

- `background`: night field;
- `surface` / `muted`: haze;
- `accentA/B`: curtain body;
- `glow`: folded highlights and stars.

## Runtime integration

Active renderers:

- `packages/renderer-pixi/src/effects/backgrounds/LegacyEditorialWorld.ts`
- `packages/renderer-pixi/src/effects/backgrounds/LegacyPrintWorld.ts`
- `packages/renderer-pixi/src/effects/backgrounds/LegacyArchitectureWorld.ts`
- `packages/renderer-pixi/src/effects/backgrounds/LegacyAuroraWorld.ts`

`CinematicBackground` owns all four dedicated renderers and includes all four preset IDs in `SPECIALIZED_WORLD_PRESETS`.

When one is active:

- its dedicated container is visible;
- generic particles, blobs, rings and beams are suppressed;
- the old shared `ArtDirectionWorlds` renderer is not instantiated or updated by `CinematicBackground`;
- semantic palette, World Power, World Detail and Quality are forwarded directly to the dedicated world;
- post-FX remain available after scene composition.

## Regression contract

`tests/world-background-rehabilitation.test.mjs` locks:

- no active `ArtDirectionWorlds` routing;
- dedicated visibility/update/palette/detail wiring for all four IDs;
- shader-first identity for Editorial / Print / Architecture / Aurora;
- no raw/smoothed audio inside the geometry-defining sections;
- perspective depth for Architecture;
- continuous curtain field for Aurora;
- no regression of Print into Graphics dot loops.

Real-display acceptance remains separate from CI. The automated contract prevents architectural backsliding; it does not certify aesthetics.

## Next milestone

After these four worlds merge, all 15 legacy preset IDs have dedicated rehabilitated identities. The remaining pre-WORLD_09/10 architecture work is:

1. expose/aggregate per-world `WorldColorContext`;
2. resolve background-aware typography treatment from actual world context;
3. apply temporal smoothing and polarity hysteresis;
4. verify 7:1 / 4.5:1 / 3:1 contrast floors across representative worlds, World Power 0–300%, Performance/Cinema and viewport classes;
5. run the full real-display visual acceptance matrix;
6. only then resume WORLD_09/10.
