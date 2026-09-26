import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  discoverMilkdropPresets,
  discoverMilkdropTextures,
} from "../packages/platform-node/dist/index.js";

test("MilkDrop library index preserves nested folder structure without leaking absolute paths", async () => {
  const root = await mkdtemp(join(tmpdir(), "emo-milkdrop-"));
  try {
    await mkdir(join(root, "Fractal", "Deep"), { recursive: true });
    await writeFile(join(root, "Fractal", "Alpha.milk"), "[preset00]\nfRating=5");
    await writeFile(join(root, "Fractal", "Deep", "Beta.milk"), "[preset00]\nfRating=5");
    await writeFile(join(root, "ignore.txt"), "not a preset");

    const presets = await discoverMilkdropPresets(root);
    assert.equal(presets.length, 2);
    assert.deepEqual(presets.map(preset => preset.folders), [["Fractal"], ["Fractal", "Deep"]]);
    assert.ok(presets.every(preset => !preset.relativePath.includes(root)));
    assert.ok(presets.every(preset => /^[a-f0-9]{16}$/.test(preset.id)));

    const rescanned = await discoverMilkdropPresets(root);
    assert.deepEqual(
      rescanned.map(preset => preset.id),
      presets.map(preset => preset.id),
      "stable relative paths must produce stable library IDs",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("MilkDrop texture index accepts browser-decodable image formats and ignores unrelated files", async () => {
  const root = await mkdtemp(join(tmpdir(), "emo-milkdrop-textures-"));
  try {
    await mkdir(join(root, "nested"), { recursive: true });
    await writeFile(join(root, "noise_lq.png"), "png");
    await writeFile(join(root, "nested", "custom.webp"), "webp");
    await writeFile(join(root, "nested", "legacy.dds"), "dds");

    const textures = await discoverMilkdropTextures(root);
    assert.equal(textures.length, 2);
    assert.deepEqual(textures.map(texture => texture.name), ["noise_lq", "custom"]);
    assert.ok(textures.every(texture => !texture.relativePath.includes(root)));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
