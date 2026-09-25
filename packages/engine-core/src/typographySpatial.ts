export interface TypographySpatialMetrics {
  width: number;
  height: number;
  advanceWidth: number;
  lineHeight: number;
  ascent: number;
  descent: number;
  padding: number;
}

export interface TypographySpatialPose {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface TypographySpatialBox {
  cx: number;
  cy: number;
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface TypographySpatialPlacement extends TypographySpatialPose {
  id: string;
  maxWidth?: number;
  maxHeight?: number;
}

export function normalizeSpatialMetrics(
  value: Partial<TypographySpatialMetrics> | undefined,
  fallbackText = "",
): TypographySpatialMetrics {
  const fallbackWidth = Math.max(24, fallbackText.length * 46);
  const width = finitePositive(value?.width, fallbackWidth);
  const height = finitePositive(value?.height, 84);
  return {
    width,
    height,
    advanceWidth: finitePositive(value?.advanceWidth, width),
    lineHeight: finitePositive(value?.lineHeight, height),
    ascent: finitePositive(value?.ascent, height * 0.78),
    descent: finitePositive(value?.descent, height * 0.22),
    padding: Math.max(0, Number.isFinite(value?.padding) ? value?.padding ?? 0 : 0),
  };
}

export function spatialBoxFor(
  metrics: TypographySpatialMetrics,
  pose: TypographySpatialPose,
  extraGap = 0,
): TypographySpatialBox {
  const scale = Math.max(0.0001, Math.abs(pose.scale));
  const localWidth = Math.max(1, metrics.width + (metrics.padding + extraGap) * 2) * scale;
  const localHeight = Math.max(1, metrics.height + (metrics.padding + extraGap) * 2) * scale;
  const cos = Math.abs(Math.cos(pose.rotation));
  const sin = Math.abs(Math.sin(pose.rotation));
  const width = localWidth * cos + localHeight * sin;
  const height = localWidth * sin + localHeight * cos;

  return {
    cx: pose.x,
    cy: pose.y,
    width,
    height,
    left: pose.x - width * 0.5,
    right: pose.x + width * 0.5,
    top: pose.y - height * 0.5,
    bottom: pose.y + height * 0.5,
  };
}

export function spatialBoxesOverlap(
  a: TypographySpatialBox,
  b: TypographySpatialBox,
  gap = 0,
) {
  return !(
    a.right + gap <= b.left
    || b.right + gap <= a.left
    || a.bottom + gap <= b.top
    || b.bottom + gap <= a.top
  );
}

export function fitSpatialScale(
  metrics: TypographySpatialMetrics,
  maxWidth: number,
  maxHeight: number,
  rotation = 0,
  desired = 1,
  min = 0.08,
  max = 4,
) {
  const box = spatialBoxFor(metrics, { x: 0, y: 0, scale: 1, rotation });
  const fit = Math.min(
    Math.max(1, maxWidth) / Math.max(1, box.width),
    Math.max(1, maxHeight) / Math.max(1, box.height),
  );
  return clampNumber(Math.min(desired, fit), min, max);
}

export function spatialEnvelope(boxes: TypographySpatialBox[]) {
  if (!boxes.length) {
    return {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      width: 0,
      height: 0,
      cx: 0,
      cy: 0,
    };
  }

  let left = boxes[0].left;
  let right = boxes[0].right;
  let top = boxes[0].top;
  let bottom = boxes[0].bottom;

  for (let index = 1; index < boxes.length; index++) {
    const box = boxes[index];
    left = Math.min(left, box.left);
    right = Math.max(right, box.right);
    top = Math.min(top, box.top);
    bottom = Math.max(bottom, box.bottom);
  }

  return {
    left,
    right,
    top,
    bottom,
    width: right - left,
    height: bottom - top,
    cx: (left + right) * 0.5,
    cy: (top + bottom) * 0.5,
  };
}

export function clampSpatialPoseToRect(
  metrics: TypographySpatialMetrics,
  pose: TypographySpatialPose,
  rect: { left: number; right: number; top: number; bottom: number },
  gap = 0,
) {
  const box = spatialBoxFor(metrics, pose, gap);
  const halfW = box.width * 0.5;
  const halfH = box.height * 0.5;
  const minX = rect.left + halfW;
  const maxX = rect.right - halfW;
  const minY = rect.top + halfH;
  const maxY = rect.bottom - halfH;

  return {
    ...pose,
    x: minX <= maxX ? clampNumber(pose.x, minX, maxX) : (rect.left + rect.right) * 0.5,
    y: minY <= maxY ? clampNumber(pose.y, minY, maxY) : (rect.top + rect.bottom) * 0.5,
  };
}

function finitePositive(value: number | undefined, fallback: number) {
  return Number.isFinite(value) && (value ?? 0) > 0 ? value as number : fallback;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
