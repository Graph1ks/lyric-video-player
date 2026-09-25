import assert from "node:assert/strict";
import test from "node:test";

import {
  contrastRatio,
  createVisualPalette,
  oklchToHex,
  resolveColorHarmony,
} from "../packages/engine-core/dist/index.js";

test("OKLCH conversion preserves neutral black and white endpoints", () => {
  assert.equal(oklchToHex({ l: 0, c: 0, h: 0 }), 0x000000);
  assert.equal(oklchToHex({ l: 1, c: 0, h: 0 }), 0xffffff);
});

test("split complement palette produces separated accent hues and readable lyric roles", () => {
  const palette = createVisualPalette({
    harmony: "split-complement",
    scene: "neon",
    lineIndex: 3,
    baseHue: 210,
  });

  assert.equal(palette.resolvedHarmony, "split-complement");
  assert.ok(Math.abs(palette.accentAHue - palette.accentBHue) >= 50);
  assert.ok(palette.primaryContrast >= 7);
  assert.ok(palette.secondaryContrast >= 4.5);
  assert.ok(contrastRatio(palette.textPrimary, palette.background) >= 7);
});

test("AUTO harmony is deterministic for the same scene and cue", () => {
  const a = resolveColorHarmony("auto", "poster", 8);
  const b = resolveColorHarmony("auto", "poster", 8);
  assert.equal(a, b);
});

test("all harmony families produce finite in-gamut packed colors", () => {
  const harmonies = ["analogous", "complement", "split-complement", "triad", "tetrad", "monochrome"];
  for (const harmony of harmonies) {
    const palette = createVisualPalette({ harmony, scene: "vortex", lineIndex: 2 });
    for (const key of ["background", "surface", "textPrimary", "textSecondary", "accentA", "accentB", "glow", "muted"]) {
      assert.ok(Number.isInteger(palette[key]));
      assert.ok(palette[key] >= 0 && palette[key] <= 0xffffff);
    }
  }
});
