export interface VisualFxRack {
  cameraMotion: number;
  impactPulse: number;
  displacement: number;
  smear: number;
  bloom: number;
  feedback: number;
  postFx: number;
  worldIntensity: number;
  worldDetail: number;
  screenBloom: number;
  scanlines: number;
  grain: number;
  vignette: number;
}

/**
 * Factory rack = the visual balance that existed before the controls were
 * exposed. Every formerly implicit renderer/compositor layer ran at authored
 * strength 1.0. Keeping factory at 1.0 is important: exposing a control must
 * not silently make the product cleaner/flatter.
 */
export const FACTORY_VISUAL_FX_RACK: VisualFxRack = Object.freeze({
  cameraMotion: 1,
  impactPulse: 1,
  displacement: 1,
  smear: 1,
  bloom: 1,
  feedback: 1,
  postFx: 1,
  worldIntensity: 1,
  worldDetail: 1,
  screenBloom: 1,
  scanlines: 1,
  grain: 1,
  vignette: 1,
});

export const DEFAULT_VISUAL_FX_RACK: VisualFxRack = FACTORY_VISUAL_FX_RACK;

export type VisualFxRackKey = keyof VisualFxRack;

export function clampFxAmount(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(3, value));
}

export function sanitizeVisualFxRack(
  value: Partial<VisualFxRack> | undefined,
  fallback: VisualFxRack = DEFAULT_VISUAL_FX_RACK,
): VisualFxRack {
  const out = { ...fallback };
  if (!value) return out;
  for (const key of Object.keys(out) as VisualFxRackKey[]) {
    const candidate = value[key];
    if (candidate !== undefined) out[key] = clampFxAmount(candidate);
  }
  return out;
}
