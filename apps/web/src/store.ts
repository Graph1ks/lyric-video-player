import { create } from "zustand";
import type {
  BackgroundPreset,
  BackgroundPresetId,
  ColorCanvasId,
  ColorCanvasMode,
  ColorFlowMode,
  ColorHarmonyId,
  ColorHarmonyMode,
  ColorMoodId,
  ColorMoodMode,
  CompositionMotionId,
  CompositionMotionPreset,
  QualityMode,
  SceneMode,
  TypographyLayoutId,
  TypographyLayoutPreset,
  TypographyPreset,
  TypographyPresetId,
  TypographySequenceMode,
  ResolvedTypographySequence,
  VisualMode,
  VisualPalette,
} from "@graph1ks/emo-engine-core";
import {
  sortDirectorCues,
  type DirectorControlSnapshot,
  type DirectorCueDraft,
} from "./directorPlanning";

let cueCounter = 0;

export type UiLanguage = "en" | "de";

export interface UiState {
  hudVisible: boolean;
  uiLanguage: UiLanguage;
  directorDetachedOpen: boolean;
  mode: VisualMode;
  intensity: number;
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
  projectDrawerOpen: boolean;

  activeScene: SceneMode;
  activeTypography: TypographyPresetId;
  activeSequence: ResolvedTypographySequence;
  activeLayout: TypographyLayoutId;
  activeMotion: CompositionMotionId;
  activeBackground: BackgroundPresetId;
  activeHarmony: ColorHarmonyId;
  activeMood: ColorMoodId;
  activeCanvas: ColorCanvasId;
  activePalette: VisualPalette | null;

  directorTrackTitle: string;
  directorTrackMeta: string;
  directorPlaybackSeconds: number;
  directorDurationSeconds: number;
  directorPlaying: boolean;
  directorMuted: boolean;
  directorVolume: number;
  directorAudioBands: { bass: number; mid: number; treble: number };
  directorCues: DirectorCueDraft[];

  setHudVisible(value: boolean): void;
  setUiLanguage(value: UiLanguage): void;
  setDirectorDetachedOpen(value: boolean): void;
  setMode(value: VisualMode): void;
  setIntensity(value: number): void;
  setQuality(value: QualityMode): void;
  setTypographyPreset(value: TypographyPreset): void;
  setTypographySequence(value: TypographySequenceMode): void;
  setTypographyLayout(value: TypographyLayoutPreset): void;
  setCompositionMotion(value: CompositionMotionPreset): void;
  setBackgroundPreset(value: BackgroundPreset): void;
  setColorHarmony(value: ColorHarmonyMode): void;
  setColorMood(value: ColorMoodMode): void;
  setColorCanvas(value: ColorCanvasMode): void;
  setColorFlow(value: ColorFlowMode): void;
  setSyncMs(value: number): void;
  setProjectDrawerOpen(value: boolean): void;

  setActiveScene(value: SceneMode): void;
  setActiveTypography(value: TypographyPresetId): void;
  setActiveSequence(value: ResolvedTypographySequence): void;
  setActiveLayout(value: TypographyLayoutId): void;
  setActiveMotion(value: CompositionMotionId): void;
  setActiveBackground(value: BackgroundPresetId): void;
  setActivePalette(value: VisualPalette): void;

  setDirectorTrack(title: string, meta?: string): void;
  setDirectorPlayback(seconds: number, duration: number): void;
  setDirectorPlaying(value: boolean): void;
  setDirectorMuted(value: boolean): void;
  setDirectorVolume(value: number): void;
  setDirectorAudioBands(value: { bass: number; mid: number; treble: number }): void;
  addDirectorCue(at: number, label?: string): void;
  removeDirectorCue(id: string): void;
  clearDirectorCues(): void;
  applyDirectorCue(id: string): void;
}

export const useUiStore = create<UiState>((set, get) => ({
  hudVisible: true,
  uiLanguage: "en",
  directorDetachedOpen: false,
  mode: "auto",
  intensity: 1,
  quality: "cinema",
  typographyPreset: "auto",
  typographySequence: "auto",
  typographyLayout: "auto",
  compositionMotion: "auto",
  backgroundPreset: "auto",
  colorHarmony: "auto",
  colorMood: "auto",
  colorCanvas: "auto",
  colorFlow: "static",
  syncMs: 0,
  projectDrawerOpen: false,

  activeScene: "neon",
  activeTypography: "elastic",
  activeSequence: "off",
  activeLayout: "directional-stage",
  activeMotion: "handoff",
  activeBackground: "nebula",
  activeHarmony: "split-complement",
  activeMood: "dream",
  activeCanvas: "color-field",
  activePalette: null,

  directorTrackTitle: "NO TRACK LOADED",
  directorTrackMeta: "Load an audio file + Enhanced LRC",
  directorPlaybackSeconds: 0,
  directorDurationSeconds: 0,
  directorPlaying: false,
  directorMuted: false,
  directorVolume: 0.9,
  directorAudioBands: { bass: 0, mid: 0, treble: 0 },
  directorCues: [],

  setHudVisible: hudVisible => set({ hudVisible }),
  setUiLanguage: uiLanguage => set({ uiLanguage }),
  setDirectorDetachedOpen: directorDetachedOpen => set({ directorDetachedOpen }),
  setMode: mode => set({ mode }),
  setIntensity: intensity => set({ intensity }),
  setQuality: quality => set({ quality }),
  setTypographyPreset: typographyPreset => set({ typographyPreset }),
  setTypographySequence: typographySequence => set({ typographySequence }),
  setTypographyLayout: typographyLayout => set({ typographyLayout }),
  setCompositionMotion: compositionMotion => set({ compositionMotion }),
  setBackgroundPreset: backgroundPreset => set({ backgroundPreset }),
  setColorHarmony: colorHarmony => set({ colorHarmony }),
  setColorMood: colorMood => set({ colorMood }),
  setColorCanvas: colorCanvas => set({ colorCanvas }),
  setColorFlow: colorFlow => set({ colorFlow }),
  setSyncMs: syncMs => set({ syncMs }),
  setProjectDrawerOpen: projectDrawerOpen => set({ projectDrawerOpen }),

  setActiveScene: activeScene => set({ activeScene }),
  setActiveTypography: activeTypography => set({ activeTypography }),
  setActiveSequence: activeSequence => set({ activeSequence }),
  setActiveLayout: activeLayout => set({ activeLayout }),
  setActiveMotion: activeMotion => set({ activeMotion }),
  setActiveBackground: activeBackground => set({ activeBackground }),
  setActivePalette: activePalette => set({
    activePalette,
    activeHarmony: activePalette.resolvedHarmony,
    activeMood: activePalette.resolvedMood,
    activeCanvas: activePalette.resolvedCanvas,
  }),

  setDirectorTrack: (directorTrackTitle, directorTrackMeta = "") => set({
    directorTrackTitle,
    directorTrackMeta,
  }),
  setDirectorPlayback: (directorPlaybackSeconds, directorDurationSeconds) => set({
    directorPlaybackSeconds,
    directorDurationSeconds,
  }),
  setDirectorPlaying: directorPlaying => set({ directorPlaying }),
  setDirectorMuted: directorMuted => set({ directorMuted }),
  setDirectorVolume: directorVolume => set({ directorVolume: Math.max(0, Math.min(1, directorVolume)) }),
  setDirectorAudioBands: directorAudioBands => set({ directorAudioBands }),

  addDirectorCue: (at, label) => {
    const state = get();
    const cue: DirectorCueDraft = {
      id: createCueId(),
      at: Math.max(0, Number.isFinite(at) ? at : 0),
      label: label?.trim() || `Cue ${state.directorCues.length + 1}`,
      trackLabel: state.directorTrackTitle,
      snapshot: controlSnapshot(state),
    };
    set({ directorCues: sortDirectorCues([...state.directorCues, cue]) });
  },
  removeDirectorCue: id => set(state => ({
    directorCues: state.directorCues.filter(cue => cue.id !== id),
  })),
  clearDirectorCues: () => set({ directorCues: [] }),
  applyDirectorCue: id => {
    const cue = get().directorCues.find(candidate => candidate.id === id);
    if (!cue) return;
    set({ ...cue.snapshot });
  },
}));

export type DirectorSharedState = Pick<
  UiState,
  | "uiLanguage"
  | "mode"
  | "intensity"
  | "quality"
  | "typographyPreset"
  | "typographySequence"
  | "typographyLayout"
  | "compositionMotion"
  | "backgroundPreset"
  | "colorHarmony"
  | "colorMood"
  | "colorCanvas"
  | "colorFlow"
  | "syncMs"
  | "activeScene"
  | "activeTypography"
  | "activeSequence"
  | "activeLayout"
  | "activeMotion"
  | "activeBackground"
  | "activeHarmony"
  | "activeMood"
  | "activeCanvas"
  | "activePalette"
  | "directorTrackTitle"
  | "directorTrackMeta"
  | "directorPlaybackSeconds"
  | "directorDurationSeconds"
  | "directorPlaying"
  | "directorMuted"
  | "directorVolume"
  | "directorAudioBands"
  | "directorCues"
>;

export function directorSharedState(state: UiState): DirectorSharedState {
  return {
    uiLanguage: state.uiLanguage,
    mode: state.mode,
    intensity: state.intensity,
    quality: state.quality,
    typographyPreset: state.typographyPreset,
    typographySequence: state.typographySequence,
    typographyLayout: state.typographyLayout,
    compositionMotion: state.compositionMotion,
    backgroundPreset: state.backgroundPreset,
    colorHarmony: state.colorHarmony,
    colorMood: state.colorMood,
    colorCanvas: state.colorCanvas,
    colorFlow: state.colorFlow,
    syncMs: state.syncMs,
    activeScene: state.activeScene,
    activeTypography: state.activeTypography,
    activeSequence: state.activeSequence,
    activeLayout: state.activeLayout,
    activeMotion: state.activeMotion,
    activeBackground: state.activeBackground,
    activeHarmony: state.activeHarmony,
    activeMood: state.activeMood,
    activeCanvas: state.activeCanvas,
    activePalette: state.activePalette,
    directorTrackTitle: state.directorTrackTitle,
    directorTrackMeta: state.directorTrackMeta,
    directorPlaybackSeconds: state.directorPlaybackSeconds,
    directorDurationSeconds: state.directorDurationSeconds,
    directorPlaying: state.directorPlaying,
    directorMuted: state.directorMuted,
    directorVolume: state.directorVolume,
    directorAudioBands: state.directorAudioBands,
    directorCues: state.directorCues,
  };
}

function controlSnapshot(state: UiState): DirectorControlSnapshot {
  return {
    mode: state.mode,
    intensity: state.intensity,
    quality: state.quality,
    typographyPreset: state.typographyPreset,
    typographySequence: state.typographySequence,
    typographyLayout: state.typographyLayout,
    compositionMotion: state.compositionMotion,
    backgroundPreset: state.backgroundPreset,
    colorHarmony: state.colorHarmony,
    colorMood: state.colorMood,
    colorCanvas: state.colorCanvas,
    colorFlow: state.colorFlow,
    syncMs: state.syncMs,
  };
}

function createCueId() {
  cueCounter += 1;
  return `${Date.now().toString(36)}-${cueCounter.toString(36)}`;
}
