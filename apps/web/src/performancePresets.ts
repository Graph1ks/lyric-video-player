import {
  DEFAULT_VISUAL_FX_RACK,
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

function fx(overrides: Partial<VisualFxRack>): VisualFxRack {
  return sanitizeVisualFxRack(overrides, DEFAULT_VISUAL_FX_RACK);
}

export const BUILTIN_PERFORMANCE_PRESETS: PerformancePresetDefinition[] = [
  {
    id: "tender-slow",
    label: "Tender / Slow",
    emotion: "Tender",
    pace: "slow",
    description: "Warm negative space, soft handoffs and almost no distortion.",
    intensity: 0.74,
    colorFlow: "static",
    auto: {
      scenes: ["neon"],
      typographyPresets: ["elastic", "outline"],
      sequences: ["off", "ribbon-path"],
      layouts: ["directional-stage", "center-stack"],
      motions: ["handoff", "anchor-build"],
      backgrounds: ["aurora", "minimal"],
      harmonies: ["analogous"],
      moods: ["tender"],
      canvases: ["night", "paper"],
    },
    fx: fx({
      cameraMotion: 0.28,
      impactPulse: 0.18,
      displacement: 0,
      smear: 0,
      bloom: 0.55,
      feedback: 0,
      postFx: 0.16,
      worldIntensity: 0.7,
      worldDetail: 0.8,
      screenBloom: 0.35,
      scanlines: 0,
      grain: 0.12,
      vignette: 0.35,
    }),
  },
  {
    id: "heartbreak-slow",
    label: "Heartbreak / Slow",
    emotion: "Heartbreak",
    pace: "slow",
    description: "Editorial restraint, heavy shadow and selective page-like movement.",
    intensity: 0.86,
    colorFlow: "static",
    auto: {
      scenes: ["poster"],
      typographyPresets: ["outline", "impact"],
      sequences: ["off", "manifesto-wall"],
      layouts: ["editorial", "center-stack"],
      motions: ["panel", "camera-handoff"],
      backgrounds: ["editorial", "print"],
      harmonies: ["monochrome", "split-complement"],
      moods: ["heartbreak", "longing"],
      canvases: ["night", "paper"],
    },
    fx: fx({
      cameraMotion: 0.42,
      impactPulse: 0.32,
      displacement: 0.12,
      smear: 0,
      bloom: 0.34,
      feedback: 0.12,
      postFx: 0.3,
      worldIntensity: 1.15,
      worldDetail: 1.2,
      screenBloom: 0.22,
      scanlines: 0.12,
      grain: 0.45,
      vignette: 0.8,
    }),
  },
  {
    id: "longing-mid",
    label: "Longing / Midtempo",
    emotion: "Longing",
    pace: "mid",
    description: "Flowing distance, measured camera travel and atmospheric depth.",
    intensity: 0.94,
    colorFlow: "static",
    auto: {
      scenes: ["neon"],
      typographyPresets: ["elastic", "wave"],
      sequences: ["off", "ribbon-path"],
      layouts: ["directional-stage", "split-stage"],
      motions: ["handoff", "camera-handoff"],
      backgrounds: ["nebula", "aurora"],
      harmonies: ["analogous", "split-complement"],
      moods: ["longing", "dream"],
      canvases: ["night", "color-field"],
    },
    fx: fx({
      cameraMotion: 0.72,
      impactPulse: 0.35,
      displacement: 0.22,
      smear: 0.12,
      bloom: 0.85,
      feedback: 0.3,
      postFx: 0.42,
      worldIntensity: 1.45,
      worldDetail: 1.45,
      screenBloom: 0.7,
      scanlines: 0.08,
      grain: 0.2,
      vignette: 0.5,
    }),
  },
  {
    id: "dream-mid",
    label: "Dream / Midtempo",
    emotion: "Dream",
    pace: "mid",
    description: "Deep color fields, liquid motion and spatial lyric trails.",
    intensity: 1,
    colorFlow: "rainbow",
    auto: {
      scenes: ["neon", "vortex"],
      typographyPresets: ["wave", "tunnel"],
      sequences: ["ribbon-path", "spiral-depth"],
      layouts: ["directional-stage", "center-stack"],
      motions: ["portal", "camera-handoff"],
      backgrounds: ["liquid", "aurora", "starfield"],
      harmonies: ["analogous", "triad"],
      moods: ["dream"],
      canvases: ["color-field", "night"],
    },
    fx: fx({
      cameraMotion: 0.9,
      impactPulse: 0.48,
      displacement: 0.78,
      smear: 0.28,
      bloom: 1.35,
      feedback: 0.62,
      postFx: 0.72,
      worldIntensity: 1.8,
      worldDetail: 1.75,
      screenBloom: 1.15,
      scanlines: 0.05,
      grain: 0.18,
      vignette: 0.46,
    }),
  },
  {
    id: "calm-slow",
    label: "Calm / Slow",
    emotion: "Calm",
    pace: "slow",
    description: "Clean typography and quiet worlds with effects intentionally switched off.",
    intensity: 0.62,
    colorFlow: "static",
    auto: {
      scenes: ["neon"],
      typographyPresets: ["outline"],
      sequences: ["off"],
      layouts: ["center-stack"],
      motions: ["handoff"],
      backgrounds: ["minimal"],
      harmonies: ["monochrome"],
      moods: ["calm"],
      canvases: ["night"],
    },
    fx: fx({
      cameraMotion: 0.12,
      impactPulse: 0.08,
      displacement: 0,
      smear: 0,
      bloom: 0.18,
      feedback: 0,
      postFx: 0,
      worldIntensity: 0.38,
      worldDetail: 0.45,
      screenBloom: 0.12,
      scanlines: 0,
      grain: 0,
      vignette: 0.22,
    }),
  },
  {
    id: "euphoria-fast",
    label: "Euphoria / Fast",
    emotion: "Euphoria",
    pace: "fast",
    description: "Bright kinetic handoffs, dense worlds and punchy bloom without heavy grime.",
    intensity: 1.18,
    colorFlow: "rainbow",
    auto: {
      scenes: ["neon", "poster"],
      typographyPresets: ["impact", "cascade", "elastic"],
      sequences: ["off", "hero-echo", "ribbon-path"],
      layouts: ["directional-stage", "split-stage"],
      motions: ["handoff", "conveyor", "takeover"],
      backgrounds: ["spectrum", "rays", "aurora"],
      harmonies: ["triad", "tetrad"],
      moods: ["euphoria"],
      canvases: ["color-field", "poster"],
    },
    fx: fx({
      cameraMotion: 1.05,
      impactPulse: 1.25,
      displacement: 0.55,
      smear: 0.52,
      bloom: 1.55,
      feedback: 0.52,
      postFx: 0.62,
      worldIntensity: 2.25,
      worldDetail: 2.15,
      screenBloom: 1.3,
      scanlines: 0.08,
      grain: 0.1,
      vignette: 0.22,
    }),
  },
  {
    id: "rage-fast",
    label: "Rage / Fast",
    emotion: "Rage",
    pace: "fast",
    description: "Hard cuts, obvious distortion, graphic worlds and strong transient impact.",
    intensity: 1.34,
    colorFlow: "static",
    auto: {
      scenes: ["poster", "vortex"],
      typographyPresets: ["impact", "glitch", "scatter"],
      sequences: ["off", "hero-echo", "shape-fill"],
      layouts: ["editorial", "crossword"],
      motions: ["takeover", "collapse", "flip"],
      backgrounds: ["sparks", "print", "architecture"],
      harmonies: ["complement", "split-complement"],
      moods: ["rage"],
      canvases: ["poster", "night"],
    },
    fx: fx({
      cameraMotion: 1.45,
      impactPulse: 2.15,
      displacement: 1.85,
      smear: 1.6,
      bloom: 1.18,
      feedback: 0.72,
      postFx: 1.8,
      worldIntensity: 2.8,
      worldDetail: 2.55,
      screenBloom: 0.72,
      scanlines: 0.72,
      grain: 1.15,
      vignette: 0.78,
    }),
  },
  {
    id: "tension-burst",
    label: "Tension / Burst",
    emotion: "Tension",
    pace: "burst",
    description: "Compressed pressure, unstable camera energy and extreme spatial distortion.",
    intensity: 1.28,
    colorFlow: "static",
    auto: {
      scenes: ["vortex"],
      typographyPresets: ["glitch", "tunnel", "scatter"],
      sequences: ["off", "spiral-depth"],
      layouts: ["center-stack", "vertical-accent"],
      motions: ["portal", "camera-handoff", "collapse"],
      backgrounds: ["vortex", "architecture", "grid"],
      harmonies: ["complement", "monochrome"],
      moods: ["tension"],
      canvases: ["night"],
    },
    fx: fx({
      cameraMotion: 1.7,
      impactPulse: 1.55,
      displacement: 2.2,
      smear: 1.85,
      bloom: 0.82,
      feedback: 1.35,
      postFx: 2.1,
      worldIntensity: 2.5,
      worldDetail: 2.8,
      screenBloom: 0.5,
      scanlines: 1.1,
      grain: 0.9,
      vignette: 1.2,
    }),
  },
];

const STORAGE_KEY = "emo.performance-presets.v2";
const LEGACY_STORAGE_KEY = "emo.performance-presets.v1";

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
  const defaults = defaultPerformancePresets();
  if (typeof localStorage === "undefined") return defaults;

  try {
    const currentRaw = localStorage.getItem(STORAGE_KEY);
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    const raw = currentRaw ?? legacyRaw;
    if (!raw) return defaults;

    const stored = JSON.parse(raw) as Array<Partial<PerformancePresetDefinition> & { id?: string }>;
    const builtinIds = new Set(defaults.map(item => item.id));

    // v1 did not own the renderer FX rack and its built-in pools were the broad
    // presets this migration replaces. Keep user-created presets, but do not
    // let old built-in overrides re-expand the new curated v2 defaults.
    if (!currentRaw && legacyRaw) {
      const migratedCustom = stored
        .filter(item => item.id && !builtinIds.has(item.id))
        .map(item => sanitizeCustomPerformancePreset(item))
        .filter((item): item is PerformancePresetDefinition => Boolean(item));
      const migrated = [...defaults, ...migratedCustom];
      savePerformancePresets(migrated);
      return migrated;
    }

    const byId = new Map(stored.filter(item => item.id).map(item => [item.id!, item]));
    const merged = defaults.map(item => {
      const override = byId.get(item.id);
      return override ? sanitizePerformancePreset(override, item) : item;
    });
    const custom = stored
      .filter(item => item.id && !builtinIds.has(item.id))
      .map(item => sanitizeCustomPerformancePreset(item))
      .filter((item): item is PerformancePresetDefinition => Boolean(item));
    return [...merged, ...custom];
  } catch {
    return defaults;
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

export function builtinPerformancePreset(id: string) {
  const preset = BUILTIN_PERFORMANCE_PRESETS.find(item => item.id === id);
  return preset ? clonePerformancePreset(preset) : undefined;
}

export function isBuiltinPerformancePreset(id: string) {
  return BUILTIN_PERFORMANCE_PRESETS.some(item => item.id === id);
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

function sanitizePerformancePreset(
  value: Partial<PerformancePresetDefinition>,
  fallback: PerformancePresetDefinition,
): PerformancePresetDefinition {
  const auto = { ...fallback.auto };
  for (const key of Object.keys(fallback.auto) as PerformancePresetPoolKey[]) {
    const candidate = value.auto?.[key];
    if (Array.isArray(candidate)) {
      (auto as Record<string, unknown>)[key] = [...candidate];
    }
  }

  return {
    ...fallback,
    intensity: Number.isFinite(value.intensity)
      ? Math.max(0.2, Math.min(1.8, value.intensity!))
      : fallback.intensity,
    colorFlow: value.colorFlow === "rainbow" ? "rainbow" : "static",
    auto,
    fx: sanitizeVisualFxRack(value.fx, fallback.fx),
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
