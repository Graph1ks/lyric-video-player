export type ProjectAssetKind = "audio" | "lyrics" | "manifest" | "image" | "video" | "preset" | "other";
export type ProjectVisualMode = "auto" | "poster" | "neon" | "vortex";
export type ProjectQualityMode = "performance" | "cinema";

export interface EmoProjectDefaults {
  visualMode?: ProjectVisualMode;
  intensity?: number;
  quality?: ProjectQualityMode;
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
