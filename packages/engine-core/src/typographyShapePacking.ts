import type { SequenceScopeWordRef } from "./typographySequence.js";
import {
  normalizeSpatialMetrics,
  spatialBoxFor,
  spatialBoxesOverlap,
  type TypographySpatialBox,
  type TypographySpatialMetrics,
} from "./typographySpatial.js";

export type ShapeFillVariant = "tree" | "star" | "figure";

export interface TypographyPackingSlot {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  rotation: number;
  priority: number;
}

export type TypographyMetricsById = Record<string, TypographySpatialMetrics | undefined>;

interface CandidatePoint {
  x: number;
  y: number;
  nx: number;
  ny: number;
  priority: number;
}

interface PackedWord {
  word: SequenceScopeWordRef;
  slot: TypographyPackingSlot;
  box: TypographySpatialBox;
}

export function shapeFillVariantForScope(scopeStartLineIndex: number): ShapeFillVariant {
  const index = Math.abs(Math.floor(scopeStartLineIndex)) % 3;
  return index === 0 ? "tree" : index === 1 ? "star" : "figure";
}

/**
 * d3-cloud / wordcloud2 style placement adapted for deterministic lyric scenes:
 * real text extents are tested against an occupancy set and candidate positions
 * are searched nearest-first. Unlike generic word clouds we never drop a lyric:
 * scale is reduced and placement retried until every scope word has a slot.
 */
export function buildShapeFillLayout(
  variant: ShapeFillVariant,
  words: SequenceScopeWordRef[],
  metricsById: TypographyMetricsById,
  width: number,
  height: number,
): Map<string, TypographyPackingSlot> {
  const safeWords = [...words].sort((a, b) => a.scopeOrdinal - b.scopeOrdinal);
  const result = new Map<string, TypographyPackingSlot>();
  if (!safeWords.length) return result;

  const w = Math.max(1, width);
  const h = Math.max(1, height);
  const regionWidth = w * 0.72;
  const regionHeight = h * 0.76;
  const minDimension = Math.min(w, h);
  const gap = Math.max(3, minDimension * 0.0065);
  const candidates = buildShapeCandidates(variant, regionWidth, regionHeight);
  const occupied: TypographySpatialBox[] = [];

  const approximateCoverage = variant === "tree" ? 0.54 : variant === "star" ? 0.43 : 0.36;
  const usableArea = regionWidth * regionHeight * approximateCoverage * 0.72;
  const baseWordArea = usableArea / Math.max(1, safeWords.length);

  const descriptors = safeWords.map(word => {
    const metrics = normalizeSpatialMetrics(metricsById[word.id], word.text);
    const seed = hash01(word.scopeOrdinal * 19.37 + word.text.length * 7.13);
    const anchor = word.scopeOrdinal % 11 === 0;
    const sizeWeight = anchor
      ? 1.6 + seed * 0.45
      : 0.66 + seed * 0.82;
    const desiredArea = baseWordArea * sizeWeight;
    const desiredScale = clampNumber(
      Math.sqrt(desiredArea / Math.max(1, metrics.width * metrics.height)),
      0.11,
      3.4,
    );
    const vertical = !anchor && hash01(word.scopeOrdinal * 31.71 + 4.2) < 0.19;
    const rotation = vertical
      ? (word.scopeOrdinal % 2 === 0 ? Math.PI * 0.5 : -Math.PI * 0.5)
      : 0;
    return { word, metrics, desiredScale, rotation, sizeWeight };
  });

  // Place the most spatially important words first, but because we solve the
  // complete phrase scope at once the result is stable while lyrics reveal.
  descriptors.sort((a, b) => (
    b.desiredScale * b.metrics.width * b.metrics.height
    - a.desiredScale * a.metrics.width * a.metrics.height
    || a.word.scopeOrdinal - b.word.scopeOrdinal
  ));

  for (const descriptor of descriptors) {
    const preferred = preferredCandidate(
      candidates,
      hash01(descriptor.word.scopeOrdinal * 53.17 + descriptor.word.text.length * 3.11),
    );
    const ordered = candidates
      .map(candidate => ({
        candidate,
        distance: squaredDistance(candidate, preferred)
          - candidate.priority * regionWidth * regionWidth * 0.015,
      }))
      .sort((a, b) => a.distance - b.distance);

    let packed: PackedWord | undefined;
    const shrinkSteps = [1, 0.94, 0.88, 0.81, 0.74, 0.67, 0.6, 0.53, 0.46, 0.39, 0.32, 0.26, 0.2];

    for (const shrink of shrinkSteps) {
      const scale = Math.max(0.07, descriptor.desiredScale * shrink);
      for (const { candidate } of ordered) {
        const pose = {
          x: candidate.x,
          y: candidate.y,
          scale,
          rotation: descriptor.rotation,
        };
        const box = spatialBoxFor(descriptor.metrics, pose, gap);
        if (!boxInsideShape(variant, box, regionWidth, regionHeight)) continue;
        if (occupied.some(other => spatialBoxesOverlap(box, other))) continue;

        packed = {
          word: descriptor.word,
          slot: {
            x: candidate.x,
            y: candidate.y,
            width: box.width,
            height: box.height,
            scale,
            rotation: descriptor.rotation,
            priority: descriptor.sizeWeight,
          },
          box,
        };
        break;
      }
      if (packed) break;
    }

    // Lyrics cannot be dropped. If the normal cloud search cannot seat the
    // word, keep reducing it and search the complete silhouette deterministically.
    if (!packed) {
      for (let emergency = 0; emergency < 10 && !packed; emergency++) {
        const scale = Math.max(0.035, descriptor.desiredScale * Math.pow(0.78, emergency + 5));
        for (const candidate of candidates) {
          const pose = { x: candidate.x, y: candidate.y, scale, rotation: descriptor.rotation };
          const box = spatialBoxFor(descriptor.metrics, pose, gap * 0.45);
          if (!boxInsideShape(variant, box, regionWidth, regionHeight)) continue;
          if (occupied.some(other => spatialBoxesOverlap(box, other))) continue;
          packed = {
            word: descriptor.word,
            slot: {
              x: candidate.x,
              y: candidate.y,
              width: box.width,
              height: box.height,
              scale,
              rotation: descriptor.rotation,
              priority: descriptor.sizeWeight,
            },
            box,
          };
          break;
        }
      }
    }

    if (!packed) {
      // Last-resort deterministic safety slot. This should only occur for
      // pathological masks/word counts; it still avoids NaN/drop behavior.
      const candidate = candidates[descriptor.word.scopeOrdinal % candidates.length] ?? {
        x: 0, y: 0, nx: 0, ny: 0, priority: 0,
      };
      const scale = 0.035;
      const box = spatialBoxFor(descriptor.metrics, {
        x: candidate.x,
        y: candidate.y,
        scale,
        rotation: descriptor.rotation,
      });
      packed = {
        word: descriptor.word,
        slot: {
          x: candidate.x,
          y: candidate.y,
          width: box.width,
          height: box.height,
          scale,
          rotation: descriptor.rotation,
          priority: descriptor.sizeWeight,
        },
        box,
      };
    }

    occupied.push(packed.box);
    result.set(packed.word.id, packed.slot);
  }

  return result;
}

/**
 * Progressive book/page composer for Manifesto Wall. The whole phrase is
 * reserved once, then words reveal into their immutable slots. Most slots are
 * horizontal, occasional 90-degree words act as editorial brackets.
 */
export function buildManifestoPageLayout(
  words: SequenceScopeWordRef[],
  metricsById: TypographyMetricsById,
  width: number,
  height: number,
): Map<string, TypographyPackingSlot> {
  const source = [...words].sort((a, b) => a.scopeOrdinal - b.scopeOrdinal);
  const result = new Map<string, TypographyPackingSlot>();
  if (!source.length) return result;

  const pageWidth = Math.max(1, width) * 0.78;
  const pageHeight = Math.max(1, height) * 0.7;
  const minDimension = Math.min(width, height);
  const gapX = Math.max(6, minDimension * 0.009);
  const gapY = Math.max(7, minDimension * 0.011);
  const left = -pageWidth * 0.5;
  const top = -pageHeight * 0.5;

  const descriptors = source.map(word => {
    const metrics = normalizeSpatialMetrics(metricsById[word.id], word.text);
    const hash = hash01(word.scopeOrdinal * 17.73 + word.text.length * 11.91);
    const anchor = word.scopeOrdinal === 0 || word.scopeOrdinal % 9 === 0;
    const vertical = !anchor
      && word.text.length <= 12
      && hash01(word.scopeOrdinal * 29.11 + 8.7) < 0.17;
    const localScale = anchor
      ? 1.18 + hash * 0.22
      : 0.72 + hash * 0.34;
    return {
      word,
      metrics,
      rotation: vertical
        ? (word.scopeOrdinal % 2 === 0 ? Math.PI * 0.5 : -Math.PI * 0.5)
        : 0,
      localScale,
      anchor,
    };
  });

  // Reduce the whole page until every reserved word fits. No word is omitted.
  for (let globalScale = 1; globalScale >= 0.28; globalScale -= 0.035) {
    const attempt = new Map<string, TypographyPackingSlot>();
    let cursorX = left;
    let cursorY = top;
    let rowHeight = 0;
    let failed = false;

    for (const descriptor of descriptors) {
      let scale = globalScale * descriptor.localScale;
      let box = spatialBoxFor(descriptor.metrics, {
        x: 0,
        y: 0,
        scale,
        rotation: descriptor.rotation,
      });

      const maxWordWidth = pageWidth * (descriptor.anchor ? 0.62 : 0.48);
      if (box.width > maxWordWidth) {
        scale *= maxWordWidth / box.width;
        box = spatialBoxFor(descriptor.metrics, {
          x: 0,
          y: 0,
          scale,
          rotation: descriptor.rotation,
        });
      }

      if (cursorX > left && cursorX + box.width > left + pageWidth) {
        cursorX = left;
        cursorY += rowHeight + gapY;
        rowHeight = 0;
      }

      if (cursorY + box.height > top + pageHeight) {
        failed = true;
        break;
      }

      const editorialIndent = cursorX === left && descriptor.word.lineIndex % 2 === 1
        ? Math.min(pageWidth * 0.055, 28)
        : 0;
      const x = cursorX + editorialIndent + box.width * 0.5;
      const y = cursorY + box.height * 0.5;

      attempt.set(descriptor.word.id, {
        x,
        y,
        width: box.width,
        height: box.height,
        scale,
        rotation: descriptor.rotation,
        priority: descriptor.anchor ? 2 : 1,
      });

      cursorX += editorialIndent + box.width + gapX;
      rowHeight = Math.max(rowHeight, box.height);
    }

    if (!failed && attempt.size === descriptors.length) return attempt;
  }

  // Extremely dense phrase fallback: one deterministic compact shelf pass.
  let cursorX = left;
  let cursorY = top;
  let rowHeight = 0;
  for (const descriptor of descriptors) {
    const scale = Math.max(0.08, 0.24 * descriptor.localScale);
    const box = spatialBoxFor(descriptor.metrics, { x: 0, y: 0, scale, rotation: descriptor.rotation });
    if (cursorX > left && cursorX + box.width > left + pageWidth) {
      cursorX = left;
      cursorY += rowHeight + gapY * 0.55;
      rowHeight = 0;
    }
    if (cursorY + box.height > top + pageHeight) cursorY = top;
    result.set(descriptor.word.id, {
      x: cursorX + box.width * 0.5,
      y: cursorY + box.height * 0.5,
      width: box.width,
      height: box.height,
      scale,
      rotation: descriptor.rotation,
      priority: descriptor.anchor ? 2 : 1,
    });
    cursorX += box.width + gapX * 0.55;
    rowHeight = Math.max(rowHeight, box.height);
  }
  return result;
}

// Backward-compatible helpers retained for tests/tools that still request only
// anonymous slots. They now use synthetic metrics and the same collision solver.
export function buildShapeFillSlots(
  variant: ShapeFillVariant,
  count: number,
  width: number,
  height: number,
): TypographyPackingSlot[] {
  const words = syntheticWords(count);
  const metrics = Object.fromEntries(words.map(word => [
    word.id,
    normalizeSpatialMetrics(undefined, word.text),
  ]));
  const map = buildShapeFillLayout(variant, words, metrics, width, height);
  return words.map(word => map.get(word.id)).filter((slot): slot is TypographyPackingSlot => Boolean(slot));
}

export function buildManifestoSlots(
  count: number,
  width: number,
  height: number,
): TypographyPackingSlot[] {
  const words = syntheticWords(count);
  const metrics = Object.fromEntries(words.map(word => [
    word.id,
    normalizeSpatialMetrics(undefined, word.text),
  ]));
  const map = buildManifestoPageLayout(words, metrics, width, height);
  return words.map(word => map.get(word.id)).filter((slot): slot is TypographyPackingSlot => Boolean(slot));
}

function buildShapeCandidates(
  variant: ShapeFillVariant,
  regionWidth: number,
  regionHeight: number,
) {
  const columns = 52;
  const rows = 58;
  const candidates: CandidatePoint[] = [];
  const seed = variant === "tree" ? 17.3 : variant === "star" ? 41.7 : 73.9;

  for (let row = 0; row < rows; row++) {
    const ny = -1 + (row + 0.5) / rows * 2;
    for (let column = 0; column < columns; column++) {
      const nx = -1 + (column + 0.5) / columns * 2;
      if (!insideShape(variant, nx, ny)) continue;
      const centerBias = 1 - Math.min(1, Math.hypot(nx, ny) / 1.35);
      const jitter = hash01((row + 1) * 91.17 + (column + 1) * 47.31 + seed);
      candidates.push({
        nx,
        ny,
        x: nx * regionWidth * 0.5,
        y: ny * regionHeight * 0.5,
        priority: centerBias * 0.48 + jitter * 0.52,
      });
    }
  }

  return candidates.sort((a, b) => b.priority - a.priority || a.y - b.y || a.x - b.x);
}

function preferredCandidate(candidates: CandidatePoint[], seed: number) {
  if (!candidates.length) return { x: 0, y: 0, nx: 0, ny: 0, priority: 0 };
  const index = Math.min(candidates.length - 1, Math.floor(seed * candidates.length));
  return candidates[index];
}

function squaredDistance(a: CandidatePoint, b: CandidatePoint) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function boxInsideShape(
  variant: ShapeFillVariant,
  box: TypographySpatialBox,
  regionWidth: number,
  regionHeight: number,
) {
  const xs = [box.left, box.cx, box.right];
  const ys = [box.top, box.cy, box.bottom];
  for (const x of xs) {
    for (const y of ys) {
      const nx = x / Math.max(1, regionWidth * 0.5);
      const ny = y / Math.max(1, regionHeight * 0.5);
      if (!insideShape(variant, nx, ny)) return false;
    }
  }
  return true;
}

function insideShape(variant: ShapeFillVariant, x: number, y: number) {
  if (variant === "tree") return insideTree(x, y);
  if (variant === "star") return insideStar(x, y);
  return insideFigure(x, y);
}

function insideTree(x: number, y: number) {
  const crown = y >= -0.92 && y <= 0.44
    && Math.abs(x) <= 0.12 + ((y + 0.92) / 1.36) * 0.82;
  const trunk = y > 0.3 && y <= 0.94 && Math.abs(x) <= 0.2;
  return crown || trunk;
}

function insideStar(x: number, y: number) {
  const angle = Math.atan2(y, x) - Math.PI * 0.5;
  const radius = Math.hypot(x, y);
  const sector = Math.PI / 5;
  const folded = Math.abs((((angle + sector * 0.5) % sector) + sector) % sector - sector * 0.5);
  const outer = 0.9;
  const inner = 0.4;
  const boundary = inner + (outer - inner) * (1 - folded / (sector * 0.5));
  return radius <= boundary;
}

function insideFigure(x: number, y: number) {
  const head = Math.hypot(x + 0.02, y + 0.68) <= 0.18;
  const torso = pointToSegmentDistance(x, y, -0.02, -0.48, 0.06, 0.12) <= 0.2;
  const leftArm = pointToSegmentDistance(x, y, -0.02, -0.35, -0.7, -0.05) <= 0.11;
  const rightArm = pointToSegmentDistance(x, y, 0.02, -0.33, 0.62, -0.55) <= 0.11;
  const leftLeg = pointToSegmentDistance(x, y, 0.03, 0.08, -0.48, 0.82) <= 0.13;
  const rightLeg = pointToSegmentDistance(x, y, 0.08, 0.08, 0.62, 0.66) <= 0.13;
  return head || torso || leftArm || rightArm || leftLeg || rightLeg;
}

function pointToSegmentDistance(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
) {
  const vx = bx - ax;
  const vy = by - ay;
  const length2 = vx * vx + vy * vy;
  const t = length2 > 0
    ? clampNumber(((px - ax) * vx + (py - ay) * vy) / length2, 0, 1)
    : 0;
  const dx = px - (ax + vx * t);
  const dy = py - (ay + vy * t);
  return Math.hypot(dx, dy);
}

function syntheticWords(count: number): SequenceScopeWordRef[] {
  return Array.from({ length: Math.max(1, Math.floor(count)) }, (_, index) => ({
    id: `synthetic:${index}`,
    lineIndex: 0,
    wordIndex: index,
    text: index % 5 === 0 ? "MANIFESTO" : index % 3 === 0 ? "WORD" : "TYPE",
    start: index,
    end: index + 0.5,
    scopeOrdinal: index,
  }));
}

function hash01(value: number) {
  const x = Math.sin(value * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
