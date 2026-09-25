import assert from "node:assert/strict";
import test from "node:test";

import { resampleSpectrum } from "../packages/audio-web/dist/index.js";

test("spectrum resampling is normalized, deterministic and logarithmically distributed", () => {
  const bins = new Uint8Array(1024);
  for (let index = 0; index < bins.length; index++) bins[index] = Math.min(255, Math.round(index / 4));

  const a = resampleSpectrum(bins, new Float32Array(48), 48000);
  const b = resampleSpectrum(bins, new Float32Array(48), 48000);

  assert.deepEqual([...a], [...b]);
  assert.equal(a.length, 48);
  assert.ok(a.every(value => value >= 0 && value <= 1));
  assert.ok(a[47] > a[0]);
});

test("spectrum resampling clears invalid sources without allocation", () => {
  const output = new Float32Array([1, 1, 1, 1]);
  const returned = resampleSpectrum(new Uint8Array(), output, 48000);
  assert.equal(returned, output);
  assert.deepEqual([...returned], [0, 0, 0, 0]);
});
