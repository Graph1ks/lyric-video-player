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


test("sequence window can scope history to a directed phrase without changing stable IDs", () => {
  const source = lines();
  const window = deriveTypographySequenceWindow(source, 2.8, {
    historySeconds: 10,
    lineStartIndex: 1,
    lineEndIndex: 1,
  });

  assert.ok(window.words.length > 0);
  assert.ok(window.words.every(word => word.lineIndex === 1));
  assert.equal(window.activeWordId, typographyWordId(1, 1));
});

test("spiral depth travels continuously across a word handoff", () => {
  const source = lines();
  const beforeWindow = deriveTypographySequenceWindow(source, 3.14, {
    historySeconds: 10,
    lineStartIndex: 0,
    lineEndIndex: 1,
  });
  const afterWindow = deriveTypographySequenceWindow(source, 3.16, {
    historySeconds: 10,
    lineStartIndex: 0,
    lineEndIndex: 1,
  });
  const before = planTypographySequence({
    grammar: "spiral-depth",
    window: beforeWindow,
    width: 1920,
    height: 1080,
  });
  const after = planTypographySequence({
    grammar: "spiral-depth",
    window: afterWindow,
    width: 1920,
    height: 1080,
  });

  const previousId = typographyWordId(1, 1);
  const a = before.words.find(word => word.id === previousId);
  const b = after.words.find(word => word.id === previousId);
  assert.ok(a && b);
  const travel = Math.hypot(a.x - b.x, a.y - b.y);
  assert.ok(travel < 80, `handoff travel was ${travel}px`);
  assert.ok(Math.abs(a.scale - b.scale) < 0.18);
});


test("Shape Fill packs stable words inside a silhouette instead of tracing a border", () => {
  const source = lines();
  const earlyWindow = deriveTypographySequenceWindow(source, 1.1, {
    historySeconds: 10,
    lineStartIndex: 0,
    lineEndIndex: 1,
  });
  const laterWindow = deriveTypographySequenceWindow(source, 1.8, {
    historySeconds: 10,
    lineStartIndex: 0,
    lineEndIndex: 1,
  });
  const early = planTypographySequence({
    grammar: "shape-fill",
    window: earlyWindow,
    width: 1280,
    height: 720,
  });
  const later = planTypographySequence({
    grammar: "shape-fill",
    window: laterWindow,
    width: 1280,
    height: 720,
  });

  assert.equal(early.variant, "shape-tree");
  assert.equal(earlyWindow.scopeWordCount, 6);
  const stableId = typographyWordId(0, 0);
  const a = early.words.find(word => word.id === stableId);
  const b = later.words.find(word => word.id === stableId);
  assert.ok(a && b);
  assert.ok(Math.abs(a.x - b.x) < 0.001);
  assert.ok(Math.abs(a.y - b.y) < 0.001);
  assert.ok(a.maxWidth > 0 && a.maxHeight > 0);
  assert.equal(a.treatment, "solid");
  assert.ok(early.words.some(word => Math.abs(word.x) < 1280 * 0.2));
});

test("Shape Fill rotates through star/figure silhouette families by phrase scope", () => {
  const starWindow = deriveTypographySequenceWindow(lines(), 2.8, {
    historySeconds: 10,
    lineStartIndex: 1,
    lineEndIndex: 1,
  });
  const star = planTypographySequence({
    grammar: "shape-fill",
    window: starWindow,
    width: 1280,
    height: 720,
  });

  assert.equal(star.variant, "shape-star");
  assert.ok(star.words.length >= 2);
  assert.ok(star.words.every(word => word.maxWidth > 0 && word.maxHeight > 0));
});

test("legacy Shape Build id resolves through the new filled-silhouette planner", () => {
  const window = deriveTypographySequenceWindow(lines(), 1.3, {
    historySeconds: 10,
    lineStartIndex: 0,
    lineEndIndex: 1,
  });
  const plan = planTypographySequence({
    grammar: "shape-build",
    window,
    width: 1280,
    height: 720,
  });

  assert.equal(plan.variant, "shape-tree");
  assert.ok(plan.words.every(word => word.treatment === "solid"));
});

test("Manifesto Wall creates stable masonry boxes with vertical bracket slots", () => {
  const window = deriveTypographySequenceWindow(lines(), 2.3, {
    historySeconds: 10,
    lineStartIndex: 0,
    lineEndIndex: 1,
  });
  const plan = planTypographySequence({
    grammar: "manifesto-wall",
    window,
    width: 1280,
    height: 720,
  });

  assert.equal(plan.variant, "masonry");
  assert.ok(plan.words.length >= 4);
  assert.ok(plan.words.every(word => word.maxWidth > 0 && word.maxHeight > 0));
  assert.ok(plan.words.some(word => Math.abs(word.rotation) > 1));
});

test("Manifesto Wall stamps the active word into its slot without bounce", () => {
  const source = lines();
  const earlyWindow = deriveTypographySequenceWindow(source, 2.01, {
    historySeconds: 10,
    lineStartIndex: 0,
    lineEndIndex: 1,
  });
  const settledWindow = deriveTypographySequenceWindow(source, 2.2, {
    historySeconds: 10,
    lineStartIndex: 0,
    lineEndIndex: 1,
  });
  const early = planTypographySequence({
    grammar: "manifesto-wall",
    window: earlyWindow,
    width: 1920,
    height: 1080,
  });
  const settled = planTypographySequence({
    grammar: "manifesto-wall",
    window: settledWindow,
    width: 1920,
    height: 1080,
  });

  const id = typographyWordId(1, 0);
  const a = early.words.find(word => word.id === id);
  const b = settled.words.find(word => word.id === id);
  assert.ok(a && b);
  assert.ok(Math.hypot(a.x - b.x, a.y - b.y) > 5);
  assert.ok(Math.abs(b.scale - 1) < 0.001);
  assert.equal(b.alpha, 1);
});

test("Ribbon Path preserves motion continuity across active-word handoff", () => {
  const source = lines();
  const beforeWindow = deriveTypographySequenceWindow(source, 3.14, {
    historySeconds: 10,
    leadSeconds: 0.12,
    lineStartIndex: 0,
    lineEndIndex: 1,
  });
  const afterWindow = deriveTypographySequenceWindow(source, 3.16, {
    historySeconds: 10,
    leadSeconds: 0.12,
    lineStartIndex: 0,
    lineEndIndex: 1,
  });
  const before = planTypographySequence({
    grammar: "ribbon-path",
    window: beforeWindow,
    width: 1920,
    height: 1080,
  });
  const after = planTypographySequence({
    grammar: "ribbon-path",
    window: afterWindow,
    width: 1920,
    height: 1080,
  });

  assert.equal(before.variant, "s-curve");
  const previousId = typographyWordId(1, 1);
  const a = before.words.find(word => word.id === previousId);
  const b = after.words.find(word => word.id === previousId);
  assert.ok(a && b);
  const travel = Math.hypot(a.x - b.x, a.y - b.y);
  assert.ok(travel < 100, `ribbon handoff travel was ${travel}px`);
  assert.ok(Math.abs(a.scale - b.scale) < 0.2);
});
