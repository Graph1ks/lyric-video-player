import assert from "node:assert/strict";
import test from "node:test";

import {
  assessTypographyComposition,
  planTypographyComposition,
} from "../packages/engine-core/dist/index.js";

const LAYOUTS = [
  "center-stack",
  "directional-stage",
  "editorial",
  "vertical-accent",
  "split-stage",
  "crossword",
];

const VIEWPORTS = [
  { name: "desktop-1080p", width: 1920, height: 1080 },
  { name: "laptop-768p", width: 1366, height: 768 },
  { name: "portrait-1080", width: 1080, height: 1920 },
  { name: "mobile-portrait", width: 390, height: 844 },
];

function widthsFor(width) {
  return [0.10, 0.26, 0.31, 0.18, 0.34, 0.22].map(value => width * value);
}

for (const viewport of VIEWPORTS) {
  for (const layout of LAYOUTS) {
    test(`readability matrix: ${layout} stays inside attention field on ${viewport.name}`, () => {
      const wordHeight = Math.max(24, Math.min(112, viewport.height * 0.105));
      const widths = widthsFor(viewport.width);
      const plan = planTypographyComposition({
        preset: layout,
        scene: layout === "editorial" ? "poster" : "neon",
        width: viewport.width,
        height: viewport.height,
        lineIndex: 4,
        wordWidths: widths,
        wordHeight,
      });
      const assessment = assessTypographyComposition(plan, widths, wordHeight);

      assert.equal(
        assessment.overflowCount,
        0,
        `${layout}/${viewport.name} overflowed the attention field`,
      );
      assert.ok(
        assessment.maxOverlapRatio <= 0.14,
        `${layout}/${viewport.name} overlap ratio ${assessment.maxOverlapRatio.toFixed(3)} is too high`,
      );
    });
  }
}

test("readability matrix remains deterministic", () => {
  const input = {
    preset: "crossword",
    scene: "vortex",
    width: 1366,
    height: 768,
    lineIndex: 7,
    wordWidths: widthsFor(1366),
    wordHeight: 81,
  };
  const a = planTypographyComposition(input);
  const b = planTypographyComposition(input);
  assert.deepEqual(a, b);
  assert.deepEqual(
    assessTypographyComposition(a, input.wordWidths, input.wordHeight),
    assessTypographyComposition(b, input.wordWidths, input.wordHeight),
  );
});
