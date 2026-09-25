import { clamp } from "./math.js";
import type {
  SceneMode,
  TypographyLayoutId,
  TypographyLayoutPreset,
} from "./types.js";

export type ReadingDirection = "ltr" | "rtl";

export interface TypographyAttentionField {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TypographyCompositionInput {
  preset: TypographyLayoutPreset;
  scene: SceneMode;
  width: number;
  height: number;
  lineIndex: number;
  wordWidths: number[];
  wordHeight?: number;
  wordTexts?: string[];
  readingDirection?: ReadingDirection;
}

export interface WordCompositionPlacement {
  x: number;
  y: number;
  rotation: number;
  scale: number;
  entryX: number;
  entryY: number;
  entryScale: number;
  entryRotation: number;
  emphasis: number;
}

export interface TypographyCompositionPlan {
  layout: TypographyLayoutId;
  anchorIndex: number;
  readingDirection: ReadingDirection;
  attentionField: TypographyAttentionField;
  words: WordCompositionPlacement[];
}

const AUTO_LAYOUTS: Record<SceneMode, TypographyLayoutId[]> = {
  poster: ["editorial", "vertical-accent", "split-stage", "crossword", "directional-stage"],
  neon: ["directional-stage", "split-stage", "editorial", "center-stack", "vertical-accent"],
  vortex: ["crossword", "directional-stage", "vertical-accent", "split-stage", "center-stack"],
};

function emptyPlacement(): WordCompositionPlacement {
  return {
    x: 0,
    y: 0,
    rotation: 0,
    scale: 1,
    entryX: 0,
    entryY: 0,
    entryScale: 0.62,
    entryRotation: 0,
    emphasis: 0.5,
  };
}

function longestWordIndex(widths: number[]) {
  let winner = 0;
  for (let index = 1; index < widths.length; index++) {
    if ((widths[index] ?? 0) > (widths[winner] ?? 0)) winner = index;
  }
  return winner;
}

function fitScale(wordWidth: number, desired: number, maxWidth: number, min = 0.36, max = 1.45) {
  if (!(wordWidth > 0)) return clamp(desired, min, max);
  return clamp(Math.min(desired, maxWidth / wordWidth), min, max);
}

function attentionField(width: number, height: number): TypographyAttentionField {
  // Deliberately stricter than conventional 80%-of-frame title safe. The
  // baseline lyric layout lives in a centered attention field; explicit
  // takeover/portal motion is allowed to escape it for full-frame moments.
  return {
    x: 0,
    y: -height * 0.035,
    width: width * 0.76,
    height: height * 0.62,
  };
}

function isVertical(rotation: number) {
  return Math.abs(Math.abs(rotation) - Math.PI / 2) < 0.2;
}

function boundsFor(
  placement: WordCompositionPlacement,
  wordWidth: number,
  wordHeight: number,
) {
  const vertical = isVertical(placement.rotation);
  const w = (vertical ? wordHeight : wordWidth) * placement.scale;
  const h = (vertical ? wordWidth : wordHeight) * placement.scale;
  return {
    left: placement.x - w * 0.5,
    right: placement.x + w * 0.5,
    top: placement.y - h * 0.5,
    bottom: placement.y + h * 0.5,
    width: w,
    height: h,
  };
}

function clampToAttentionField(
  placement: WordCompositionPlacement,
  wordWidth: number,
  wordHeight: number,
  field: TypographyAttentionField,
) {
  const bounds = boundsFor(placement, wordWidth, wordHeight);
  const minX = field.x - field.width * 0.5 + bounds.width * 0.5;
  const maxX = field.x + field.width * 0.5 - bounds.width * 0.5;
  const minY = field.y - field.height * 0.5 + bounds.height * 0.5;
  const maxY = field.y + field.height * 0.5 - bounds.height * 0.5;

  if (minX <= maxX) placement.x = clamp(placement.x, minX, maxX);
  else placement.x = field.x;
  if (minY <= maxY) placement.y = clamp(placement.y, minY, maxY);
  else placement.y = field.y;
}

function overlapAmount(
  a: ReturnType<typeof boundsFor>,
  b: ReturnType<typeof boundsFor>,
) {
  return {
    x: Math.min(a.right, b.right) - Math.max(a.left, b.left),
    y: Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top),
  };
}

function stabilizeComposition(
  words: WordCompositionPlacement[],
  wordWidths: number[],
  wordHeight: number,
  field: TypographyAttentionField,
  direction: ReadingDirection,
  anchorIndex: number,
) {
  if (words.length < 2) {
    if (words[0]) clampToAttentionField(words[0], wordWidths[0], wordHeight, field);
    return;
  }

  const gap = Math.max(10, wordHeight * 0.16);
  const flowSign = direction === "ltr" ? 1 : -1;

  // First keep every readable word inside the central title/attention field.
  words.forEach((word, index) => {
    clampToAttentionField(word, wordWidths[index], wordHeight, field);
  });

  // Deterministic collision relaxation. The later cue yields more than the
  // earlier cue so reading order remains visually recoverable.
  for (let pass = 0; pass < 8; pass++) {
    let changed = false;
    for (let i = 0; i < words.length; i++) {
      for (let j = i + 1; j < words.length; j++) {
        const a = boundsFor(words[i], wordWidths[i], wordHeight);
        const b = boundsFor(words[j], wordWidths[j], wordHeight);
        const overlap = overlapAmount(a, b);
        if (overlap.x <= gap || overlap.y <= gap) continue;

        changed = true;
        const jIsAnchor = j === anchorIndex;
        const iIsAnchor = i === anchorIndex;
        const xShift = overlap.x + gap;
        const yShift = overlap.y + gap;

        // Prefer preserving row reading by pushing the later word forward.
        const tryX = words[j].x + flowSign * xShift * (jIsAnchor ? 0.28 : 0.72);
        const originalX = words[j].x;
        words[j].x = tryX;
        clampToAttentionField(words[j], wordWidths[j], wordHeight, field);
        const movedX = Math.abs(words[j].x - originalX);

        if (movedX < xShift * 0.42) {
          // No horizontal room: open a new visual row instead of creating a
          // diagonal reverse-reading path.
          words[j].x = originalX;
          const verticalDirection = words[j].y >= words[i].y ? 1 : -1;
          words[j].y += verticalDirection * yShift * (jIsAnchor ? 0.34 : 0.72);
          if (!iIsAnchor) words[i].y -= verticalDirection * yShift * 0.16;
        } else if (!iIsAnchor) {
          words[i].x -= flowSign * xShift * 0.10;
        }

        clampToAttentionField(words[i], wordWidths[i], wordHeight, field);
        clampToAttentionField(words[j], wordWidths[j], wordHeight, field);
      }
    }
    if (!changed) break;
  }

  // Last resort: scale down only the words that still collide. This is safer
  // than allowing unreadable overlaps or sending text outside the focal field.
  for (let pass = 0; pass < 5; pass++) {
    let collision = false;
    for (let i = 0; i < words.length; i++) {
      for (let j = i + 1; j < words.length; j++) {
        const overlap = overlapAmount(
          boundsFor(words[i], wordWidths[i], wordHeight),
          boundsFor(words[j], wordWidths[j], wordHeight),
        );
        if (overlap.x <= gap * 0.7 || overlap.y <= gap * 0.7) continue;
        collision = true;
        const target = words[j].emphasis <= words[i].emphasis ? j : i;
        words[target].scale = Math.max(0.34, words[target].scale * 0.9);
        clampToAttentionField(words[target], wordWidths[target], wordHeight, field);
      }
    }
    if (!collision) break;
  }
}

function placeHorizontalRow(
  indices: number[],
  words: WordCompositionPlacement[],
  widths: number[],
  y: number,
  maxWidth: number,
  gap: number,
  direction: ReadingDirection,
  desiredScale: (index: number) => number,
) {
  if (!indices.length) return;
  const scales = indices.map(index => fitScale(widths[index], desiredScale(index), maxWidth * 0.55));
  const total = indices.reduce((sum, index, position) => (
    sum + widths[index] * scales[position] + (position ? gap : 0)
  ), 0);
  let cursor = -total * 0.5;
  const sequence = direction === "ltr" ? indices : [...indices].reverse();

  sequence.forEach(index => {
    const originalPosition = indices.indexOf(index);
    const scale = scales[originalPosition];
    const scaledWidth = widths[index] * scale;
    words[index].x = cursor + scaledWidth * 0.5;
    words[index].y = y;
    words[index].scale = scale;
    words[index].rotation = 0;
    cursor += scaledWidth + gap;
  });
}

export function resolveTypographyLayout(
  preset: TypographyLayoutPreset,
  scene: SceneMode,
  lineIndex: number,
  wordCount: number,
): TypographyLayoutId {
  if (preset !== "auto") return preset;
  if (wordCount <= 1) return "center-stack";
  const options = AUTO_LAYOUTS[scene];
  const safeLine = Math.max(0, lineIndex);
  return options[safeLine % options.length];
}

export function planTypographyComposition(
  input: TypographyCompositionInput,
): TypographyCompositionPlan {
  const width = Math.max(1, input.width);
  const height = Math.max(1, input.height);
  const wordWidths = input.wordWidths.map(value => Math.max(1, value));
  const wordHeight = Math.max(24, input.wordHeight ?? Math.min(112, height * 0.105));
  const count = wordWidths.length;
  const direction = input.readingDirection ?? "ltr";
  const layout = resolveTypographyLayout(input.preset, input.scene, input.lineIndex, count);
  const anchorIndex = longestWordIndex(wordWidths);
  const field = attentionField(width, height);
  const words = Array.from({ length: count }, emptyPlacement);
  if (!count) return { layout, anchorIndex: 0, readingDirection: direction, attentionField: field, words };

  const gap = Math.max(14, Math.min(52, width * 0.018));
  const verticalEdgeIndex = count <= 1
    ? 0
    : input.lineIndex % 2 === 0
      ? count - 1
      : 0;

  if (layout === "center-stack") {
    const rows: number[][] = [[]];
    let rowWidth = 0;
    for (let index = 0; index < count; index++) {
      const targetScale = index === anchorIndex ? 1.04 : 0.92;
      const projected = wordWidths[index] * targetScale + (rows[rows.length - 1].length ? gap : 0);
      if (rowWidth + projected > field.width * 0.94 && rows[rows.length - 1].length) {
        rows.push([]);
        rowWidth = 0;
      }
      rows[rows.length - 1].push(index);
      rowWidth += projected;
    }

    const rowGap = Math.min(wordHeight * 1.28, height * 0.15);
    const startY = field.y - ((rows.length - 1) * rowGap) * 0.5;
    rows.forEach((row, rowIndex) => {
      placeHorizontalRow(
        row,
        words,
        wordWidths,
        startY + rowIndex * rowGap,
        field.width * 0.94,
        gap,
        direction,
        index => index === anchorIndex ? 1.04 : 0.92,
      );
      row.forEach((index, position) => {
        words[index].entryX = (position % 2 ? 1 : -1) * width * 0.18;
        words[index].entryY = rowIndex % 2 ? height * 0.06 : -height * 0.06;
        words[index].entryScale = index === anchorIndex ? 0.38 : 0.68;
        words[index].entryRotation = position % 2 ? 0.05 : -0.05;
        words[index].emphasis = index === anchorIndex ? 1 : 0.56;
      });
    });
  } else if (layout === "directional-stage") {
    const split = Math.ceil(count / 2);
    const top = Array.from({ length: split }, (_, index) => index);
    const bottom = Array.from({ length: count - split }, (_, index) => index + split);
    const yTop = field.y - field.height * 0.19;
    const yBottom = field.y + field.height * 0.18;

    placeHorizontalRow(top, words, wordWidths, yTop, field.width * 0.92, gap, direction, index => index === anchorIndex ? 1.02 : 0.80);
    placeHorizontalRow(bottom, words, wordWidths, yBottom, field.width * 0.92, gap, direction, index => index === anchorIndex ? 1.06 : 0.84);

    // A single edge word may be vertical. Never place a vertical word in the
    // middle of the logical reading path.
    if (count >= 3) {
      const vertical = words[verticalEdgeIndex];
      vertical.rotation = verticalEdgeIndex === 0 ? -Math.PI / 2 : Math.PI / 2;
      vertical.scale = fitScale(wordWidths[verticalEdgeIndex], 0.72, field.height * 0.48, 0.38, 0.88);
      vertical.x = verticalEdgeIndex === 0
        ? field.x - field.width * 0.40
        : field.x + field.width * 0.40;
      vertical.y = field.y;
      vertical.emphasis = verticalEdgeIndex === anchorIndex ? 1 : 0.68;
    }

    words.forEach((word, index) => {
      const lane = index % 4;
      word.entryX = lane === 0 ? -width * 0.34 : lane === 1 ? width * 0.30 : 0;
      word.entryY = lane === 2 ? -height * 0.32 : lane === 3 ? height * 0.32 : 0;
      word.entryScale = index === anchorIndex ? 0.32 : lane === 3 ? 1.38 : 0.66;
      word.entryRotation = lane % 2 ? 0.08 : -0.08;
      if (word.emphasis === 0.5) word.emphasis = index === anchorIndex ? 1 : 0.58;
    });
  } else if (layout === "editorial") {
    const before = Array.from({ length: anchorIndex }, (_, index) => index);
    const after = Array.from({ length: count - anchorIndex - 1 }, (_, index) => index + anchorIndex + 1);

    placeHorizontalRow(before, words, wordWidths, field.y - field.height * 0.27, field.width * 0.90, gap, direction, () => 0.64);
    words[anchorIndex] = {
      x: 0,
      y: field.y,
      rotation: 0,
      scale: fitScale(wordWidths[anchorIndex], 1.28, field.width * 0.67, 0.52, 1.42),
      entryX: direction === "ltr" ? width * 0.36 : -width * 0.36,
      entryY: 0,
      entryScale: 0.24,
      entryRotation: 0,
      emphasis: 1,
    };
    placeHorizontalRow(after, words, wordWidths, field.y + field.height * 0.27, field.width * 0.90, gap, direction, () => 0.68);

    [...before, ...after].forEach((index, position) => {
      words[index].entryX = position % 2 ? width * 0.28 : -width * 0.28;
      words[index].entryY = index < anchorIndex ? -height * 0.12 : height * 0.12;
      words[index].entryScale = 0.58;
      words[index].entryRotation = 0;
      words[index].emphasis = 0.43;
    });
  } else if (layout === "vertical-accent") {
    const rest = Array.from({ length: count }, (_, index) => index).filter(index => index !== verticalEdgeIndex);
    const edgeX = verticalEdgeIndex === 0 ? -field.width * 0.39 : field.width * 0.39;
    words[verticalEdgeIndex] = {
      x: edgeX,
      y: field.y,
      rotation: verticalEdgeIndex === 0 ? -Math.PI / 2 : Math.PI / 2,
      scale: fitScale(wordWidths[verticalEdgeIndex], 0.90, field.height * 0.54, 0.40, 1.02),
      entryX: 0,
      entryY: verticalEdgeIndex === 0 ? -height * 0.34 : height * 0.34,
      entryScale: 0.5,
      entryRotation: 0,
      emphasis: verticalEdgeIndex === anchorIndex ? 1 : 0.74,
    };

    const rows = rest.length > 3 ? [rest.slice(0, Math.ceil(rest.length / 2)), rest.slice(Math.ceil(rest.length / 2))] : [rest];
    rows.forEach((row, rowIndex) => {
      const y = field.y + (rowIndex - (rows.length - 1) * 0.5) * wordHeight * 1.35;
      placeHorizontalRow(row, words, wordWidths, y, field.width * 0.68, gap, direction, index => index === anchorIndex ? 1.04 : 0.80);
      row.forEach((index, position) => {
        words[index].entryX = verticalEdgeIndex === 0 ? width * 0.30 : -width * 0.30;
        words[index].entryY = position % 2 ? height * 0.06 : -height * 0.06;
        words[index].entryScale = index === anchorIndex ? 0.38 : 0.64;
        words[index].entryRotation = 0;
        words[index].emphasis = index === anchorIndex ? 1 : 0.56;
      });
    });
  } else if (layout === "split-stage") {
    const split = Math.ceil(count / 2);
    const first = Array.from({ length: split }, (_, index) => index);
    const second = Array.from({ length: count - split }, (_, index) => index + split);
    placeHorizontalRow(first, words, wordWidths, field.y - field.height * 0.20, field.width * 0.88, gap, direction, index => index === anchorIndex ? 1.05 : 0.78);
    placeHorizontalRow(second, words, wordWidths, field.y + field.height * 0.20, field.width * 0.88, gap, direction, index => index === anchorIndex ? 1.05 : 0.82);

    const shift = field.width * 0.07;
    first.forEach(index => { words[index].x -= direction === "ltr" ? shift : -shift; });
    second.forEach(index => { words[index].x += direction === "ltr" ? shift : -shift; });
    words.forEach((word, index) => {
      word.entryX = index < split ? -width * 0.30 : width * 0.30;
      word.entryY = index < split ? -height * 0.08 : height * 0.08;
      word.entryScale = index === anchorIndex ? 0.34 : 0.68;
      word.entryRotation = 0;
      word.emphasis = index === anchorIndex ? 1 : 0.52;
    });
  } else {
    // Crossword: one edge word can run vertically while the remaining logical
    // sequence stays in a horizontal band. No diagonal cue traversal.
    const rest = Array.from({ length: count }, (_, index) => index).filter(index => index !== verticalEdgeIndex);
    placeHorizontalRow(rest, words, wordWidths, field.y, field.width * 0.72, gap, direction, index => index === anchorIndex ? 1.10 : 0.76);

    words[verticalEdgeIndex] = {
      x: verticalEdgeIndex === 0 ? -field.width * 0.39 : field.width * 0.39,
      y: field.y,
      rotation: verticalEdgeIndex === 0 ? -Math.PI / 2 : Math.PI / 2,
      scale: fitScale(wordWidths[verticalEdgeIndex], 0.76, field.height * 0.5, 0.38, 0.90),
      entryX: 0,
      entryY: verticalEdgeIndex === 0 ? -height * 0.32 : height * 0.32,
      entryScale: 0.58,
      entryRotation: 0,
      emphasis: verticalEdgeIndex === anchorIndex ? 1 : 0.72,
    };

    rest.forEach((index, position) => {
      words[index].entryX = position % 2 ? width * 0.22 : -width * 0.22;
      words[index].entryY = position % 2 ? height * 0.06 : -height * 0.06;
      words[index].entryScale = index === anchorIndex ? 0.36 : 0.66;
      words[index].entryRotation = 0;
      words[index].emphasis = index === anchorIndex ? 1 : 0.50;
    });
  }

  stabilizeComposition(words, wordWidths, wordHeight, field, direction, anchorIndex);

  return {
    layout,
    anchorIndex,
    readingDirection: direction,
    attentionField: field,
    words,
  };
}
