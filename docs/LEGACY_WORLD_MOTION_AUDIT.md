# Legacy World Motion Audit — Phase A

**Status:** active implementation audit  
**Last updated:** 2026-09-25  
**Scope:** pre-reference-set Background presets only

This audit is the implementation companion to `WORLD_BACKGROUND_REHABILITATION_PLAN.md`. It classifies the existing motion grammar before fidelity rebuilds so audio ownership is explicit instead of repaired with ad-hoc smoothing.

| Preset | Current renderer | Motion class | Confirmed legacy issue | Rehabilitation action |
| --- | --- | --- | --- | --- |
| `cinematic` | shared CinematicBackground layers | mechanical / continuous | shared blob/ring/particle scale and push paths | isolate filmic depth field; keep audio on light/material response |
| `nebula` | dedicated `LegacyNebulaWorld` | mechanical / continuous | blob scale and shared particle response made cloud mass pump | fullscreen procedural gas volume: domain-warped FBM density, ridged filaments, cavities, folded-volume lighting; audio affects emission only |
| `grid` | dedicated `LegacyGridWorld` | one-way flow / mechanical | generic particles diluted perspective identity | fullscreen infinite-perspective environment: floor/ceiling grid, horizon atmosphere, procedural side architecture and deterministic energy traffic |
| `starfield` | dedicated `LegacyStarfieldWorld` | one-way flow | global transient push/scale plus full-frame post FX could read as breathing/reversal | fixed optical axis, deterministic world-space stars, strictly decreasing z travel between wraps and analytic earlier-time streaks; audio only brightness |
| `rays` | dedicated `LegacyRaysWorld` | mechanical / burst accents | transient expansion and audio-scaled beam geometry | fullscreen participating-media field with broad soft cones, haze/noise occlusion, source bloom and light-only transient response |
| `vortex` | dedicated `LegacyVortexWorld` | one-way flow | raw energy previously changed shared-particle radius ("breathing") | projected helical ribbons + one-way tracers; audio affects light only |
| `liquid` | ProceduralLiquidFX | mechanical / continuous deformation | absolute-time speed multiplied by energy; field frequency changed with bass | fixed phase rate; audio only bounded material/warp/highlight response |
| `spectrum` | shared spectrum Graphics | rhythmic deformation | extra whole-band amplitude multiplies the already musical spectrum | keep spectrum authoritative; smooth envelope only for staging/light |
| `sparks` | shared spark Graphics | burst / impact event | transient continuously scaled all spark length/alpha | event envelope controls emission/accent; trajectory/lifetime stay autonomous |
| `lyrics` | recursive Text layer | mechanical / continuous | bass directly scales recursive text depth | time-owned composition; audio limited to light/emphasis |
| `minimal` | reduced shared layers | mechanical / continuous | identity is mostly "less of the generic stack" | dedicated sparse composition with fixed spacing grammar |
| `editorial` | dedicated `LegacyEditorialWorld` | mechanical / continuous | legacy Graphics geometry coupled identity to shared renderer | fullscreen modular editorial shader; layout/time own geometry, audio only ink/material response |
| `print` | dedicated `LegacyPrintWorld` | mechanical / material | direct band-driven dot sizing in old Graphics field | layered rotated halftone shader with time-owned misregistration; audio only ink/material response |
| `architecture` | dedicated `LegacyArchitectureWorld` | one-way depth / mechanical | old flat nested frames lacked real spatial depth | perspective corridor with time-owned `worldZ`, repeated structural frames, pillars, arches and recess parallax |
| `aurora` | dedicated `LegacyAuroraWorld` | mechanical / continuous field | old Graphics ribbons mixed audio into ribbon amplitude/width | procedural FBM curtain field with folded-volume lighting; audio only emission/highlight response |

## Shared correction landed in this phase

- `WorldAudioReactivity` provides attack/release-smoothed bands, a rising-edge transient event, a positive decay envelope, long-energy envelope, authoritative dt, and seek/discontinuity reset.
- Shared legacy layers consume this adapter; WORLD_01–08 continue to receive their own raw analyser input because they already own dedicated motion semantics.
- Whole-field raw transient particle push/scale is removed.
- Legacy blob/ring/beam scale is no longer directly driven by raw bass/transient.
- Liquid phase speed and field topology no longer multiply absolute time/spatial frequency by audio.
- Full-frame post-FX barrel/displacement/smear sampling distance is no longer driven by raw bass/transient bands, preventing a correct one-way world from being reintroduced as a global visual pump.
- `WorldColorContext` is now a pure engine-core contract for representative/title-safe luminance, highlight risk, busyness, polarity hysteresis and outline-support pressure.

## Dedicated Phase-B fidelity rebuilds now in candidate

The five worst motion offenders are isolated from the generic shared layer stack:

- `vortex` → `LegacyVortexWorld`: projected helix ribbons, depth hoops and one-way tracers;
- `rays` → `LegacyRaysWorld`: fullscreen per-pixel participating-media field with broad cones, atmospheric breakup, source bloom and event-only light response;
- `starfield` → `LegacyStarfieldWorld`: fixed-axis 3D flight volume with deterministic stars, strictly one-way z travel, analytic motion streaks and wrap fading;
- `nebula` → `LegacyNebulaWorld`: fullscreen domain-warped FBM gas density with ridged filaments, cavities, local folded-volume lighting and sparse depth stars;
- `grid` → `LegacyGridWorld`: fullscreen infinite floor/ceiling perspective, horizon atmosphere, moving side architecture and deterministic energy traffic.

All five consume semantic `VisualPalette` roles. Their geometry/phase/direction is timestamp-owned; smoothed legacy audio is restricted to light/material emphasis.

## Art-direction rehabilitation candidate

Draft PR #78 removes active runtime ownership from the old shared `ArtDirectionWorlds` Graphics path and routes the four remaining preset IDs through dedicated renderers:

- `editorial` → `LegacyEditorialWorld`: fullscreen modular graphic-layout shader with protected center, plates, rules and registration/crop structure;
- `print` → `LegacyPrintWorld`: layered rotated halftone material with deterministic mechanical misregistration and print substrate structure;
- `architecture` → `LegacyArchitectureWorld`: fullscreen perspective corridor with time-owned depth travel, projected frames, pillars, arches and side recess parallax;
- `aurora` → `LegacyAuroraWorld`: procedural multi-layer FBM curtain density with striation and folded-volume lighting.

All four consume semantic `VisualPalette` roles. Geometry/phase/depth are timestamp- or deterministic-line-owned; smoothed legacy audio is restricted to ink/material/light response.

## Next implementation slice

Once PR #78 is merged, all 15 legacy preset identities have dedicated rehabilitation paths. Next wire per-world `WorldColorContext` into typography treatment with contrast floors, smoothing and polarity hysteresis, then run the full real-display acceptance matrix before WORLD_09/10.
