import type {
  BackgroundPreset,
  ColorCanvasMode,
  ColorFlowMode,
  ColorHarmonyMode,
  ColorMoodMode,
  CompositionMotionPreset,
  QualityMode,
  TypographyLayoutPreset,
  TypographyPreset,
  TypographySequenceMode,
  VisualMode,
  VisualFxRack,
} from "@graph1ks/emo-engine-core";
import type { LowerThirdMode, LowerThirdPreset } from "./lowerThirds";

export interface DirectorControlSnapshot {
  activePerformancePresetId: string | null;
  mode: VisualMode;
  intensity: number;
  fxRack: VisualFxRack;
  quality: QualityMode;
  typographyPreset: TypographyPreset;
  typographySequence: TypographySequenceMode;
  typographyLayout: TypographyLayoutPreset;
  compositionMotion: CompositionMotionPreset;
  backgroundPreset: BackgroundPreset;
  colorHarmony: ColorHarmonyMode;
  colorMood: ColorMoodMode;
  colorCanvas: ColorCanvasMode;
  colorFlow: ColorFlowMode;
  syncMs: number;
  lowerThirdMode: LowerThirdMode;
  lowerThirdPreset: LowerThirdPreset;
  lowerThirdStartSeconds: number;
  lowerThirdDurationSeconds: number;
  lowerThirdOutroEnabled: boolean;
  lowerThirdOutroLeadSeconds: number;
  lowerThirdArtistOverride: string;
  lowerThirdTitleOverride: string;
  lowerThirdArtistImage: string;
}

export interface DirectorCueDraft {
  id: string;
  at: number;
  label: string;
  trackLabel: string;
  snapshot: DirectorControlSnapshot;
}

export function formatDirectorTime(seconds: number) {
  const safe = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const minutes = Math.floor(safe / 60);
  const rest = safe - minutes * 60;
  return `${String(minutes).padStart(2, "0")}:${rest.toFixed(3).padStart(6, "0")}`;
}

export function parseDirectorTime(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return 0;

  if (!trimmed.includes(":")) {
    const seconds = Number(trimmed);
    return Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  }

  const parts = trimmed.split(":").map(Number);
  if (parts.some(part => !Number.isFinite(part))) return 0;
  if (parts.length === 2) return Math.max(0, parts[0] * 60 + parts[1]);
  if (parts.length === 3) return Math.max(0, parts[0] * 3600 + parts[1] * 60 + parts[2]);
  return 0;
}

export function sortDirectorCues(cues: DirectorCueDraft[]) {
  return [...cues].sort((a, b) => a.at - b.at || a.label.localeCompare(b.label));
}
