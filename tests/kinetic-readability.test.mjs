import assert from "node:assert/strict";
import test from "node:test";

import {
  analyzeKineticReadability,
  evaluateCompositionMotion,
} from "../packages/engine-core/dist/index.js";

function words(step, duration, count, text = "WORD") {
  return Array.from({ length: count }, (_, index) => ({
    start: index * step,
    end: index * step + duration,
    text,
  }));
}

test("readability pressure classifies generous and burst lyric timing", () => {
  const expressive = analyzeKineticReadability({
    lineStart: 0,
    lineEnd: 4,
    words: words(0.8, 0.65, 5, "slow"),
  });
  const burst = analyzeKineticReadability({
    lineStart: 0,
    lineEnd: 1.05,
    words: words(0.12, 0.1, 8, "velocity"),
  });

  assert.equal(expressive.tier, "expressive");
  assert.equal(burst.tier, "burst");
  assert.ok(burst.pressure > expressive.pressure);
  assert.ok(burst.motion.travelScale > 0);
  assert.ok(burst.motion.travelScale < expressive.motion.travelScale);
  assert.ok(burst.motion.alphaFloor > expressive.motion.alphaFloor);
});

test("rapid motion budget preserves movement while reducing extreme excursions", () => {
  const base = {
    preset: "takeover",
    scene: "poster",
    lineIndex: 2,
    width: 1920,
    height: 1080,
    anchorIndex: 0,
    intensity: 1,
  };

  const slowWords = [
    { start: 0, end: 1.2, x: -320, y: 90, scale: 1, rotation: 0, emphasis: 1, text: "DOMINATE" },
    { start: 1.2, end: 2.4, x: 250, y: -80, scale: 1, rotation: 0, emphasis: 0.5, text: "SPACE" },
  ];
  const fastWords = [
    { start: 0, end: 0.12, x: -320, y: 90, scale: 1, rotation: 0, emphasis: 1, text: "DOMINATE" },
    { start: 0.12, end: 0.24, x: 250, y: -80, scale: 1, rotation: 0, emphasis: 0.5, text: "SPACE" },
  ];

  const slow = evaluateCompositionMotion({
    ...base,
    time: 0.55,
    lineStart: 0,
    lineEnd: 2.4,
    words: slowWords,
  });
  const fast = evaluateCompositionMotion({
    ...base,
    time: 0.06,
    lineStart: 0,
    lineEnd: 0.24,
    words: fastWords,
  });

  assert.ok(Math.abs(fast.words[0].x) > 0);
  assert.ok(Math.abs(fast.words[0].x) < Math.abs(slow.words[0].x));
  assert.ok(fast.words[0].scaleX > 1);
  assert.ok(fast.words[0].scaleX < slow.words[0].scaleX);
});
