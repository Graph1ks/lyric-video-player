# Professional Control Surface + Visual FX Rack

**Status:** merged baseline — PR #57 / `94e34e6609c180c07445246c69d46cc0ef9021ef`  
**Started:** 2026-09-25  
**Scope:** playback telemetry, web-player/Director chrome, explicit renderer FX ownership, preset semantics, and background-world dynamic range.

## Why this pass exists

The previous Director exposed the authored visual families but still hid several renderer/compositor behaviors behind one global intensity value. That made presets difficult to reason about: a user could constrain typography, motion and backgrounds while camera impulses, displacement, smear, feedback, bloom, lens/chroma treatment and DOM screen texture continued to run outside the preset vocabulary.

The transport also depended on the main renderer's `requestAnimationFrame` clock. When the detached Director had focus, a background browser window could throttle that RAF. Playback itself continued, but Director telemetry and Lower Third schedule evaluation could appear frozen.

This pass treats E-MO as a professional performance console rather than a decorative web HUD.

## Interface research

The design direction is informed by current professional audio/video tools, without copying their assets or layouts:

- Avid Pro Tools 2025.10 continues to invest in dark-theme support and UI-customization rather than ornamental chrome.
- Ableton Live 12 explicitly describes its UI as modernized/streamlined, with view controls that show/hide working areas; its Control Bar keeps transport and session-level controls persistent.
- Ableton's current mixer work increases handle size, meter contrast and configurable section visibility.
- DaVinci Resolve 20 Fairlight keeps standard transport, timecode/playhead, timeline, monitoring meters and mixer as first-class production surfaces.

Sources:
- https://resources.avid.com/SupportFiles/PT/Whats_New_in_Pro_Tools_2025.10.pdf
- https://www.ableton.com/en/release-notes/live-12/
- https://www.ableton.com/en/manual/live-concepts/
- https://documents.blackmagicdesign.com/UserManuals/DaVinci-Resolve-20-Fairlight-Audio-Post.pdf

E-MO therefore uses the following principles:

1. **Transport is infrastructure.** Large readable playhead time, play/pause, skip, seek and monitor level remain obvious and stable.
2. **Dense, not tiny.** Professional information density is acceptable; illegible micro-labels are not.
3. **One control = one behavior.** Hidden renderer behavior is considered a Director bug.
4. **Modular visibility.** Presets may constrain a category, leave it unrestricted, or switch an FX amount fully off.
5. **Direct numerical feedback.** FX and world controls always show their current percentage.
6. **Quiet chrome, expressive output.** The console stays restrained while the rendered world is allowed to become extreme.

## Playback telemetry contract

The main renderer still evaluates visual frames from the audio/LRC clock.

Operator telemetry is separate:

- HTML media events update shared playback immediately on load, seek, duration change, play/pause and rate changes.
- A 125 ms heartbeat samples `currentTime` and `duration` independently of Pixi RAF.
- The detached Director interpolates between shared samples with its own visible-window RAF.

The local interpolation is presentation-only. It never becomes the authoritative audio clock.

This fixes two coupled failures:

- a frozen Director counter/progress indicator while audio continued;
- scheduled Lower Thirds not entering their start/outro windows because shared playback time was stale.

## FX Rack

`VisualFxRack` is an engine-core contract with independent 0–300% controls.

| Control | Owns |
| --- | --- |
| Camera Motion | directed camera travel, scale, skew and audio micro-motion |
| Impact / Pulse | word/line impulses, scene transition pulse and background flash/push |
| Displacement | reactive spatial displacement filter |
| Velocity Smear | directional temporal/spatial smear |
| Bloom | renderer bright-pass + presentation bloom |
| Temporal Feedback | previous-frame additive feedback |
| Lens / Chroma / Warp | cinematic post pass: barrel, chromatic offset, smear/glow/grain/vignette inside that shader |
| World Power | background/world visibility, audio response and visual amplitude |
| World Detail | particle/shape/frame/ribbon density |
| Screen Bloom | DOM screen bloom finish |
| Scanlines | DOM scanline finish |
| Film Grain | DOM grain finish |
| Vignette | DOM vignette finish |

Semantics:

- **0% = OFF** for FX controls.
- **100% = authored normal**.
- **300% = intentionally extreme**.
- Global **Intensity** remains the master authored-animation energy and does not replace the FX Rack.

## Preset semantics

A Performance Preset now has two different kinds of controls.

### AUTO pools

Selected chips mean: **AUTO may use only these values**.

An empty pool means: **ANY / unrestricted on this axis**.

This deliberately answers the earlier ambiguity: a preset does **not** have to select every family and it does not have to constrain every category.

### FX amounts

FX values are explicit amounts. **0% means that effect is disabled for the preset.**

This lets a preset be strongly kinetic while, for example, displacement, smear and feedback are all completely absent.

## Curated presets

The built-ins are intentionally smaller and more differentiated than the previous library.

- **Calm / Slow** is almost a single visual vocabulary and disables most compositor effects.
- **Tender / Slow** keeps soft camera/type motion but disables displacement/smear.
- **Heartbreak / Slow** is editorial with shadow/grain rather than a generalized AUTO mix.
- **Longing / Midtempo** is atmospheric with moderate depth.
- **Dream / Midtempo** enables liquid/spatial depth and stronger bloom.
- **Euphoria / Fast** increases world density and bright kinetic response.
- **Rage / Fast** uses obvious transient impact, distortion and high world power.
- **Tension / Burst** pushes displacement/smear/feedback/post processing toward the extreme end.

## Background-world contract

World Power and World Detail are independent.

At low power, world layers fade toward the base canvas. At high power, alpha, travel, spectrum amplitude, geometry and audio response increase.

World Detail changes actual structural density:

- art-world markers, frames, pillars, aurora layers/points/motes;
- particles/blobs;
- recursive lyric echoes;
- sparks;
- spectrum resolution;
- grid/ray/vortex/star/nebula geometry.

The 0–300% range is deliberately nonlinear in perceived result: the upper half is for performance-showpiece territory, not minor fine tuning.

## Acceptance

Verify with real audio and a detached Director:

- Director counter advances smoothly every visible frame while audio plays.
- Timeline progress follows the song and seeking updates immediately.
- Main player may be backgrounded without freezing Director telemetry.
- Scheduled Lower Third appears at the configured start; optional outro window appears before the actual duration endpoint.
- Every FX Rack control produces an obvious independent change and 0% removes that behavior.
- Calm/Tender and Rage/Tension are visibly different without inspecting settings.
- World Power at 20–40% is restrained, 100% is normal, 200–300% is unmistakably aggressive.
- World Detail changes density rather than merely opacity.
- Main web player and detached Director read as one production-console design system.
