# Director Performance Presets

**Status:** active candidate — `feat/director-performance-presets`  
**Started:** 2026-09-25  
**Scope:** curated AUTO constraints, editable performance profiles, lower-third scheduling and detached-Director control ergonomics.

## Product goal

The Director exposes many independent visual axes. That is useful for manual art direction, but unrestricted AUTO can produce too many combinations and makes it difficult to understand which families work well together.

Performance Presets add a layer **above** existing AUTO behavior.

A preset does not hard-code one frozen look. It defines which values AUTO is allowed to use:

- scene families;
- typography behaviors;
- persistent lyric sequences;
- word layouts;
- composition-motion grammars;
- background worlds;
- color moods;
- canvas polarity;
- color harmonies;
- global intensity;
- static vs Rainbow Drift.

This keeps automatic variation while reducing the possibility space to a deliberate art-direction vocabulary.

## Curated baseline presets

The built-in library starts with emotion + pace combinations:

| Preset | Pace | Direction |
| --- | --- | --- |
| Tender / Slow | Slow | spacious, soft, restrained |
| Heartbreak / Slow | Slow | dark editorial, sparse |
| Longing / Midtempo | Mid | flowing, atmospheric |
| Dream / Midtempo | Mid | soft depth, chromatic |
| Calm / Slow | Slow | minimal, low pressure |
| Euphoria / Fast | Fast | bright, energetic |
| Rage / Fast | Fast | hard graphic impact |
| Tension / Burst | Burst | compressed, high-pressure depth |

These are authored defaults, not immutable rules. Every pool can be edited from the Director.

## Runtime contract

`VisualAutoProfile` lives in engine-core and is renderer/framework independent.

The profile constrains AUTO at the point where each automatic decision is resolved:

1. `SceneDirector` limits scene, typography, layout, motion and persistent-sequence choices.
2. `CinematicBackground` limits AUTO background worlds.
3. `createVisualPalette()` limits AUTO mood, canvas and harmony choices.
4. Manual controls still override the corresponding AUTO axis.
5. Returning a manual axis to AUTO hands that axis back to the active preset.

If no preset is active, existing unrestricted AUTO behavior remains the compatibility path.

A profile never introduces a second animation clock and does not change LRC timing, seek determinism or the pure timestamp-derived motion contract.

## Editing and persistence

Built-in presets are editable and have a Reset action.

Users can also create a custom preset by cloning the active preset. Custom presets can be renamed or deleted.

Preset edits are stored in browser/Electron renderer local storage under a versioned key. They are local application preferences for this milestone; they are **not yet serialized into `emo.project/v1`**.

Each pool must retain at least one allowed option. This prevents an invalid empty AUTO domain.

## Lower Third scheduling

Lower Third presentation now has three modes:

- **Off**
- **Scheduled**
- **Always**

Scheduled mode exposes:

- start time in song seconds (default 10s);
- visible duration (default 8s);
- optional outro trigger;
- lead time before track end for the outro trigger (default 10s).

The Director also has **Show Now**, which triggers the Lower Third immediately for the configured visible duration regardless of schedule mode.

The visual-style preset remains independent from the scheduling mode.

## Detached Director transport

The detached Director top bar uses a two-row responsive layout:

- row 1: identity + operator actions;
- row 2: complete playback transport.

This prevents file/fullscreen/workspace actions from compressing the timeline, track metadata, seek controls and volume controls into a broken single row.

## HUD control

The player HUD button uses an explicit auto-width control with minimum width and padding rather than the square icon-button width. The text is therefore contained inside its own border.

## Acceptance

Verify:

- activating each performance preset returns all authored visual axes to AUTO and visibly limits variation to that preset's pools;
- editing a pool takes effect live without reloading the app;
- built-in Reset restores the authored pool;
- custom presets survive reload in the same browser/Electron profile;
- unrestricted AUTO still behaves as before when no performance preset is active;
- scheduled Lower Third appears at the configured song time for the configured duration;
- optional outro presentation occurs at the configured lead time before track end;
- Always remains visible and Off stays hidden;
- Show Now overrides any schedule temporarily;
- detached Director transport remains fully usable at common desktop widths;
- HUD text remains inside its border.
