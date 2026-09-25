import type {
  ColorFlowMode,
  VisualAutoProfile,
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
}

export type PerformancePresetPoolKey = keyof VisualAutoProfile;

export const BUILTIN_PERFORMANCE_PRESETS: PerformancePresetDefinition[] = [
  {
    id: "tender-slow",
    label: "Tender / Slow",
    emotion: "Tender",
    pace: "slow",
    description: "Soft, spacious movement with restrained editorial and ribbon moments.",
    intensity: 0.72,
    colorFlow: "static",
    auto: {
      scenes: ["neon", "poster"],
      typographyPresets: ["elastic", "wave", "outline"],
      sequences: ["off", "ribbon-path", "manifesto-wall"],
      layouts: ["directional-stage", "editorial", "center-stack"],
      motions: ["handoff", "anchor-build", "panel"],
      backgrounds: ["minimal", "aurora", "editorial", "cinematic"],
      harmonies: ["analogous", "split-complement", "monochrome"],
      moods: ["tender", "calm"],
      canvases: ["night", "paper"],
    },
  },
  {
    id: "heartbreak-slow",
    label: "Heartbreak / Slow",
    emotion: "Heartbreak",
    pace: "slow",
    description: "Dark editorial pacing, persistent page writing and sparse camera movement.",
    intensity: 0.82,
    colorFlow: "static",
    auto: {
      scenes: ["poster", "vortex"],
      typographyPresets: ["outline", "impact", "wave"],
      sequences: ["off", "manifesto-wall", "hero-echo"],
      layouts: ["editorial", "center-stack", "vertical-accent"],
      motions: ["panel", "camera-handoff", "collapse"],
      backgrounds: ["editorial", "print", "minimal", "architecture"],
      harmonies: ["monochrome", "split-complement"],
      moods: ["heartbreak", "longing"],
      canvases: ["night", "paper"],
    },
  },
  {
    id: "longing-mid",
    label: "Longing / Midtempo",
    emotion: "Longing",
    pace: "mid",
    description: "Flowing handoffs, readable asymmetry and atmospheric distance.",
    intensity: 0.9,
    colorFlow: "static",
    auto: {
      scenes: ["neon", "poster"],
      typographyPresets: ["elastic", "wave", "cascade", "outline"],
      sequences: ["off", "ribbon-path", "hero-echo"],
      layouts: ["directional-stage", "editorial", "split-stage"],
      motions: ["handoff", "conveyor", "camera-handoff"],
      backgrounds: ["aurora", "nebula", "editorial", "cinematic"],
      harmonies: ["analogous", "split-complement", "triad"],
      moods: ["longing", "dream"],
      canvases: ["night", "color-field", "paper"],
    },
  },
  {
    id: "dream-mid",
    label: "Dream / Midtempo",
    emotion: "Dream",
    pace: "mid",
    description: "Soft depth, liquid/aurora worlds and controlled spatial sequences.",
    intensity: 0.92,
    colorFlow: "rainbow",
    auto: {
      scenes: ["neon", "vortex"],
      typographyPresets: ["wave", "elastic", "tunnel", "outline"],
      sequences: ["off", "ribbon-path", "spiral-depth"],
      layouts: ["directional-stage", "center-stack", "editorial"],
      motions: ["handoff", "portal", "camera-handoff"],
      backgrounds: ["aurora", "nebula", "liquid", "starfield"],
      harmonies: ["analogous", "triad", "tetrad"],
      moods: ["dream", "calm"],
      canvases: ["color-field", "night"],
    },
  },
  {
    id: "calm-slow",
    label: "Calm / Slow",
    emotion: "Calm",
    pace: "slow",
    description: "Minimal worlds, low motion pressure and long readable holds.",
    intensity: 0.62,
    colorFlow: "static",
    auto: {
      scenes: ["neon", "poster"],
      typographyPresets: ["outline", "wave", "elastic"],
      sequences: ["off", "manifesto-wall", "ribbon-path"],
      layouts: ["center-stack", "editorial", "directional-stage"],
      motions: ["handoff", "anchor-build", "panel"],
      backgrounds: ["minimal", "cinematic", "aurora"],
      harmonies: ["monochrome", "analogous"],
      moods: ["calm", "tender"],
      canvases: ["night", "paper"],
    },
  },
  {
    id: "euphoria-fast",
    label: "Euphoria / Fast",
    emotion: "Euphoria",
    pace: "fast",
    description: "Bright high-energy handoffs with selective spatial depth and spectrum worlds.",
    intensity: 1.16,
    colorFlow: "rainbow",
    auto: {
      scenes: ["neon", "vortex", "poster"],
      typographyPresets: ["impact", "cascade", "elastic", "wave"],
      sequences: ["off", "ribbon-path", "spiral-depth", "hero-echo"],
      layouts: ["directional-stage", "split-stage", "center-stack"],
      motions: ["handoff", "conveyor", "takeover", "camera-handoff"],
      backgrounds: ["spectrum", "rays", "sparks", "aurora"],
      harmonies: ["triad", "tetrad", "split-complement"],
      moods: ["euphoria"],
      canvases: ["color-field", "poster"],
    },
  },
  {
    id: "rage-fast",
    label: "Rage / Fast",
    emotion: "Rage",
    pace: "fast",
    description: "Hard graphic impact, glitch/scatter accents and aggressive structured worlds.",
    intensity: 1.28,
    colorFlow: "static",
    auto: {
      scenes: ["poster", "vortex"],
      typographyPresets: ["impact", "glitch", "scatter", "cascade"],
      sequences: ["off", "hero-echo", "shape-fill", "spiral-depth"],
      layouts: ["editorial", "crossword", "split-stage", "center-stack"],
      motions: ["takeover", "panel", "collapse", "flip"],
      backgrounds: ["sparks", "print", "architecture", "vortex"],
      harmonies: ["complement", "monochrome", "split-complement"],
      moods: ["rage", "tension"],
      canvases: ["poster", "night"],
    },
  },
  {
    id: "tension-burst",
    label: "Tension / Burst",
    emotion: "Tension",
    pace: "burst",
    description: "Compressed high-pressure motion with selective portal, glitch and architectural depth.",
    intensity: 1.2,
    colorFlow: "static",
    auto: {
      scenes: ["vortex", "poster"],
      typographyPresets: ["glitch", "scatter", "tunnel", "impact"],
      sequences: ["off", "spiral-depth", "hero-echo"],
      layouts: ["center-stack", "crossword", "vertical-accent"],
      motions: ["portal", "camera-handoff", "collapse", "flip"],
      backgrounds: ["architecture", "vortex", "grid", "sparks"],
      harmonies: ["complement", "split-complement", "monochrome"],
      moods: ["tension", "rage"],
      canvases: ["night", "color-field"],
    },
  },
];

const STORAGE_KEY = "emo.performance-presets.v1";

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
  };
}

export function loadPerformancePresets() {
  const defaults = defaultPerformancePresets();
  if (typeof localStorage === "undefined") return defaults;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const stored = JSON.parse(raw) as PerformancePresetDefinition[];
    const byId = new Map(stored.map(item => [item.id, item]));
    return defaults.map(item => {
      const override = byId.get(item.id);
      return override ? sanitizePerformancePreset(override, item) : item;
    });
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

function sanitizePerformancePreset(
  value: PerformancePresetDefinition,
  fallback: PerformancePresetDefinition,
): PerformancePresetDefinition {
  const auto = { ...fallback.auto };
  for (const key of Object.keys(fallback.auto) as PerformancePresetPoolKey[]) {
    const candidate = value.auto?.[key];
    if (Array.isArray(candidate) && candidate.length) {
      (auto as Record<string, unknown>)[key] = [...candidate];
    }
  }

  return {
    ...fallback,
    intensity: Number.isFinite(value.intensity)
      ? Math.max(0.2, Math.min(1.8, value.intensity))
      : fallback.intensity,
    colorFlow: value.colorFlow === "rainbow" ? "rainbow" : "static",
    auto,
  };
}
