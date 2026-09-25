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
| `editorial` | ArtDirectionWorlds | mechanical / continuous | bass changed corner geometry size | time-authored graphic motion; audio on ink/light emphasis |
| `print` | ArtDirectionWorlds | rhythmic local texture | direct band-driven dot sizing | bounded smoothed texture response; preserve print registration structure |
| `architecture` | ArtDirectionWorlds | mechanical / continuous | bass changed whole nested-frame scale | fixed spatial frame system; camera/parallax time-owned |
| `aurora` | ArtDirectionWorlds | mechanical / continuous deformation | band values directly changed ribbon amplitude/width | continuous ribbon phase; only smoothed bounded local deformation/light |

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

## Next implementation slice

Continue dedicated fidelity work on `cinematic`, `liquid`, `spectrum`, `sparks`, `lyrics` and `minimal`, then rebuild the four `ArtDirectionWorlds` presets. After the world identities are stable, wire per-world `WorldColorContext` into typography treatment with contrast floors and polarity hysteresis.
