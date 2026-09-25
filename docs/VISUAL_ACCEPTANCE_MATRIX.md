# Visual Acceptance Matrix

**Status:** active engineering QA contract  
**Last updated:** 2026-09-25

The visual engine now has enough independent dimensions that ad-hoc spot checks are no longer sufficient. This document defines the minimum repeatable acceptance matrix before new visual grammars are added.

## Automated composition matrix

`tests/visual-readability-matrix.test.mjs` runs every typography composition across representative viewport classes:

| Viewport | Size |
|---|---:|
| Desktop 1080p | 1920 × 1080 |
| Laptop | 1366 × 768 |
| Portrait | 1080 × 1920 |
| Mobile portrait | 390 × 844 |

For a six-word stress line, every base composition must:

- keep transformed word bounds inside the central attention field;
- avoid severe base-layout overlap;
- produce deterministic output for identical input.

The reusable engine-core helper `assessTypographyComposition()` reports:

- transformed word bounds;
- attention-field overflow count;
- collision pairs;
- maximum overlap ratio.

This is intentionally base-composition QA. Takeover/Portal and other explicit fullscreen motion grammars may exceed the attention field during motion by design.

## Manual real-track matrix

Automated geometry cannot judge aesthetics. Before a world/layout combination is considered accepted, test real Enhanced LRC content in at least:

- 1920×1080 desktop;
- a 1366×768-class laptop window;
- narrow portrait/mobile;
- short 1–3 word hooks;
- ordinary 4–7 word lines;
- at least one dense/long line;
- slow and fast word timing.

For each sample, inspect:

1. **Reading path** — cue order remains obvious without reconstructing a zig-zag route.
2. **Primary focus** — the current word is immediately identifiable.
3. **Collision** — no accidental word-on-word collision at base layout.
4. **Edge safety** — ordinary readable lyrics remain inside the attention field.
5. **World contrast** — background structure does not occupy the same visual-frequency/contrast budget as the lyrics.
6. **Color** — background does not collapse to muddy brown; mood/harmony remains recognizable.
7. **Motion** — composition grammar supports the reading path rather than fighting it.
8. **Seek** — arbitrary seeking reconstructs the same frame/state.
9. **Performance** — Cinema/Performance modes remain usable for their target class.

## Current world acceptance queue

- Editorial
- Print
- Architecture
- Aurora

Do not add another ambient-particle variant merely to increase preset count. The next world should represent a genuinely missing visual grammar such as volumetric light, collage/cutout, or 2.5D/image treatment.

## Limits

The current production reading-layout baseline is Latin/LTR-first. Full RTL/bidirectional typography requires an explicit script-aware implementation and its own acceptance matrix.
