import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Butterchurn remains a background source beneath all lyric typography", async () => {
  const source = await readFile("packages/renderer-pixi/src/render/EngineRenderer.ts", "utf8");
  assert.match(
    source,
    /scene\.addChild\(this\.milkdrop\.container, this\.background\.container, this\.camera\)/,
  );
  assert.match(source, /backgroundEngine === "milkdrop"/);
  assert.match(source, /milkdrop\.getWorldColorContext/);
});

test("MilkDrop quality controls use Butterchurn render scale and native output AA", async () => {
  const source = await readFile(
    "packages/renderer-pixi/src/effects/backgrounds/ButterchurnBackground.ts",
    "utf8",
  );
  assert.match(source, /textureRatio: this\.settings\.renderScale/);
  assert.match(source, /setOutputAA\(this\.settings\.fxaa\)/);
  assert.match(source, /analysisCanvas\.width = 48/);
  assert.match(source, /titleSafeLuminance/);
});

test("the product does not bundle a preset pack", async () => {
  const webPackage = JSON.parse(await readFile("apps/web/package.json", "utf8"));
  const rendererPackage = JSON.parse(await readFile("packages/renderer-pixi/package.json", "utf8"));
  const dependencies = {
    ...webPackage.dependencies,
    ...rendererPackage.dependencies,
  };
  assert.equal(dependencies["butterchurn-presets"], undefined);
  assert.equal(dependencies.butterchurn, "3.0.0-beta.5");
  assert.equal(dependencies["milkdrop-preset-converter"], "0.1.2");
});
