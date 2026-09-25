import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_VISUAL_FX_RACK,
  sanitizeVisualFxRack,
} from "../packages/engine-core/dist/index.js";

test("visual FX rack supports true off and clamps extreme values to 300%", () => {
  const rack = sanitizeVisualFxRack({
    displacement: 0,
    smear: -1,
    bloom: 5,
    worldIntensity: 2.75,
    worldDetail: 3,
  });

  assert.equal(rack.displacement, 0);
  assert.equal(rack.smear, 0);
  assert.equal(rack.bloom, 3);
  assert.equal(rack.worldIntensity, 2.75);
  assert.equal(rack.worldDetail, 3);
});

test("visual FX rack keeps unspecified controls on authored defaults", () => {
  const rack = sanitizeVisualFxRack({ impactPulse: 0 });
  assert.equal(rack.impactPulse, 0);
  assert.equal(rack.cameraMotion, DEFAULT_VISUAL_FX_RACK.cameraMotion);
  assert.equal(rack.postFx, DEFAULT_VISUAL_FX_RACK.postFx);
});
