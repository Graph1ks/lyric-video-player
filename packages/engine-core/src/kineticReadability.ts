import { clamp } from "./math.js";

export type KineticReadabilityTier = "expressive" | "balanced" | "rapid" | "burst";

export interface KineticReadabilityWord {
  start: number;
  end: number;
  text?: string;
}

export interface KineticMotionBudget {
  travelScale: number;
  rotationScale: number;
  scaleExcursion: number;
  floatScale: number;
  echoScale: number;
  alphaFloor: number;
}

export interface KineticReadabilityProfile {
  tier: KineticReadabilityTier;
  pressure: number;
  duration: number;
  wordCount: number;
  characterCount: number;
  wordsPerSecond: number;
  charactersPerSecond: number;
  minimumWordDuration: number;
  motion: KineticMotionBudget;
}

const BUDGETS: Record<KineticReadabilityTier, KineticMotionBudget> = {
  expressive: {
    travelScale: 1,
    rotationScale: 1,
    scaleExcursion: 1,
    floatScale: 1,
    echoScale: 1,
    alphaFloor: 0.16,
  },
  balanced: {
    travelScale: 0.84,
    rotationScale: 0.82,
    scaleExcursion: 0.88,
    floatScale: 0.82,
    echoScale: 0.82,
    alphaFloor: 0.28,
  },
  rapid: {
    travelScale: 0.58,
    rotationScale: 0.5,
    scaleExcursion: 0.62,
    floatScale: 0.56,
    echoScale: 0.56,
    alphaFloor: 0.5,
  },
  burst: {
    travelScale: 0.36,
    rotationScale: 0.28,
    scaleExcursion: 0.42,
    floatScale: 0.34,
    echoScale: 0.34,
    alphaFloor: 0.68,
  },
};

export const DEFAULT_KINETIC_READABILITY_PROFILE: KineticReadabilityProfile = Object.freeze({
  tier: "expressive",
  pressure: 0,
  duration: 1,
  wordCount: 0,
  characterCount: 0,
  wordsPerSecond: 0,
  charactersPerSecond: 0,
  minimumWordDuration: 1,
  motion: Object.freeze({ ...BUDGETS.expressive }),
});

export function analyzeKineticReadability(input: {
  lineStart: number;
  lineEnd: number;
  words: KineticReadabilityWord[];
}): KineticReadabilityProfile {
  const duration = Math.max(0.08, input.lineEnd - input.lineStart);
  const wordCount = input.words.length;
  const characterCount = input.words.reduce(
    (sum, word) => sum + [...(word.text ?? "")].length,
    0,
  );
  const wordsPerSecond = wordCount / duration;
  const charactersPerSecond = characterCount / duration;
  const minimumWordDuration = wordCount
    ? Math.min(...input.words.map(word => Math.max(0.04, word.end - word.start)))
    : duration;

  // These are progressive pressure signals, not subtitle compliance limits.
  // 18 chars/s sits near common adult timed-text guidance (17–20 cps), while
  // word rate and minimum cue duration catch rap/burst passages where character
  // count alone can understate how little visual dwell time each word receives.
  const pressure = Math.max(
    charactersPerSecond / 18,
    wordsPerSecond / 3.2,
    0.16 / minimumWordDuration,
  );

  const tier: KineticReadabilityTier = pressure <= 0.65
    ? "expressive"
    : pressure <= 1
      ? "balanced"
      : pressure <= 1.45
        ? "rapid"
        : "burst";

  return {
    tier,
    pressure: clamp(pressure, 0, 4),
    duration,
    wordCount,
    characterCount,
    wordsPerSecond,
    charactersPerSecond,
    minimumWordDuration,
    motion: { ...BUDGETS[tier] },
  };
}
