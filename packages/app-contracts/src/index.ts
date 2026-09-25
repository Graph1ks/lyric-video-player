export type ProjectAssetKind = "audio" | "lyrics" | "manifest" | "image" | "video" | "preset" | "other";
export type ProjectVisualMode = "auto" | "poster" | "neon" | "vortex";
export type ProjectQualityMode = "performance" | "cinema";
export type ProjectTypographyPreset =
  | "auto"
  | "impact"
  | "cascade"
  | "wave"
  | "scatter"
  | "elastic"
  | "outline"
  | "tunnel"
  | "glitch";
export type ProjectTypographyLayout =
  | "auto"
  | "center-stack"
  | "directional-stage"
  | "editorial"
  | "vertical-accent"
  | "split-stage"
  | "crossword";
export type ProjectCompositionMotion =
  | "auto"
  | "handoff"
  | "conveyor"
  | "anchor-build"
  | "collapse"
  | "takeover"
  | "flip"
  | "camera-handoff"
  | "portal"
  | "panel";
export type ProjectColorHarmony =
  | "auto"
  | "split-complement"
  | "analogous"
  | "complement"
  | "triad"
  | "tetrad"
  | "monochrome";
export type ProjectColorMood =
  | "auto"
  | "tender"
  | "heartbreak"
  | "longing"
  | "euphoria"
  | "rage"
  | "dream"
  | "tension"
  | "calm";
export type ProjectColorFlow = "static" | "rainbow";
export type ProjectBackgroundPreset =
  | "auto"
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
  | "minimal";

export interface EmoProjectDefaults {
  visualMode?: ProjectVisualMode;
  intensity?: number;
  quality?: ProjectQualityMode;
  typographyPreset?: ProjectTypographyPreset;
  typographyLayout?: ProjectTypographyLayout;
  compositionMotion?: ProjectCompositionMotion;
  backgroundPreset?: ProjectBackgroundPreset;
  colorHarmony?: ProjectColorHarmony;
  colorMood?: ProjectColorMood;
  colorFlow?: ProjectColorFlow;
  syncMs?: number;
}

export interface EmoProjectManifestV1 {
  schema: "emo.project/v1";
  name?: string;
  audio: string;
  lyrics: string;
  assets?: string[];
  presets?: string[];
  defaults?: EmoProjectDefaults;
}

export interface ProjectAssetDescriptor {
  id: string;
  kind: ProjectAssetKind;
  fileName: string;
  relativePath: string;
  size: number;
}

export interface ProjectDescriptor {
  id: string;
  name: string;
  relativeDirectory: string;
  manifestFile?: string;
  manifest?: EmoProjectManifestV1;
  audio?: ProjectAssetDescriptor;
  lyrics?: ProjectAssetDescriptor;
  assets: ProjectAssetDescriptor[];
}

export interface ProjectListResponse {
  rootLabel: string;
  projects: ProjectDescriptor[];
}

export interface RuntimeCapabilities {
  mode: "browser" | "server" | "desktop";
  canChooseDirectory: boolean;
  canReadProjectRoot: boolean;
  canWriteProjectRoot: boolean;
}

export interface RuntimeInfo {
  product: "E-MO-Engine";
  rootLabel: string;
  capabilities: RuntimeCapabilities;
}

export interface DesktopBridge {
  chooseProjectRoot(): Promise<ProjectListResponse | null>;
}
