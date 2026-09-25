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
