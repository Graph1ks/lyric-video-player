# MilkDrop / Butterchurn Integration

E-MO can use user-selected MilkDrop `.milk` libraries as an external background source. No preset pack or texture pack is bundled, downloaded, recommended, or required by the product.

## Runtime model

The feature is split across the existing platform boundaries:

1. **Desktop/server filesystem layer**
   - owns the absolute preset and optional texture roots;
   - recursively indexes supported files;
   - exposes only stable IDs, relative paths and metadata to the renderer;
   - streams only assets resolved inside the explicitly configured roots.
2. **Web application**
   - searches and virtualizes the library;
   - converts selected `.milk` files on demand;
   - keeps converted presets in a session cache;
   - resolves optional custom texture samplers against the selected texture root;
   - reports conversion/runtime/missing-texture diagnostics instead of hiding failed presets.
3. **Renderer**
   - runs Butterchurn against the existing Web Audio source;
   - renders it as a dedicated background source beneath the lyric camera;
   - supports 1x, 1.5x and 2x Butterchurn texture scale plus native output FXAA;
   - applies optional E-MO palette influence after Butterchurn rendering;
   - samples a 48x27 analysis buffer every sixth rendered frame for title-safe readability.

The static E-MO worlds remain the default renderer path. Selecting any native world switches the background source back to `emo`.

## Desktop folders

The Electron bridge exposes two read-only folder pickers:

- **MilkDrop preset folder** — recursively indexes `.milk` files;
- **MilkDrop texture folder** — recursively indexes browser-decodable PNG/JPEG/WebP images.

Absolute paths stay in the Electron/main-process server instance. They are never written into `emo.project/v1` or sent to the client API.

Server deployments can opt in with:

- `EMO_MILKDROP_PRESET_ROOT`
- `EMO_MILKDROP_TEXTURE_ROOT`

A library rescan is explicit. After indexing, source and texture lookups reuse the in-memory metadata cache rather than walking a large library for every preset selection.

## Preset compatibility states

The UI keeps every indexed preset visible and assigns runtime status as it is exercised:

- `unconverted`
- `converting`
- `ready`
- `missing-textures`
- `unsupported`
- `conversion-error`
- `runtime-error`

Unsupported/conversion failures do not remove the preset from search. Re-selecting it after a converter/runtime update retries conversion.

## Texture resolution

MilkDrop shader sampler references are extracted from the source before conversion. Built-in Butterchurn samplers are ignored. Custom references are matched case-insensitively against the selected texture library.

Missing or browser-undecodable textures are reported as degraded compatibility. The preset is still passed to Butterchurn so its own fallback behavior remains available.

The initial texture implementation intentionally supports PNG, JPEG and WebP. Formats that Chromium cannot decode directly are not exposed as custom Butterchurn images.

## Audio ownership

Butterchurn does not create a second audio clock or a second media source. `AudioEngine.visualizerSource()` exposes the existing Web Audio context and `MediaElementAudioSourceNode` as a read-only visualization tap.

The authoritative HTML audio clock, lyric timing and E-MO FFT/band analysis remain unchanged.

## Render order

The Pixi scene order is deliberately:

```text
Butterchurn background
or native E-MO background
        ↓
lyric camera
  ├─ persistent typography
  └─ kinetic lyrics
        ↓
existing scene compositor / post FX
```

Butterchurn therefore cannot become a foreground overlay over the lyrics.

## Readability

Native E-MO worlds report analytical `WorldColorContext` values. An arbitrary Butterchurn frame cannot know those metrics analytically, so the external background uses a small asynchronous rendering-side sample:

- representative RGB/hue;
- title-safe luminance;
- highlight pressure;
- chroma pressure;
- local edge/busyness estimate.

Those values feed the existing smoothed `WorldColorContext → WorldTypographyTreatment` path. Existing polarity hysteresis and support-outline levels remain authoritative, preventing frame-by-frame black/white text flicker.

## Color integration

`Palette Influence` is a post-Butterchurn grade:

- **0%** preserves the original preset color;
- higher values mix luminance-preserving E-MO accent roles into the frame;
- the source `VisualPalette` continues to come from the existing OKLCH color director.

Preset equations and shader color constants are not rewritten.

## Typography fonts

The Director exposes a curated self-hosted set of Google-font families across:

- sans;
- display;
- condensed;
- serif;
- mono;
- handwritten;
- graphic.

Fonts are bundled through Fontsource packages, so lyric rendering does not require a Google Fonts network request. The selected font is loaded through `document.fonts` before the Pixi typography styles are remeasured.

## Performance

The preset list uses TanStack Virtual so libraries with thousands of nested entries do not create thousands of mounted React rows.

Butterchurn render scale is independent from Pixi's output resolution:

- `1x` — baseline;
- `1.5x` — intermediate;
- `2x` — explicit high-quality option.

FXAA is controlled through Butterchurn's output-AA path. 2x rendering can be expensive at 4K and remains an explicit operator choice rather than a forced default.

## Distribution boundary

E-MO distributes support code only:

- Butterchurn runtime;
- MilkDrop preset converter;
- self-hosted open-font packages.

Preset libraries, texture libraries, songs and lyrics are user-provided external material and are not bundled or relicensed by E-MO.
