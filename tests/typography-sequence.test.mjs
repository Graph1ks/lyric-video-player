import assert from "node:assert/strict";
import test from "node:test";

import {
  deriveTypographySequenceWindow,
  planTypographySequence,
  typographyWordId,
} from "../packages/engine-core/dist/index.js";

function lines() {
  return [
    {
      start: 0,
      end: 2,
      text: "ONE TWO THREE",
      words: [
        { start: 0, end: 0.6, text: "ONE" },
        { start: 0.6, end: 1.2, text: "TWO" },
        { start: 1.2, end: 2, text: "THREE" },
      ],
    },
    {
      start: 2,
      end: 4,
      text: "FOUR FIVE SIX",
      words: [
        { start: 2, end: 2.55, text: "FOUR" },
        { start: 2.55, end: 3.15, text: "FIVE" },
        { start: 3.15, end: 4, text: "SIX" },
      ],
    },
  ];
}

test("sequence window is seek-safe and assigns stable word roles", () => {
  const source = lines();
  const first = deriveTypographySequenceWindow(source, 2.3, {
    historySeconds: 4,
    leadSeconds: 0.3,
  });
  const repeated = deriveTypographySequenceWindow(source, 2.3, {
    historySeconds: 4,
    leadSeconds: 0.3,
  });

  assert.deepEqual(repeated, first);
  assert.equal(first.activeLineIndex, 1);
  assert.equal(first.activeWordId, typographyWordId(1, 0));
  assert.equal(first.words.find(word => word.id === typographyWordId(1, 0))?.role, "active");
  assert.equal(first.words.find(word => word.id === typographyWordId(0, 2))?.role, "recent");
  assert.equal(first.words.find(word => word.id === typographyWordId(0, 0))?.role, "history");
  assert.equal(first.words.find(word => word.id === typographyWordId(1, 1))?.role, "incoming");
});

test("sequence window bounds history without dropping the active word", () => {
  const window = deriveTypographySequenceWindow(lines(), 3.35, {
    historySeconds: 10,
    leadSeconds: 0.2,
    maxWords: 3,
  });

  assert.equal(window.words.length, 3);
  assert.ok(window.omittedWordCount > 0);
  assert.equal(window.activeWordId, typographyWordId(1, 2));
  assert.ok(window.words.some(word => word.id === window.activeWordId));
});

test("spiral depth makes newer lyrics larger than deep history", () => {
  const window = deriveTypographySequenceWindow(lines(), 3.4, {
    historySeconds: 10,
    maxWords: 12,
  });
  const plan = planTypographySequence({
    grammar: "spiral-depth",
    window,
    width: 1920,
    height: 1080,
  });

  assert.equal(plan.grammar, "spiral-depth");
  assert.ok(plan.words.length >= 4);
  const hero = plan.words.find(word => word.id === plan.heroId);
  const oldest = [...plan.words].sort((a, b) => a.zIndex - b.zIndex)[0];
  assert.ok(hero);
  assert.ok(oldest);
  assert.ok(hero.scale > oldest.scale);
  assert.ok(hero.alpha > oldest.alpha);
  assert.ok(plan.words.every(word => Number.isFinite(word.x) && Number.isFinite(word.y)));
});

test("hero echo keeps the current word solid and history as outline structure", () => {
  const window = deriveTypographySequenceWindow(lines(), 2.8, {
    historySeconds: 10,
    maxWords: 12,
  });
  const plan = planTypographySequence({
    grammar: "hero-echo",
    window,
    width: 1280,
    height: 720,
  });

  const hero = plan.words.find(word => word.id === plan.heroId);
  assert.ok(hero);
  assert.equal(hero.id, typographyWordId(1, 1));
  assert.equal(hero.treatment, "solid");
  assert.ok(hero.scale > 1);
  assert.ok(plan.words.filter(word => word.id !== hero.id).every(word => word.treatment === "outline"));
});
