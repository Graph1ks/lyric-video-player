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

test("vertical accent keeps the dominant word emphasized while rotating only a logical edge cue", () => {
  const plan = planTypographyComposition({
    preset: "vertical-accent",
    scene: "poster",
    width: 1280,
    height: 720,
    lineIndex: 1,
    wordWidths: [100, 540, 180, 220],
  });

  assert.equal(plan.anchorIndex, 1);
  assert.equal(plan.words[1].emphasis, 1);
  const vertical = plan.words
    .map((word, index) => ({ index, rotation: Math.abs(word.rotation) }))
    .filter(word => word.rotation > 1.5);
  assert.equal(vertical.length, 1);
  assert.ok(vertical[0].index === 0 || vertical[0].index === plan.words.length - 1);

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


function box(word, width, height) {
  const vertical = Math.abs(Math.abs(word.rotation) - Math.PI / 2) < 0.2;
  const w = (vertical ? height : width) * word.scale;
  const h = (vertical ? width : height) * word.scale;
  return {
    left: word.x - w / 2,
    right: word.x + w / 2,
    top: word.y - h / 2,
    bottom: word.y + h / 2,
  };
}

test("composition keeps readable words inside the central attention field", () => {
  const widths = [620, 410, 540, 360, 500];
  const height = 112;
  const plan = planTypographyComposition({
    preset: "editorial",
    scene: "poster",
    width: 1920,
    height: 1080,
    lineIndex: 3,
    wordWidths: widths,
    wordHeight: height,
  });

  const field = plan.attentionField;
  for (let index = 0; index < plan.words.length; index++) {
    const bounds = box(plan.words[index], widths[index], height);
    assert.ok(bounds.left >= field.x - field.width / 2 - 1);
    assert.ok(bounds.right <= field.x + field.width / 2 + 1);
    assert.ok(bounds.top >= field.y - field.height / 2 - 1);
    assert.ok(bounds.bottom <= field.y + field.height / 2 + 1);
  }
});

test("split-stage follows rows instead of alternating left-right cue jumps", () => {
  const plan = planTypographyComposition({
    preset: "split-stage",
    scene: "neon",
    width: 1600,
    height: 900,
    lineIndex: 4,
    wordWidths: [180, 220, 200, 240, 160, 260],
    wordHeight: 90,
  });

  const firstRow = plan.words.slice(0, 3);
  const secondRow = plan.words.slice(3);
  assert.ok(firstRow[0].x < firstRow[1].x && firstRow[1].x < firstRow[2].x);
  assert.ok(secondRow[0].x < secondRow[1].x && secondRow[1].x < secondRow[2].x);
  assert.ok(firstRow.every(word => word.y < secondRow[0].y));
});

test("vertical accents are restricted to a logical edge word", () => {
  const plan = planTypographyComposition({
    preset: "vertical-accent",
    scene: "poster",
    width: 1920,
    height: 1080,
    lineIndex: 2,
    wordWidths: [220, 310, 280, 420],
    wordHeight: 108,
  });

  const vertical = plan.words
    .map((word, index) => ({ index, vertical: Math.abs(word.rotation) > 1 }))
    .filter(item => item.vertical);
  assert.equal(vertical.length, 1);
  assert.ok(vertical[0].index === 0 || vertical[0].index === plan.words.length - 1);
});
