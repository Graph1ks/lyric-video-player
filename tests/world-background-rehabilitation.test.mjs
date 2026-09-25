import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  chooseWorldTextPolarity,
  createVisualPalette,
  createWorldColorContext,
} from "../packages/engine-core/dist/index.js";
import { WorldAudioReactivity } from "../packages/renderer-pixi/dist/effects/backgrounds/WorldAudioReactivity.js";

function source(relativePath) {
  return readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

const quiet = {
  bass: 0.08,
  mid: 0.12,
  treble: 0.1,
  energy: 0.1,
  transient: 0.05,
};

test("world audio reactivity smooths continuous bands and emits one-shot transient events", () => {
  const reactivity = new WorldAudioReactivity();
  const initial = reactivity.update(10, quiet);
  assert.equal(initial.discontinuity, true);
  assert.equal(initial.transientRise, false);

  const frame = reactivity.update(10.016, {
    bass: 1,
    mid: 0.8,
    treble: 0.7,
    energy: 0.95,
    transient: 0.9,
  });
  const smoothedBass = frame.bands.bass;
  const envelope = frame.transientEnvelope;

  assert.equal(frame.discontinuity, false);
  assert.equal(frame.transientRise, true);
  assert.ok(smoothedBass > quiet.bass && smoothedBass < 1);
  assert.ok(envelope > 0.5);

  const sameFrameObject = reactivity.update(10.032, {
    bass: 1,
    mid: 0.8,
    treble: 0.7,
    energy: 0.95,
    transient: 0.88,
  });
  assert.strictEqual(sameFrameObject, frame);
  assert.equal(sameFrameObject.transientRise, false);
  assert.ok(sameFrameObject.transientEnvelope < envelope);
});

test("world audio reactivity resets on seek/discontinuity without inventing a burst", () => {
  const reactivity = new WorldAudioReactivity();
  reactivity.update(4, quiet);
  reactivity.update(4.016, { ...quiet, transient: 0.9, energy: 0.8 });

  const seek = reactivity.update(1.5, {
    bass: 0.72,
    mid: 0.55,
    treble: 0.33,
    energy: 0.61,
    transient: 0.75,
  });

  assert.equal(seek.discontinuity, true);
  assert.equal(seek.transientRise, false);
  assert.equal(seek.transientEnvelope, 0);
  assert.equal(seek.bands.bass, 0.72);
  assert.equal(seek.longEnergy, 0.61);
});

test("world color context selects stable polarity and requests support for busy mid-tone worlds", () => {
  const palette = createVisualPalette({
    harmony: "split-complement",
    mood: "dream",
    canvas: "night",
    scene: "neon",
    lineIndex: 2,
  });

  const dark = createWorldColorContext({
    palette,
    titleSafeLuminance: 0.03,
    busyness: 0.15,
  });
  const bright = createWorldColorContext({
    palette,
    titleSafeLuminance: 0.78,
    busyness: 0.15,
  });
  const busyMid = createWorldColorContext({
    palette,
    titleSafeLuminance: 0.18,
    busyness: 0.92,
    highlightRisk: 0.8,
  });

  assert.equal(dark.recommendedPolarity, "light");
  assert.equal(bright.recommendedPolarity, "dark");
  assert.ok(busyMid.outlineStrength > dark.outlineStrength);

  assert.equal(chooseWorldTextPolarity(0.18, "light"), "light");
  assert.equal(chooseWorldTextPolarity(0.18, "dark"), "dark");
  assert.equal(chooseWorldTextPolarity(0.55, "light"), "dark");
  assert.equal(chooseWorldTextPolarity(0.04, "dark"), "light");
});

test("legacy shared geometry consumes smoothed/event audio instead of raw global pump mappings", async () => {
  const [background, art, liquid] = await Promise.all([
    source("packages/renderer-pixi/src/effects/backgrounds/CinematicBackground.ts"),
    source("packages/renderer-pixi/src/effects/backgrounds/ArtDirectionWorlds.ts"),
    source("packages/renderer-pixi/src/effects/backgrounds/ProceduralLiquidFX.ts"),
  ]);

  assert.match(background, /legacyReactivity\.update\(time, audio\)/);
  assert.match(background, /this\.artDirection\.update\(time, legacyAudio\)/);
  assert.match(background, /this\.discoMirrorballRoom\.update\(time, audio\)/);
  assert.doesNotMatch(background, /bass \* \(0\.1 \+ index \* 0\.01\)/);
  assert.doesNotMatch(background, /transient \* \(0\.18 \+ particle\.depth \* 0\.35\)/);
  assert.doesNotMatch(background, /transient \* 1\.6/);
  assert.doesNotMatch(art, /const breathe = [^\n]*audio\.bass/);
  assert.doesNotMatch(liquid, /float speed = [^;]*uEnergy/);
  assert.doesNotMatch(liquid, /fbm\(warped \* \([^\n]*uBass/);
});
