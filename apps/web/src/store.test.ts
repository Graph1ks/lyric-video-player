import { describe, expect, it } from "vitest";
import { useUiStore } from "./store";

describe("E-MO UI store", () => {
  it("preserves the HUD toggle and visual controls", () => {
    useUiStore.setState({ hudVisible: true, mode: "auto", typographyPreset: "auto", typographyLayout: "auto", compositionMotion: "auto", backgroundPreset: "auto", colorHarmony: "auto", colorMood: "auto", colorCanvas: "auto", colorFlow: "static", syncMs: 0 });
    useUiStore.getState().setHudVisible(false);
    useUiStore.getState().setMode("vortex");
    useUiStore.getState().setTypographyPreset("tunnel");
    useUiStore.getState().setTypographyLayout("vertical-accent");
    useUiStore.getState().setCompositionMotion("portal");
    useUiStore.getState().setBackgroundPreset("starfield");
    useUiStore.getState().setColorHarmony("split-complement");
    useUiStore.getState().setColorMood("heartbreak");
    useUiStore.getState().setColorCanvas("paper");
    useUiStore.getState().setColorFlow("rainbow");
    useUiStore.getState().setSyncMs(120);
    expect(useUiStore.getState().hudVisible).toBe(false);
    expect(useUiStore.getState().mode).toBe("vortex");
    expect(useUiStore.getState().typographyPreset).toBe("tunnel");
    expect(useUiStore.getState().typographyLayout).toBe("vertical-accent");
    expect(useUiStore.getState().compositionMotion).toBe("portal");
    expect(useUiStore.getState().backgroundPreset).toBe("starfield");
    expect(useUiStore.getState().colorHarmony).toBe("split-complement");
    expect(useUiStore.getState().colorMood).toBe("heartbreak");
    expect(useUiStore.getState().colorCanvas).toBe("paper");
    expect(useUiStore.getState().colorFlow).toBe("rainbow");
    expect(useUiStore.getState().syncMs).toBe(120);
  });
});


describe("Director workspace state", () => {
  it("captures and recalls complete visual cue snapshots", () => {
    useUiStore.setState({
      directorCues: [],
      directorTrackTitle: "TEST TRACK",
      mode: "poster",
      intensity: 1.24,
      quality: "cinema",
      typographyPreset: "impact",
      typographyLayout: "editorial",
      compositionMotion: "takeover",
      backgroundPreset: "print",
      colorHarmony: "triad",
      colorMood: "rage",
      colorCanvas: "poster",
      colorFlow: "rainbow",
      syncMs: 90,
    });

    useUiStore.getState().addDirectorCue(12.5, "HOOK HIT");
    const cue = useUiStore.getState().directorCues[0];
    expect(cue.label).toBe("HOOK HIT");
    expect(cue.at).toBe(12.5);
    expect(cue.trackLabel).toBe("TEST TRACK");
    expect(cue.snapshot.typographyPreset).toBe("impact");
    expect(cue.snapshot.backgroundPreset).toBe("print");

    useUiStore.getState().setMode("neon");
    useUiStore.getState().setTypographyPreset("wave");
    useUiStore.getState().setBackgroundPreset("aurora");
    useUiStore.getState().applyDirectorCue(cue.id);

    expect(useUiStore.getState().mode).toBe("poster");
    expect(useUiStore.getState().typographyPreset).toBe("impact");
    expect(useUiStore.getState().backgroundPreset).toBe("print");
    expect(useUiStore.getState().syncMs).toBe(90);
  });

  it("clears planner drafts without altering live controls", () => {
    useUiStore.getState().addDirectorCue(2, "A");
    expect(useUiStore.getState().directorCues.length).toBeGreaterThan(0);
    const mode = useUiStore.getState().mode;
    useUiStore.getState().clearDirectorCues();
    expect(useUiStore.getState().directorCues).toHaveLength(0);
    expect(useUiStore.getState().mode).toBe(mode);
  });
});


describe("Operator + presentation state", () => {
  it("stores manual cinematic sequence selection inside Director cue snapshots", () => {
    useUiStore.setState({
      directorCues: [],
      typographySequence: "spiral-depth",
      lowerThirdMode: "scheduled",
      lowerThirdPreset: "poster-stamp",
    });
    useUiStore.getState().addDirectorCue(24, "SPIRAL");
    const cue = useUiStore.getState().directorCues[0];
    expect(cue.snapshot.typographySequence).toBe("spiral-depth");
    expect(cue.snapshot.lowerThirdMode).toBe("scheduled");
    expect(cue.snapshot.lowerThirdPreset).toBe("poster-stamp");
  });

  it("keeps UI language and lower-third controls in shared Director state", () => {
    useUiStore.getState().setUiLanguage("de");
    useUiStore.getState().setLowerThirdMode("always");
    useUiStore.getState().setLowerThirdPreset("glass-plate");
    useUiStore.getState().setLowerThirdStartSeconds(10);
    useUiStore.getState().setLowerThirdDurationSeconds(9);
    useUiStore.getState().setLowerThirdOutroEnabled(true);
    useUiStore.getState().setLowerThirdOutroLeadSeconds(12);
    useUiStore.getState().setLowerThirdArtistOverride("KÜNSTLER");
    useUiStore.getState().setLowerThirdTitleOverride("SONG");

    const state = useUiStore.getState();
    expect(state.uiLanguage).toBe("de");
    expect(state.lowerThirdMode).toBe("always");
    expect(state.lowerThirdPreset).toBe("glass-plate");
    expect(state.lowerThirdStartSeconds).toBe(10);
    expect(state.lowerThirdDurationSeconds).toBe(9);
    expect(state.lowerThirdOutroEnabled).toBe(true);
    expect(state.lowerThirdOutroLeadSeconds).toBe(12);
    expect(state.lowerThirdArtistOverride).toBe("KÜNSTLER");
    expect(state.lowerThirdTitleOverride).toBe("SONG");
  });

  it("activates a curated performance preset by returning visual axes to constrained AUTO", () => {
    const preset = useUiStore.getState().performancePresets.find(item => item.id === "rage-fast");
    expect(preset).toBeTruthy();

    useUiStore.getState().setMode("neon");
    useUiStore.getState().setTypographyPreset("wave");
    useUiStore.getState().setBackgroundPreset("aurora");
    useUiStore.getState().activatePerformancePreset("rage-fast");

    const state = useUiStore.getState();
    expect(state.activePerformancePresetId).toBe("rage-fast");
    expect(state.mode).toBe("auto");
    expect(state.typographyPreset).toBe("auto");
    expect(state.typographySequence).toBe("auto");
    expect(state.typographyLayout).toBe("auto");
    expect(state.compositionMotion).toBe("auto");
    expect(state.backgroundPreset).toBe("auto");
    expect(state.colorHarmony).toBe("auto");
    expect(state.colorMood).toBe("auto");
    expect(state.colorCanvas).toBe("auto");
    expect(state.intensity).toBe(preset?.intensity);
    expect(state.fxRack).toEqual(preset?.fx);
  });

  it("allows an AUTO pool to be emptied to mean unrestricted ANY", () => {
    useUiStore.getState().activatePerformancePreset("calm-slow");
    const before = useUiStore.getState().performancePresets.find(item => item.id === "calm-slow");
    expect(before?.auto.scenes?.length).toBeGreaterThan(0);

    const only = before?.auto.scenes?.[0];
    if (!only) throw new Error("Expected calm-slow scene pool");
    for (const scene of [...(before?.auto.scenes ?? [])].slice(1)) {
      useUiStore.getState().togglePerformancePresetPool("calm-slow", "scenes", scene);
    }
    useUiStore.getState().togglePerformancePresetPool("calm-slow", "scenes", only);

    const after = useUiStore.getState().performancePresets.find(item => item.id === "calm-slow");
    expect(after?.auto.scenes).toHaveLength(0);

    useUiStore.getState().resetPerformancePreset("calm-slow");
  });

  it("lets a preset switch hidden renderer effects fully off", () => {
    useUiStore.getState().activatePerformancePreset("rage-fast");
    useUiStore.getState().setPerformancePresetFx("rage-fast", "displacement", 0);
    useUiStore.getState().setPerformancePresetFx("rage-fast", "impactPulse", 0);

    const state = useUiStore.getState();
    const preset = state.performancePresets.find(item => item.id === "rage-fast");
    expect(preset?.fx.displacement).toBe(0);
    expect(preset?.fx.impactPulse).toBe(0);
    expect(state.fxRack.displacement).toBe(0);
    expect(state.fxRack.impactPulse).toBe(0);

    useUiStore.getState().resetPerformancePreset("rage-fast");
  });
});
