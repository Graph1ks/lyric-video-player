import assert from "node:assert/strict";
import test from "node:test";

import {
  analyzeKineticReadability,
  evaluateCinematicCameraPlan,
  evaluateElasticTether,
} from "../packages/engine-core/dist/index.js";

const expressive = analyzeKineticReadability({
  lineStart: 0,
  lineEnd: 3,
  words: [
    { start: 0, end: 0.8, text: "PULL" },
    { start: 0.8, end: 1.6, text: "ME" },
    { start: 1.6, end: 3, text: "IN" },
  ],
});

const burst = analyzeKineticReadability({
  lineStart: 0,
  lineEnd: 0.48,
  words: [
    { start: 0, end: 0.12, text: "A" },
    { start: 0.12, end: 0.24, text: "B" },
    { start: 0.24, end: 0.36, text: "C" },
    { start: 0.36, end: 0.48, text: "D" },
  ],
});

test("Elastic Tether stretches along a horizontal pull and settles at target", () => {
  const entering = evaluateElasticTether({
    time: 0.03,
    start: 0,
    end: 0.8,
    sourceX: -420,
    sourceY: 30,
    budget: expressive.motion,
  });
  const settled = evaluateElasticTether({
    time: 0.72,
    start: 0,
    end: 0.8,
    sourceX: -420,
    sourceY: 30,
    budget: expressive.motion,
  });

  assert.ok(entering.scaleX > entering.scaleY);
  assert.ok(Math.abs(entering.x) > Math.abs(settled.x));
  assert.ok(Math.abs(settled.x) < 8);
  assert.ok(Math.abs(settled.y) < 8);
  assert.ok(settled.alpha > 0.99);
});

test("Elastic Tether remains kinetic but reduces travel and deformation under burst pressure", () => {
  const slow = evaluateElasticTether({
    time: 0.04,
    start: 0,
    end: 0.8,
    sourceX: 360,
    sourceY: -110,
    budget: expressive.motion,
  });
  const fast = evaluateElasticTether({
    time: 0.04,
    start: 0,
    end: 0.12,
    sourceX: 360,
    sourceY: -110,
    budget: burst.motion,
  });

  assert.ok(Math.abs(fast.x) > 0);
  assert.ok(Math.abs(fast.x) < Math.abs(slow.x));
  assert.ok(Math.abs(fast.scaleX - 1) < Math.abs(slow.scaleX - 1));
});

test("camera plan follows eye trace while protecting Shape Build framing", () => {
  const hero = evaluateCinematicCameraPlan({
    mode: "poster",
    shotRole: "accent",
    sequenceGrammar: "hero-echo",
    phraseProgress: 0.5,
    focus: { x: 0.62, y: -0.18 },
    readabilityPressure: 0.5,
  });
  const shape = evaluateCinematicCameraPlan({
    mode: "poster",
    shotRole: "establish",
    sequenceGrammar: "shape-build",
    phraseProgress: 0.5,
    focus: { x: 0.62, y: -0.18 },
    readabilityPressure: 0.5,
  });

  assert.ok(hero.offsetX < 0);
  assert.ok(Math.abs(hero.offsetX) > Math.abs(shape.offsetX));
  assert.ok(hero.scale > shape.scale);
  assert.ok(shape.microMotionScale < hero.microMotionScale);
});

test("camera impulse budget drops as lyric readability pressure rises", () => {
  const calm = evaluateCinematicCameraPlan({
    mode: "neon",
    shotRole: "develop",
    sequenceGrammar: "ribbon-path",
    phraseProgress: 0.4,
    focus: { x: -0.3, y: 0.2 },
    readabilityPressure: 0.4,
  });
  const dense = evaluateCinematicCameraPlan({
    mode: "neon",
    shotRole: "develop",
    sequenceGrammar: "ribbon-path",
    phraseProgress: 0.4,
    focus: { x: -0.3, y: 0.2 },
    readabilityPressure: 1.8,
  });

  assert.ok(dense.impulseScale < calm.impulseScale);
  assert.ok(Math.abs(dense.offsetX) < Math.abs(calm.offsetX));
});
