# Operator Output Safety + Lower Thirds

**Status:** active candidate  
**Started:** 2026-09-25  
**Scope:** edge-safe presentation, detached-Director operator ownership, readable bilingual controls, manual persistent sequences and screen-space artist/title graphics.

## Render correctness contract

### Background is not lyric camera content

The background/world layer is screen-anchored. CameraRig moves typography, not the complete rendered world.

```text
SCENE
├── BACKGROUND / WORLD        screen anchored
└── TYPOGRAPHY CAMERA
    ├── persistent sequences
    └── current-line lyrics
```

The complete scene is then captured by the RenderGraph.

This prevents lyric pan/rotation/zoom from pulling the world away from the viewport and exposing transparent render-target regions as black edges.

### Fullscreen resize is explicit

The renderer must react to all relevant viewport changes:

- host `ResizeObserver`;
- `window.resize`;
- `document.fullscreenchange`;
- `visualViewport.resize` where available.

On fullscreen transition the renderer resizes immediately and once again on the next animation frame because Chromium may settle fullscreen layout asynchronously.

Render targets, background, typography and camera viewport are rebuilt from the host element's actual bounding box.

### Screen FX must bleed past the output edge

DOM scanline/grain/vignette/bloom treatment uses overscan and the shell clips the result.

An effect boundary must never become visible as part of the image.

### Large typography needs raster headroom

Pixi Text is vector-authored but rendered through raster textures. Scaling a small generated texture several times can therefore expose pixelation even though the source is a font.

Primary/current and persistent lyric Text objects now request elevated internal texture resolution, with a minimum 3× raster scale and a 4× cap. Background recursive typography uses a smaller bounded quality budget.

A future MSDF/SDF text path remains possible if real-track visual acceptance shows that extreme zooms still exceed the raster baseline.

## Detached Director = operator console

When the detached Director is present, the player becomes a clean output monitor:

- player HUD is hidden;
- player HUD restore affordance is hidden;
- lyrics/world/lower thirds remain visible;
- the player still owns audio, timing and Pixi rendering.

The Director sends commands to the player over a dedicated same-origin BroadcastChannel.

Current Director transport:

- Play / Pause;
- seek bar;
- current time / duration;
- ±5 seconds;
- mute;
- volume;
- load audio;
- load Enhanced LRC;
- toggle player fullscreen.

The Director never creates a second AudioEngine or EngineRenderer.

## Persistent cinematic sequences are explicit controls

Persistent sequence scenes are no longer AUTO-only behavior.

Director choices:

- Auto Sequence;
- Classic Line;
- Spiral Depth;
- Hero / Echo;
- Shape Build;
- Ribbon Path.

Manual selection overrides sequence AUTO while preserving the existing pure timestamp-derived planners.

Keyboard `S` cycles this sequence axis.

## UI language

The control plane supports:

- English;
- German.

The language state is synchronized between main player and detached Director.

Creative product/effect names may remain shared English names where translating them would make the UI less recognizable; explanatory copy and operational controls are localized.

## Professional readability rule

Director UI should not rely on micro-fonts.

Baseline rule for the current pass:

- important card names: approximately 13–14 px;
- effect descriptions: approximately 11–12 px;
- section titles: approximately 17 px;
- navigation labels: approximately 11 px;
- tertiary metadata may be smaller, but should remain readable at ordinary desktop viewing distance.

The dock deliberately shows fewer/larger controls at once. Recognition and operational accuracy are more important than maximum button density.

## Lower Third system

Lower thirds are a separate screen-space presentation layer above the rendered lyric image.

They intentionally do not inherit:

- typography camera pan/zoom;
- displacement;
- velocity smear;
- CRT/barrel treatment;
- render-target raster scaling.

This keeps artist/title identity stable and crisp.

### Modes

- **Off** — disabled except manual preview.
- **Intro** — display during the opening eight seconds.
- **Rotate** — display for seven seconds in each 45-second presentation chapter.

### Presets

1. Clean Broadcast
2. Minimal Underline
3. Editorial Split
4. Bold Block
5. Glass Plate
6. Neon Tag
7. Corner Stack
8. Ribbon Slide
9. Poster Stamp
10. Cinematic Credit

`Auto Rotation` selects a different preset by presentation chapter.

### Content

Default content comes from current track / Enhanced LRC metadata.

The Director may override:

- artist;
- song title.

Optional artist image input:

- linked image URL;
- local image upload stored as the current session's Data URL.

Image upload is an operator convenience in this baseline. Project-asset persistence should later copy/reference an explicit project asset rather than serializing large Data URLs into the project manifest.

## Future persistence

Lower Third configuration and Director cue plans should eventually become serializable scene/project directives.

Playlist support should reference the same per-song plan contract rather than introducing a separate playlist-only effect schema.

## Manual acceptance

Before this baseline is considered visually accepted, verify:

- fullscreen enter/exit at 1080p and 4K has no bottom strip;
- strong camera pans/zooms never expose black behind the world;
- scanline/grain/vignette treatment has no visible rectangular boundary;
- hero/tunnel zoom typography remains acceptably crisp;
- detached Director removes all normal player controls;
- Director transport operates the main player;
- closing the Director restores the player HUD;
- Spiral/Hero/Shape/Ribbon can all be manually selected;
- EN/DE switch updates operator copy;
- all ten Lower Third presets remain inside safe area at desktop and narrow widths;
- linked/uploaded portrait behaves correctly;
- Lower Third output remains stable while lyric camera/post-FX move beneath it.
