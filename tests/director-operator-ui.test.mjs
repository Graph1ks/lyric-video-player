import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

function source(relativePath) {
  return readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

test("detached Director owns a dedicated professional command deck and transport", async () => {
  const [director, css] = await Promise.all([
    source("apps/web/src/DirectorWindow.tsx"),
    source("apps/web/src/styles.css"),
  ]);

  assert.match(director, /director-command-deck/);
  assert.match(director, /director-transport-console/);
  assert.match(director, /director-main-counter/);
  assert.match(director, /director-pro-timeline/);
  assert.match(director, /useSmoothDirectorPlayback/);
  assert.match(css, /\.director-command-strip\s*\{/);
  assert.match(css, /\.director-transport-console\s*\{/);
});

test("Director playback telemetry is independent from the renderer RAF", async () => {
  const app = await source("apps/web/src/App.tsx");

  assert.match(app, /const syncPlaybackTelemetry = \(\) =>/);
  assert.match(app, /"timeupdate"/);
  assert.match(app, /"durationchange"/);
  assert.match(app, /window\.setInterval\(syncPlaybackTelemetry, 125\)/);
  assert.match(app, /setDirectorPlayback\(clock\.time, clock\.duration\)/);
});

test("main player uses the same production-console design language", async () => {
  const [app, css] = await Promise.all([
    source("apps/web/src/App.tsx"),
    source("apps/web/src/styles.css"),
  ]);

  assert.match(app, /player-command-bar/);
  assert.match(app, /player-transport-console/);
  assert.match(app, /className="hud-button"/);
  assert.match(css, /\.player-command-bar\s*\{/);
  assert.match(css, /\.player-transport-console\s*\{/);
});

test("previously hidden renderer effects are exposed through the Director FX rack", async () => {
  const [director, renderer, rack] = await Promise.all([
    source("apps/web/src/VisualDirector.tsx"),
    source("packages/renderer-pixi/src/render/EngineRenderer.ts"),
    source("packages/engine-core/src/visualFxRack.ts"),
  ]);

  for (const effect of [
    "cameraMotion",
    "impactPulse",
    "displacement",
    "smear",
    "bloom",
    "feedback",
    "postFx",
    "worldIntensity",
    "worldDetail",
    "screenBloom",
    "scanlines",
    "grain",
    "vignette",
  ]) {
    assert.match(rack, new RegExp(effect));
    assert.match(director, new RegExp(effect));
  }
  assert.match(renderer, /setFxRack\(value: VisualFxRack\)/);
  assert.match(renderer, /setEffectLevels\(value\.cameraMotion, value\.impactPulse\)/);
  assert.match(renderer, /setFeedbackMix\(value\.feedback\)/);
});
