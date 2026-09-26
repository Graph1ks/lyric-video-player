import { create } from "zustand";
import { DEFAULT_VISUAL_FX_RACK } from "@graph1ks/emo-engine-core";
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
  VisualAutoProfile,
  VisualFxRack,
  VisualFxRackKey,
} from "@graph1ks/emo-engine-core";
import {
  sortDirectorCues,
  type DirectorControlSnapshot,
  type DirectorCueDraft,
} from "./directorPlanning";
import type { LowerThirdMode, LowerThirdPreset } from "./lowerThirds";
import type {
  BackgroundEngine,
  MilkdropPresetStatus,
  MilkdropRenderScale,
} from "./milkdrop";
import type { TypographyFontId } from "./typographyFonts";
import {
  createCustomPerformancePreset,
  loadPerformancePresets,
  savePerformancePresets,
  type PerformancePresetDefinition,
  setPresetFxValue,
  type PerformancePresetPoolKey,
} from "./performancePresets";

let cueCounter = 0;

export type UiLanguage = "en" | "de";

export interface UiState {
  hudVisible: boolean;
  uiLanguage: UiLanguage;
  directorDetachedOpen: boolean;
  mode: VisualMode;
  intensity: number;
  fxRack: VisualFxRack;
  quality: QualityMode;
  typographyPreset: TypographyPreset;
  typographySequence: TypographySequenceMode;
  typographyLayout: TypographyLayoutPreset;
  compositionMotion: CompositionMotionPreset;
  backgroundPreset: BackgroundPreset;
  backgroundEngine: BackgroundEngine;
  milkdropPresetId: string | null;
  milkdropOpacity: number;
  milkdropPaletteInfluence: number;
  milkdropRenderScale: MilkdropRenderScale;
  milkdropFxaa: boolean;
  milkdropBlendSeconds: number;
  milkdropPresetStatuses: Record<string, MilkdropPresetStatus>;
  typographyFont: TypographyFontId;
  colorHarmony: ColorHarmonyMode;
  colorMood: ColorMoodMode;
  colorCanvas: ColorCanvasMode;
  colorFlow: ColorFlowMode;
  syncMs: number;
  projectDrawerOpen: boolean;

  performancePresets: PerformancePresetDefinition[];
  activePerformancePresetId: string | null;

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
  directorArtist: string;
  lowerThirdMode: LowerThirdMode;
  lowerThirdPreset: LowerThirdPreset;
  lowerThirdArtistOverride: string;
  lowerThirdTitleOverride: string;
  lowerThirdArtistImage: string;
  lowerThirdPreviewUntil: number;
  lowerThirdStartSeconds: number;
  lowerThirdDurationSeconds: number;
  lowerThirdOutroEnabled: boolean;
  lowerThirdOutroLeadSeconds: number;
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
  setFxRackValue(key: VisualFxRackKey, value: number): void;
  resetFxRack(): void;
  setQuality(value: QualityMode): void;
  setTypographyPreset(value: TypographyPreset): void;
  setTypographySequence(value: TypographySequenceMode): void;
  setTypographyLayout(value: TypographyLayoutPreset): void;
  setCompositionMotion(value: CompositionMotionPreset): void;
  setBackgroundPreset(value: BackgroundPreset): void;
  setBackgroundEngine(value: BackgroundEngine): void;
  setMilkdropPresetId(value: string | null): void;
  setMilkdropOpacity(value: number): void;
  setMilkdropPaletteInfluence(value: number): void;
  setMilkdropRenderScale(value: MilkdropRenderScale): void;
  setMilkdropFxaa(value: boolean): void;
  setMilkdropBlendSeconds(value: number): void;
  setMilkdropPresetStatus(id: string, value: MilkdropPresetStatus): void;
  setTypographyFont(value: TypographyFontId): void;
  setColorHarmony(value: ColorHarmonyMode): void;
  setColorMood(value: ColorMoodMode): void;
  setColorCanvas(value: ColorCanvasMode): void;
  setColorFlow(value: ColorFlowMode): void;
  setSyncMs(value: number): void;
  setProjectDrawerOpen(value: boolean): void;

  activatePerformancePreset(id: string | null): void;
  createPerformancePreset(): void;
  deletePerformancePreset(id: string): void;
  setPerformancePresetLabel(id: string, label: string): void;
  setPerformancePresetIntensity(id: string, value: number): void;
  setPerformancePresetColorFlow(id: string, value: ColorFlowMode): void;
  setPerformancePresetFx(id: string, key: VisualFxRackKey, value: number): void;
  togglePerformancePresetPool(id: string, key: PerformancePresetPoolKey, value: string): void;

  setActiveScene(value: SceneMode): void;
  setActiveTypography(value: TypographyPresetId): void;
  setActiveSequence(value: ResolvedTypographySequence): void;
  setActiveLayout(value: TypographyLayoutId): void;
  setActiveMotion(value: CompositionMotionId): void;
  setActiveBackground(value: BackgroundPresetId): void;
  setActivePalette(value: VisualPalette): void;

  setDirectorTrack(title: string, meta?: string, artist?: string): void;
  setLowerThirdMode(value: LowerThirdMode): void;
  setLowerThirdPreset(value: LowerThirdPreset): void;
  setLowerThirdArtistOverride(value: string): void;
  setLowerThirdTitleOverride(value: string): void;
  setLowerThirdArtistImage(value: string): void;
  setLowerThirdStartSeconds(value: number): void;
  setLowerThirdDurationSeconds(value: number): void;
  setLowerThirdOutroEnabled(value: boolean): void;
  setLowerThirdOutroLeadSeconds(value: number): void;
  triggerLowerThird(): void;
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

const initialPerformancePresets = loadPerformancePresets();

export const useUiStore = create<UiState>((set, get) => ({
  hudVisible: true,
  uiLanguage: "en",
  directorDetachedOpen: false,
  mode: "auto",
  intensity: 1,
  fxRack: { ...DEFAULT_VISUAL_FX_RACK },
  quality: "cinema",
  typographyPreset: "auto",
  typographySequence: "auto",
  typographyLayout: "auto",
  compositionMotion: "auto",
  backgroundPreset: "auto",
  backgroundEngine: "emo",
  milkdropPresetId: null,
  milkdropOpacity: 1,
  milkdropPaletteInfluence: 0.18,
  milkdropRenderScale: 1,
  milkdropFxaa: true,
  milkdropBlendSeconds: 2.7,
  milkdropPresetStatuses: {},
  typographyFont: "inter",
  colorHarmony: "auto",
  colorMood: "auto",
  colorCanvas: "auto",
  colorFlow: "static",
  syncMs: 0,
  projectDrawerOpen: false,

  performancePresets: initialPerformancePresets,
  activePerformancePresetId: null,

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
  directorArtist: "",
  lowerThirdMode: "scheduled",
  lowerThirdPreset: "auto",
  lowerThirdArtistOverride: "",
  lowerThirdTitleOverride: "",
  lowerThirdArtistImage: "",
  lowerThirdPreviewUntil: 0,
  lowerThirdStartSeconds: 10,
  lowerThirdDurationSeconds: 8,
  lowerThirdOutroEnabled: false,
  lowerThirdOutroLeadSeconds: 10,
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
  setFxRackValue: (key, value) => set(state => ({
    fxRack: { ...state.fxRack, [key]: Math.max(0, Math.min(3, value)) },
  })),
  resetFxRack: () => set({ fxRack: { ...DEFAULT_VISUAL_FX_RACK } }),
  setQuality: quality => set({ quality }),
  setTypographyPreset: typographyPreset => set({ typographyPreset }),
  setTypographySequence: typographySequence => set({ typographySequence }),
  setTypographyLayout: typographyLayout => set({ typographyLayout }),
  setCompositionMotion: compositionMotion => set({ compositionMotion }),
  setBackgroundPreset: backgroundPreset => set({ backgroundPreset, backgroundEngine: "emo" }),
  setBackgroundEngine: backgroundEngine => set({ backgroundEngine }),
  setMilkdropPresetId: milkdropPresetId => set({
    milkdropPresetId,
    ...(milkdropPresetId ? { backgroundEngine: "milkdrop" as const } : {}),
  }),
  setMilkdropOpacity: milkdropOpacity => set({ milkdropOpacity: Math.max(0, Math.min(1, milkdropOpacity)) }),
  setMilkdropPaletteInfluence: milkdropPaletteInfluence => set({
    milkdropPaletteInfluence: Math.max(0, Math.min(1, milkdropPaletteInfluence)),
  }),
  setMilkdropRenderScale: milkdropRenderScale => set({ milkdropRenderScale }),
  setMilkdropFxaa: milkdropFxaa => set({ milkdropFxaa }),
  setMilkdropBlendSeconds: milkdropBlendSeconds => set({
    milkdropBlendSeconds: Math.max(0, Math.min(12, milkdropBlendSeconds)),
  }),
  setMilkdropPresetStatus: (id, value) => set(state => ({
    milkdropPresetStatuses: { ...state.milkdropPresetStatuses, [id]: value },
  })),
  setTypographyFont: typographyFont => set({ typographyFont }),
  setColorHarmony: colorHarmony => set({ colorHarmony }),
  setColorMood: colorMood => set({ colorMood }),
  setColorCanvas: colorCanvas => set({ colorCanvas }),
  setColorFlow: colorFlow => set({ colorFlow }),
  setSyncMs: syncMs => set({ syncMs }),
  setProjectDrawerOpen: projectDrawerOpen => set({ projectDrawerOpen }),

  activatePerformancePreset: id => {
    if (!id) {
      set({ activePerformancePresetId: null });
      return;
    }
    const preset = get().performancePresets.find(item => item.id === id);
    if (!preset) return;
    set({
      activePerformancePresetId: id,
      mode: "auto",
      typographyPreset: "auto",
      typographySequence: "auto",
      typographyLayout: "auto",
      compositionMotion: "auto",
      backgroundPreset: "auto",
      backgroundEngine: "emo",
      colorHarmony: "auto",
      colorMood: "auto",
      colorCanvas: "auto",
      colorFlow: preset.colorFlow,
      intensity: preset.intensity,
      fxRack: { ...preset.fx },
    });
  },
  createPerformancePreset: () => {
    const state = get();
    const source = state.performancePresets.find(item => item.id === state.activePerformancePresetId);
    const ordinal = state.performancePresets.length + 1;
    const auto: VisualAutoProfile = {
      scenes: state.mode === "auto" ? [] : [state.mode],
      typographyPresets: state.typographyPreset === "auto" ? [] : [state.typographyPreset],
      sequences: state.typographySequence === "auto" ? [] : [state.typographySequence],
      layouts: state.typographyLayout === "auto" ? [] : [state.typographyLayout],
      motions: state.compositionMotion === "auto" ? [] : [state.compositionMotion],
      backgrounds: state.backgroundPreset === "auto" ? [] : [state.backgroundPreset],
      harmonies: state.colorHarmony === "auto" ? [] : [state.colorHarmony],
      moods: state.colorMood === "auto" ? [] : [state.colorMood],
      canvases: state.colorCanvas === "auto" ? [] : [state.colorCanvas],
    };
    const seed: PerformancePresetDefinition = {
      id: `custom-seed-${ordinal}`,
      label: `Custom ${ordinal}`,
      emotion: "Custom",
      pace: "mid",
      description: "User-authored Director performance profile",
      intensity: state.intensity,
      colorFlow: state.colorFlow,
      auto,
      fx: { ...state.fxRack },
    };
    const created = createCustomPerformancePreset(source ?? seed, ordinal);
    const performancePresets = [...state.performancePresets, created];
    savePerformancePresets(performancePresets);
    set({
      performancePresets,
      activePerformancePresetId: created.id,
      mode: "auto",
      typographyPreset: "auto",
      typographySequence: "auto",
      typographyLayout: "auto",
      compositionMotion: "auto",
      backgroundPreset: "auto",
      backgroundEngine: "emo",
      colorHarmony: "auto",
      colorMood: "auto",
      colorCanvas: "auto",
      colorFlow: created.colorFlow,
      intensity: created.intensity,
      fxRack: { ...created.fx },
    });
  },
  deletePerformancePreset: id => {
    const state = get();
    const performancePresets = state.performancePresets.filter(item => item.id !== id);
    savePerformancePresets(performancePresets);
    set({
      performancePresets,
      activePerformancePresetId: state.activePerformancePresetId === id ? null : state.activePerformancePresetId,
    });
  },
  setPerformancePresetLabel: (id, label) => {
    const state = get();
    const performancePresets = state.performancePresets.map(item =>
      item.id === id ? { ...item, label: label.slice(0, 80) } : item
    );
    savePerformancePresets(performancePresets);
    set({ performancePresets });
  },
  setPerformancePresetIntensity: (id, value) => {
    const state = get();
    const intensity = Math.max(0.2, Math.min(1.8, value));
    const performancePresets = state.performancePresets.map(item =>
      item.id === id ? { ...item, intensity } : item
    );
    savePerformancePresets(performancePresets);
    set({
      performancePresets,
      ...(state.activePerformancePresetId === id ? { intensity } : {}),
    });
  },
  setPerformancePresetColorFlow: (id, colorFlow) => {
    const state = get();
    const performancePresets = state.performancePresets.map(item =>
      item.id === id ? { ...item, colorFlow } : item
    );
    savePerformancePresets(performancePresets);
    set({
      performancePresets,
      ...(state.activePerformancePresetId === id ? { colorFlow } : {}),
    });
  },
  setPerformancePresetFx: (id, key, value) => {
    const state = get();
    const performancePresets = state.performancePresets.map(item =>
      item.id === id ? setPresetFxValue(item, key, value) : item
    );
    savePerformancePresets(performancePresets);
    const updated = performancePresets.find(item => item.id === id);
    set({
      performancePresets,
      ...(state.activePerformancePresetId === id && updated ? { fxRack: { ...updated.fx } } : {}),
    });
  },
  togglePerformancePresetPool: (id, key, value) => {
    const state = get();
    const performancePresets = state.performancePresets.map(item => {
      if (item.id !== id) return item;
      const auto = { ...item.auto };
      const current = [...(((auto as Record<string, string[] | undefined>)[key]) ?? [])];
      const exists = current.includes(value);
      (auto as Record<string, string[]>)[key] = exists
        ? current.filter(candidate => candidate !== value)
        : [...current, value];
      return { ...item, auto };
    });
    savePerformancePresets(performancePresets);
    set({ performancePresets });
  },

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

  setDirectorTrack: (directorTrackTitle, directorTrackMeta = "", directorArtist = "") => set({
    directorTrackTitle,
    directorTrackMeta,
    directorArtist,
  }),
  setLowerThirdMode: lowerThirdMode => set({ lowerThirdMode }),
  setLowerThirdPreset: lowerThirdPreset => set({ lowerThirdPreset }),
  setLowerThirdArtistOverride: lowerThirdArtistOverride => set({ lowerThirdArtistOverride }),
  setLowerThirdTitleOverride: lowerThirdTitleOverride => set({ lowerThirdTitleOverride }),
  setLowerThirdArtistImage: lowerThirdArtistImage => set({ lowerThirdArtistImage }),
  setLowerThirdStartSeconds: lowerThirdStartSeconds => set({
    lowerThirdStartSeconds: Math.max(0, Math.min(600, lowerThirdStartSeconds)),
  }),
  setLowerThirdDurationSeconds: lowerThirdDurationSeconds => set({
    lowerThirdDurationSeconds: Math.max(1, Math.min(60, lowerThirdDurationSeconds)),
  }),
  setLowerThirdOutroEnabled: lowerThirdOutroEnabled => set({ lowerThirdOutroEnabled }),
  setLowerThirdOutroLeadSeconds: lowerThirdOutroLeadSeconds => set({
    lowerThirdOutroLeadSeconds: Math.max(0, Math.min(120, lowerThirdOutroLeadSeconds)),
  }),
  triggerLowerThird: () => set({
    lowerThirdPreviewUntil: Date.now() + get().lowerThirdDurationSeconds * 1000,
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
  | "fxRack"
  | "quality"
  | "typographyPreset"
  | "typographySequence"
  | "typographyLayout"
  | "compositionMotion"
  | "backgroundPreset"
  | "backgroundEngine"
  | "milkdropPresetId"
  | "milkdropOpacity"
  | "milkdropPaletteInfluence"
  | "milkdropRenderScale"
  | "milkdropFxaa"
  | "milkdropBlendSeconds"
  | "milkdropPresetStatuses"
  | "typographyFont"
  | "colorHarmony"
  | "colorMood"
  | "colorCanvas"
  | "colorFlow"
  | "syncMs"
  | "performancePresets"
  | "activePerformancePresetId"
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
  | "directorArtist"
  | "lowerThirdMode"
  | "lowerThirdPreset"
  | "lowerThirdArtistOverride"
  | "lowerThirdTitleOverride"
  | "lowerThirdArtistImage"
  | "lowerThirdPreviewUntil"
  | "lowerThirdStartSeconds"
  | "lowerThirdDurationSeconds"
  | "lowerThirdOutroEnabled"
  | "lowerThirdOutroLeadSeconds"
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
    fxRack: state.fxRack,
    quality: state.quality,
    typographyPreset: state.typographyPreset,
    typographySequence: state.typographySequence,
    typographyLayout: state.typographyLayout,
    compositionMotion: state.compositionMotion,
    backgroundPreset: state.backgroundPreset,
    backgroundEngine: state.backgroundEngine,
    milkdropPresetId: state.milkdropPresetId,
    milkdropOpacity: state.milkdropOpacity,
    milkdropPaletteInfluence: state.milkdropPaletteInfluence,
    milkdropRenderScale: state.milkdropRenderScale,
    milkdropFxaa: state.milkdropFxaa,
    milkdropBlendSeconds: state.milkdropBlendSeconds,
    milkdropPresetStatuses: state.milkdropPresetStatuses,
    typographyFont: state.typographyFont,
    colorHarmony: state.colorHarmony,
    colorMood: state.colorMood,
    colorCanvas: state.colorCanvas,
    colorFlow: state.colorFlow,
    syncMs: state.syncMs,
    performancePresets: state.performancePresets,
    activePerformancePresetId: state.activePerformancePresetId,
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
    directorArtist: state.directorArtist,
    lowerThirdMode: state.lowerThirdMode,
    lowerThirdPreset: state.lowerThirdPreset,
    lowerThirdArtistOverride: state.lowerThirdArtistOverride,
    lowerThirdTitleOverride: state.lowerThirdTitleOverride,
    lowerThirdArtistImage: state.lowerThirdArtistImage,
    lowerThirdPreviewUntil: state.lowerThirdPreviewUntil,
    lowerThirdStartSeconds: state.lowerThirdStartSeconds,
    lowerThirdDurationSeconds: state.lowerThirdDurationSeconds,
    lowerThirdOutroEnabled: state.lowerThirdOutroEnabled,
    lowerThirdOutroLeadSeconds: state.lowerThirdOutroLeadSeconds,
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
    activePerformancePresetId: state.activePerformancePresetId,
    mode: state.mode,
    intensity: state.intensity,
    fxRack: { ...state.fxRack },
    quality: state.quality,
    typographyPreset: state.typographyPreset,
    typographySequence: state.typographySequence,
    typographyLayout: state.typographyLayout,
    compositionMotion: state.compositionMotion,
    backgroundPreset: state.backgroundPreset,
    backgroundEngine: state.backgroundEngine,
    milkdropPresetId: state.milkdropPresetId,
    milkdropOpacity: state.milkdropOpacity,
    milkdropPaletteInfluence: state.milkdropPaletteInfluence,
    milkdropRenderScale: state.milkdropRenderScale,
    milkdropFxaa: state.milkdropFxaa,
    milkdropBlendSeconds: state.milkdropBlendSeconds,
    typographyFont: state.typographyFont,
    colorHarmony: state.colorHarmony,
    colorMood: state.colorMood,
    colorCanvas: state.colorCanvas,
    colorFlow: state.colorFlow,
    syncMs: state.syncMs,
    lowerThirdMode: state.lowerThirdMode,
    lowerThirdPreset: state.lowerThirdPreset,
    lowerThirdStartSeconds: state.lowerThirdStartSeconds,
    lowerThirdDurationSeconds: state.lowerThirdDurationSeconds,
    lowerThirdOutroEnabled: state.lowerThirdOutroEnabled,
    lowerThirdOutroLeadSeconds: state.lowerThirdOutroLeadSeconds,
    lowerThirdArtistOverride: state.lowerThirdArtistOverride,
    lowerThirdTitleOverride: state.lowerThirdTitleOverride,
    lowerThirdArtistImage: state.lowerThirdArtistImage,
  };
}

function createCueId() {
  cueCounter += 1;
  return `${Date.now().toString(36)}-${cueCounter.toString(36)}`;
}
