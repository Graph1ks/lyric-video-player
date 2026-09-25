# Composition Motion Grammar

**Status:** merged baseline  
**Owner:** engine-core / renderer-pixi  
**Determinism:** required

## Purpose

Typography composition answers **where words live in the frame**. Glyph typography answers **how letters inside a word animate**. Composition motion answers **how the complete word/layout behaves over lyric time**.

These are intentionally separate contracts:

```text
Enhanced LRC time
      |
Typography Composition
  fixed word stage targets
      |
Composition Motion Grammar
  whole-word / whole-stage transforms
      |
Typography Motion
  glyph selectors and word-local motion
      |
Pixi render
```

Composition motion must never depend on hidden animation history. Given the same scene, cue index, LRC times, viewport and timestamp, it must evaluate to the same transform frame.

## Runtime contract

The pure evaluator lives in:

`packages/engine-core/src/typographyMotionGrammar.ts`

Input includes:

- requested motion preset / AUTO;
- scene family;
- line index;
- explicit playback/LRC time;
- line start/end;
- viewport dimensions;
- composition anchor index;
- word cue times;
- word composition position/rotation/scale/emphasis;
- visual intensity.

Output includes:

- resolved motion family;
- active word index;
- whole-stage transform;
- per-word x/y offset, rotation, x/y scale and alpha.

Pixi consumes this output. React does not evaluate frames.

## Baseline motion families

| ID | Behavior |
|---|---|
| `handoff` | words arrive from alternating directions; sung words hand visual focus forward |
| `conveyor` | current lyric position pushes the word field along a deterministic horizontal/vertical lane |
| `anchor-build` | satellite words build outward from the composition's dominant anchor |
| `collapse` | distributed composition converges toward the center near the line ending |
| `takeover` | active word moves toward center, enlarges and suppresses surrounding words |
| `flip` | whole words analytically resolve from a 90° flip-like entrance |
| `camera-handoff` | the typography stage shifts/zooms toward the active word without moving the background camera |
| `portal` | active word expands through the viewer and fades near cue exit |
| `panel` | the complete typography stage enters/exits like an editorial panel |

`AUTO` selects from scene-specific deterministic sequences using cue index. It is not random.

## Renderer integration

`KineticLyrics` owns three nested transform levels:

1. `mainLayer` — whole-stage motion grammar;
2. word `slot` — composition target + grammar offsets;
3. word `motion` / glyph nodes — existing entry punches and selector-driven typography motion.

This ordering is deliberate. A 90° Vertical Accent word can keep its layout rotation while a Takeover or Portal grammar animates the whole word, and glyph-level Wave/Elastic/Glitch can still run inside it.

## UI / persistence

- Visual Director label: **Composition Motion**
- keyboard cycle: `G`
- `M` remains mute
- project manifest key: `defaults.compositionMotion`

## Non-goals for this baseline

- It does not move the global scene/background camera. `camera-handoff` currently transforms the typography stage only.
- It does not author cross-line persistent objects; each active line is still evaluated independently.
- It does not replace the existing `CameraRig` audio/line/word impulses.
- It does not yet serialize per-section scene stacks; that remains Step 7.

## Acceptance / tuning

Automated tests verify deterministic evaluation and representative transforms. Real-track acceptance still needs to tune:

- long-word overscale in Takeover/Portal;
- crowded layouts on narrow/mobile viewports;
- grammar × layout combinations that produce excessive movement;
- grammar × glyph-effect combinations that reduce readability.

If a combination proves systematically poor, constrain AUTO compatibility rather than adding history-dependent exceptions.
