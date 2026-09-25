import { create } from "zustand";
import type { BackgroundPreset, ColorCanvasMode, ColorFlowMode, ColorHarmonyMode, ColorMoodMode, CompositionMotionPreset, QualityMode, TypographyLayoutPreset, TypographyPreset, VisualMode } from "@graph1ks/emo-engine-core";

interface UiState {
  hudVisible: boolean;
  mode: VisualMode;
  intensity: number;
  quality: QualityMode;
  typographyPreset: TypographyPreset;
  typographyLayout: TypographyLayoutPreset;
  compositionMotion: CompositionMotionPreset;
  backgroundPreset: BackgroundPreset;
  colorHarmony: ColorHarmonyMode;
  colorMood: ColorMoodMode;
  colorCanvas: ColorCanvasMode;
  colorFlow: ColorFlowMode;
  syncMs: number;
  projectDrawerOpen: boolean;
  setHudVisible(value: boolean): void;
  setMode(value: VisualMode): void;
  setIntensity(value: number): void;
  setQuality(value: QualityMode): void;
  setTypographyPreset(value: TypographyPreset): void;
  setTypographyLayout(value: TypographyLayoutPreset): void;
  setCompositionMotion(value: CompositionMotionPreset): void;
  setBackgroundPreset(value: BackgroundPreset): void;
  setColorHarmony(value: ColorHarmonyMode): void;
  setColorMood(value: ColorMoodMode): void;
  setColorCanvas(value: ColorCanvasMode): void;
  setColorFlow(value: ColorFlowMode): void;
  setSyncMs(value: number): void;
  setProjectDrawerOpen(value: boolean): void;
}

export const useUiStore = create<UiState>(set => ({
  hudVisible: true,
  mode: "auto",
  intensity: 1,
  quality: "cinema",
  typographyPreset: "auto",
  typographyLayout: "auto",
  compositionMotion: "auto",
  backgroundPreset: "auto",
  colorHarmony: "auto",
  colorMood: "auto",
  colorCanvas: "auto",
  colorFlow: "static",
  syncMs: 0,
  projectDrawerOpen: false,
  setHudVisible: hudVisible => set({ hudVisible }),
  setMode: mode => set({ mode }),
  setIntensity: intensity => set({ intensity }),
  setQuality: quality => set({ quality }),
  setTypographyPreset: typographyPreset => set({ typographyPreset }),
  setTypographyLayout: typographyLayout => set({ typographyLayout }),
  setCompositionMotion: compositionMotion => set({ compositionMotion }),
  setBackgroundPreset: backgroundPreset => set({ backgroundPreset }),
  setColorHarmony: colorHarmony => set({ colorHarmony }),
  setColorMood: colorMood => set({ colorMood }),
  setColorCanvas: colorCanvas => set({ colorCanvas }),
  setColorFlow: colorFlow => set({ colorFlow }),
  setSyncMs: syncMs => set({ syncMs }),
  setProjectDrawerOpen: projectDrawerOpen => set({ projectDrawerOpen })
}));
