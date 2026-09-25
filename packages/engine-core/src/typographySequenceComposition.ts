import { clamp, lerp } from "./math.js";
import type {
  SequenceWordRef,
  TypographySequenceWindow,
} from "./typographySequence.js";

export type TypographySequenceGrammarId = "spiral-depth" | "hero-echo";
export type SequenceTypographyTreatment = "solid" | "outline";

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
}

export interface TypographySequencePlan {
  grammar: TypographySequenceGrammarId;
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
  return input.grammar === "hero-echo"
    ? planHeroEcho(input)
    : planSpiralDepth(input);
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
    // Continuous rank handoff: the old hero approaches depth unit 1 while it
    // is active; when the next word starts it becomes rank 1 at the same unit.
    // This avoids a whole-spiral snap at every word boundary.
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
  if (!hero) return { grammar: "hero-echo", words: [] };

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
    heroId: hero.id,
    words: placements,
  };
}

function compareNewest(a: SequenceWordRef, b: SequenceWordRef) {
  return b.start - a.start || b.lineIndex - a.lineIndex || b.wordIndex - a.wordIndex;
}

function normalizeAngle(angle: number) {
  let value = angle;
  while (value > Math.PI) value -= Math.PI * 2;
  while (value < -Math.PI) value += Math.PI * 2;
  return value;
}
