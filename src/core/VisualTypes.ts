export type SceneMode = "poster" | "neon" | "vortex";
export type VisualMode = "auto" | SceneMode;
export type QualityMode = "performance" | "cinema";

export interface VisualSettings {
  mode: VisualMode;
  intensity: number;
  quality: QualityMode;
}

export const SCENE_LABELS: Record<SceneMode, string> = {
  poster: "Poster Impact",
  neon: "Neon Cinema",
  vortex: "Vortex Tunnel",
};
