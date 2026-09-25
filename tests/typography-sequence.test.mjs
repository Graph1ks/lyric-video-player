import assert from "node:assert/strict";
import test from "node:test";

import {
  deriveTypographySequenceWindow,
  planTypographySequence,
  resolveManifestoPageScope,
  spatialBoxFor,
  spatialBoxesOverlap,
  typographyWordId,
} from "../packages/engine-core/dist/index.js";

function spatialMetricsFor(window) {
  return Object.fromEntries(window.scopeWords.map((word, index) => {
    const width = Math.max(72, word.text.length * (48 + (index % 3) * 7));
    const height = 82 + (index % 4) * 11;
    return [word.id, {
      width,
      height,
      advanceWidth: width,
      lineHeight: height,
      ascent: height * 0.78,
      descent: height * 0.22,
      padding: 5,
    }];
  }));
}

function assertNoSpatialOverlap(plan, metricsById, message) {
  const boxes = plan.words
    .filter(word => word.role !== "incoming")
    .map(word => ({
      id: word.id,
      box: spatialBoxFor(metricsById[word.id], word, 1),
    }));
  for (let a = 0; a < boxes.length; a++) {
    for (let b = a + 1; b < boxes.length; b++) {
      assert.equal(
        spatialBoxesOverlap(boxes[a].box, boxes[b].box),
        false,
        `${message}: ${boxes[a].id} overlapped ${boxes[b].id}`,
      );
    }
  }
}

function manifestoLines(wordCount = 24) {
  const words = Array.from({ length: wordCount }, (_, index) => ({
    start: index * 0.45,
    end: index * 0.45 + 0.42,
    text: index % 6 === 0
      ? "REVOLUTION"
      : index % 5 === 0
        ? "VIGILANT"
        : index % 3 === 0
          ? "VOICE"
          : `WORD${index}`,
  }));
  return [{
    start: 0,
    end: wordCount * 0.45 + 0.1,
    text: words.map(word => word.text).join(" "),
    words,
  }];
}

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


test("Shape Fill packs measured words into stable non-overlapping silhouette space", () => {
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
  const metrics = spatialMetricsFor(earlyWindow);
  const early = planTypographySequence({
    grammar: "shape-fill",
    window: earlyWindow,
    width: 1280,
    height: 720,
    metricsById: metrics,
  });
  const later = planTypographySequence({
    grammar: "shape-fill",
    window: laterWindow,
    width: 1280,
    height: 720,
    metricsById: metrics,
  });

  assert.equal(early.variant, "shape-tree");
  assert.equal(earlyWindow.scopeWordCount, 6);
  assert.equal(earlyWindow.scopeWords.length, 6);
  const stableId = typographyWordId(0, 0);
  const a = early.words.find(word => word.id === stableId);
  const b = later.words.find(word => word.id === stableId);
  assert.ok(a && b);
  assert.ok(Math.abs(a.x - b.x) < 0.001);
  assert.ok(Math.abs(a.y - b.y) < 0.001);
  assert.ok(a.scale > 0);
  assert.equal(a.treatment, "solid");
  assertNoSpatialOverlap(later, metrics, "Shape Fill");
});

test("Shape Fill rotates through star/figure silhouette families by phrase scope", () => {
  const starWindow = deriveTypographySequenceWindow(lines(), 2.8, {
    historySeconds: 10,
    lineStartIndex: 1,
    lineEndIndex: 1,
  });
  const metrics = spatialMetricsFor(starWindow);
  const star = planTypographySequence({
    grammar: "shape-fill",
    window: starWindow,
    width: 1280,
    height: 720,
    metricsById: metrics,
  });

  assert.equal(star.variant, "shape-star");
  assert.ok(star.words.length >= 2);
  assert.ok(star.words.every(word => word.scale > 0));
  assertNoSpatialOverlap(star, metrics, "Shape Fill star");
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
    metricsById: spatialMetricsFor(window),
  });

  assert.equal(plan.variant, "shape-tree");
  assert.ok(plan.words.every(word => word.treatment === "solid"));
});

test("Manifesto Wall reserves a progressive editorial page before words reveal", () => {
  const source = manifestoLines();
  const earlyWindow = deriveTypographySequenceWindow(source, 1.2, {
    historySeconds: 100,
    leadSeconds: 0.08,
    lineStartIndex: 0,
    lineEndIndex: 0,
    maxWords: 64,
  });
  const lateWindow = deriveTypographySequenceWindow(source, 8.4, {
    historySeconds: 100,
    leadSeconds: 0.08,
    lineStartIndex: 0,
    lineEndIndex: 0,
    maxWords: 64,
  });
  const metrics = spatialMetricsFor(earlyWindow);
  const early = planTypographySequence({
    grammar: "manifesto-wall",
    window: earlyWindow,
    width: 1600,
    height: 900,
    metricsById: metrics,
  });
  const late = planTypographySequence({
    grammar: "manifesto-wall",
    window: lateWindow,
    width: 1600,
    height: 900,
    metricsById: metrics,
  });

  assert.equal(early.variant, "editorial-page");
  assert.equal(earlyWindow.scopeWords.length, 24);
  assert.ok(early.words.length < late.words.length, "page should reveal progressively");

  const firstId = typographyWordId(0, 0);
  const firstEarly = early.words.find(word => word.id === firstId);
  const firstLate = late.words.find(word => word.id === firstId);
  assert.ok(firstEarly && firstLate);
  assert.ok(Math.abs(firstEarly.x - firstLate.x) < 0.001);
  assert.ok(Math.abs(firstEarly.y - firstLate.y) < 0.001);

  const horizontal = late.words.filter(word => Math.abs(word.rotation) < 0.2).length;
  const vertical = late.words.filter(word => Math.abs(word.rotation) > 1.2).length;
  assert.ok(horizontal > vertical, "Manifesto should remain mostly horizontal");
  assert.ok(vertical >= 1, "Manifesto should reserve occasional 90-degree bracket words");
});

test("Manifesto Wall active word snaps into its reserved page slot without bounce", () => {
  const source = manifestoLines(12);
  const earlyWindow = deriveTypographySequenceWindow(source, 1.81, {
    historySeconds: 100,
    lineStartIndex: 0,
    lineEndIndex: 0,
    maxWords: 32,
  });
  const settledWindow = deriveTypographySequenceWindow(source, 2.05, {
    historySeconds: 100,
    lineStartIndex: 0,
    lineEndIndex: 0,
    maxWords: 32,
  });
  const metrics = spatialMetricsFor(earlyWindow);
  const early = planTypographySequence({
    grammar: "manifesto-wall",
    window: earlyWindow,
    width: 1920,
    height: 1080,
    metricsById: metrics,
  });
  const settled = planTypographySequence({
    grammar: "manifesto-wall",
    window: settledWindow,
    width: 1920,
    height: 1080,
    metricsById: metrics,
  });

  const id = typographyWordId(0, 4);
  const a = early.words.find(word => word.id === id);
  const b = settled.words.find(word => word.id === id);
  assert.ok(a && b);
  assert.ok(Math.hypot(a.x - b.x, a.y - b.y) > 1);
  assert.ok(b.alpha >= a.alpha);
});

test("Spiral Depth uses measured extents to prevent long-word overlap", () => {
  const source = manifestoLines(14);
  const window = deriveTypographySequenceWindow(source, 5.8, {
    historySeconds: 100,
    maxWords: 24,
  });
  const metrics = spatialMetricsFor(window);
  const plan = planTypographySequence({
    grammar: "spiral-depth",
    window,
    width: 1920,
    height: 1080,
    metricsById: metrics,
  });
  assertNoSpatialOverlap(plan, metrics, "Spiral Depth");
});

test("Ribbon Path uses measured extents to keep words separated on the curve", () => {
  const source = manifestoLines(14);
  const window = deriveTypographySequenceWindow(source, 5.8, {
    historySeconds: 100,
    maxWords: 24,
  });
  const metrics = spatialMetricsFor(window);
  const plan = planTypographySequence({
    grammar: "ribbon-path",
    window,
    width: 1920,
    height: 1080,
    metricsById: metrics,
  });
  assertNoSpatialOverlap(plan, metrics, "Ribbon Path");
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
  const metrics = spatialMetricsFor(beforeWindow);
  const before = planTypographySequence({
    grammar: "ribbon-path",
    window: beforeWindow,
    width: 1920,
    height: 1080,
    metricsById: metrics,
  });
  const after = planTypographySequence({
    grammar: "ribbon-path",
    window: afterWindow,
    width: 1920,
    height: 1080,
    metricsById: metrics,
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


test("manual Manifesto page scope continues across ordinary four-line Director phrases", () => {
  assert.deepEqual(resolveManifestoPageScope(0, 28), { startLine: 0, endLine: 11 });
  assert.deepEqual(resolveManifestoPageScope(7, 28), { startLine: 0, endLine: 11 });
  assert.deepEqual(resolveManifestoPageScope(12, 28), { startLine: 12, endLine: 23 });
  assert.deepEqual(resolveManifestoPageScope(27, 28), { startLine: 24, endLine: 27 });
});
