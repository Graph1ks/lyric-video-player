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


test("legacy Vortex is a dedicated projected-depth world with one-way timestamp travel", async () => {
  const [background, vortex] = await Promise.all([
    source("packages/renderer-pixi/src/effects/backgrounds/CinematicBackground.ts"),
    source("packages/renderer-pixi/src/effects/backgrounds/LegacyVortexWorld.ts"),
  ]);

  assert.match(background, /"vortex",[\s\S]*"prism-stage-beams"/);
  assert.match(background, /legacyVortex\.container\.visible = this\.resolvedPreset === "vortex"/);
  assert.match(background, /legacyVortex\.update\(time, legacyAudio\)/);
  assert.match(vortex, /Helical ribbons are the identity layer/);
  assert.match(vortex, /One-way tracer flow/);
  assert.match(vortex, /const t = fract\(seed \+ time \* travelSpeed\)/);
  assert.match(vortex, /const z = 0\.12 \+ eased \* 7\.15/);
  assert.match(vortex, /project\(/);
  assert.match(vortex, /palette\?\.accentA/);
  assert.match(vortex, /palette\?\.accentB/);
  assert.doesNotMatch(vortex, /time \* \([^\n]*audio\./);
  assert.doesNotMatch(vortex, /radius = [^;]*audio\./);
  assert.doesNotMatch(vortex, /angle = [^;]*audio\./);
});


test("phase B legacy worlds use authored fidelity systems and keep motion time-owned", async () => {
  const [background, rays, starfield, nebula, grid] = await Promise.all([
    source("packages/renderer-pixi/src/effects/backgrounds/CinematicBackground.ts"),
    source("packages/renderer-pixi/src/effects/backgrounds/LegacyRaysWorld.ts"),
    source("packages/renderer-pixi/src/effects/backgrounds/LegacyStarfieldWorld.ts"),
    source("packages/renderer-pixi/src/effects/backgrounds/LegacyNebulaWorld.ts"),
    source("packages/renderer-pixi/src/effects/backgrounds/LegacyGridWorld.ts"),
  ]);

  for (const [id, field] of [
    ["rays", "legacyRays"],
    ["starfield", "legacyStarfield"],
    ["nebula", "legacyNebula"],
    ["grid", "legacyGrid"],
  ]) {
    assert.match(
      background,
      new RegExp(`${field}\\.container\\.visible = this\\.resolvedPreset === "${id}"`),
    );
    assert.match(
      background,
      new RegExp(`${field}\\.update\\(time, legacyAudio`),
    );
  }
  assert.match(background, /!artWorld && !specializedWorld/);

  // Rays: actual per-pixel participating media and broad cones, not Graphics lines.
  assert.match(rays, /GlProgram\.from/);
  assert.match(rays, /Participating-media haze/);
  assert.match(rays, /Seven broad cones with soft shoulders/);
  assert.match(rays, /float lightResponse = 0\.80 \+ uEnergy/);
  assert.doesNotMatch(rays, /source\.[xy] = [^;]*audio\./);
  assert.doesNotMatch(rays, /float width = [^;]*audio\./);

  // Starfield: fixed optical axis and monotonically decreasing z-phase.
  assert.match(starfield, /Camera flight is strictly one-way/);
  assert.match(starfield, /const phase = fract\(star\.zSeed - time \* star\.speed\)/);
  assert.match(starfield, /const previousPhase = fract\(star\.zSeed - \(time - trailSeconds\) \* star\.speed\)/);
  assert.match(starfield, /const cx = this\.w \* 0\.5/);
  assert.match(starfield, /const cy = this\.h \* 0\.5/);
  assert.doesNotMatch(starfield, /perspective spokes/i);
  assert.doesNotMatch(starfield, /const phase = [^;]*audio\./);
  assert.doesNotMatch(starfield, /const z = [^;]*audio\./);

  // Nebula: shader-domain gas density, domain warping and filament structure.
  assert.match(nebula, /GlProgram\.from/);
  assert.match(nebula, /float cloudField\(/);
  assert.match(nebula, /float warped = fbm/);
  assert.match(nebula, /float ridged\(/);
  assert.match(nebula, /folded-volume lighting/i);
  assert.doesNotMatch(nebula, /\.ellipse\(/);
  assert.doesNotMatch(nebula, /Math\.random\(/);

  // Grid: full-frame infinite perspective environment plus deterministic architecture/traffic.
  assert.match(grid, /GlProgram\.from/);
  assert.match(grid, /Infinite perspective floor/);
  assert.match(grid, /Procedural side architecture/);
  assert.match(grid, /float worldZ = inv \+ t \*/);
  assert.match(grid, /Deterministic energy traffic/);
  assert.doesNotMatch(grid, /Math\.random\(/);
});


test("minimum fidelity floor locks cinematic and liquid to authored rendering systems", async () => {
  const [background, cinematic, liquid] = await Promise.all([
    source("packages/renderer-pixi/src/effects/backgrounds/CinematicBackground.ts"),
    source("packages/renderer-pixi/src/effects/backgrounds/LegacyCinematicWorld.ts"),
    source("packages/renderer-pixi/src/effects/backgrounds/ProceduralLiquidFX.ts"),
  ]);

  for (const id of ["cinematic", "liquid"]) {\n    assert.match(background, new RegExp(`"${id}"`));\n  }
  assert.match(background, /legacyCinematic\.container\.visible = this\.resolvedPreset === "cinematic"/);
  assert.match(background, /legacyCinematic\.update\(time, legacyAudio\)/);
  assert.match(background, /liquidFX\.setPalette\(palette\)/);
  assert.match(background, /liquidFX\.setDetail\(this\.worldDetail\)/);

  // Cinematic: continuous atmospheric shader + optical identity, never generic shape soup.
  assert.match(cinematic, /GlProgram\.from/);
  assert.match(cinematic, /Filmic depth field/);
  assert.match(cinematic, /Anamorphic lens-light structure is the paused-frame identity layer/);
  assert.match(cinematic, /Foreground shadow masses create controlled parallax/);
  assert.doesNotMatch(cinematic, /\.circle\(/);
  assert.doesNotMatch(cinematic, /\.poly\(/);
  assert.doesNotMatch(cinematic, /Math\.random\(/);

  // Liquid: actual implicit 3D surface with smooth-min fusion, raymarching and material normals.
  assert.match(liquid, /float smin\(/);
  assert.match(liquid, /float field\(vec3 p\)/);
  assert.match(liquid, /vec3 normalAt\(vec3 p\)/);
  assert.match(liquid, /for \(int stepIndex = 0; stepIndex < 58; stepIndex\+\+\)/);
  assert.match(liquid, /float fresnel = pow/);
  assert.match(liquid, /setPalette\(palette: VisualPalette\)/);

  const fieldStart = liquid.indexOf("float field(vec3 p)");
  const normalStart = liquid.indexOf("vec3 normalAt(vec3 p)");
  assert.ok(fieldStart >= 0 && normalStart > fieldStart);
  const fieldSource = liquid.slice(fieldStart, normalStart);
  assert.doesNotMatch(fieldSource, /u(?:Bass|Mid|Energy|Transient)/);
  assert.doesNotMatch(liquid, /darkColor|midColor|hotColor/);
  assert.doesNotMatch(liquid, /uniform float uTransient/);
});



test("spectrum and sparks meet the dedicated fidelity floor", async () => {
  const [background, spectrum, sparks] = await Promise.all([
    source("packages/renderer-pixi/src/effects/backgrounds/CinematicBackground.ts"),
    source("packages/renderer-pixi/src/effects/backgrounds/LegacySpectrumWorld.ts"),
    source("packages/renderer-pixi/src/effects/backgrounds/LegacySparksWorld.ts"),
  ]);

  assert.match(background, /"cinematic",\s*\n\s*"liquid",\s*\n\s*"spectrum",\s*\n\s*"sparks",\s*\n\s*"vortex"/);
  assert.match(background, /legacySpectrum\.container\.visible = this\.resolvedPreset === "spectrum"/);
  assert.match(background, /legacySparks\.container\.visible = this\.resolvedPreset === "sparks"/);
  assert.match(background, /legacySpectrum\.update\(time, legacyAudio, spectrum\)/);
  assert.match(background, /legacySparks\.update\(time, legacyAudio, legacyFrame\.transientEnvelope\)/);
  assert.match(background, /this\.sparkLayer\.visible = false/);
  assert.match(background, /this\.spectrumLayer\.visible = false/);
  assert.doesNotMatch(background, /this\.updateSparks\(time/);
  assert.doesNotMatch(background, /this\.updateSpectrum\(time/);

  // Spectrum: real FFT data becomes projected 3D topography, not a second minimal waveform.
  assert.match(spectrum, /spectrum\.length >= 2/);
  assert.match(spectrum, /A logarithmic-ish sampling curve/);
  assert.match(spectrum, /projected spectral topography/i);
  assert.match(spectrum, /const lanes =/);
  assert.match(spectrum, /function project\(/);
  assert.match(spectrum, /setPalette\(palette: VisualPalette\)/);
  assert.doesNotMatch(spectrum, /Math\.random\(/);

  // Sparks: analytic ballistic trajectories with history-derived trails.
  assert.match(sparks, /const cycle = seed\.phase \+ time \* seed\.rate/);
  assert.match(sparks, /const gravity =/);
  assert.match(sparks, /const previous3 = sparkPosition/);
  assert.match(sparks, /Transient response creates extra freshly-born emission only/);
  assert.match(sparks, /setPalette\(palette: VisualPalette\)/);
  assert.doesNotMatch(sparks, /Math\.random\(/);

  const motionStart = sparks.indexOf("function sparkPosition(");
  assert.ok(motionStart >= 0);
  const motionSource = sparks.slice(motionStart);
  assert.doesNotMatch(motionSource, /audio\.|transientEnvelope/);
});


test("global spatial post FX no longer turn raw audio into scene-scale motion", async () => {
  const [post, displacement, smear] = await Promise.all([
    source("packages/renderer-pixi/src/render/CinematicPostFX.ts"),
    source("packages/renderer-pixi/src/render/ReactiveDisplacementFX.ts"),
    source("packages/renderer-pixi/src/render/ReactiveVelocitySmearFX.ts"),
  ]);

  assert.match(post, /Spatial lens shape is autonomous/);
  assert.doesNotMatch(post, /float barrel = \([^;]*uBass/);
  assert.doesNotMatch(post, /float barrel = \([^;]*uTransient/);
  assert.doesNotMatch(post, /vec2 glowOffset = [^;]*uBass/);

  assert.doesNotMatch(displacement, /warp\.[xy] \+= [^;]*u(?:Bass|Mid|Transient)/);
  assert.doesNotMatch(displacement, /float swirl = [^;]*u(?:Bass|Mid|Transient)/);
  assert.doesNotMatch(displacement, /float ripple = [^;]*u(?:Bass|Mid|Transient)/);

  assert.match(smear, /Trail sampling distance is autonomous/);
  assert.doesNotMatch(smear, /float motion = \([^;]*u(?:Bass|Energy|Transient)/);
});
