# Typography Spatial System

**Status:** active candidate — PR #51  
**Started:** 2026-09-25  
**Scope:** shared text measurement, spatial bounds, collision ownership and stable phrase geometry for every kinetic typography family.

## Why this layer exists

A font size is not a spatial measurement.

Two words rendered at the same `fontSize` can have very different:

- advance width;
- ink width;
- ascent/descent;
- line height;
- stroke footprint;
- rotated screen footprint.

Treating a word as only `{ x, y, fontSize }` causes exactly the failures seen during visual acceptance:

- long words overlap in Spiral/Vortex layouts;
- Shape Fill slots look correct mathematically but rendered words stack over each other;
- vertical words consume much more screen height than a horizontal-width-only solver expects;
- animated type can grow outside a collision-safe resting layout.

The spatial system makes measured geometry a first-class input **before** visual placement.

## Research basis

E-MO does not add a generic word-cloud dependency. It adapts established browser-layout principles while keeping the engine deterministic and seek-safe.

### d3-cloud

Repository: https://github.com/jasondavies/d3-cloud

Relevant ideas:

- measure/rasterize words before placement;
- maintain occupied space;
- search candidate positions along a deterministic geometric path;
- reject positions that collide with already occupied words.

Generic clouds are allowed to omit words that never find a fit. E-MO is not: lyric text is semantic source content and must not silently disappear.

### wordcloud2.js

Repository: https://github.com/timdream/wordcloud2.js

Relevant ideas:

- draw/measure a word independently;
- derive occupied cells from the rendered word;
- test nearest candidate positions;
- support rotation and shrink-to-fit behavior.

E-MO uses the same broad model — measurement + occupancy + candidate search + shrink/retry — but owns its own implementation and data model.

### Canvas / Pixi measurement

The renderer measures the exact active Pixi `TextStyle` with `CanvasTextMetrics`.

It supplements that block measurement with native Canvas `TextMetrics.actualBoundingBox*` values when available.

This distinction matters because glyph ink can extend beyond simple advance width or nominal font-size boxes.

No third-party word-cloud runtime is bundled.

## Data contract

Renderer-independent engine-core geometry:

```ts
interface TypographySpatialMetrics {
  width: number;
  height: number;
  advanceWidth: number;
  lineHeight: number;
  ascent: number;
  descent: number;
  padding: number;
}
```

A placement becomes a screen-space box through:

```text
measured local geometry
        +
scale / rotation / position
        ↓
rotated spatial footprint
        ↓
conservative AABB
        ↓
collision / safe-frame / envelope logic
```

The current implementation deliberately uses conservative rotated AABBs rather than per-pixel alpha masks. This is faster and guarantees separation, at the cost of leaving some additional whitespace around strongly rotated/concave glyph shapes.

Pixel-mask collision is a future density optimization, not the baseline correctness mechanism.

## Measurement ownership

### Renderer

`packages/renderer-pixi/src/effects/typography/TypographyMetrics.ts`

Owns:

- Pixi-style measurement;
- native Canvas ink-bounds sampling;
- stroke/readability padding;
- measurement cache.

The renderer knows the real font implementation and therefore owns measurement.

### Engine core

`packages/engine-core/src/typographySpatial.ts`

Owns:

- portable metric records;
- rotated box calculation;
- overlap tests;
- fit scale;
- spatial envelopes;
- safe-rectangle clamping.

Engine core never imports Pixi or DOM APIs.

## Temporal stability

Persistent sequences expose two related word sets.

### `scopeWords`

Every word in the directed phrase, including words whose lyric time has not arrived.

Used to reserve stable geometry.

### `words`

Only the time-derived active/recent/history/incoming window.

Used to decide what is currently rendered.

This allows a phrase to reserve its entire layout once while still starting visually empty.

A word that becomes visible later therefore does **not** force earlier words to move.

## Static phrase geometry

Shape Fill and Manifesto layouts are expensive compared with ordinary transforms.

Their full-phrase geometry is cached by:

- grammar;
- phrase bounds;
- viewport;
- base font size;
- phrase word count.

Per-frame work remains:

- time-derived reveal roles;
- active emphasis;
- alpha;
- camera focus/envelope.

Packing is not recomputed 60 times per second.

## Shape Fill

Shape Fill solves all phrase words against a real silhouette.

Current masks:

- Tree;
- Star;
- Human/Figure.

Algorithm:

1. measure every phrase word;
2. generate candidate points inside the silhouette;
3. assign deterministic size/orientation intent;
4. place larger/high-priority words first;
5. reject candidates whose rotated spatial box:
   - leaves the mask;
   - collides with occupied words;
6. retry at progressively smaller scales;
7. perform an emergency deterministic shrink search if necessary.

A lyric word is never intentionally dropped.

Active-state emphasis does not enlarge a solved Shape Fill word beyond its reserved geometry. Shape readability is structural; focus should come from palette/camera/alpha rather than breaking packing.

## Manifesto Wall

The corrected Manifesto model is a **progressively written editorial page**, not a pre-built masonry poster.

The complete phrase reserves one page before playback reveal.

The page composer:

- follows chronological lyric order;
- fills shelf/line space left-to-right;
- uses mostly horizontal type;
- creates occasional ±90° editorial bracket words;
- applies moderate deterministic scale variation;
- scales the complete page only when required to fit all phrase words.

At time zero the page can be visually empty. Words appear one by one in their pre-reserved locations and remain there.

When Manifesto is selected explicitly in the Director, the renderer uses a longer **12-line page chapter** instead of the generic Director phrase boundary (which is normally at most four lines). Crossing that deterministic page boundary turns to a fresh page. AUTO-authored Manifesto remains phrase-scoped so the automatic Director can still change visual grammar.

Arrival is a short rigid snap from slightly smaller than final scale. It never grows beyond its collision-solved final box.

## Spiral Depth

Spiral placement no longer advances by rank alone.

Each word contributes its measured projected extent to the next depth interval.

The solver also checks actual screen-space boxes. If an older word collides with a newer one, it is moved farther around/deeper into the spiral. Dense tails progressively shrink instead of overlapping.

## Ribbon Path

Ribbon words retain one continuous S-curve.

Each candidate is checked against the measured boxes already seated on that curve.

Older words move farther down the same path until they clear newer content. The geometric grammar remains continuous; collision avoidance does not invent off-path escape positions.

## Ordinary line composition / Vortex

`KineticLyrics` now measures complete word width and height and sends both into the composition engine.

The composition collision solver therefore no longer assumes that every word has the same `fontSize`-derived height.

A small preset-specific **motion envelope** inflates the measured footprint before layout for effects that can expand or travel locally:

- Tunnel;
- Elastic;
- Wave;
- Glitch;
- Scatter;
- generic Impact/Cascade baseline.

Vortex receives a small additional spatial safety factor.

The rendered word is not artificially enlarged by this safety factor; it is only reserved more space.

## Camera framing

Persistent typography exposes:

- active focus point;
- envelope center of revealed text;
- fit scale for the revealed envelope.

Manifesto camera planning blends active-word focus with the page envelope and caps close-up zoom against the currently revealed content.

Subtle skew/rotation can create an angled page/3D-camera impression without allowing the growing text page to disappear from context.

## Non-negotiable rules

1. Font size is never a substitute for measured geometry.
2. Layout code must not query Pixi directly; renderer measurement is converted into engine-core data.
3. Persistent future words may reserve geometry before reveal.
4. Seek/replay at the same timestamp must reconstruct the same placement.
5. No lyric token may be silently dropped because a packer is full.
6. Structural grammars must not apply active-scale pulses that invalidate collision solving.
7. New curve/shape typography families must use the shared spatial layer rather than implement private width guesses.
8. Audio motion is subordinate to readability and collision safety.
