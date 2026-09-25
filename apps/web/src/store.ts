import { create } from "zustand";
import type { QualityMode, VisualMode } from "@graph1ks/emo-engine-core";

interface UiState {
  hudVisible: boolean;
  mode: VisualMode;
  intensity: number;
  quality: QualityMode;
  syncMs: number;
  projectDrawerOpen: boolean;
  setHudVisible(value: boolean): void;
  setMode(value: VisualMode): void;
  setIntensity(value: number): void;
  setQuality(value: QualityMode): void;
  setSyncMs(value: number): void;
  setProjectDrawerOpen(value: boolean): void;
}

export const useUiStore = create<UiState>(set => ({
  hudVisible: true,
  mode: "auto",
  intensity: 1,
  quality: "cinema",
  syncMs: 0,
  projectDrawerOpen: false,
  setHudVisible: hudVisible => set({ hudVisible }),
  setMode: mode => set({ mode }),
  setIntensity: intensity => set({ intensity }),
  setQuality: quality => set({ quality }),
  setSyncMs: syncMs => set({ syncMs }),
  setProjectDrawerOpen: projectDrawerOpen => set({ projectDrawerOpen })
}));
