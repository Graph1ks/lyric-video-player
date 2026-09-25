import { create } from "zustand";
import type { QualityMode, TypographyPreset, VisualMode } from "@graph1ks/emo-engine-core";

interface UiState {
  hudVisible: boolean;
  mode: VisualMode;
  intensity: number;
  quality: QualityMode;
  typographyPreset: TypographyPreset;
  syncMs: number;
  projectDrawerOpen: boolean;
  setHudVisible(value: boolean): void;
  setMode(value: VisualMode): void;
  setIntensity(value: number): void;
  setQuality(value: QualityMode): void;
  setTypographyPreset(value: TypographyPreset): void;
  setSyncMs(value: number): void;
  setProjectDrawerOpen(value: boolean): void;
}

export const useUiStore = create<UiState>(set => ({
  hudVisible: true,
  mode: "auto",
  intensity: 1,
  quality: "cinema",
  typographyPreset: "auto",
  syncMs: 0,
  projectDrawerOpen: false,
  setHudVisible: hudVisible => set({ hudVisible }),
  setMode: mode => set({ mode }),
  setIntensity: intensity => set({ intensity }),
  setQuality: quality => set({ quality }),
  setTypographyPreset: typographyPreset => set({ typographyPreset }),
  setSyncMs: syncMs => set({ syncMs }),
  setProjectDrawerOpen: projectDrawerOpen => set({ projectDrawerOpen })
}));
