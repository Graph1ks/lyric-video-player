# World Motion & Audio Reactivity Contract

**Status:** active design rule for procedural visualizer worlds

This contract exists because visually rich worlds can still fail if audio reactivity is mapped directly onto motion geometry.

## Core rule

**Music may drive energy; it must not arbitrarily rewrite physical motion.**

Raw audio bands are noisy and discontinuous from frame to frame. Using them directly inside position, rotation speed, radius, scale, or phase terms creates visible jitter, stutter, breathing, reversal or "seizure" behavior.

## Motion classes

### 1. Mechanical / continuous motion

Examples:

- mirrorball rotation;
- slow room projection drift;
- ribbon travel;
- camera-independent parallax;
- orbital drift.

Rules:

- derive direction and base rate from audio/playback time only;
- do not multiply absolute time by raw audio values;
- do not resize geometry from raw bass/energy;
- audio may change light intensity, sparkle, exposure or material response;
- if light response is noisy, use a short attack/release envelope.

### 2. One-way kinetic flow

Examples:

- tunnel rush;
- outward streak fields;
- particle exhaust;
- scrolling terrain.

Rules:

- maintain a monotonically increasing travel phase;
- audio may only add a **positive** speed boost;
- never recompute phase as `time * (base + rawAudio)`, because changes in rawAudio cause phase jumps that can visually reverse motion;
- on seek/discontinuity, reset travel from authoritative audio time.

### 3. Bursts / impacts

A burst is an event, not an oscillation.

Rules:

- detect a rising transient edge;
- start a short positive envelope;
- advance a burst age outward from zero;
- decay the envelope; never add an inhale/retract phase;
- brightness, shock-front radius and streak gain may increase during the event;
- the field must continue moving in the same direction before, during and after the burst.

### 4. Rhythmic deformation

Direct geometric audio mapping is allowed only when the design explicitly calls for pulsing geometry.

Even then:

- use smoothed/enveloped audio;
- keep deformation bounded;
- prefer local accents over full-scene scale oscillation;
- preserve the world’s directional motion grammar.

## WORLD_03 correction

Disco Mirrorball Room now follows a motorized-lighting model:

- sphere radius is constant;
- angular velocity is constant and time-driven;
- reflection tile geometry is time-driven;
- bass/energy/treble/transient are smoothed before affecting lighting;
- music changes glints, reflection brightness and exposure, not the ball’s mechanics.

## WORLD_04 correction

Neon Energy Burst Tunnel now follows a one-way flow model:

- radial travel is integrated monotonically;
- raw bass is removed from phase/time multipliers;
- rising transient edges trigger a positive burst envelope;
- `burstAge` drives an outward shock front;
- burst state can accelerate the outward travel but cannot reverse it;
- all motion remains outward between hits.

## Rule for future worlds

Before mapping any audio band to geometry, classify the target as:

- mechanical;
- one-way flow;
- burst/impact;
- intentionally rhythmic deformation.

The implementation must preserve that motion class under noisy real music input.


## Legacy background rehabilitation scope

This contract explicitly applies to the pre-reference-set background stack as well as the newer WORLD_XX implementations.

The next rehabilitation pass covers:

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
- `editorial`
- `print`
- `architecture`
- `aurora`

Current shared legacy code contains raw-audio scale/push/breathe mappings that violate this contract. Those paths are now considered known technical debt and must be removed/re-authored rather than preserved for compatibility.

See `docs/WORLD_BACKGROUND_REHABILITATION_PLAN.md`.
