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

export const DEFAULT_VISUAL_FX_RACK: VisualFxRack = Object.freeze({
  cameraMotion: 0.75,
  impactPulse: 0.65,
  displacement: 0.55,
  smear: 0.45,
  bloom: 0.7,
  feedback: 0.35,
  postFx: 0.55,
  worldIntensity: 1,
  worldDetail: 1,
  screenBloom: 0.55,
  scanlines: 0.35,
  grain: 0.35,
  vignette: 0.55,
});

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
