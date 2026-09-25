import { create } from "zustand";
import type { BackgroundPreset, ColorHarmonyMode, CompositionMotionPreset, QualityMode, TypographyLayoutPreset, TypographyPreset, VisualMode } from "@graph1ks/emo-engine-core";

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
  setSyncMs: syncMs => set({ syncMs }),
  setProjectDrawerOpen: projectDrawerOpen => set({ projectDrawerOpen })
}));
