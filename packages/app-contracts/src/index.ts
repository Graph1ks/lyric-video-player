export type ProjectAssetKind = "audio" | "lyrics" | "manifest" | "image" | "video" | "preset" | "other";

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
