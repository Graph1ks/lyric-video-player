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

  for (const id of [
    "prism-stage-beams",
    "laser-canopy-grid",
    "disco-mirrorball-room",
    "neon-energy-burst-tunnel",
  ]) {
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
  assert.match(background, /discoMirrorballRoom\.container\.visible = this\.resolvedPreset === "disco-mirrorball-room"/);
  assert.match(background, /neonEnergyBurstTunnel\.container\.visible = this\.resolvedPreset === "neon-energy-burst-tunnel"/);
  assert.match(background, /!artWorld && !specializedWorld/);
});

test("Prism Stage Beams uses a GPU volumetric shader instead of cartoon Graphics fixtures", async () => {
  const prism = await source("packages/renderer-pixi/src/effects/backgrounds/PrismStageBeamsWorld.ts");

  assert.match(prism, /Filter, GlProgram/);
  assert.match(prism, /wrappedAngle/);
  assert.match(prism, /streakNoise/);
  assert.match(prism, /sourceBloom/);
  assert.match(prism, /anamorphic/);
  assert.match(prism, /filmic shoulder/i);
  assert.doesNotMatch(prism, /private readonly fixtures = new Graphics/);
  assert.doesNotMatch(prism, /\.circle\(/);
});

test("Laser Canopy uses analytic shader lines, rig apertures and floor hit lighting", async () => {
  const laser = await source("packages/renderer-pixi/src/effects/backgrounds/LaserCanopyGridWorld.ts");

  assert.match(laser, /Filter, GlProgram/);
  assert.match(laser, /sdSegment/);
  assert.match(laser, /coreWidth/);
  assert.match(laser, /floorHalo/);
  assert.match(laser, /Fixture apertures/);
  assert.match(laser, /Perspective floor/);
});

test("Disco Mirrorball Room uses analytic sphere facets and layered projected reflections", async () => {
  const mirrorball = await source("packages/renderer-pixi/src/effects/backgrounds/DiscoMirrorballRoomWorld.ts");

  assert.match(mirrorball, /Filter, GlProgram/);
  assert.match(mirrorball, /spherical facets/i);
  assert.match(mirrorball, /atan\(normal\.z, normal\.x\)/);
  assert.match(mirrorball, /roomReflectionLayer/);
  assert.match(mirrorball, /reflectionColor/);
  assert.match(mirrorball, /fresnel/);
  assert.match(mirrorball, /pow\(max\(dot\(reflected, l1\), 0\.0\), 56\.0\)/);
  assert.doesNotMatch(mirrorball, /new Sprite/);
});

test("Neon Energy Burst Tunnel uses polar depth, fBm streaks and electric filaments", async () => {
  const tunnel = await source("packages/renderer-pixi/src/effects/backgrounds/NeonEnergyBurstTunnelWorld.ts");

  assert.match(tunnel, /Filter, GlProgram/);
  assert.match(tunnel, /float fbm/);
  assert.match(tunnel, /log\(radius \+ 0\.035\)/);
  assert.match(tunnel, /spokeDensity/);
  assert.match(tunnel, /wrappedAngle/);
  assert.match(tunnel, /Electric scribbles/);
  assert.match(tunnel, /central energy aperture/i);
});

test("13-world reference roadmap remains durable in repository documentation", async () => {
  const docs = await source("docs/WORLD_REFERENCE_SET_13.md");

  for (let index = 1; index <= 13; index++) {
    assert.match(docs, new RegExp(`\\| ${String(index).padStart(2, "0")} \\|`));
  }
  assert.match(docs, /WORLD_01 — Prism Stage Beams/);
  assert.match(docs, /WORLD_02 — Laser Canopy Grid/);
  assert.match(docs, /WORLD_03 — Disco Mirrorball Room/);
  assert.match(docs, /WORLD_04 — Neon Energy Burst Tunnel/);
  assert.match(docs, /reference images are intentionally \*\*not committed\*\*/i);
});
