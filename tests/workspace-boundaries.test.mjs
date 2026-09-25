import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { ELRCParser, FixedFrameClock, SceneDirector } from "../packages/engine-core/dist/index.js";
import { discoverProjects, parseProjectManifest, resolveInsideRoot } from "../packages/platform-node/dist/index.js";

test("Enhanced LRC parser preserves word timing and metadata", () => {
  const parsed = new ELRCParser().parse([
    "[ti:E-MO Test]",
    "[ar:Graph1ks]",
    "[00:01.00]<00:01.00>MOVE <00:01.40>WITH <00:01.80>ME",
    "[00:03.00]SECOND LINE",
  ].join("\n"));

  assert.equal(parsed.meta.title, "E-MO Test");
  assert.equal(parsed.lines.length, 2);
  assert.equal(parsed.lines[0].words.length, 3);
  assert.equal(parsed.lines[0].words[1].text, "WITH");
  assert.equal(parsed.lines[0].words[1].start, 1.4);
  assert.equal(parsed.lines[0].end, 3);
});

test("fixed frame clock is deterministic and seekable", () => {
  const clock = new FixedFrameClock(10, 60);
  clock.seekFrame(90);
  assert.equal(clock.time, 1.5);
  clock.seek(99);
  assert.equal(clock.time, 10);
});

test("director maps repeated hooks deterministically", () => {
  const lines = new ELRCParser().parse([
    "[00:00.00]WE GO",
    "[00:02.00]longer verse line with enough words to move",
    "[00:05.00]WE GO",
  ].join("\n")).lines;
  const director = new SceneDirector();
  director.load(lines);
  assert.equal(director.sceneFor(2).mode, "vortex");
  assert.equal(director.sceneFor(2).reason, "hook");
});

test("node project adapter discovers convention-based projects and rejects root escape", async () => {
  const root = await mkdtemp(join(tmpdir(), "emo-platform-"));
  try {
    const project = join(root, "song-a");
    await mkdir(project);
    await writeFile(join(project, "track.mp3"), "audio");
    await writeFile(join(project, "lyrics.lrc"), "[00:00.00]hello");

    const projects = await discoverProjects(root);
    assert.equal(projects.length, 1);
    assert.equal(projects[0].name, "song-a");
    assert.equal(projects[0].audio?.fileName, "track.mp3");
    assert.equal(projects[0].lyrics?.fileName, "lyrics.lrc");

    assert.throws(() => resolveInsideRoot(root, "../outside"), /escapes configured E-MO project root/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("emo.project/v1 selects nested media and carries visual defaults", async () => {
  const root = await mkdtemp(join(tmpdir(), "emo-manifest-"));
  try {
    const project = join(root, "manifest-song");
    await mkdir(join(project, "media"), { recursive: true });
    await mkdir(join(project, "lyrics"), { recursive: true });
    await mkdir(join(project, "assets"), { recursive: true });
    await writeFile(join(project, "media", "mix.m4a"), "audio");
    await writeFile(join(project, "lyrics", "enhanced.lrc"), "[00:00.00]manifest");
    await writeFile(join(project, "assets", "cover.webp"), "image");

    await writeFile(join(project, "emo.project.json"), JSON.stringify({
      schema: "emo.project/v1",
      name: "Manifest Song",
      audio: "media/mix.m4a",
      lyrics: "lyrics/enhanced.lrc",
      assets: ["assets/cover.webp"],
      defaults: {
        visualMode: "vortex",
        typographyPreset: "tunnel",
        typographyLayout: "vertical-accent",
        compositionMotion: "camera-handoff",
        backgroundPreset: "lyrics",
        colorHarmony: "split-complement",
        colorMood: "heartbreak",
        colorFlow: "rainbow",
        intensity: 1.25,
        quality: "cinema",
        syncMs: 80,
      },
    }, null, 2));

    const [found] = await discoverProjects(root);
    assert.equal(found.name, "Manifest Song");
    assert.equal(found.manifest?.schema, "emo.project/v1");
    assert.equal(found.audio?.relativePath, "manifest-song/media/mix.m4a");
    assert.equal(found.lyrics?.relativePath, "manifest-song/lyrics/enhanced.lrc");
    assert.equal(found.manifest?.defaults?.visualMode, "vortex");
    assert.equal(found.manifest?.defaults?.typographyPreset, "tunnel");
    assert.equal(found.manifest?.defaults?.typographyLayout, "vertical-accent");
    assert.equal(found.manifest?.defaults?.compositionMotion, "camera-handoff");
    assert.equal(found.manifest?.defaults?.backgroundPreset, "lyrics");
    assert.equal(found.manifest?.defaults?.colorHarmony, "split-complement");
    assert.equal(found.manifest?.defaults?.colorMood, "heartbreak");
    assert.equal(found.manifest?.defaults?.colorFlow, "rainbow");
    assert.equal(found.manifest?.defaults?.syncMs, 80);
    assert.ok(found.assets.some(asset => asset.relativePath.endsWith("assets/cover.webp")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("emo.project/v1 rejects traversal and invalid visual defaults", () => {
  assert.throws(() => parseProjectManifest(JSON.stringify({
    schema: "emo.project/v1",
    audio: "../outside.mp3",
    lyrics: "lyrics.lrc",
  })), /must stay inside the project directory/);

  assert.throws(() => parseProjectManifest(JSON.stringify({
    schema: "emo.project/v1",
    audio: "track.mp3",
    lyrics: "lyrics.lrc",
    defaults: { visualMode: "unknown" },
  })), /visualMode is invalid/);

  assert.throws(() => parseProjectManifest(JSON.stringify({
    schema: "emo.project/v1",
    audio: "track.mp3",
    lyrics: "lyrics.lrc",
    defaults: { typographyPreset: "unknown" },
  })), /typographyPreset is invalid/);

  assert.throws(() => parseProjectManifest(JSON.stringify({
    schema: "emo.project/v1",
    audio: "track.mp3",
    lyrics: "lyrics.lrc",
    defaults: { typographyLayout: "unknown" },
  })), /typographyLayout is invalid/);

  assert.throws(() => parseProjectManifest(JSON.stringify({
    schema: "emo.project/v1",
    audio: "track.mp3",
    lyrics: "lyrics.lrc",
    defaults: { compositionMotion: "unknown" },
  })), /compositionMotion is invalid/);

  assert.throws(() => parseProjectManifest(JSON.stringify({
    schema: "emo.project/v1",
    audio: "track.mp3",
    lyrics: "lyrics.lrc",
    defaults: { backgroundPreset: "unknown" },
  })), /backgroundPreset is invalid/);

  assert.throws(() => parseProjectManifest(JSON.stringify({
    schema: "emo.project/v1",
    audio: "track.mp3",
    lyrics: "lyrics.lrc",
    defaults: { colorHarmony: "unknown" },
  })), /colorHarmony is invalid/);

  assert.throws(() => parseProjectManifest(JSON.stringify({
    schema: "emo.project/v1",
    audio: "track.mp3",
    lyrics: "lyrics.lrc",
    defaults: { colorMood: "unknown" },
  })), /colorMood is invalid/);

  assert.throws(() => parseProjectManifest(JSON.stringify({
    schema: "emo.project/v1",
    audio: "track.mp3",
    lyrics: "lyrics.lrc",
    defaults: { colorFlow: "strobe" },
  })), /colorFlow is invalid/);
});
