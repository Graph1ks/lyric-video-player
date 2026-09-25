import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateCompositionMotion,
  resolveCompositionMotion,
} from "../packages/engine-core/dist/index.js";

const words = [
  { start: 1, end: 1.6, x: -420, y: -120, scale: 0.8, rotation: 0, emphasis: 0.4 },
  { start: 1.6, end: 2.25, x: 260, y: 40, scale: 1.2, rotation: Math.PI / 2, emphasis: 1 },
  { start: 2.25, end: 3, x: 80, y: 180, scale: 0.9, rotation: 0, emphasis: 0.6 },
];

function frame(preset, time) {
  return evaluateCompositionMotion({
    preset,
    scene: "neon",
    lineIndex: 4,
    time,
    lineStart: 1,
    lineEnd: 3,
    width: 1920,
    height: 1080,
    anchorIndex: 1,
    words,
    intensity: 1,
  });
}

test("composition motion AUTO is deterministic", () => {
  assert.equal(
    resolveCompositionMotion("auto", "poster", 8, 5),
    resolveCompositionMotion("auto", "poster", 8, 5),
  );
  assert.notEqual(
    resolveCompositionMotion("auto", "poster", 8, 5),
    resolveCompositionMotion("auto", "poster", 9, 5),
  );
});

test("takeover pulls the active word toward center and magnifies it", () => {
  const result = frame("takeover", 1.92);
  assert.equal(result.activeWord, 1);
  assert.ok(result.words[1].x < 0);
  assert.ok(result.words[1].scaleX > 1.2);
  assert.ok(result.words[0].alpha < 1);
});

test("collapse converges distributed words toward the composition center", () => {
  const early = frame("collapse", 1.3);
  const late = frame("collapse", 2.85);
  assert.ok(Math.abs(late.words[0].x) > Math.abs(early.words[0].x));
  const earlyFinalX = words[0].x + early.words[0].x;
  const lateFinalX = words[0].x + late.words[0].x;
  assert.ok(Math.abs(lateFinalX) < Math.abs(earlyFinalX));
});

test("flip evaluates a whole-word 90 degree entrance analytically", () => {
  const before = frame("flip", 1.02);
  const after = frame("flip", 1.5);
  assert.ok(Math.abs(before.words[0].rotation) > Math.abs(after.words[0].rotation));
  assert.ok(before.words[0].scaleX < after.words[0].scaleX);
});

test("camera handoff moves the typography stage toward the active word", () => {
  const result = frame("camera-handoff", 1.92);
  assert.equal(result.activeWord, 1);
  assert.ok(result.stage.x < 0);
  assert.ok(result.stage.scale > 1);
});

test("portal grows the active word and fades it near cue exit", () => {
  const early = frame("portal", 1.72);
  const late = frame("portal", 2.2);
  assert.ok(late.words[1].scaleX > early.words[1].scaleX);
  assert.ok(late.words[1].alpha < early.words[1].alpha);
});

test("motion evaluation is pure for identical input", () => {
  assert.deepEqual(frame("handoff", 1.8), frame("handoff", 1.8));
});
