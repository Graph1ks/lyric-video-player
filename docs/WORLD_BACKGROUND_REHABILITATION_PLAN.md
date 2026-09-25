# Legacy World / Background Rehabilitation Plan

**Status:** next implementation milestone  
**Last updated:** 2026-09-25  
**Scope:** all pre-reference-set / legacy backgrounds plus shared color/readability integration

This milestone exists because local visual acceptance exposed a systemic issue: the Neon Energy Burst Tunnel's former expand/retract failure was not isolated. Several older E-MO backgrounds use the same class of raw-audio geometry modulation and therefore visibly twitch, breathe, jump or reverse in ways that do not match their visual identity.

The next thread should **not** continue directly with WORLD_09/10. First rehabilitate the legacy background stack and establish the shared motion/color contracts that future worlds inherit.

---

## 1. Legacy inventory

The current pre-reference-set Background preset IDs are:

### Shared `CinematicBackground` procedural presets

- `cinematic`
- `nebula`
- `grid`
- `starfield`
- `rays`
- `vortex`
- `liquid`
- `spectrum`
- `sparks`
- `lyrics`
- `minimal`

### `ArtDirectionWorlds` presets

- `editorial`
- `print`
- `architecture`
- `aurora`

These 15 presets are the rehabilitation target.

The newer reference-set worlds WORLD_01–08 remain in the visual-acceptance queue and may receive tuning later, but this milestone specifically fixes the old shared background architecture before adding WORLD_09/10.

---

## 2. Confirmed motion problem

The problem is architectural, not one bad constant.

Current legacy code contains direct raw-audio-to-geometry mappings such as:

- blob scale from raw bass;
- vortex radius/"breathe" from raw energy;
- ray expansion from raw transient;
- a global particle push multiplier from transient;
- particle scale directly from transient;
- art-world pulse/breathe values directly from bass;
- geometry width/amplitude directly from unsmoothed bands.

Examples currently live in:

- `packages/renderer-pixi/src/effects/backgrounds/CinematicBackground.ts`
- `packages/renderer-pixi/src/effects/backgrounds/ArtDirectionWorlds.ts`
- `packages/renderer-pixi/src/effects/backgrounds/ProceduralLiquidFX.ts`

This produces the same visual family of defects previously seen in WORLD_04:

- twitching;
- expand/retract breathing;
- scale pumping;
- sudden radial pushes;
- phase jumps;
- direction changes;
- geometry appearing to respond to every sample instead of behaving like an authored world.

### Hard rule

**Raw audio bands must not be treated as a motion/physics clock.**

The durable motion taxonomy in `docs/WORLD_MOTION_AUDIO_REACTIVITY.md` now applies to every legacy preset as well.

---

## 3. Required motion rehabilitation

Before fidelity work, every legacy preset must be classified as one of:

1. **mechanical / continuous**
2. **one-way flow**
3. **burst / impact event**
4. **intentionally rhythmic deformation**

Then rebuild its audio ownership accordingly.

### Mechanical / continuous motion

Use absolute audio/playback time and authored base rates for:

- rotation;
- drift;
- orbit;
- camera movement;
- parallax;
- slow wave travel.

Audio may change:

- brightness;
- glow;
- material response;
- sparkle;
- small bounded deformation.

Audio must not continuously change the object's base angular/linear phase.

### One-way flow

Use an integrated monotonic travel phase.

Correct model:

`travel += dt * (baseSpeed + positiveBoost)`

Do not use:

`time * (baseSpeed + rawAudio)`

for a motion whose direction must remain coherent.

### Burst / impact event

Transient response must be event-like:

- rising-edge trigger;
- positive envelope;
- age/progress;
- decay;
- no inhale/retract half-cycle unless the design explicitly calls for it.

### Rhythmic deformation

Allowed only when pulsing geometry is genuinely part of the visual identity.

Even then:

- use smoothed/enveloped audio;
- bound the deformation;
- do not drive whole-scene topology from noisy bands;
- keep a stable autonomous base motion underneath.

---

## 4. Shared audio-reactivity layer

Do not fix 15 presets by inventing 15 unrelated smoothing snippets.

The next implementation should evaluate a small reusable world-audio layer, e.g. an engine/renderer helper that exposes:

- smoothed bass;
- smoothed mid;
- smoothed treble;
- smoothed energy;
- transient rising-edge event;
- transient envelope;
- optional long energy envelope;
- authoritative `dt` / discontinuity handling.

Requirements:

- deterministic after seek/time discontinuity;
- attack/release times owned explicitly;
- no history dependency that prevents reconstruction from the authoritative clock;
- no allocation-heavy per-frame behavior;
- easy unit/source-contract testing.

This helper is not required to force identical response curves across all worlds. It should provide stable primitives; each world still owns its art direction.

---

## 5. Hardcore fidelity upgrade

Fixing twitching alone is insufficient.

The legacy stack currently relies too heavily on shared generic layers:

- blobs;
- particles;
- rings;
- beams;
- generic geometry;
- shared pulse/push logic.

That makes many backgrounds feel like minor variations of the same effect.

### New fidelity rule

Each named Background preset must have a recognizable rendering identity in a paused frame **and** in motion.

A preset should not exist merely because a generic layer receives different constants.

Where necessary, move legacy presets into dedicated renderer classes instead of continuing to expand one giant `CinematicBackground` branch table.

### Target direction per legacy preset

These are art-direction targets, not frozen implementation mandates.

| Preset | Rehabilitation target |
| --- | --- |
| `cinematic` | restrained filmic depth field, lens-light structure, layered haze, controlled parallax; no generic blob soup |
| `nebula` | volumetric/cloud-like depth, slow autonomous drift, star/dust parallax, coherent color mass |
| `grid` | true perspective grid/mesh or projected geometry with horizon/depth; not floating particles pretending to be a grid |
| `starfield` | real z-depth travel, stable one-way motion, depth-dependent size/brightness |
| `rays` | authored volumetric shafts with slow targeting/drift; no transient-driven whole-field expansion |
| `vortex` | continuous one-way funnel/spiral travel with actual depth grammar; no audio breathing/retraction |
| `liquid` | substantially richer fluid/implicit-surface treatment, palette-aware material/lighting, continuous motion |
| `spectrum` | real spectrum ownership, layered musical frequency structure, distinct from WORLD_08 minimal waveform |
| `sparks` | ballistic/flowing spark trajectories with birth/lifetime/decay; transients spawn/accent events rather than scaling the whole scene |
| `lyrics` | deliberate recursive typography depth/composition, bounded resource lifecycle, palette/readability-aware |
| `minimal` | intentionally sparse authored field with excellent spacing and subtle motion; not simply "fewer generic particles" |
| `editorial` | strong graphic composition, print/editorial hierarchy, restrained autonomous movement |
| `print` | halftone/registration/ink/offset language with controlled texture and palette integration |
| `architecture` | real perspective/spatial construction; projected geometry or Mesh where needed |
| `aurora` | flowing curtain/ribbon field with smooth continuous phase, depth layers and restrained music lighting response |

### Fidelity acceptance

For every rehabilitated preset:

- identity obvious in a paused frame;
- movement reads as intentional rather than reactive noise;
- 50 / 100 / 200 / 300% World Power produces meaningfully different but coherent staging;
- World Detail changes structure/density, not merely alpha;
- Cinema/Performance preserve the same identity;
- no specialized world is diluted by unrelated generic fallback layers;
- no raw-audio seizure behavior.

---

## 6. OKLCH must become a world-wide color system

The current Color Director already creates a semantic `VisualPalette` from OKLCH mood/harmony/canvas roles:

- `background`
- `surface`
- `textPrimary`
- `textSecondary`
- `accentA`
- `accentB`
- `glow`
- `muted`

This is good infrastructure, but several worlds still contain hard-coded color languages or only partially use the palette.

### Required world-color contract

Every rehabilitated world should consume the semantic palette.

A world may preserve a recognizable identity, but should derive its actual hues/material colors from:

- base/background;
- accent A/B;
- glow;
- surface/muted roles;
- world-specific controlled hue offsets when required.

Hard-coded RGB should be reserved for true semantic exceptions, not the default authored look.

### Color identity vs. palette

The goal is not to make every world the same color.

Example:

- Aurora can remain "cool luminous curtain";
- Sparks can remain "hot emissive";
- Print can remain "ink/paper";
- Nebula can remain "deep atmospheric".

But those identities should be **mapped into the active OKLCH palette**, not ignore it.

Thus:

> world identity defines relationships and material behavior; the Color Director defines the current color language.

---

## 7. Typography must adapt to the actual world, not only the nominal canvas

Current color code already enforces strong contrast:

- primary text target: **7:1**
- secondary text target: **4.5:1**
- muted text target: **3:1**

However, those ratios are currently calculated against `VisualPalette.background`.

That is insufficient once the rendered world contains:

- bright beams;
- large light fields;
- a luminous center;
- reflective geometry;
- bright terrain/equalizer peaks;
- rapidly changing chromatic regions.

The nominal background color can be dark while the actual title-safe region is bright.

### Required new concept: World Color / Readability Context

The next implementation should introduce a cheap semantic description of the currently rendered world, e.g. a `WorldColorContext` / `WorldReadabilityContext`.

Candidate data:

- dominant/representative hue;
- representative luminance;
- title-safe-region luminance;
- peak/highlight luminance risk;
- chroma/saturation;
- visual busyness/detail pressure;
- recommended text polarity;
- optional preferred outline/shadow strength.

Do **not** default to expensive per-frame GPU readback.

Preferred first implementation:

- each world analytically reports/estimates its current color/readability context from the same palette, power and smoothed envelopes it uses to render;
- aggregate that context centrally;
- smooth it temporally.

If later measurement proves estimates insufficient, a low-resolution luminance probe/reduction pass can be evaluated separately.

---

## 8. Background-aware typography palette

Typography should keep the Color Director's OKLCH mood/harmony but adapt its treatment to the active world.

Required behavior:

1. start from the existing OKLCH `VisualPalette`;
2. combine it with the current World Readability Context;
3. preserve the current harmony where possible;
4. adjust OKLCH lightness/chroma first;
5. flip light/dark polarity only when necessary;
6. use outline/shadow/glow support when the background is locally complex;
7. preserve the existing contrast floors;
8. avoid frame-to-frame color flicker.

### Stability rules

Typography color must not twitch with the world.

Use:

- temporal smoothing;
- hysteresis around light/dark polarity changes;
- preferably phrase/cue-stable polarity;
- bounded continuous lightness/chroma adjustment.

A transient beam crossing the center must not make the lyrics rapidly alternate white/black every frame.

### Typography systems that must consume the resolved treatment

At minimum:

- ordinary `KineticLyrics`;
- `PersistentTypographySequences`;
- echoes/outlines;
- recursive lyric background where applicable;
- Lower Third text if it is composited over the same world in the output surface.

This is a **color/treatment adaptation** requirement. It does not imply random typeface-family switching.

---

## 9. Two-way color ownership

The desired final relationship is:

`OKLCH Color Director → World material colors`

and

`World rendered tone/readability context → Typography contrast treatment`

This is intentionally two-way.

The world must not independently invent a disconnected color palette, and typography must not assume that the nominal canvas color is the only thing behind it.

The Color Director remains the art-direction source of truth; the world contributes rendering-context information needed for legibility.

---

## 10. Migration / implementation order

### Phase A — audit and shared primitives

1. inventory every legacy preset's current geometry/audio mappings;
2. mark raw audio → position/phase/scale/topology paths;
3. add shared smoothed world-audio/event primitives;
4. add regression tests for monotonic/continuous motion contracts;
5. define `WorldColorContext` / typography-resolution API before doing 15 one-off implementations.

### Phase B — worst legacy motion offenders

Start with presets currently using the shared particle/blob/ring/beam paths most aggressively:

1. `vortex`
2. `rays`
3. `starfield`
4. `nebula`
5. `grid`

Goal: eliminate visible twitch/retract/pump behavior first.

### Phase C — dedicated fidelity rebuilds

Rebuild the generic/shared presets into distinctive renderers:

- cinematic;
- nebula;
- grid;
- starfield;
- rays;
- vortex;
- liquid;
- spectrum;
- sparks;
- lyrics;
- minimal.

### Phase D — ArtDirectionWorlds

Upgrade:

- editorial;
- print;
- architecture;
- aurora.

Keep their graphic identities but apply the same motion, palette and readability contracts.

### Phase E — color/readability integration

1. route OKLCH palette roles into every old world;
2. collect World Color Context;
3. resolve background-aware typography color/treatment;
4. validate contrast under 0–300% World Power and representative bright/dark states.

### Phase F — only then continue WORLD_09/10

WORLD_09/10 should inherit the rehabilitated motion/color/readability infrastructure rather than creating another parallel system.

---

## 11. Testing contract

Add tests that catch the architectural regressions, not only screenshots.

### Motion

Verify representative worlds do not:

- multiply absolute `time` by raw audio to determine continuous phase;
- use raw transient as a whole-scene reversible scale;
- alter direction of one-way motion;
- change topology/spacing directly from noisy bands.

Verify:

- smoothing/discontinuity reset behavior;
- burst rising-edge behavior;
- deterministic seek reconstruction.

### Color

Verify:

- every legacy world receives semantic palette roles;
- typography contrast resolver retains primary/secondary/muted minimums;
- bright-world context can select dark typography;
- dark-world context can select light typography;
- polarity hysteresis prevents rapid toggling;
- OKLCH mood/harmony remains deterministic.

### Visual acceptance

Real-display acceptance remains mandatory. Source tests cannot prove cinematic fidelity.

---

## 12. Do not redo / traps

- Do not fix this by globally lowering audio reactivity. The issue is **ownership and semantics**, not simply too much amplitude.
- Do not add another generic "smooth everything" multiplier without classifying motion.
- Do not preserve a weak old preset merely for compatibility if its visual identity is generic; preserve the preset ID, not a bad renderer implementation.
- Do not use a 2D warp as the replacement for a depth-dependent legacy world.
- Do not hard-code new RGB palettes while simultaneously claiming OKLCH integration.
- Do not derive typography contrast only from `VisualPalette.background` once bright world geometry dominates the title-safe region.
- Do not use synchronous GPU readback each frame for readability.
- Do not allow adaptive typography colors to flicker every frame.
- Do not continue WORLD_09/10 before the shared motion/color/readability contracts are in place.

---

## 13. Next-thread start point

Read:

1. `AGENTS.md`
2. `PROJECT.md`
3. `STATUS.md`
4. `docs/HANDOVER.md`
5. **`docs/WORLD_BACKGROUND_REHABILITATION_PLAN.md`**
6. `docs/WORLD_MOTION_AUDIO_REACTIVITY.md`
7. `docs/VISUAL_READABILITY_COLOR_RULES.md`
8. `docs/3D_WORLD_RENDERING_ARCHITECTURE.md`
9. `docs/WORLD_RENDERING_TECH_RESEARCH.md`

Then begin **Phase A: legacy-motion audit + shared world-audio envelopes + World Color Context design**.

Do not start WORLD_09/10 first.
