import { clamp, lerp } from "./math.js";
import type { CinematicShotRole } from "./director.js";
import type { SceneMode } from "./types.js";
import type { TypographySequenceGrammarId } from "./typographySequenceComposition.js";

export interface CinematicFocusPoint {
  x: number;
  y: number;
}

export interface CinematicCameraPlanInput {
  mode: SceneMode;
  shotRole: CinematicShotRole;
  sequenceGrammar?: TypographySequenceGrammarId;
  phraseProgress: number;
  focus: CinematicFocusPoint;
  contentCenter?: CinematicFocusPoint;
  contentFitScale?: number;
  readabilityPressure?: number;
  intensity?: number;
}

export interface CinematicCameraPlan {
  offsetX: number;
  offsetY: number;
  scale: number;
  rotation: number;
  skewX: number;
  skewY: number;
  impulseScale: number;
  microMotionScale: number;
}

const SHOT_SCALE: Record<CinematicShotRole, number> = {
  establish: 0.985,
  develop: 1.012,
  accent: 1.06,
  release: 1.005,
};

const SHOT_FOLLOW: Record<CinematicShotRole, number> = {
  establish: 0.2,
  develop: 0.3,
  accent: 0.42,
  release: 0.22,
};

export function evaluateCinematicCameraPlan(
  input: CinematicCameraPlanInput,
): CinematicCameraPlan {
  const phraseProgress = clamp(input.phraseProgress);
  const intensity = clamp(input.intensity ?? 1, 0.2, 1.8);
  const pressure = Math.max(0, input.readabilityPressure ?? 0);
  const readability = clamp(1 - Math.max(0, pressure - 0.72) * 0.28, 0.48, 1);
  let focusX = clamp(input.focus.x, -0.92, 0.92);
  let focusY = clamp(input.focus.y, -0.88, 0.88);
  const contentX = clamp(input.contentCenter?.x ?? focusX, -0.92, 0.92);
  const contentY = clamp(input.contentCenter?.y ?? focusY, -0.88, 0.88);

  let scale = SHOT_SCALE[input.shotRole];
  let follow = SHOT_FOLLOW[input.shotRole];
  let rotation = 0;
  let skewX = 0;
  let skewY = 0;
  let microMotionScale = 0.58;

  if (input.sequenceGrammar === "spiral-depth") {
    scale += lerp(0.025, 0.065, phraseProgress);
    follow += 0.12;
    rotation += Math.sin(phraseProgress * Math.PI * 2) * 0.008;
    microMotionScale = 0.34;
  } else if (input.sequenceGrammar === "hero-echo") {
    scale += 0.035;
    follow += 0.14;
    microMotionScale = 0.28;
  } else if (
    input.sequenceGrammar === "shape-fill"
    || input.sequenceGrammar === "shape-build"
  ) {
    scale -= 0.045;
    follow *= 0.3;
    microMotionScale = 0.14;
  } else if (input.sequenceGrammar === "manifesto-wall") {
    // Treat the growing manifesto as a page under a camera: follow the active
    // word, but bias toward the revealed-page envelope so the writing never
    // leaves the operator's visual context.
    focusX = lerp(focusX, contentX, 0.3);
    focusY = lerp(focusY, contentY, 0.28);
    scale += lerp(0.075, 0.028, phraseProgress);
    if (Number.isFinite(input.contentFitScale)) {
      scale = Math.min(scale, clamp((input.contentFitScale ?? 1) * 1.045, 0.84, 1.16));
    }
    follow += 0.2;
    rotation += Math.sin(phraseProgress * Math.PI * 1.6) * 0.012 + focusY * 0.004;
    skewX = Math.sin(phraseProgress * Math.PI * 1.35 + 0.3) * 0.026;
    skewY = Math.cos(phraseProgress * Math.PI * 1.1) * 0.008;
    microMotionScale = 0.08;
  } else if (input.sequenceGrammar === "ribbon-path") {
    scale += 0.012;
    follow += 0.08;
    rotation += focusY * 0.006;
    microMotionScale = 0.3;
  }

  if (input.mode === "vortex") {
    scale += 0.012;
    rotation += Math.sin(phraseProgress * Math.PI) * 0.004;
  } else if (input.mode === "poster") {
    follow *= 0.82;
  }

  follow *= readability;
  rotation *= readability;
  const impulseScale = clamp(
    readability * (input.shotRole === "accent" ? 0.92 : input.shotRole === "establish" ? 0.62 : 0.72),
    0.28,
    1,
  );

  // Camera motion is opposite the on-screen focus offset: a word on the right
  // asks the camera to pan right, which means shifting the scene left.
  return {
    offsetX: -focusX * follow * intensity,
    offsetY: -focusY * follow * 0.78 * intensity,
    scale: 1 + (scale - 1) * intensity,
    rotation: rotation * intensity,
    skewX: skewX * intensity,
    skewY: skewY * intensity,
    impulseScale,
    microMotionScale: microMotionScale * readability,
  };
}
