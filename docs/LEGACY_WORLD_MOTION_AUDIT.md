# Legacy World Motion Audit — Phase A

**Status:** active implementation audit  
**Last updated:** 2026-09-25  
**Scope:** pre-reference-set Background presets only

This audit is the implementation companion to `WORLD_BACKGROUND_REHABILITATION_PLAN.md`. It classifies the existing motion grammar before fidelity rebuilds so audio ownership is explicit instead of repaired with ad-hoc smoothing.

| Preset | Current renderer | Motion class | Confirmed legacy issue | Rehabilitation action |
| --- | --- | --- | --- | --- |
| `cinematic` | shared CinematicBackground layers | mechanical / continuous | shared blob/ring/particle scale and push paths | isolate filmic depth field; keep audio on light/material response |
| `nebula` | shared blobs/particles/beams | mechanical / continuous | blob scale and shared particle response made cloud mass pump | autonomous drift/depth; audio only illumination and bounded local density accents |
| `grid` | shared Geometry + particles | one-way flow / mechanical | generic particles dilute perspective identity | dedicated perspective grid/mesh with time-owned scroll |
| `starfield` | shared particles + streaks | one-way flow | global transient push/scale modified all stars | keep z travel time-owned; audio only brightness/specular accents |
| `rays` | shared beams/rings/particles | mechanical / burst accents | transient expansion and audio-scaled beam geometry | dedicated shafts; slow targeting plus event-only flare |
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
- `WorldColorContext` is now a pure engine-core contract for representative/title-safe luminance, highlight risk, busyness, polarity hysteresis and outline-support pressure.

## Next implementation slice

`vortex` is now isolated in `LegacyVortexWorld`. Continue with dedicated `rays`, `starfield`, `nebula` and `grid` renderers in that order, preserving preset IDs while removing dependence on the generic shared layer stack.
