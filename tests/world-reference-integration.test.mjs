import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

function source(relativePath) {
  return readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

test("WORLD_01 through WORLD_08 are first-class selectable background presets", async () => {
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
    "fractal-hex-spiral-mosaic",
    "soft-hex-cell-field",
    "particle-spiral-vortex",
    "minimal-rainbow-waveform",
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
  assert.match(background, /fractalHexSpiralMosaic\.container\.visible = this\.resolvedPreset === "fractal-hex-spiral-mosaic"/);
  assert.match(background, /softHexCellField\.container\.visible = this\.resolvedPreset === "soft-hex-cell-field"/);
  assert.match(background, /particleSpiralVortex\.container\.visible = this\.resolvedPreset === "particle-spiral-vortex"/);
  assert.match(background, /minimalRainbowWaveform\.container\.visible = this\.resolvedPreset === "minimal-rainbow-waveform"/);
  assert.match(background, /minimalRainbowWaveform\.update\(time, audio, spectrum\)/);
  assert.match(background, /!specializedWorld/);
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

test("Laser Canopy is an animated moving-head disco rig with volumetric shafts and floor projection", async () => {
  const [background, laser] = await Promise.all([
    source("packages/renderer-pixi/src/effects/backgrounds/CinematicBackground.ts"),
    source("packages/renderer-pixi/src/effects/backgrounds/LaserCanopyGridWorld.ts"),
  ]);

  assert.match(laser, /Filter, GlProgram/);
  assert.match(laser, /vec2 projectPoint\(vec3 world\)/);
  assert.match(laser, /vec3 fixtureWorld\(float fixtureIndex\)/);
  assert.match(laser, /vec3 movingTarget\(float fixtureIndex, float beamIndex, float time\)/);
  assert.match(laser, /Continuous moving-head choreography/);
  assert.match(laser, /wide fan,/i);
  assert.match(laser, /crossing diagonals/i);
  assert.match(laser, /rotating floor orbit/i);
  assert.match(laser, /vec3 beamVolume\(/);
  assert.match(laser, /bright optical core plus a much wider haze body/i);
  assert.match(laser, /ellipseSpot/);
  assert.match(laser, /ellipseRing/);
  assert.match(laser, /Eight moving heads × four independently aimed shafts/);
  assert.match(laser, /Moving-head housings and lenses are intentionally visible/);
  assert.match(laser, /Near-camera haze catches a few shafts as soft colored wash/);
  assert.match(laser, /setPalette\(palette: VisualPalette\)/);
  assert.match(background, /laserCanopyGrid\.setPalette\(palette\)/);

  const geometryStart = laser.indexOf("vec3 movingTarget(");
  const beamColorStart = laser.indexOf("vec3 beamColor(", geometryStart);
  assert.ok(geometryStart >= 0 && beamColorStart > geometryStart);
  const geometrySource = laser.slice(geometryStart, beamColorStart);
  assert.doesNotMatch(geometrySource, /u(?:Bass|Mid|Treble|Energy|Transient)/);

  const volumeStart = laser.indexOf("vec3 beamVolume(");
  const spotStart = laser.indexOf("float ellipseSpot", volumeStart);
  assert.ok(volumeStart >= 0 && spotStart > volumeStart);
  const volumeSource = laser.slice(volumeStart, spotStart);
  assert.doesNotMatch(volumeSource, /u(?:Bass|Mid|Treble|Energy|Transient)/);

  assert.doesNotMatch(laser, /true projected 3D canopy/);
  assert.doesNotMatch(laser, /Longitudinal canopy strand/);
  assert.doesNotMatch(laser, /Reverse diagonal/);
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

test("Mirrorball motion is mechanical while music changes lighting only", async () => {
  const mirrorball = await source("packages/renderer-pixi/src/effects/backgrounds/DiscoMirrorballRoomWorld.ts");

  assert.match(mirrorball, /rotateY\(normal, uTime \* 0\.205\)/);
  assert.match(mirrorball, /float ballRadius = 0\.305;/);
  assert.doesNotMatch(mirrorball, /rotateY\(normal, uTime \* \([^\n]*uEnergy/);
  assert.doesNotMatch(mirrorball, /float ballRadius = [^;]*uBass/);
  assert.match(mirrorball, /smoothEnvelope/);
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
  assert.match(tunnel, /uTravel/);
  assert.match(tunnel, /uBurstAge/);
  assert.match(tunnel, /travel \+= dt \* \(1\.0 \+ this\.burst \* 0\.82\)/);
  assert.match(tunnel, /One-way burst shock front/);
  assert.doesNotMatch(tunnel, /uTime \* \([^\n]*uBass/);
});

test("Fractal Hex Spiral Mosaic is projected 3D geometry with autonomous vortex travel", async () => {
  const fractal = await source("packages/renderer-pixi/src/effects/backgrounds/FractalHexSpiralMosaicWorld.ts");

  assert.match(fractal, /Stable deterministic population/);
  assert.match(fractal, /True z-depth/);
  assert.match(fractal, /const progress = fract/);
  assert.match(fractal, /const z = 0\.25 \+ eased/);
  assert.match(fractal, /hexPlane/);
  assert.match(fractal, /project\(/);
  assert.match(fractal, /Back-to-front side faces create actual prism depth/);
  assert.match(fractal, /Small camera orbit creates real parallax/);
  assert.doesNotMatch(fractal, /vortexWarp/);
  assert.doesNotMatch(fractal, /Filter, GlProgram/);
});

test("Soft Hex Cell Field is a correctly packed projected 3D hex-prism surface", async () => {
  const softHex = await source("packages/renderer-pixi/src/effects/backgrounds/SoftHexCellFieldWorld.ts");

  assert.match(softHex, /Explicit 3D camera \+ look-at basis/);
  assert.match(softHex, /Pointy-top axial coordinates guarantee a correctly packed hex field/);
  assert.match(softHex, /SQRT3 \* radius \* \(q \+ r \* 0\.5\)/);
  assert.match(softHex, /1\.5 \* radius \* r/);
  assert.match(softHex, /0\.935 \+ seedC \* 0\.045/);
  assert.match(softHex, /cameraBasis/);
  assert.match(softHex, /Draw all six prism sides/);
  assert.match(softHex, /actual occlusion\/depth/);
  assert.doesNotMatch(softHex, /renderHexLayer/);
});

test("Particle Spiral Vortex uses projected 3D particle depth instead of a flat polar mask", async () => {
  const vortex = await source("packages/renderer-pixi/src/effects/backgrounds/ParticleSpiralVortexWorld.ts");

  assert.match(vortex, /Genuine 3D funnel/);
  assert.match(vortex, /const z = 0\.18 \+ eased \* 8\.7/);
  assert.match(vortex, /project\(/);
  assert.match(vortex, /rendered\.sort\(\(a, b\) => b\.depth - a\.depth\)/);
  assert.match(vortex, /Geometry is autonomous; audio cannot reverse or jitter it/);
  assert.match(vortex, /Bright multicolor whirlpool core/);
});

test("Minimal Rainbow Waveform is spectrum-driven, mirrored and per-bin smoothed", async () => {
  const waveform = await source("packages/renderer-pixi/src/effects/backgrounds/MinimalRainbowWaveformWorld.ts");

  assert.match(waveform, /spectrum: Float32Array/);
  assert.match(waveform, /Per-bin attack\/release/);
  assert.match(waveform, /centerY - height/);
  assert.match(waveform, /centerY \+ height/);
  assert.match(waveform, /Horizontal luminous core is segmented/);
  assert.match(waveform, /large negative space/i);
  assert.match(waveform, /updateSpectrum\(spectrum, audio/);
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
  assert.match(docs, /WORLD_05 — Fractal Hex Spiral Mosaic/);
  assert.match(docs, /WORLD_06 — Soft Hex Cell Field/);
  assert.match(docs, /WORLD_07 — Particle Spiral Vortex/);
  assert.match(docs, /WORLD_08 — Minimal Rainbow Waveform/);
  assert.match(docs, /reference images are intentionally \*\*not committed\*\*/i);
});
