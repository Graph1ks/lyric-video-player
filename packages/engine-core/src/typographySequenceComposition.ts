import { clamp, lerp } from "./math.js";
import {
  buildManifestoPageLayout,
  buildShapeFillLayout,
  shapeFillVariantForScope,
  type TypographyMetricsById,
  type TypographyPackingSlot,
} from "./typographyShapePacking.js";
import {
  fitSpatialScale,
  normalizeSpatialMetrics,
  spatialBoxFor,
  spatialBoxesOverlap,
  type TypographySpatialBox,
} from "./typographySpatial.js";
import type {
  SequenceWordRef,
  TypographySequenceWindow,
} from "./typographySequence.js";

export type TypographySequenceGrammarId =
  | "spiral-depth"
  | "hero-echo"
  | "shape-fill"
  | "manifesto-wall"
  | "ribbon-path"
  | "shape-build";
export type TypographySequenceMode = "auto" | "off" | TypographySequenceGrammarId;
export type ResolvedTypographySequence = "off" | TypographySequenceGrammarId;
export type SequenceTypographyTreatment = "solid" | "outline";
export type TypographySequenceVariant =
  | "spiral"
  | "hero-echo"
  | "shape-tree"
  | "shape-star"
  | "shape-figure"
  | "editorial-page"
  | "s-curve"
  | "frame"
  | "ring";

export interface TypographySequencePlacement {
  id: string;
  role: SequenceWordRef["role"];
  x: number;
  y: number;
  scale: number;
  rotation: number;
  alpha: number;
  zIndex: number;
  treatment: SequenceTypographyTreatment;
  maxWidth?: number;
  maxHeight?: number;
}

export interface TypographySequencePlan {
  grammar: TypographySequenceGrammarId;
  variant: TypographySequenceVariant;
  heroId?: string;
  words: TypographySequencePlacement[];
}

export interface TypographySequencePlanInput {
  grammar: TypographySequenceGrammarId;
  window: TypographySequenceWindow;
  width: number;
  height: number;
  metricsById?: TypographyMetricsById;
  staticLayout?: ReadonlyMap<string, TypographyPackingSlot>;
}

export function planTypographySequence(
  input: TypographySequencePlanInput,
): TypographySequencePlan {
  if (input.grammar === "hero-echo") return planHeroEcho(input);
  if (input.grammar === "shape-fill" || input.grammar === "shape-build") {
    return planShapeFill(input);
  }
  if (input.grammar === "manifesto-wall") return planManifestoWall(input);
  if (input.grammar === "ribbon-path") return planRibbonPath(input);
  return planSpiralDepth(input);
}

function planSpiralDepth(input: TypographySequencePlanInput): TypographySequencePlan {
  const width = Math.max(1, input.width);
  const height = Math.max(1, input.height);
  const minDimension = Math.min(width, height);
  const visible = input.window.words
    .filter(word => word.role !== "incoming")
    .sort(compareNewest);

  const active = visible.find(word => word.role === "active");
  const activeProgress = active
    ? clamp((input.window.time - active.start) / Math.max(0.04, active.end - active.start))
    : 0;
  const maxDepthUnits = 13;
  const occupied: TypographySpatialBox[] = [];
  const placements: TypographySequencePlacement[] = [];
  let cumulativeDepth = activeProgress;

  for (let rank = 0; rank < visible.length; rank++) {
    const word = visible[rank];
    const metrics = normalizeSpatialMetrics(input.metricsById?.[word.id], word.text);

    if (rank > 0) {
      const previous = visible[rank - 1];
      const previousMetrics = normalizeSpatialMetrics(input.metricsById?.[previous.id], previous.text);
      const projectedExtent = (
        Math.max(previousMetrics.width, previousMetrics.height)
        + Math.max(metrics.width, metrics.height)
      ) * 0.5;
      cumulativeDepth += clamp(projectedExtent / Math.max(1, minDimension) * 4.4, 0.72, 1.85);
    }

    let depthUnits = cumulativeDepth;
    let chosen: TypographySequencePlacement | undefined;
    let chosenBox: TypographySpatialBox | undefined;

    for (let attempt = 0; attempt < 24; attempt++) {
      const depth = clamp(depthUnits / maxDepthUnits);
      const tail = Math.pow(0.88, Math.max(0, depthUnits - maxDepthUnits));
      const angle = -Math.PI * 0.16 - depthUnits * 0.64;
      const radius = minDimension * lerp(0.255, 0.028, Math.pow(depth, 0.8));
      const isActive = word.role === "active";
      const recent = word.role === "recent";
      const scale = lerp(1.42, 0.17, Math.pow(depth, 0.7)) * tail;
      const alpha = isActive
        ? 1
        : clamp(
            lerp(recent ? 0.84 : 0.64, 0.07, Math.pow(depth, 0.9)) * Math.max(0.25, tail),
            0.045,
            0.9,
          );
      const rotation = isActive ? 0 : normalizeAngle(angle + Math.PI * 0.5) * 0.72;
      const x = Math.cos(angle) * radius * Math.min(1.55, width / minDimension);
      const y = Math.sin(angle) * radius * 0.78;
      const box = spatialBoxFor(metrics, { x, y, scale, rotation }, Math.max(3, minDimension * 0.004));

      if (!occupied.some(other => spatialBoxesOverlap(box, other))) {
        chosen = {
          id: word.id,
          role: word.role,
          x,
          y,
          scale,
          rotation,
          alpha,
          zIndex: Math.max(1, maxDepthUnits * 10 - Math.round(depthUnits * 10)),
          treatment: isActive || recent ? "solid" : "outline",
        };
        chosenBox = box;
        break;
      }

      // Push older content deeper around the spiral rather than allowing screen-
      // space overlap. The tail scale contracts if the phrase becomes dense.
      depthUnits += 0.28 + attempt * 0.018;
    }

    if (!chosen) {
      const depth = Math.max(maxDepthUnits, depthUnits);
      const angle = -Math.PI * 0.16 - depth * 0.64;
      const radius = minDimension * 0.026;
      const tail = Math.pow(0.84, Math.max(0, depth - maxDepthUnits));
      chosen = {
        id: word.id,
        role: word.role,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius * 0.78,
        scale: Math.max(0.045, 0.15 * tail),
        rotation: normalizeAngle(angle + Math.PI * 0.5) * 0.72,
        alpha: Math.max(0.035, 0.12 * tail),
        zIndex: 1,
        treatment: "outline",
      };
      chosenBox = spatialBoxFor(metrics, chosen, 1);
    }

    cumulativeDepth = depthUnits;
    if (chosenBox) occupied.push(chosenBox);
    placements.push(chosen);
  }

  return {
    grammar: "spiral-depth",
    variant: "spiral",
    heroId: active?.id ?? visible[0]?.id,
    words: placements,
  };
}

function planHeroEcho(input: TypographySequencePlanInput): TypographySequencePlan {
  const width = Math.max(1, input.width);
  const height = Math.max(1, input.height);
  const started = input.window.words
    .filter(word => word.role !== "incoming")
    .sort(compareNewest);
  const hero = started.find(word => word.role === "active") ?? started[0];
  if (!hero) return { grammar: "hero-echo", variant: "hero-echo", words: [] };

  const echoes = started.filter(word => word.id !== hero.id);
  const echoCount = Math.max(1, echoes.length);
  const heroMetrics = normalizeSpatialMetrics(input.metricsById?.[hero.id], hero.text);
  const heroScale = fitSpatialScale(
    heroMetrics,
    width * 0.52,
    height * 0.62,
    0,
    1.52,
    0.42,
    1.52,
  );

  const placements: TypographySequencePlacement[] = [{
    id: hero.id,
    role: hero.role,
    x: width * 0.16,
    y: 0,
    scale: heroScale,
    rotation: 0,
    alpha: 1,
    zIndex: echoCount + 2,
    treatment: "solid",
  }];

  const echoAreaHeight = height * 0.72;
  const rowHeight = echoAreaHeight / echoCount;
  const startY = -echoAreaHeight * 0.5 + rowHeight * 0.5;

  echoes.forEach((word, index) => {
    const recency = 1 - index / Math.max(1, echoes.length - 1);
    const metrics = normalizeSpatialMetrics(input.metricsById?.[word.id], word.text);
    const desired = 0.62 + recency * 0.12;
    const scale = fitSpatialScale(
      metrics,
      width * 0.37,
      rowHeight * 0.82,
      0,
      desired,
      0.09,
      desired,
    );

    placements.push({
      id: word.id,
      role: word.role,
      x: -width * 0.235,
      y: startY + index * rowHeight,
      scale,
      rotation: 0,
      alpha: clamp(0.12 + recency * 0.22, 0.1, 0.38),
      zIndex: echoCount - index,
      treatment: "outline",
    });
  });

  return {
    grammar: "hero-echo",
    variant: "hero-echo",
    heroId: hero.id,
    words: placements,
  };
}

function planShapeFill(input: TypographySequencePlanInput): TypographySequencePlan {
  const width = Math.max(1, input.width);
  const height = Math.max(1, input.height);
  const shapeVariant = shapeFillVariantForScope(input.window.scopeStartLineIndex);
  const layout = input.staticLayout ?? buildShapeFillLayout(
    shapeVariant,
    input.window.scopeWords,
    input.metricsById ?? {},
    width,
    height,
  );
  const visible = input.window.words
    .filter(word => word.role !== "incoming" || word.age <= 0.12)
    .sort(compareChronological);
  const active = visible.find(word => word.role === "active");

  const placements = visible.map(word => {
    const slot = layout.get(word.id);
    const isActive = word.role === "active";
    const recent = word.role === "recent";
    const isIncoming = word.role === "incoming";
    const arrival = isIncoming ? 1 - clamp(word.age / 0.12) : 1;
    const baseScale = slot?.scale ?? 0.5;

    return {
      id: word.id,
      role: word.role,
      x: slot?.x ?? 0,
      y: slot?.y ?? 0,
      // Shape geometry is the composition: never grow a packed word beyond
      // its collision-solved slot just because it becomes active.
      scale: baseScale,
      rotation: slot?.rotation ?? 0,
      alpha: isActive
        ? 1
        : recent
          ? 0.94
          : isIncoming
            ? 0.08 + arrival * 0.46
            : 0.8,
      zIndex: isActive ? input.window.scopeWordCount + 10 : word.scopeOrdinal + 1,
      treatment: "solid",
    } satisfies TypographySequencePlacement;
  });

  return {
    grammar: input.grammar,
    variant: shapeVariant === "tree"
      ? "shape-tree"
      : shapeVariant === "star"
        ? "shape-star"
        : "shape-figure",
    heroId: active?.id,
    words: placements,
  };
}

function planManifestoWall(input: TypographySequencePlanInput): TypographySequencePlan {
  const width = Math.max(1, input.width);
  const height = Math.max(1, input.height);
  const layout = input.staticLayout ?? buildManifestoPageLayout(
    input.window.scopeWords,
    input.metricsById ?? {},
    width,
    height,
  );
  const visible = input.window.words
    .filter(word => word.role !== "incoming" || word.age <= 0.08)
    .sort(compareChronological);
  const active = visible.find(word => word.role === "active");

  const placements = visible.map(word => {
    const slot = layout.get(word.id);
    const finalX = slot?.x ?? 0;
    const finalY = slot?.y ?? 0;
    const finalRotation = slot?.rotation ?? 0;
    const finalScale = slot?.scale ?? 0.7;
    const isActive = word.role === "active";
    const incoming = word.role === "incoming";
    const cueProgress = isActive
      ? clamp((input.window.time - word.start) / Math.max(0.04, word.end - word.start))
      : incoming
        ? 0
        : 1;
    const snapProgress = isActive ? clamp(cueProgress / 0.16) : incoming ? 0 : 1;
    const snap = 1 - Math.pow(1 - snapProgress, 5);
    const entryDistance = Math.max(18, Math.min(width, height) * 0.035);
    const direction = word.scopeOrdinal % 4;
    const entryX = direction === 0 ? -entryDistance : direction === 1 ? entryDistance : 0;
    const entryY = direction === 2 ? -entryDistance : direction === 3 ? entryDistance : 0;
    const entryRotation = finalRotation + (direction % 2 === 0 ? -0.025 : 0.025);

    return {
      id: word.id,
      role: word.role,
      x: lerp(finalX + entryX, finalX, snap),
      y: lerp(finalY + entryY, finalY, snap),
      // Stamp from slightly smaller into the reserved page slot. Scaling above
      // the solved slot would create a transient collision with neighboring type.
      scale: finalScale * lerp(0.92, 1, snap),
      rotation: lerp(entryRotation, finalRotation, snap),
      alpha: incoming ? 0 : isActive ? clamp(snap * 1.8) : 0.9,
      zIndex: isActive ? input.window.scopeWordCount + 20 : word.scopeOrdinal + 1,
      treatment: "solid",
    } satisfies TypographySequencePlacement;
  });

  return {
    grammar: "manifesto-wall",
    variant: "editorial-page",
    heroId: active?.id,
    words: placements,
  };
}

function planRibbonPath(input: TypographySequencePlanInput): TypographySequencePlan {
  const width = Math.max(1, input.width);
  const height = Math.max(1, input.height);
  const minDimension = Math.min(width, height);
  const started = input.window.words
    .filter(word => word.role !== "incoming")
    .sort(compareNewest)
    .slice(0, 11);
  const active = started.find(word => word.role === "active");
  const activeProgress = active
    ? clamp((input.window.time - active.start) / Math.max(0.04, active.end - active.start))
    : 0;
  const placements: TypographySequencePlacement[] = [];
  const occupied: TypographySpatialBox[] = [];

  for (let rank = 0; rank < started.length; rank++) {
    const word = started[rank];
    const metrics = normalizeSpatialMetrics(input.metricsById?.[word.id], word.text);
    const baseUnits = rank + activeProgress;
    let u = 0.74 - baseUnits * 0.075;
    let chosen: TypographySequencePlacement | undefined;
    let chosenBox: TypographySpatialBox | undefined;

    for (let attempt = 0; attempt < 20; attempt++) {
      const extraDepth = attempt * 0.16;
      const units = baseUnits + extraDepth;
      const depth = clamp(units / 10);
      const point = pointOnRibbon(u, width, height);
      const isActive = word.role === "active";
      const recent = word.role === "recent";
      const trailScale = lerp(recent ? 0.78 : 0.68, 0.34, depth);
      const trailAlpha = lerp(recent ? 0.82 : 0.62, 0.07, depth);
      const scale = isActive ? lerp(1.14, 0.78, activeProgress) : trailScale;
      const alpha = isActive ? lerp(1, 0.82, activeProgress) : trailAlpha;
      const rotation = isActive
        ? point.rotation * lerp(0.45, 1, activeProgress)
        : point.rotation;
      const box = spatialBoxFor(metrics, {
        x: point.x,
        y: point.y,
        scale,
        rotation,
      }, Math.max(3, minDimension * 0.0045));

      if (!occupied.some(other => spatialBoxesOverlap(box, other))) {
        chosen = {
          id: word.id,
          role: word.role,
          x: point.x,
          y: point.y,
          scale,
          rotation,
          alpha,
          zIndex: 100 - Math.round(units * 6),
          treatment: isActive || recent ? "solid" : "outline",
        };
        chosenBox = box;
        break;
      }

      // Older words slide farther down the same continuous S-curve until their
      // measured screen box clears the already seated newer words.
      u -= 0.018 + attempt * 0.0015;
    }

    if (!chosen) {
      const point = pointOnRibbon(u, width, height);
      chosen = {
        id: word.id,
        role: word.role,
        x: point.x,
        y: point.y,
        scale: 0.24,
        rotation: point.rotation,
        alpha: 0.08,
        zIndex: 1,
        treatment: "outline",
      };
      chosenBox = spatialBoxFor(metrics, chosen, 1);
    }

    placements.push(chosen);
    occupied.push(chosenBox);
  }

  const incoming = input.window.words
    .filter(word => word.role === "incoming")
    .sort(compareChronological)[0];
  if (incoming) {
    const metrics = normalizeSpatialMetrics(input.metricsById?.[incoming.id], incoming.text);
    const arrival = 1 - clamp(incoming.age / 0.12);
    let u = lerp(0.86, 0.74, arrival);
    let placement: TypographySequencePlacement | undefined;

    for (let attempt = 0; attempt < 12; attempt++) {
      const point = pointOnRibbon(u, width, height);
      const scale = lerp(0.52, 0.82, arrival);
      const candidate: TypographySequencePlacement = {
        id: incoming.id,
        role: incoming.role,
        x: point.x,
        y: point.y,
        scale,
        rotation: point.rotation,
        alpha: 0.06 + arrival * 0.18,
        zIndex: 104,
        treatment: "outline",
      };
      const box = spatialBoxFor(metrics, candidate, Math.max(2, minDimension * 0.0035));
      if (!occupied.some(other => spatialBoxesOverlap(box, other))) {
        placement = candidate;
        break;
      }
      u += 0.016;
    }

    if (placement) placements.push(placement);
  }

  return {
    grammar: "ribbon-path",
    variant: "s-curve",
    heroId: active?.id ?? started[0]?.id,
    words: placements,
  };
}

function pointOnFrame(t: number, width: number, height: number) {
  const rx = width * 0.34;
  const ry = height * 0.285;
  const segment = (t % 1) * 4;

  if (segment < 1) {
    return { x: lerp(-rx, rx, segment), y: -ry, rotation: 0 };
  }
  if (segment < 2) {
    return { x: rx, y: lerp(-ry, ry, segment - 1), rotation: Math.PI * 0.5 };
  }
  if (segment < 3) {
    return { x: lerp(rx, -rx, segment - 2), y: ry, rotation: 0 };
  }
  return { x: -rx, y: lerp(ry, -ry, segment - 3), rotation: -Math.PI * 0.5 };
}

function pointOnRing(t: number, width: number, height: number) {
  const angle = -Math.PI * 0.5 + t * Math.PI * 2;
  return {
    x: Math.cos(angle) * width * 0.315,
    y: Math.sin(angle) * height * 0.285,
    rotation: uprightAngle(angle + Math.PI * 0.5),
  };
}

function pointOnRibbon(u: number, width: number, height: number) {
  const phase = (u * 1.22 - 0.08) * Math.PI * 2;
  const secondary = (u * 2.1 + 0.15) * Math.PI * 2;
  const x = (u - 0.5) * width * 0.94;
  const y = Math.sin(phase) * height * 0.19 + Math.sin(secondary) * height * 0.035;
  const dx = width * 0.94;
  const dy = Math.cos(phase) * Math.PI * 2 * 1.22 * height * 0.19
    + Math.cos(secondary) * Math.PI * 2 * 2.1 * height * 0.035;
  const rotation = clamp(Math.atan2(dy, dx), -0.42, 0.42);
  return { x, y, rotation };
}

function uprightAngle(angle: number) {
  let value = normalizeAngle(angle);
  if (value > Math.PI * 0.5) value -= Math.PI;
  if (value < -Math.PI * 0.5) value += Math.PI;
  return value;
}

function compareNewest(a: SequenceWordRef, b: SequenceWordRef) {
  return b.start - a.start || b.lineIndex - a.lineIndex || b.wordIndex - a.wordIndex;
}

function compareChronological(a: SequenceWordRef, b: SequenceWordRef) {
  return a.start - b.start || a.lineIndex - b.lineIndex || a.wordIndex - b.wordIndex;
}

function normalizeAngle(angle: number) {
  let value = angle;
  while (value > Math.PI) value -= Math.PI * 2;
  while (value < -Math.PI) value += Math.PI * 2;
  return value;
}
