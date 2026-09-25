export type ShapeFillVariant = "tree" | "star" | "figure";

export interface TypographyPackingSlot {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  priority: number;
}

interface NormalizedCell {
  x: number;
  y: number;
  priority: number;
}

interface MutableRect {
  x: number;
  y: number;
  width: number;
  height: number;
  seed: number;
}

export function shapeFillVariantForScope(scopeStartLineIndex: number): ShapeFillVariant {
  const index = Math.abs(Math.floor(scopeStartLineIndex)) % 3;
  return index === 0 ? "tree" : index === 1 ? "star" : "figure";
}

export function buildShapeFillSlots(
  variant: ShapeFillVariant,
  count: number,
  width: number,
  height: number,
): TypographyPackingSlot[] {
  const safeCount = Math.max(1, Math.floor(count));
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  const regionWidth = w * 0.7;
  const regionHeight = h * 0.72;
  const aspect = regionWidth / Math.max(1, regionHeight);

  let columns = Math.max(7, Math.ceil(Math.sqrt(safeCount * 2.25 * aspect)));
  let rows = Math.max(9, Math.ceil(columns / Math.max(0.45, aspect)));
  let candidates = shapeCandidates(variant, columns, rows);

  while (candidates.length < safeCount && columns < 36 && rows < 36) {
    columns += 1;
    rows += 1;
    candidates = shapeCandidates(variant, columns, rows);
  }

  const selected = distributedSelect(candidates, safeCount);
  const cellWidth = regionWidth / columns;
  const cellHeight = regionHeight / rows;

  return selected.map((cell, index) => {
    const radial = Math.min(1, Math.hypot(cell.x, cell.y) / 1.18);
    const sizeLift = 1.18 - radial * 0.18;
    const boxWidth = cellWidth * 1.58 * sizeLift;
    const boxHeight = cellHeight * 1.26 * sizeLift;
    const vertical = index % 6 === 4 && boxHeight > boxWidth * 0.58;

    return {
      x: cell.x * regionWidth * 0.5,
      y: cell.y * regionHeight * 0.5,
      width: boxWidth,
      height: boxHeight,
      rotation: vertical ? (index % 2 === 0 ? Math.PI * 0.5 : -Math.PI * 0.5) : 0,
      priority: cell.priority,
    };
  });
}

export function buildManifestoSlots(
  count: number,
  width: number,
  height: number,
): TypographyPackingSlot[] {
  const safeCount = Math.max(1, Math.floor(count));
  const wallWidth = Math.max(1, width) * 0.78;
  const wallHeight = Math.max(1, height) * 0.64;
  const rects: MutableRect[] = [{
    x: -wallWidth * 0.5,
    y: -wallHeight * 0.5,
    width: wallWidth,
    height: wallHeight,
    seed: 1,
  }];

  for (let step = 1; rects.length < safeCount; step++) {
    const targetIndex = chooseSplitRect(rects, step);
    const target = rects.splice(targetIndex, 1)[0];
    const horizontal = shouldSplitHorizontal(target, step);
    const ratio = splitRatio(target.seed, step);

    if (horizontal) {
      const firstHeight = target.height * ratio;
      rects.push(
        {
          x: target.x,
          y: target.y,
          width: target.width,
          height: firstHeight,
          seed: target.seed * 2 + 1,
        },
        {
          x: target.x,
          y: target.y + firstHeight,
          width: target.width,
          height: target.height - firstHeight,
          seed: target.seed * 2 + 2,
        },
      );
    } else {
      const firstWidth = target.width * ratio;
      rects.push(
        {
          x: target.x,
          y: target.y,
          width: firstWidth,
          height: target.height,
          seed: target.seed * 2 + 1,
        },
        {
          x: target.x + firstWidth,
          y: target.y,
          width: target.width - firstWidth,
          height: target.height,
          seed: target.seed * 2 + 2,
        },
      );
    }
  }

  const gutter = Math.max(3, Math.min(width, height) * 0.008);
  return rects
    .map((rect, index) => {
      const innerWidth = Math.max(12, rect.width - gutter);
      const innerHeight = Math.max(12, rect.height - gutter);
      const vertical = innerHeight > innerWidth * 1.24;

      return {
        x: rect.x + rect.width * 0.5,
        y: rect.y + rect.height * 0.5,
        width: innerWidth,
        height: innerHeight,
        rotation: vertical
          ? ((rect.seed + index) % 2 === 0 ? Math.PI * 0.5 : -Math.PI * 0.5)
          : 0,
        priority: rect.width * rect.height,
      } satisfies TypographyPackingSlot;
    })
    .sort((a, b) => (
      a.y - b.y
      || a.x - b.x
      || b.priority - a.priority
    ));
}

function shapeCandidates(
  variant: ShapeFillVariant,
  columns: number,
  rows: number,
): NormalizedCell[] {
  const cells: NormalizedCell[] = [];
  const seed = variant === "tree" ? 17.3 : variant === "star" ? 41.7 : 73.9;

  for (let row = 0; row < rows; row++) {
    const y = -1 + (row + 0.5) / rows * 2;
    for (let column = 0; column < columns; column++) {
      const x = -1 + (column + 0.5) / columns * 2;
      if (!insideShape(variant, x, y)) continue;
      const centerBias = 1 - Math.min(1, Math.hypot(x, y) / 1.35);
      const jitter = hash01((row + 1) * 91.17 + (column + 1) * 47.31 + seed);
      cells.push({
        x,
        y,
        priority: centerBias * 0.58 + jitter * 0.42,
      });
    }
  }

  return cells.sort((a, b) => b.priority - a.priority || a.y - b.y || a.x - b.x);
}

function distributedSelect(candidates: NormalizedCell[], count: number) {
  if (candidates.length <= count) return candidates;

  // Pick across the whole candidate field rather than taking only the center.
  // A deterministic golden-step walk gives broad silhouette coverage while
  // preserving stable placement for a fixed phrase scope.
  const selected: NormalizedCell[] = [];
  const used = new Set<number>();
  const step = 0.6180339887498949;

  for (let index = 0; index < count; index++) {
    let cursor = Math.floor((((index + 0.5) * step) % 1) * candidates.length);
    while (used.has(cursor)) cursor = (cursor + 1) % candidates.length;
    used.add(cursor);
    selected.push(candidates[cursor]);
  }

  return selected.sort((a, b) => b.priority - a.priority || a.y - b.y || a.x - b.x);
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
    ? clamp01(((px - ax) * vx + (py - ay) * vy) / length2)
    : 0;
  const dx = px - (ax + vx * t);
  const dy = py - (ay + vy * t);
  return Math.hypot(dx, dy);
}

function chooseSplitRect(rects: MutableRect[], step: number) {
  let bestIndex = 0;
  let bestScore = -Infinity;
  for (let index = 0; index < rects.length; index++) {
    const rect = rects[index];
    const jitter = 0.82 + hash01(rect.seed * 17.13 + step * 9.71) * 0.36;
    const score = rect.width * rect.height * jitter;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }
  return bestIndex;
}

function shouldSplitHorizontal(rect: MutableRect, step: number) {
  const aspect = rect.width / Math.max(1, rect.height);
  if (aspect > 1.35) return false;
  if (aspect < 0.74) return true;
  return (rect.seed + step) % 2 === 0;
}

function splitRatio(seed: number, step: number) {
  const options = [0.38, 0.44, 0.5, 0.56, 0.62];
  return options[Math.floor(hash01(seed * 31.7 + step * 11.3) * options.length) % options.length];
}

function hash01(value: number) {
  const x = Math.sin(value * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}
