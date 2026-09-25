# Shape Fill, Manifesto Wall and Edge Safety

**Status:** merged baseline — PR #48 / `40a5f29a078f1983285dea984ef468f98efa23ec`  
**Started:** 2026-09-25  
**Scope:** correct calligram semantics, architectural kinetic typography, and final output-edge safety.

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

The pure engine generates a fixed phrase-wide slot field from:

- silhouette family;
- phrase-scope word count;
- viewport dimensions.

The phrase's `scopeOrdinal` maps each lyric word to one stable slot.

This matters because slots must **not** move when later words become visible.

Each slot provides:

- center position;
- maximum width;
- maximum height;
- optional 90° orientation;
- deterministic priority.

Pixi measures the actual text texture and scales it to fit its allotted slot. Placement geometry therefore remains pure/deterministic while real font metrics are respected at render time.

### Readability

Shape Fill is structural:

- readability pressure does not collapse its silhouette geometry;
- active words get only a small emphasis lift;
- history remains solid rather than degrading into outline-only material;
- renderer keeps a larger bounded phrase history.

## Manifesto Wall

New sequence grammar:

```text
manifesto-wall
```

This is inspired by architectural kinetic typography such as the linked *V for Vendetta* kinetic-type treatment: words become physical compositional blocks rather than ordinary lines.

### Masonry model

The phrase owns one large rectangular wall region.

A deterministic recursive subdivision splits that wall into exactly the phrase's word count.

The resulting slots vary in size and aspect ratio:

- wide slots become headline / anchor blocks;
- small slots become connective words;
- tall narrow slots become ±90° bracket / column words.

Because subdivision uses full phrase scope, already-landed words never reflow merely because new words arrive.

### Arrival grammar

The active word uses a short rigid arrival:

- slide/drop from one of four deterministic directions;
- slight initial rotation;
- direct ease into final slot during roughly the first 18% of the cue;
- no elastic bounce;
- no continuous float after landing.

Once landed, the word becomes part of the wall.

This produces the desired typesetting / composing-tray / masonry feeling rather than a stream of individually animated floating words.

### Camera behavior

Manifesto Wall allows stronger focus following than Shape Fill because the camera should read across the constructed wall.

However:

- audio impulses remain heavily bounded;
- micro-motion is deliberately low;
- the block architecture remains primary.

Shape Fill stays wider and follows active slots only weakly so the silhouette is not destroyed by camera reframing.

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

## Research framing

Useful terminology found during the design pass:

- **packed word art / packed word cloud** — large words claim space and smaller words fill remaining interior gaps;
- **calligram / typographic silhouette** — text is used as material to create a recognizable image;
- **kinetic typography** — moving type synchronized to speech/music and meaning;
- the linked YouTube ID `Otv5ywOa-8U` is indexed as *V (V for Vendetta Kinetic Typography)* and is widely referenced as a kinetic-typography example.

The runtime implementation does not reproduce another artist's exact layout. It implements the general compositional grammar: rigid word-by-word arrival, scale hierarchy, rotated structural words, dense negative-space packing and camera-guided reading.

## Compatibility

`shape-build` remains accepted internally as a compatibility alias for the new filled-silhouette planner.

New UI and AUTO direction use `shape-fill`.

## Manual acceptance

The implementation baseline is merged and CI-verified. Verify on real tracks/displays:

- no black reveal at any edge during strong displacement/smear/transient hits;
- no visible rectangular scanline/grain/bloom boundary;
- Tree / Star / Figure read as filled silhouettes, not perimeter paths;
- existing words stay spatially stable while Shape Fill grows;
- Manifesto Wall feels rigid and architectural rather than bouncy;
- at least some Manifesto slots resolve as obvious 90° bracket words;
- large wall slots create visibly dominant anchor words;
- camera follows Manifesto reading focus without destroying the wall;
- Rapid/Burst lyrics remain readable while still snapping into place;
- manual Director selection and AUTO selection both expose the new grammars.
