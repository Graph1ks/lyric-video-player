# Art Direction Worlds

**Status:** Step 4 candidate baseline  
**Last updated:** 2026-09-25

## Purpose

E-MO backgrounds must be art-direction systems, not a collection of nearly identical particle fields.

A world owns the large visual grammar behind the lyrics: blocks, spatial structure, print texture, light ribbons or other scene-scale forms. Small particles, post-FX and lyric typography remain independent layers.

Every world must:

- consume semantic `VisualPalette` roles rather than own arbitrary scene colors;
- preserve a quiet/readable central lyric region unless the selected typography motion explicitly takes over the frame;
- use explicit audio/LRC time and deterministic seeded values;
- remain seek-reconstructable;
- have distinct geometry/composition rather than merely a different color or particle density;
- support Performance and Cinema budgets.

## Step 4 baseline worlds

### Editorial

**Visual grammar:** asymmetric plates, bars, crop/corner marks and graphic-design framing.

Palette roles:

- `surface`: large structural plates;
- `accentA`: primary edge block/marker;
- `accentB`: secondary rule/plate;
- `textPrimary` / `muted`: fine graphic marks.

Readability budget: major blocks stay at frame edges; the center remains negative space.

### Print

**Visual grammar:** moving halftone field, print bands and diagonal registration/texture lines.

Palette roles:

- `accentA/B`: halftone dots;
- `surface`: print bands;
- `textSecondary`: fine line texture.

Readability budget: the halftone generator explicitly skips a central quiet rectangle around the lyric attention field.

### Architecture

**Visual grammar:** nested frames, vanishing-point guides and side pillars.

Palette roles:

- `accentA/B`: spatial frame lines;
- `surface`: structural pillars.

Readability budget: structures frame the lyric field instead of crossing through its center.

### Aurora

**Visual grammar:** layered translucent top/bottom ribbons, horizon glow and sparse motes.

Palette roles:

- `accentA/B`: ribbon layers;
- `glow`: horizon line.

Readability budget: ribbons originate at the upper/lower frame edges and leave the central lyric band relatively quiet.

## Runtime integration

Implementation:

`packages/renderer-pixi/src/effects/backgrounds/ArtDirectionWorlds.ts`

`CinematicBackground` owns one `ArtDirectionWorlds` instance. When an art-direction preset is selected:

- generic blob, particle, ring and beam layers are suppressed;
- legacy geometry rendering is bypassed;
- the art world is drawn directly from current palette, time and audio bands;
- post-FX remain available after composition.

This suppression is important: otherwise the new worlds would still look like the same particle background with extra shapes.

## New background preset IDs

- `editorial`
- `print`
- `architecture`
- `aurora`

These are valid in UI selection, AUTO routing and `emo.project/v1`.

## AUTO routing

The baseline routing intentionally gives the newer worlds meaningful exposure:

- Poster favors Editorial / Print / Architecture.
- Neon favors Aurora / Architecture.
- Vortex favors Architecture / Print / Aurora alongside its existing tunnel worlds.

AUTO remains deterministic by scene family + cue index.

## Next world candidates

The next Step 4 additions should be selected for genuinely different composition, not quantity:

- volumetric light/fog;
- collage/cutout;
- 2.5D parallax planes;
- image/video treatment with explicit readability masks.

Before adding them, visually accept the first four worlds against real Enhanced LRC tracks.
