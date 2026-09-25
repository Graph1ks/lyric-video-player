import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  DEFAULT_VISUAL_FX_RACK,
  FACTORY_VISUAL_FX_RACK,
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

test("factory FX rack exactly matches the pre-exposure authored strength", () => {
  for (const [key, value] of Object.entries(FACTORY_VISUAL_FX_RACK)) {
    assert.equal(value, 1, `${key} must reset to authored strength 1.0`);
    assert.equal(DEFAULT_VISUAL_FX_RACK[key], 1);
  }
});

test("visual FX rack keeps unspecified controls on factory defaults", () => {
  const rack = sanitizeVisualFxRack({ impactPulse: 0 });
  assert.equal(rack.impactPulse, 0);
  assert.equal(rack.cameraMotion, 1);
  assert.equal(rack.postFx, 1);
});

test("cinematic post shader keeps an explicit untouched source sample for true bypass", async () => {
  const source = await readFile(
    new URL("../packages/renderer-pixi/src/render/CinematicPostFX.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /vec4 source = texture2D\(uTexture,/);
  assert.match(source, /vec3 processed = mix\(source\.rgb, color,/);
});

test("impact amount is applied once, not squared before the background owns it", async () => {
  const renderer = await readFile(
    new URL("../packages/renderer-pixi/src/render/EngineRenderer.ts", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(renderer, /background\.hit\([^\n]*fxRack\.impactPulse/);
  assert.match(renderer, /background\.setImpactPulse\(value\.impactPulse\)/);
});
