import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

function source(relativePath) {
  return readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

test("transient Pixi lyric text is explicitly destroyed on rebuild", async () => {
  const [kinetic, background] = await Promise.all([
    source("packages/renderer-pixi/src/effects/typography/KineticLyrics.ts"),
    source("packages/renderer-pixi/src/effects/backgrounds/CinematicBackground.ts"),
  ]);

  assert.match(kinetic, /word\.slot\.destroy\(\{ children: true \}\)/);
  assert.match(kinetic, /echo\.destroy\(\{ style: true \}\)/);
  assert.match(kinetic, /destroyEchoLayers\(\)/);

  assert.match(background, /this\.resolvedPreset === "lyrics"/);
  assert.match(background, /destroyLyricBackdrop\(\)/);
  assert.match(background, /echo\.destroy\(\{ style: true \}\)/);
});

test("full-frame spatial filters never allocate a transparent Pixi padding gutter", async () => {
  const paths = [
    "packages/renderer-pixi/src/render/ReactiveDisplacementFX.ts",
    "packages/renderer-pixi/src/render/ReactiveVelocitySmearFX.ts",
    "packages/renderer-pixi/src/render/CinematicPostFX.ts",
  ];

  for (const path of paths) {
    const code = await source(path);
    assert.match(code, /this\.filter\.padding = 0;/, path);
  }
});

test("presentation has an unfiltered safety plane and opaque liquid background", async () => {
  const [graph, liquid] = await Promise.all([
    source("packages/renderer-pixi/src/render/SceneRenderGraph.ts"),
    source("packages/renderer-pixi/src/effects/backgrounds/ProceduralLiquidFX.ts"),
  ]);

  assert.match(graph, /private fallback\?: Sprite;/);
  assert.match(graph, /this\.fallback\.texture = texture;/);
  assert.match(graph, /this\.output\.addChild\(this\.fallback\)/);
  assert.match(liquid, /gl_FragColor = vec4\(max\(color, vec3\(0\.0\)\), 1\.0\);/);
});
