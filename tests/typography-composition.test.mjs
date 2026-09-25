import assert from "node:assert/strict";
import test from "node:test";

import {
  planTypographyComposition,
  resolveTypographyLayout,
} from "../packages/engine-core/dist/index.js";

test("typography composition AUTO is deterministic per scene and cue", () => {
  const a = resolveTypographyLayout("auto", "poster", 7, 5);
  const b = resolveTypographyLayout("auto", "poster", 7, 5);
  assert.equal(a, b);
  assert.notEqual(resolveTypographyLayout("auto", "poster", 7, 5), resolveTypographyLayout("auto", "poster", 8, 5));
});

test("directional stage creates mixed orientations and independent entrances", () => {
  const plan = planTypographyComposition({
    preset: "directional-stage",
    scene: "neon",
    width: 1920,
    height: 1080,
    lineIndex: 2,
    wordWidths: [140, 260, 380, 190],
    wordTexts: ["I", "DON'T", "WANNA", "GO"],
  });

  assert.equal(plan.layout, "directional-stage");
  assert.equal(plan.words.length, 4);
  assert.ok(plan.words.some(word => Math.abs(word.rotation) > 1));
  assert.ok(plan.words.some(word => Math.abs(word.entryX) > 500));
  assert.ok(plan.words.some(word => word.entryScale < 0.4));
});

test("vertical accent rotates the dominant word and keeps placements inside the stage budget", () => {
  const plan = planTypographyComposition({
    preset: "vertical-accent",
    scene: "poster",
    width: 1280,
    height: 720,
    lineIndex: 1,
    wordWidths: [100, 540, 180, 220],
  });

  assert.equal(plan.anchorIndex, 1);
  assert.ok(Math.abs(plan.words[1].rotation) > 1.5);
  for (const word of plan.words) {
    assert.ok(Number.isFinite(word.x));
    assert.ok(Number.isFinite(word.y));
    assert.ok(word.scale > 0);
  }
});

test("single-word AUTO falls back to a centered composition", () => {
  const plan = planTypographyComposition({
    preset: "auto",
    scene: "vortex",
    width: 1920,
    height: 1080,
    lineIndex: 99,
    wordWidths: [620],
  });

  assert.equal(plan.layout, "center-stack");
  assert.equal(plan.words.length, 1);
});
