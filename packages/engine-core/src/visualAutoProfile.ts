import type {
  BackgroundPresetId,
  ColorCanvasId,
  ColorHarmonyId,
  ColorMoodId,
  CompositionMotionId,
  SceneMode,
  TypographyLayoutId,
  TypographyPresetId,
} from "./types.js";
import type { TypographySequenceGrammarId } from "./typographySequenceComposition.js";

export interface VisualAutoProfile {
  scenes?: SceneMode[];
  typographyPresets?: TypographyPresetId[];
  sequences?: Array<TypographySequenceGrammarId | "off">;
  layouts?: TypographyLayoutId[];
  motions?: CompositionMotionId[];
  backgrounds?: BackgroundPresetId[];
  harmonies?: ColorHarmonyId[];
  moods?: ColorMoodId[];
  canvases?: ColorCanvasId[];
}

export function pickAllowed<T extends string>(
  preferred: readonly T[],
  allowed: readonly T[] | undefined,
  index: number,
): T {
  if (!allowed?.length) {
    return preferred[Math.max(0, index) % Math.max(1, preferred.length)];
  }

  const filtered = preferred.filter(value => allowed.includes(value));
  const source = filtered.length ? filtered : allowed;
  return source[Math.max(0, index) % source.length];
}

export function isAllowed<T extends string>(
  value: T,
  allowed: readonly T[] | undefined,
) {
  return !allowed?.length || allowed.includes(value);
}
