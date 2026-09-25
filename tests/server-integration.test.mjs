import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import test from "node:test";

import { createEmoServer } from "../apps/server/dist/server.js";

test("EmoServer serves manifest projects, SPA shell and byte ranges end-to-end", async () => {
  const temp = await mkdtemp(join(tmpdir(), "emo-server-integration-"));
  const root = join(temp, "projects");
  const webDist = join(temp, "web");
  const projectDir = join(root, "manifest-song");
  const audioBytes = Buffer.from("0123456789abcdef", "utf8");
  const lrc = "[00:00.00]<00:00.00>MOVE <00:00.40>NOW";

  await mkdir(join(projectDir, "media"), { recursive: true });
  await mkdir(join(projectDir, "lyrics"), { recursive: true });
  await mkdir(webDist, { recursive: true });

  await writeFile(join(webDist, "index.html"), "<!doctype html><title>E-MO TEST SHELL</title>");
  await writeFile(join(projectDir, "media", "track.m4a"), audioBytes);
  await writeFile(join(projectDir, "lyrics", "track.lrc"), lrc);
  await writeFile(join(projectDir, "emo.project.json"), JSON.stringify({
    schema: "emo.project/v1",
    name: "HTTP Manifest Song",
    audio: "media/track.m4a",
    lyrics: "lyrics/track.lrc",
    defaults: {
      visualMode: "poster",
      canvasTone: "light",
      intensity: 1.3,
      quality: "cinema",
      syncMs: -40,
    },
  }));

  const server = createEmoServer({ projectRoot: root, webDist, mode: "server" });

  try {
    const listening = await server.listen(0, "127.0.0.1");

    const runtimeResponse = await fetch(`${listening.url}/api/runtime`);
    assert.equal(runtimeResponse.status, 200);
    assert.equal(runtimeResponse.headers.get("x-content-type-options"), "nosniff");
    const runtime = await runtimeResponse.json();
    assert.equal(runtime.product, "E-MO-Engine");
    assert.equal(runtime.rootLabel, basename(root));
    assert.equal(runtime.capabilities.mode, "server");
    assert.equal(runtime.capabilities.canReadProjectRoot, true);
    assert.equal(runtime.capabilities.canWriteProjectRoot, false);

    const listResponse = await fetch(`${listening.url}/api/projects`);
    assert.equal(listResponse.status, 200);
    const list = await listResponse.json();
    assert.equal(list.projects.length, 1);

    const project = list.projects[0];
    assert.equal(project.name, "HTTP Manifest Song");
    assert.equal(project.manifest.schema, "emo.project/v1");
    assert.equal(project.manifest.defaults.visualMode, "poster");
    assert.equal(project.manifest.defaults.canvasTone, "light");
    assert.equal(project.manifest.defaults.intensity, 1.3);
    assert.equal(project.manifest.defaults.syncMs, -40);
    assert.ok(project.audio?.id);
    assert.ok(project.lyrics?.id);

    const detailResponse = await fetch(`${listening.url}/api/projects/${project.id}`);
    assert.equal(detailResponse.status, 200);
    const detail = await detailResponse.json();
    assert.equal(detail.id, project.id);
    assert.equal(detail.audio.relativePath, "manifest-song/media/track.m4a");

    const lyricsResponse = await fetch(`${listening.url}/media/${project.id}/${project.lyrics.id}`);
    assert.equal(lyricsResponse.status, 200);
    assert.match(lyricsResponse.headers.get("content-type") ?? "", /^text\/plain/);
    assert.equal(await lyricsResponse.text(), lrc);

    const rangeResponse = await fetch(`${listening.url}/media/${project.id}/${project.audio.id}`, {
      headers: { Range: "bytes=2-5" },
    });
    assert.equal(rangeResponse.status, 206);
    assert.equal(rangeResponse.headers.get("accept-ranges"), "bytes");
    assert.equal(rangeResponse.headers.get("content-range"), "bytes 2-5/16");
    assert.equal(rangeResponse.headers.get("content-length"), "4");
    assert.equal(await rangeResponse.text(), "2345");

    const suffixResponse = await fetch(`${listening.url}/media/${project.id}/${project.audio.id}`, {
      headers: { Range: "bytes=-4" },
    });
    assert.equal(suffixResponse.status, 206);
    assert.equal(suffixResponse.headers.get("content-range"), "bytes 12-15/16");
    assert.equal(await suffixResponse.text(), "cdef");

    const unsatisfiedResponse = await fetch(`${listening.url}/media/${project.id}/${project.audio.id}`, {
      headers: { Range: "bytes=99-" },
    });
    assert.equal(unsatisfiedResponse.status, 416);
    assert.equal(unsatisfiedResponse.headers.get("content-range"), "bytes */16");

    const headResponse = await fetch(`${listening.url}/media/${project.id}/${project.audio.id}`, {
      method: "HEAD",
      headers: { Range: "bytes=0-3" },
    });
    assert.equal(headResponse.status, 206);
    assert.equal(headResponse.headers.get("content-range"), "bytes 0-3/16");
    assert.equal(headResponse.headers.get("content-length"), "4");
    assert.equal((await headResponse.arrayBuffer()).byteLength, 0);

    const spaResponse = await fetch(`${listening.url}/projects/${project.id}`);
    assert.equal(spaResponse.status, 200);
    assert.match(await spaResponse.text(), /E-MO TEST SHELL/);
  } finally {
    await server.close();
    await rm(temp, { recursive: true, force: true });
  }
});
