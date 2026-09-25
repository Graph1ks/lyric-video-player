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

  const denominator = Math.max(1, visible.length - 1);
  const placements = visible.map((word, rank) => {
    const depth = rank / denominator;
    const angle = -Math.PI * 0.18 - rank * 0.72;
    const radius = minDimension * lerp(0.245, 0.045, Math.pow(depth, 0.82));
    const active = word.role === "active";
    const recent = word.role === "recent";
    const scale = lerp(1.34, 0.24, Math.pow(depth, 0.72));
    const alpha = active
      ? 1
      : clamp(lerp(recent ? 0.8 : 0.62, 0.08, Math.pow(depth, 0.9)), 0.06, 0.9);

    return {
      id: word.id,
      role: word.role,
      x: Math.cos(angle) * radius * Math.min(1.55, width / minDimension),
      y: Math.sin(angle) * radius * 0.76,
      scale,
      rotation: active ? 0 : normalizeAngle(angle + Math.PI * 0.5) * 0.74,
      alpha,
      zIndex: visible.length - rank,
      treatment: active || recent ? "solid" : "outline",
    } satisfies TypographySequencePlacement;
  });

  return {
    grammar: "spiral-depth",
    heroId: visible[0]?.id,
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
