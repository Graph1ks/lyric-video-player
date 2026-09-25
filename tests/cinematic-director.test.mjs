import assert from "node:assert/strict";
import test from "node:test";

import { SceneDirector } from "../packages/engine-core/dist/index.js";

function line(start, end, text, wordCount = 4) {
  const duration = (end - start) / wordCount;
  return {
    start,
    end,
    text,
    words: Array.from({ length: wordCount }, (_, index) => ({
      start: start + index * duration,
      end: start + (index + 1) * duration,
      text: `W${index}`,
    })),
  };
}

test("AUTO directs a phrase as one coherent typography family", () => {
  const director = new SceneDirector();
  director.load([
    line(0, 1.4, "first line", 5),
    line(1.45, 2.8, "second line", 5),
    line(2.85, 4.1, "third line", 4),
    line(4.15, 5.5, "fourth line", 5),
  ]);

  const scenes = [0, 1, 2, 3].map(index => director.sceneFor(index));
  assert.ok(scenes.every(scene => scene.phraseIndex === scenes[0].phraseIndex));
  assert.ok(scenes.every(scene => scene.typography.family === scenes[0].typography.family));
  assert.equal(scenes[0].shotRole, "establish");
  assert.equal(scenes.at(-1).shotRole, "release");
});

test("a meaningful pause starts a new cinematic phrase", () => {
  const director = new SceneDirector();
  director.load([
    line(0, 1.2, "one", 3),
    line(1.25, 2.4, "two", 3),
    line(3.4, 4.5, "three", 3),
  ]);

  assert.equal(director.sceneFor(0).phraseIndex, director.sceneFor(1).phraseIndex);
  assert.notEqual(director.sceneFor(1).phraseIndex, director.sceneFor(2).phraseIndex);
});

test("manual scene mode keeps phrase continuity but rebinds a compatible typography bundle", () => {
  const director = new SceneDirector();
  director.load([
    line(0, 1.5, "a longer lyric phrase", 5),
    line(1.55, 3, "keeps flowing here", 5),
  ]);
  const auto = director.sceneFor(0);

  director.setMode("vortex");
  const forcedA = director.sceneFor(0);
  const forcedB = director.sceneFor(1);

  assert.equal(forcedA.mode, "vortex");
  assert.equal(forcedA.phraseIndex, auto.phraseIndex);
  assert.equal(forcedA.typography.family, forcedB.typography.family);
  assert.match(forcedA.typography.family, /tunnel|scatter|wave/);
});


test("a recurring lyric motif starts a new directed phrase and keeps hook routing", () => {
  const director = new SceneDirector();
  director.load([
    line(0, 1.8, "WE GO", 2),
    line(1.8, 4.8, "longer verse line with enough words to move", 7),
    line(4.8, 6.2, "WE GO", 2),
  ]);

  assert.notEqual(director.sceneFor(1).phraseIndex, director.sceneFor(2).phraseIndex);
  assert.equal(director.sceneFor(2).reason, "hook");
  assert.equal(director.sceneFor(2).mode, "vortex");
});


test("cinematic bundles expose persistent sequence grammars selectively", () => {
  const director = new SceneDirector();
  director.load([
    line(0, 1.8, "compact hit", 2),
    line(1.8, 3.6, "another compact hit", 2),
    line(3.6, 5.4, "third compact hit", 2),
    line(5.4, 7.2, "fourth compact hit", 2),
    line(7.2, 9.0, "next phrase opens", 2),
  ]);

  const first = director.sceneFor(0);
  assert.equal(first.phraseStartLine, 0);
  assert.equal(first.phraseEndLine, 3);
  assert.equal(first.typography.sequenceGrammar, "hero-echo");

  const next = director.sceneFor(4);
  assert.equal(next.phraseStartLine, 4);
  assert.equal(next.phraseEndLine, 4);
});


test("AUTO routes compact second phrase into Manifesto Wall", () => {
  const director = new SceneDirector();
  director.load([
    line(0, 1.2, "first hit", 2),
    line(1.2, 2.4, "keeps phrase", 2),
    line(3.4, 4.6, "second phrase", 2),
    line(4.6, 5.8, "builds wall", 2),
  ]);

  const second = director.sceneFor(2);
  assert.equal(second.phraseIndex, 1);
  assert.equal(second.mode, "poster");
  assert.equal(second.typography.sequenceGrammar, "manifesto-wall");
});

test("AUTO exposes Shape Fill on the next compact poster phrase", () => {
  const director = new SceneDirector();
  director.load([
    line(0, 1.1, "first phrase", 2),
    line(2.0, 3.1, "second phrase", 2),
    line(4.0, 5.1, "third phrase", 2),
  ]);

  const third = director.sceneFor(2);
  assert.equal(third.phraseIndex, 2);
  assert.equal(third.mode, "poster");
  assert.equal(third.typography.sequenceGrammar, "shape-fill");
});

test("AUTO exposes Ribbon Path on Neon phrase family", () => {
  const director = new SceneDirector();
  director.load([
    line(0, 2.8, "this phrase has enough words to stay cinematic", 8),
    line(2.85, 5.4, "and continues without a compact poster hit", 8),
  ]);

  const scene = director.sceneFor(0);
  assert.equal(scene.mode, "neon");
  assert.equal(scene.typography.sequenceGrammar, "ribbon-path");
});


test("performance profile constrains AUTO scene and coherent typography pools", () => {
  const director = new SceneDirector();
  director.setAutoProfile({
    scenes: ["neon"],
    typographyPresets: ["wave"],
    sequences: ["off", "ribbon-path"],
    layouts: ["split-stage"],
    motions: ["conveyor"],
  });
  director.load([
    line(0, 1.1, "compact phrase", 2),
    line(1.1, 2.2, "would normally be poster", 2),
    line(3.2, 4.5, "new phrase", 3),
  ]);

  const first = director.sceneFor(0);
  const second = director.sceneFor(2);
  for (const scene of [first, second]) {
    assert.equal(scene.mode, "neon");
    assert.equal(scene.typography.typographyPreset, "wave");
    assert.equal(scene.typography.layout, "split-stage");
    assert.equal(scene.typography.motion, "conveyor");
    assert.ok(
      scene.typography.sequenceGrammar === undefined
      || scene.typography.sequenceGrammar === "ribbon-path",
    );
  }
});

test("performance profile can disable persistent sequences while keeping AUTO direction", () => {
  const director = new SceneDirector();
  director.setAutoProfile({
    scenes: ["poster"],
    typographyPresets: ["impact", "outline"],
    sequences: ["off"],
    layouts: ["editorial", "center-stack"],
    motions: ["takeover", "panel"],
  });
  director.load([
    line(0, 1.2, "first hit", 2),
    line(1.2, 2.4, "second hit", 2),
  ]);

  assert.equal(director.sceneFor(0).mode, "poster");
  assert.equal(director.sceneFor(0).typography.sequenceGrammar, undefined);
});
