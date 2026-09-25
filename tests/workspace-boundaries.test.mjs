import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { ELRCParser, FixedFrameClock, SceneDirector } from "../packages/engine-core/dist/index.js";
import { discoverProjects, resolveInsideRoot } from "../packages/platform-node/dist/index.js";

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

test("node project adapter discovers projects and rejects root escape", async () => {
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
