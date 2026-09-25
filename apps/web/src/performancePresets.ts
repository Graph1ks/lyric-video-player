import {
  sanitizeVisualFxRack,
  type ColorFlowMode,
  type VisualAutoProfile,
  type VisualFxRack,
  type VisualFxRackKey,
} from "@graph1ks/emo-engine-core";

export type PerformancePace = "slow" | "mid" | "fast" | "burst";

export interface PerformancePresetDefinition {
  id: string;
  label: string;
  emotion: string;
  pace: PerformancePace;
  description: string;
  intensity: number;
  colorFlow: ColorFlowMode;
  auto: VisualAutoProfile;
  fx: VisualFxRack;
}

export type PerformancePresetPoolKey = keyof VisualAutoProfile;

// Built-in emotion/pace presets were intentionally removed. Presets are now
// user-authored only. Keep the retired IDs solely for storage migration so old
// authored defaults do not reappear from localStorage after the update.
export const BUILTIN_PERFORMANCE_PRESETS: PerformancePresetDefinition[] = [];

const RETIRED_BUILTIN_PRESET_IDS = new Set([
  "tender-slow",
  "heartbreak-slow",
  "longing-mid",
  "dream-mid",
  "calm-slow",
  "euphoria-fast",
  "rage-fast",
  "tension-burst",
]);

const STORAGE_KEY = "emo.performance-presets.v3";
const LEGACY_STORAGE_KEYS = ["emo.performance-presets.v2", "emo.performance-presets.v1"];

export function defaultPerformancePresets() {
  return BUILTIN_PERFORMANCE_PRESETS.map(clonePerformancePreset);
}

export function clonePerformancePreset(
  preset: PerformancePresetDefinition,
): PerformancePresetDefinition {
  return {
    ...preset,
    auto: Object.fromEntries(
      Object.entries(preset.auto).map(([key, values]) => [key, values ? [...values] : values]),
    ) as VisualAutoProfile,
    fx: { ...preset.fx },
  };
}

export function loadPerformancePresets() {
  if (typeof localStorage === "undefined") return [];

  try {
    const currentRaw = localStorage.getItem(STORAGE_KEY);
    const legacyRaw = LEGACY_STORAGE_KEYS
      .map(key => localStorage.getItem(key))
      .find((value): value is string => Boolean(value));
    const raw = currentRaw ?? legacyRaw;
    if (!raw) return [];

    const stored = JSON.parse(raw) as Array<Partial<PerformancePresetDefinition> & { id?: string }>;
    const custom = stored
      .filter(item => item.id && !RETIRED_BUILTIN_PRESET_IDS.has(item.id))
      .map(item => sanitizeCustomPerformancePreset(item))
      .filter((item): item is PerformancePresetDefinition => Boolean(item));

    if (!currentRaw) savePerformancePresets(custom);
    return custom;
  } catch {
    return [];
  }
}

export function savePerformancePresets(presets: PerformancePresetDefinition[]) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch {
    // Presets remain usable for the current session when storage is unavailable.
  }
}

export function builtinPerformancePreset(_id: string) {
  return undefined;
}

export function isBuiltinPerformancePreset(_id: string) {
  return false;
}

export function createCustomPerformancePreset(
  source: PerformancePresetDefinition,
  ordinal: number,
): PerformancePresetDefinition {
  const clone = clonePerformancePreset(source);
  return {
    ...clone,
    id: `custom-${Date.now().toString(36)}-${Math.max(1, ordinal).toString(36)}`,
    label: `Custom ${Math.max(1, ordinal)}`,
    description: "Custom Director performance profile",
  };
}

function sanitizeCustomPerformancePreset(
  value: Partial<PerformancePresetDefinition> & { id?: string },
): PerformancePresetDefinition | undefined {
  if (!value || typeof value.id !== "string" || typeof value.label !== "string") return undefined;

  return {
    id: value.id,
    label: value.label.slice(0, 80),
    emotion: typeof value.emotion === "string" ? value.emotion : "Custom",
    pace: value.pace && ["slow", "mid", "fast", "burst"].includes(value.pace) ? value.pace : "mid",
    description: typeof value.description === "string" ? value.description : "Custom Director performance profile",
    intensity: Number.isFinite(value.intensity) ? Math.max(0.2, Math.min(1.8, value.intensity!)) : 1,
    colorFlow: value.colorFlow === "rainbow" ? "rainbow" : "static",
    auto: sanitizeAutoProfile(value.auto),
    fx: sanitizeVisualFxRack(value.fx),
  };
}

function sanitizeAutoProfile(value: VisualAutoProfile | undefined): VisualAutoProfile {
  if (!value) return {};
  return Object.fromEntries(
    Object.entries(value).map(([key, values]) => [
      key,
      Array.isArray(values) ? [...values] : undefined,
    ]),
  ) as VisualAutoProfile;
}

export function setPresetFxValue(
  preset: PerformancePresetDefinition,
  key: VisualFxRackKey,
  value: number,
): PerformancePresetDefinition {
  return {
    ...preset,
    fx: sanitizeVisualFxRack({ ...preset.fx, [key]: value }, preset.fx),
  };
}
