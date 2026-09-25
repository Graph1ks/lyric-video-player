# Shape Fill, Manifesto Wall and Edge Safety

**Status:** merged baseline — PR #48 + PR #51 + PR #53 / `89f2ac1680d13f6ec126ab3258ad4659507e2272`  
**Started:** 2026-09-25  
**Scope:** correct calligram semantics, progressive page typography, shared spatial metrics, and final output-edge safety.

## Terminology correction

The previous **Shape Build** implementation was an outline/path calligram: words occupied a frame or ring path.

That is not the target discussed in visual review.

The intended effect is a **packed silhouette / text-filled shape / calligram fill**:

- words occupy the **interior area** of a recognizable silhouette;
- the silhouette is perceived from the aggregate word mass;
- words use different available slot sizes and may rotate vertically where useful;
- old words remain load-bearing visual material while later words complete the silhouette.

This is closer to the common packed word-cloud / typographic silhouette model than to outline text-on-path.

## Shape Fill

New sequence grammar:

```text
shape-fill
```

Built-in silhouette families:

1. **Tree**
2. **Star**
3. **Human / Figure**

The silhouette rotates deterministically from phrase scope.

### Packing contract

v0.11.1 replaces anonymous phrase slots with a measured spatial solver.

For every phrase word, the renderer measures the exact active font/style and passes a renderer-independent metric record into engine-core:

- measured width and height;
- advance width;
- line height;
- font ascent/descent;
- stroke/readability padding.

The engine converts those metrics into rotated spatial boxes before placement.

Shape Fill then follows the same broad placement principles used by established JavaScript word-cloud engines:

- evaluate real word extents;
- maintain occupied space;
- search candidate locations inside the mask;
- reject collisions;
- reduce scale and retry when a word cannot fit.

Unlike a generic word cloud, lyric tokens are **never intentionally dropped**. The entire directed phrase is reserved up front, so already-visible words do not move merely because later lyrics reveal.

Tree / Star / Figure remain deterministic phrase-scope masks.

### Readability

Shape Fill is structural:

- readability pressure does not collapse its silhouette geometry;
- active words get only a small emphasis lift;
- history remains solid rather than degrading into outline-only material;
- renderer keeps a larger bounded phrase history.

## Manifesto Wall

Sequence grammar:

```text
manifesto-wall
```

The corrected target is **not a pre-existing masonry poster**.

Think of an initially blank book/editorial page. As the vocal progresses, the page writes itself one word at a time:

- most words are horizontal;
- a minority become ±90° editorial brackets/marginal columns;
- size varies moderately, with occasional anchor words;
- landed words remain in their reserved position;
- unrevealed future words already own invisible space, so the page does not reflow under the viewer.

### Progressive page composer

The complete directed phrase is measured and reserved before reveal.

The composer lays chronological words into an editorial shelf/page model. It scales the whole page down only as much as required to fit the full phrase, then keeps those positions immutable.

At runtime, the visible plan contains only words whose LRC time has arrived. The visual result therefore starts empty and progressively becomes a written page.

Manual Director selection extends Manifesto across deterministic 12-line page chapters so the writing can continue substantially longer than the ordinary four-line Director phrase. At the chapter boundary the engine turns to a fresh empty page. AUTO Manifesto remains phrase-scoped so automatic art direction can still transition into other grammars.

### Arrival grammar

The active word receives a short rigid snap/slotted entry:

- small deterministic x/y offset;
- very slight rotation offset;
- fast ease into its pre-reserved page position;
- no elastic bounce after landing.

### Camera behavior

The camera reads across the growing page rather than dragging the page around arbitrarily.

It combines:

- the active word focus;
- the spatial envelope of all currently revealed words;
- a fit-scale limit derived from that envelope.

Manifesto can use subtle perspective-like skew and rotation for an angled/3D page feeling, but micro-motion remains low and the revealed page remains recoverable in frame.

## Edge safety

The merged v0.10.1 pass separated the screen-anchored background from the moving lyric camera. Real-display acceptance still exposed visible effect boundaries near the physical output edge.

v0.11 adds a second safety layer.

### World bleed

Opaque background, flash and liquid surfaces extend approximately 12% beyond the logical viewport.

This gives background-local filters real source pixels outside the visible image.

### Shader edge guard

Spatial post effects reduce their deformation before the physical output boundary:

- displacement;
- velocity smear;
- barrel distortion;
- chromatic displacement;
- post-smear/glow intensity.

Sampling remains clamped, and final presentation shader output is forced opaque.

The goal is not to create a visible "safe frame". The transition is gradual and exists only to prevent the effect implementation boundary from becoming visible content.

### DOM screen-character guard

Bloom, scanline and grain overlays retain overscan but now also fade toward the physical edge.

Vignette remains a deliberate image treatment and sits over an opaque world.

### v0.11.2 acceptance correction

Real-display testing showed that source bleed and shader edge guards were necessary but not sufficient.

The remaining edge artifact came from the **full-frame filter boundary itself**. Pixi filter padding extends a Sprite's filter input outside its actual image with transparent texels. A displacement, smear or barrel/chroma tap can then sample that padded gutter; after RGB processing it appears as a black wave or glitch strip even though the world beneath the filter is opaque.

The corrected full-frame contract is therefore:

- displacement, velocity smear and cinematic post-FX use **zero filter padding**;
- their shader taps remain clamped and progressively edge-guarded;
- the render graph keeps one unfiltered copy of the current presented frame underneath the filtered Sprite, so any unexpected filter clipping reveals scene pixels rather than the canvas clear color;
- the fallback is a Sprite sharing the already-present RenderTexture, not a fourth full-size RenderTexture;
- Procedural Liquid writes alpha 1 because it is a background surface.

Long-play testing in the same acceptance pass also found a separate Pixi resource-lifetime bug. Dynamic lyric glyph/echo Text objects and Recursive Lyrics backdrop Text objects must be destroyed, not merely detached with `removeChildren()`. Recursive Lyrics backdrop textures are now created only while that preset is active and are reused while their text/style/viewport key is unchanged.

## Research framing

The spatial implementation intentionally learns from established browser word-cloud techniques without taking on a new runtime dependency.

**d3-cloud** measures/rasterizes words, represents their occupied pixels as sprite/bit masks, and searches candidate positions along a spiral until a collision-free placement is found.

**wordcloud2.js** similarly measures each word on its own canvas, records occupied grid cells, and searches nearest candidate points; it also implements shrink-to-fit behavior.

E-MO adapts the useful principles:

- measured word geometry;
- occupied-space collision checks;
- nearest-free candidate search;
- deterministic shrink/retry.

It changes the generic word-cloud contract in two important ways:

1. placement must be deterministic from lyric/project data;
2. a lyric word must never be silently discarded because packing failed.

Pixi's `CanvasTextMetrics` is used to match renderer font/style geometry. Native Canvas `TextMetrics.actualBoundingBox*` is also sampled where available so glyph ink that extends beyond nominal advance width is included in the collision envelope.

The current engine uses conservative rotated AABBs for fast runtime collision. It does not yet perform full per-glyph pixel-mask collision; that remains an optional future density optimization if visual acceptance shows it is necessary.

## Compatibility

`shape-build` remains accepted internally as a compatibility alias for the new filled-silhouette planner.

New UI and AUTO direction use `shape-fill`.

## Manual acceptance

The implementation baseline is merged and CI-verified. Verify on real tracks/displays:

- no black reveal at any edge during strong displacement/smear/transient hits;
- no visible rectangular scanline/grain/bloom boundary;
- Tree / Star / Figure read as filled silhouettes, not perimeter paths;
- existing words stay spatially stable while Shape Fill grows;
- Manifesto Wall starts empty and progressively writes a stable editorial page rather than appearing as a pre-built block;
- Manifesto stays mostly horizontal while occasional short words resolve as 90° editorial brackets;
- moderate size variation and occasional anchor words create hierarchy without destroying page flow;
- camera follows Manifesto reading focus while keeping the growing page envelope recoverable;
- Rapid/Burst lyrics remain readable while still snapping into place;
- manual Director selection and AUTO selection both expose the new grammars.
