import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

function source(relativePath) {
  return readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

test("WORLD_01 and WORLD_02 are first-class selectable background presets", async () => {
  const [types, catalog, background] = await Promise.all([
    source("packages/engine-core/src/types.ts"),
    source("apps/web/src/directorCatalog.ts"),
    source("packages/renderer-pixi/src/effects/backgrounds/CinematicBackground.ts"),
  ]);

  for (const id of ["prism-stage-beams", "laser-canopy-grid"]) {
    assert.match(types, new RegExp(`\\| "${id}"`));
    assert.match(catalog, new RegExp(`value: "${id}"`));
    assert.match(background, new RegExp(`"${id}"`));
  }
});

test("specialized stage and laser worlds suppress generic background layers", async () => {
  const background = await source("packages/renderer-pixi/src/effects/backgrounds/CinematicBackground.ts");

  assert.match(background, /SPECIALIZED_WORLD_PRESETS/);
  assert.match(background, /prismStageBeams\.container\.visible = this\.resolvedPreset === "prism-stage-beams"/);
  assert.match(background, /laserCanopyGrid\.container\.visible = this\.resolvedPreset === "laser-canopy-grid"/);
  assert.match(background, /!artWorld && !specializedWorld/);
});

test("prism stage world owns volumetric beam layers and visible fixture hub", async () => {
  const prism = await source("packages/renderer-pixi/src/effects/backgrounds/PrismStageBeamsWorld.ts");

  assert.match(prism, /private readonly beams = new Graphics\(\)/);
  assert.match(prism, /private readonly fixtures = new Graphics\(\)/);
  assert.match(prism, /private readonly flare = new Graphics\(\)/);
  assert.match(prism, /this\.beams\.blendMode = "add"/);
  assert.match(prism, /transient/);
  assert.match(prism, /COLORS/);
});

test("laser canopy world owns crisp beam cores, overhead rig and floor hit points", async () => {
  const laser = await source("packages/renderer-pixi/src/effects/backgrounds/LaserCanopyGridWorld.ts");

  assert.match(laser, /private readonly rig = new Graphics\(\)/);
  assert.match(laser, /private readonly beams = new Graphics\(\)/);
  assert.match(laser, /private readonly floor = new Graphics\(\)/);
  assert.match(laser, /crispWidth/);
  assert.match(laser, /landingX/);
  assert.match(laser, /hitRadius/);
});

test("13-world reference roadmap remains durable in repository documentation", async () => {
  const docs = await source("docs/WORLD_REFERENCE_SET_13.md");

  for (let index = 1; index <= 13; index++) {
    assert.match(docs, new RegExp(`\\| ${String(index).padStart(2, "0")} \\|`));
  }
  assert.match(docs, /WORLD_01 — Prism Stage Beams/);
  assert.match(docs, /WORLD_02 — Laser Canopy Grid/);
  assert.match(docs, /reference images are intentionally \*\*not committed\*\*/i);
});
