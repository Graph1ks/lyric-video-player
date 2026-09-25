import {
  clamp,
  dampedPulse,
  easeOutExpo,
} from "./math.js";
import type { KineticMotionBudget } from "./kineticReadability.js";

export interface ElasticTetherInput {
  time: number;
  start: number;
  end: number;
  sourceX: number;
  sourceY: number;
  intensity?: number;
  budget: KineticMotionBudget;
}

export interface ElasticTetherMotion {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  alpha: number;
  progress: number;
}

export function evaluateElasticTether(input: ElasticTetherInput): ElasticTetherMotion {
  const intensity = clamp(input.intensity ?? 1, 0.2, 1.8);
  const duration = Math.max(0.08, input.end - input.start);
  const preRoll = Math.min(0.14, duration * 0.28);
  const settleDuration = Math.min(0.62, Math.max(0.26, duration * 0.72));
  const age = input.time - input.start;
  const progress = clamp((age + preRoll) / (preRoll + settleDuration));
  const travelEase = easeOutExpo(progress);

  const sourceDistance = Math.max(1, Math.hypot(input.sourceX, input.sourceY));
  const nx = input.sourceX / sourceDistance;
  const ny = input.sourceY / sourceDistance;
  const bounce = dampedPulse(age, 16, 6.6);
  const overshootDistance = sourceDistance * 0.055 * bounce;

  let x = input.sourceX * (1 - travelEase) - nx * overshootDistance;
  let y = input.sourceY * (1 - travelEase) - ny * overshootDistance;

  const pullEnvelope = Math.sin(progress * Math.PI) * (1 - progress * 0.2);
  const stretch = (0.34 * pullEnvelope + Math.abs(bounce) * 0.12)
    * intensity
    * input.budget.scaleExcursion;
  const absX = Math.abs(nx);
  const absY = Math.abs(ny);
  let scaleX = 1 + stretch * absX - stretch * 0.32 * absY;
  let scaleY = 1 + stretch * absY - stretch * 0.32 * absX;

  // A small compression pulse on arrival gives the tether a follow-through
  // without turning the word into unreadable rubber.
  scaleX += bounce * 0.045 * input.budget.scaleExcursion;
  scaleY -= bounce * 0.035 * input.budget.scaleExcursion;

  const directionAngle = Math.atan2(ny, nx);
  let rotation = clamp(directionAngle, -Math.PI * 0.5, Math.PI * 0.5)
    * 0.075
    * (1 - progress)
    * intensity;

  x *= input.budget.travelScale;
  y *= input.budget.travelScale;
  rotation *= input.budget.rotationScale;

  const alpha = clamp((age + preRoll * 0.72) / Math.max(0.06, preRoll * 0.9));

  return {
    x,
    y,
    rotation,
    scaleX: Math.max(0.62, scaleX),
    scaleY: Math.max(0.62, scaleY),
    alpha,
    progress,
  };
}
