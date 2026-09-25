import { clamp, lerp } from "./math.js";
import {
  buildManifestoSlots,
  buildShapeFillSlots,
  shapeFillVariantForScope,
} from "./typographyShapePacking.js";
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
  | "masonry"
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

  const placements = visible.map((word, rank) => {
    const depthUnits = rank + activeProgress;
    const depth = clamp(depthUnits / maxDepthUnits);
    const angle = -Math.PI * 0.16 - depthUnits * 0.64;
    const radius = minDimension * lerp(0.255, 0.028, Math.pow(depth, 0.8));
    const isActive = word.role === "active";
    const recent = word.role === "recent";
    const scale = lerp(1.42, 0.17, Math.pow(depth, 0.7));
    const alpha = isActive
      ? 1
      : clamp(lerp(recent ? 0.84 : 0.64, 0.07, Math.pow(depth, 0.9)), 0.06, 0.9);

    return {
      id: word.id,
      role: word.role,
      x: Math.cos(angle) * radius * Math.min(1.55, width / minDimension),
      y: Math.sin(angle) * radius * 0.78,
      scale,
      rotation: isActive ? 0 : normalizeAngle(angle + Math.PI * 0.5) * 0.72,
      alpha,
      zIndex: Math.max(1, maxDepthUnits * 10 - Math.round(depthUnits * 10)),
      treatment: isActive || recent ? "solid" : "outline",
    } satisfies TypographySequencePlacement;
  });

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
  const spacing = Math.min(height * 0.105, height * 0.66 / echoCount);
  const startY = -spacing * (echoes.length - 1) * 0.5;

  const placements: TypographySequencePlacement[] = [{
    id: hero.id,
    role: hero.role,
    x: width * 0.15,
    y: 0,
    scale: 1.52,
    rotation: 0,
    alpha: 1,
    zIndex: echoCount + 2,
    treatment: "solid",
  }];

  echoes.forEach((word, index) => {
    const recency = 1 - index / Math.max(1, echoes.length - 1);
    placements.push({
      id: word.id,
      role: word.role,
      x: -width * 0.225 + index * width * 0.003,
      y: startY + index * spacing,
      scale: 0.62 + recency * 0.12,
      rotation: (index - echoes.length * 0.5) * 0.004,
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
  const slots = buildShapeFillSlots(
    shapeVariant,
    Math.max(1, input.window.scopeWordCount),
    width,
    height,
  );
  const visible = input.window.words
    .filter(word => word.role !== "incoming" || word.age <= 0.12)
    .sort(compareChronological);
  const active = visible.find(word => word.role === "active");

  const placements = visible.map(word => {
    const slot = slots[word.scopeOrdinal % Math.max(1, slots.length)];
    const isActive = word.role === "active";
    const recent = word.role === "recent";
    const isIncoming = word.role === "incoming";
    const arrival = isIncoming ? 1 - clamp(word.age / 0.12) : 1;

    return {
      id: word.id,
      role: word.role,
      x: slot?.x ?? 0,
      y: slot?.y ?? 0,
      scale: isActive ? 1.06 : recent ? 1.02 : 1,
      rotation: slot?.rotation ?? 0,
      alpha: isActive
        ? 1
        : recent
          ? 0.92
          : isIncoming
            ? 0.08 + arrival * 0.42
            : 0.76,
      zIndex: isActive ? input.window.scopeWordCount + 10 : word.scopeOrdinal + 1,
      treatment: "solid",
      maxWidth: slot?.width,
      maxHeight: slot?.height,
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
  const slots = buildManifestoSlots(
    Math.max(1, input.window.scopeWordCount),
    width,
    height,
  );
  const visible = input.window.words
    .filter(word => word.role !== "incoming" || word.age <= 0.08)
    .sort(compareChronological);
  const active = visible.find(word => word.role === "active");

  const placements = visible.map(word => {
    const slot = slots[word.scopeOrdinal % Math.max(1, slots.length)];
    const finalX = slot?.x ?? 0;
    const finalY = slot?.y ?? 0;
    const finalRotation = slot?.rotation ?? 0;
    const isActive = word.role === "active";
    const recent = word.role === "recent";
    const incoming = word.role === "incoming";
    const cueProgress = isActive
      ? clamp((input.window.time - word.start) / Math.max(0.04, word.end - word.start))
      : incoming
        ? 0
        : 1;
    const snapProgress = isActive ? clamp(cueProgress / 0.18) : incoming ? 0 : 1;
    const snap = 1 - Math.pow(1 - snapProgress, 4);
    const entryDistanceX = Math.max(slot?.width ?? width * 0.08, width * 0.055);
    const entryDistanceY = Math.max(slot?.height ?? height * 0.08, height * 0.06);
    const direction = word.scopeOrdinal % 4;
    const entryX = direction === 0
      ? -entryDistanceX
      : direction === 1
        ? entryDistanceX
        : 0;
    const entryY = direction === 2
      ? -entryDistanceY
      : direction === 3
        ? entryDistanceY
        : 0;
    const entryRotation = finalRotation + (
      direction % 2 === 0 ? -0.055 : 0.055
    );

    return {
      id: word.id,
      role: word.role,
      x: lerp(finalX + entryX, finalX, snap),
      y: lerp(finalY + entryY, finalY, snap),
      scale: lerp(1.14, 1, snap),
      rotation: lerp(entryRotation, finalRotation, snap),
      alpha: incoming
        ? 0
        : isActive
          ? clamp(snap * 1.7)
          : recent
            ? 0.96
            : 0.82,
      zIndex: isActive ? input.window.scopeWordCount + 20 : word.scopeOrdinal + 1,
      treatment: "solid",
      maxWidth: slot?.width,
      maxHeight: slot?.height,
    } satisfies TypographySequencePlacement;
  });

  return {
    grammar: "manifesto-wall",
    variant: "masonry",
    heroId: active?.id,
    words: placements,
  };
}

function planRibbonPath(input: TypographySequencePlanInput): TypographySequencePlan {
  const width = Math.max(1, input.width);
  const height = Math.max(1, input.height);
  const started = input.window.words
    .filter(word => word.role !== "incoming")
    .sort(compareNewest)
    .slice(0, 11);
  const active = started.find(word => word.role === "active");
  const activeProgress = active
    ? clamp((input.window.time - active.start) / Math.max(0.04, active.end - active.start))
    : 0;
  const placements: TypographySequencePlacement[] = started.map((word, rank) => {
    const units = rank + activeProgress;
    const u = 0.74 - units * 0.075;
    const point = pointOnRibbon(u, width, height);
    const depth = clamp(units / 10);
    const isActive = word.role === "active";
    const recent = word.role === "recent";
    const trailScale = lerp(recent ? 0.78 : 0.68, 0.34, depth);
    const trailAlpha = lerp(recent ? 0.82 : 0.62, 0.07, depth);
    // Position already hands off continuously through rank + activeProgress.
    // Do the same for scale/alpha/orientation so the outgoing hero arrives at
    // the exact visual state its rank-1 trail node will use after the boundary.
    const scale = isActive ? lerp(1.14, 0.78, activeProgress) : trailScale;
    const alpha = isActive ? lerp(1, 0.82, activeProgress) : trailAlpha;
    const rotation = isActive
      ? point.rotation * lerp(0.45, 1, activeProgress)
      : point.rotation;

    return {
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
  });

  const incoming = input.window.words
    .filter(word => word.role === "incoming")
    .sort(compareChronological)[0];
  if (incoming) {
    const arrival = 1 - clamp(incoming.age / 0.12);
    const point = pointOnRibbon(lerp(0.86, 0.74, arrival), width, height);
    placements.push({
      id: incoming.id,
      role: incoming.role,
      x: point.x,
      y: point.y,
      scale: lerp(0.52, 0.82, arrival),
      rotation: point.rotation,
      alpha: 0.06 + arrival * 0.18,
      zIndex: 104,
      treatment: "outline",
    });
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
