export interface WordCue {
  start: number;
  end: number;
  text: string;
}

export interface LineCue {
  start: number;
  end: number;
  text: string;
  words: WordCue[];
}

export interface LyricMeta {
  title?: string;
  artist?: string;
  album?: string;
  author?: string;
}

export interface ParsedLyrics {
  offsetMs: number;
  lines: LineCue[];
  meta: LyricMeta;
}

export type SceneMode = "poster" | "neon" | "vortex";
export type VisualMode = "auto" | SceneMode;
export type QualityMode = "performance" | "cinema";
export type TypographyPresetId =
  | "impact"
  | "cascade"
  | "wave"
  | "scatter"
  | "elastic"
  | "outline"
  | "tunnel"
  | "glitch";
export type TypographyPreset = "auto" | TypographyPresetId;
export type TypographyLayoutId =
  | "center-stack"
  | "directional-stage"
  | "editorial"
  | "vertical-accent"
  | "split-stage"
  | "crossword";
export type TypographyLayoutPreset = "auto" | TypographyLayoutId;
export type CompositionMotionId =
  | "handoff"
  | "conveyor"
  | "anchor-build"
  | "collapse"
  | "takeover"
  | "flip"
  | "camera-handoff"
  | "portal"
  | "panel";
export type CompositionMotionPreset = "auto" | CompositionMotionId;
export type BackgroundPresetId =
  | "cinematic"
  | "nebula"
  | "grid"
  | "starfield"
  | "rays"
  | "vortex"
  | "liquid"
  | "spectrum"
  | "sparks"
  | "lyrics"
  | "minimal"
  | "editorial"
  | "print"
  | "architecture"
  | "aurora";
export type BackgroundPreset = "auto" | BackgroundPresetId;
export type ColorHarmonyId =
  | "split-complement"
  | "analogous"
  | "complement"
  | "triad"
  | "tetrad"
  | "monochrome";
export type ColorHarmonyMode = "auto" | ColorHarmonyId;
export type ColorMoodId =
  | "tender"
  | "heartbreak"
  | "longing"
  | "euphoria"
  | "rage"
  | "dream"
  | "tension"
  | "calm";
export type ColorMoodMode = "auto" | ColorMoodId;
export type ColorFlowMode = "static" | "rainbow";
export type CanvasToneId = "dark" | "light" | "color";
export type CanvasToneMode = "auto" | CanvasToneId;

export interface VisualSettings {
  mode: VisualMode;
  intensity: number;
  quality: QualityMode;
  typographyPreset?: TypographyPreset;
  typographyLayout?: TypographyLayoutPreset;
  compositionMotion?: CompositionMotionPreset;
  backgroundPreset?: BackgroundPreset;
  colorHarmony?: ColorHarmonyMode;
  colorMood?: ColorMoodMode;
  colorFlow?: ColorFlowMode;
  canvasTone?: CanvasToneMode;
}

export interface AudioBands {
  bass: number;
  mid: number;
  treble: number;
  energy: number;
  transient: number;
}

export const EMPTY_AUDIO_BANDS: AudioBands = Object.freeze({
  bass: 0,
  mid: 0,
  treble: 0,
  energy: 0,
  transient: 0,
});

export const SCENE_LABELS: Record<SceneMode, string> = {
  poster: "Poster Impact",
  neon: "Neon Cinema",
  vortex: "Vortex Tunnel",
};
