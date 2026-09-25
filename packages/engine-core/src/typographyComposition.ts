import { clamp } from "./math.js";
import type {
  SceneMode,
  TypographyLayoutId,
  TypographyLayoutPreset,
} from "./types.js";

export interface TypographyCompositionInput {
  preset: TypographyLayoutPreset;
  scene: SceneMode;
  width: number;
  height: number;
  lineIndex: number;
  wordWidths: number[];
  wordTexts?: string[];
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

function fitScale(wordWidth: number, desired: number, maxWidth: number, min = 0.42, max = 1.45) {
  if (!(wordWidth > 0)) return clamp(desired, min, max);
  return clamp(Math.min(desired, maxWidth / wordWidth), min, max);
}

function mirrorForLine(lineIndex: number) {
  return lineIndex % 2 === 0 ? 1 : -1;
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
  const count = wordWidths.length;
  const layout = resolveTypographyLayout(input.preset, input.scene, input.lineIndex, count);
  const anchorIndex = longestWordIndex(wordWidths);
  const words = Array.from({ length: count }, emptyPlacement);
  if (!count) return { layout, anchorIndex: 0, words };

  const mirror = mirrorForLine(input.lineIndex);
  const safeW = width * 0.82;
  const safeH = height * 0.62;

  if (layout === "center-stack") {
    const gap = Math.max(16, Math.min(64, width * 0.022));
    const rows: number[][] = [[]];
    let rowWidth = 0;

    for (let index = 0; index < count; index++) {
      const next = wordWidths[index] + (rows[rows.length - 1].length ? gap : 0);
      if (rowWidth + next > safeW && rows[rows.length - 1].length) {
        rows.push([]);
        rowWidth = 0;
      }
      rows[rows.length - 1].push(index);
      rowWidth += wordWidths[index] + (rows[rows.length - 1].length > 1 ? gap : 0);
    }

    const lineHeight = Math.min(height * 0.15, 132);
    let y = -((rows.length - 1) * lineHeight) * 0.5;
    rows.forEach((row, rowIndex) => {
      const total = row.reduce((sum, index, position) => (
        sum + wordWidths[index] + (position ? gap : 0)
      ), 0);
      let x = -total * 0.5;
      row.forEach((index, position) => {
        const scale = fitScale(wordWidths[index], index === anchorIndex ? 1.08 : 1, safeW * 0.72);
        words[index] = {
          x: x + wordWidths[index] * 0.5,
          y,
          rotation: 0,
          scale,
          entryX: position % 2 ? width * 0.22 : -width * 0.22,
          entryY: rowIndex % 2 ? height * 0.08 : -height * 0.08,
          entryScale: index === anchorIndex ? 0.34 : 0.64,
          entryRotation: position % 2 ? 0.06 : -0.06,
          emphasis: index === anchorIndex ? 1 : 0.55,
        };
        x += wordWidths[index] + gap;
      });
      y += lineHeight;
    });
    return { layout, anchorIndex, words };
  }

  if (layout === "directional-stage") {
    const slots = [
      [-0.27, -0.22, 0, 0.9, -0.46, 0, 0.68, -0.08],
      [0.23, -0.12, Math.PI / 2, 0.72, 0, 0.48, 0.72, -0.18],
      [-0.12, 0.11, 0, 1.24, 0.45, 0, 0.28, 0.08],
      [0.27, 0.24, 0, 0.82, 0, -0.46, 1.55, 0.1],
      [-0.31, 0.27, -0.08, 0.74, -0.4, 0.24, 0.58, -0.12],
      [0.08, -0.31, 0.05, 0.78, 0.34, -0.34, 0.5, 0.08],
    ] as const;

    for (let index = 0; index < count; index++) {
      const slot = slots[index % slots.length];
      const rotate = slot[2] * mirror;
      const vertical = Math.abs(rotate) > 1;
      const maxWordWidth = vertical ? safeH * 0.76 : safeW * 0.48;
      const scale = fitScale(wordWidths[index], slot[3] * (index === anchorIndex ? 1.08 : 1), maxWordWidth);
      words[index] = {
        x: slot[0] * width * mirror,
        y: slot[1] * height,
        rotation: rotate,
        scale,
        entryX: slot[4] * width * mirror,
        entryY: slot[5] * height,
        entryScale: slot[6],
        entryRotation: slot[7] * mirror,
        emphasis: index === anchorIndex ? 1 : 0.58,
      };
    }
    return { layout, anchorIndex, words };
  }

  if (layout === "editorial") {
    const satellites = [
      [-0.31, -0.24, 0, 0.68, -0.42, 0],
      [0.29, -0.27, Math.PI / 2, 0.58, 0, -0.42],
      [0.31, 0.22, 0, 0.7, 0.42, 0],
      [-0.28, 0.28, -0.06, 0.62, -0.35, 0.28],
      [0.05, -0.33, 0.04, 0.64, 0, -0.38],
    ] as const;
    let satelliteIndex = 0;

    for (let index = 0; index < count; index++) {
      if (index === anchorIndex) {
        words[index] = {
          x: -width * 0.04 * mirror,
          y: height * 0.03,
          rotation: 0,
          scale: fitScale(wordWidths[index], 1.36, safeW * 0.68, 0.55, 1.5),
          entryX: width * 0.42 * mirror,
          entryY: 0,
          entryScale: 0.22,
          entryRotation: 0.04 * mirror,
          emphasis: 1,
        };
        continue;
      }
      const slot = satellites[satelliteIndex++ % satellites.length];
      const rotation = slot[2] * mirror;
      const vertical = Math.abs(rotation) > 1;
      words[index] = {
        x: slot[0] * width * mirror,
        y: slot[1] * height,
        rotation,
        scale: fitScale(wordWidths[index], slot[3], vertical ? safeH * 0.54 : safeW * 0.34, 0.38, 0.9),
        entryX: slot[4] * width * mirror,
        entryY: slot[5] * height,
        entryScale: 0.58,
        entryRotation: (satelliteIndex % 2 ? -0.12 : 0.12) * mirror,
        emphasis: 0.42,
      };
    }
    return { layout, anchorIndex, words };
  }

  if (layout === "vertical-accent") {
    const verticalIndex = anchorIndex;
    let horizontalSlot = 0;
    const horizontalCount = Math.max(1, count - 1);
    for (let index = 0; index < count; index++) {
      if (index === verticalIndex) {
        words[index] = {
          x: -width * 0.27 * mirror,
          y: 0,
          rotation: (Math.PI / 2) * mirror,
          scale: fitScale(wordWidths[index], 1.1, safeH * 0.76, 0.46, 1.2),
          entryX: 0,
          entryY: height * 0.5 * mirror,
          entryScale: 0.45,
          entryRotation: -0.18 * mirror,
          emphasis: 1,
        };
        continue;
      }
      const t = horizontalCount <= 1 ? 0.5 : horizontalSlot / (horizontalCount - 1);
      words[index] = {
        x: width * 0.17 * mirror,
        y: (t - 0.5) * safeH * 0.74,
        rotation: horizontalSlot % 3 === 2 ? 0.035 * mirror : 0,
        scale: fitScale(wordWidths[index], horizontalSlot % 2 ? 0.78 : 0.92, safeW * 0.45, 0.42, 1.05),
        entryX: width * 0.43 * mirror,
        entryY: horizontalSlot % 2 ? height * 0.12 : -height * 0.12,
        entryScale: horizontalSlot % 3 === 1 ? 1.45 : 0.62,
        entryRotation: horizontalSlot % 2 ? -0.08 : 0.08,
        emphasis: 0.55,
      };
      horizontalSlot++;
    }
    return { layout, anchorIndex, words };
  }

  if (layout === "split-stage") {
    const rows = Math.ceil(count / 2);
    for (let index = 0; index < count; index++) {
      const side = index % 2 === 0 ? -1 : 1;
      const row = Math.floor(index / 2);
      const t = rows <= 1 ? 0.5 : row / (rows - 1);
      const x = side * width * (0.19 + (row % 2) * 0.055) * mirror;
      const y = (t - 0.5) * safeH * 0.82;
      const desired = index === anchorIndex ? 1.05 : 0.76 + (index % 3) * 0.08;
      words[index] = {
        x,
        y,
        rotation: side * 0.025 * mirror,
        scale: fitScale(wordWidths[index], desired, safeW * 0.42, 0.42, 1.16),
        entryX: side * width * 0.46 * mirror,
        entryY: row % 2 ? height * 0.08 : -height * 0.08,
        entryScale: index === anchorIndex ? 0.3 : 0.7,
        entryRotation: side * 0.1 * mirror,
        emphasis: index === anchorIndex ? 1 : 0.5,
      };
    }
    return { layout, anchorIndex, words };
  }

  // crossword
  const verticalIndex = count > 1
    ? (anchorIndex + 1 + (input.lineIndex % Math.max(1, count - 1))) % count
    : anchorIndex;
  let satellite = 0;
  for (let index = 0; index < count; index++) {
    if (index === anchorIndex) {
      words[index] = {
        x: 0,
        y: 0,
        rotation: 0,
        scale: fitScale(wordWidths[index], 1.26, safeW * 0.68, 0.5, 1.4),
        entryX: -width * 0.42 * mirror,
        entryY: 0,
        entryScale: 0.3,
        entryRotation: -0.04 * mirror,
        emphasis: 1,
      };
    } else if (index === verticalIndex) {
      words[index] = {
        x: -width * 0.12 * mirror,
        y: -height * 0.015,
        rotation: (Math.PI / 2) * mirror,
        scale: fitScale(wordWidths[index], 0.84, safeH * 0.58, 0.4, 0.96),
        entryX: 0,
        entryY: height * 0.46,
        entryScale: 0.62,
        entryRotation: -0.16 * mirror,
        emphasis: 0.78,
      };
    } else {
      const positions = [
        [0.25, -0.23],
        [-0.27, 0.24],
        [0.26, 0.25],
        [-0.28, -0.27],
      ] as const;
      const position = positions[satellite++ % positions.length];
      words[index] = {
        x: position[0] * width * mirror,
        y: position[1] * height,
        rotation: satellite % 2 ? 0.045 * mirror : -0.035 * mirror,
        scale: fitScale(wordWidths[index], 0.62, safeW * 0.3, 0.38, 0.78),
        entryX: position[0] * width * 1.4 * mirror,
        entryY: position[1] * height * 0.8,
        entryScale: 0.56,
        entryRotation: satellite % 2 ? 0.13 : -0.13,
        emphasis: 0.38,
      };
    }
  }
  return { layout, anchorIndex, words };
}
