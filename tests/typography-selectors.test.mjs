import assert from "node:assert/strict";
import test from "node:test";

import {
  EMPTY_AUDIO_BANDS,
  combineSelectorWeights,
  rangeSelector,
  staggerSelector,
  waveSelector,
  wiggleSelector,
} from "../packages/engine-core/dist/index.js";

function context(overrides = {}) {
  return {
    index: 2,
    count: 8,
    wordIndex: 0,
    wordCount: 2,
    lineIndex: 3,
    time: 1.25,
    lineProgress: 0.4,
    wordProgress: 0.6,
    seed: 0.371,
    audio: EMPTY_AUDIO_BANDS,
    ...overrides,
  };
}

test("range selector gives deterministic feathered glyph weights", () => {
  const inside = rangeSelector(context({ index: 3 }), { start: 0.25, end: 0.75, feather: 0.1 });
  const outside = rangeSelector(context({ index: 0 }), { start: 0.25, end: 0.75, feather: 0.1 });
  assert.equal(inside, 1);
  assert.equal(outside, 0);
});

test("stagger selector respects direction and progresses monotonically", () => {
  const earlyForward = staggerSelector(context({ index: 0 }), { progress: 0.35, spread: 0.7, order: "forward" });
  const lateForward = staggerSelector(context({ index: 7 }), { progress: 0.35, spread: 0.7, order: "forward" });
  const earlyReverse = staggerSelector(context({ index: 7 }), { progress: 0.35, spread: 0.7, order: "reverse" });
  assert.ok(earlyForward > lateForward);
  assert.equal(earlyForward, earlyReverse);
});

test("random stagger order and wiggle are deterministic for the same frame", () => {
  const a = staggerSelector(context({ index: 5 }), { progress: 0.55, spread: 0.75, order: "random", seed: 99 });
  const b = staggerSelector(context({ index: 5 }), { progress: 0.55, spread: 0.75, order: "random", seed: 99 });
  assert.equal(a, b);

  const wiggleA = wiggleSelector(context(), { frequency: 8, seed: 123 });
  const wiggleB = wiggleSelector(context(), { frequency: 8, seed: 123 });
  const wiggleLater = wiggleSelector(context({ time: 1.75 }), { frequency: 8, seed: 123 });
  assert.equal(wiggleA, wiggleB);
  assert.notEqual(wiggleA, wiggleLater);
});

test("wave selector stays normalized and selector blending is clamped", () => {
  for (let index = 0; index < 8; index++) {
    const value = waveSelector(context({ index, time: index * 0.13 }), { cycles: 2.2, speed: 3.4 });
    assert.ok(value >= 0 && value <= 1);
  }

  assert.equal(combineSelectorWeights([0.5, 0.5], "multiply"), 0.25);
  assert.equal(combineSelectorWeights([0.7, 0.6], "add"), 1);
  assert.equal(combineSelectorWeights([0.2, 0.8, 0.4], "max"), 0.8);
});
