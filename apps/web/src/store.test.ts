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

  it("creates and activates a user-authored performance preset", () => {
    useUiStore.setState({
      performancePresets: [],
      activePerformancePresetId: null,
      mode: "neon",
      typographyPreset: "wave",
      typographySequence: "off",
      typographyLayout: "center-stack",
      compositionMotion: "handoff",
      backgroundPreset: "aurora",
      colorHarmony: "analogous",
      colorMood: "dream",
      colorCanvas: "night",
      colorFlow: "rainbow",
      intensity: 1.12,
    });

    useUiStore.getState().createPerformancePreset();
    const created = useUiStore.getState().performancePresets[0];
    expect(created).toBeTruthy();
    expect(created.auto.scenes).toEqual(["neon"]);
    expect(created.auto.backgrounds).toEqual(["aurora"]);

    useUiStore.getState().setMode("poster");
    useUiStore.getState().activatePerformancePreset(created.id);

    const state = useUiStore.getState();
    expect(state.activePerformancePresetId).toBe(created.id);
    expect(state.mode).toBe("auto");
    expect(state.typographyPreset).toBe("auto");
    expect(state.backgroundPreset).toBe("auto");
    expect(state.intensity).toBe(created.intensity);
    expect(state.fxRack).toEqual(created.fx);
  });

  it("allows an AUTO pool to be emptied to mean unrestricted ANY", () => {
    const id = useUiStore.getState().performancePresets[0]?.id;
    if (!id) throw new Error("Expected user preset");
    const before = useUiStore.getState().performancePresets.find(item => item.id === id);
    expect(before?.auto.scenes).toEqual(["neon"]);

    useUiStore.getState().togglePerformancePresetPool(id, "scenes", "neon");

    const after = useUiStore.getState().performancePresets.find(item => item.id === id);
    expect(after?.auto.scenes).toHaveLength(0);
  });

  it("lets a preset switch renderer effects fully off", () => {
    const id = useUiStore.getState().performancePresets[0]?.id;
    if (!id) throw new Error("Expected user preset");
    useUiStore.getState().activatePerformancePreset(id);
    useUiStore.getState().setPerformancePresetFx(id, "displacement", 0);
    useUiStore.getState().setPerformancePresetFx(id, "impactPulse", 0);

    const state = useUiStore.getState();
    const preset = state.performancePresets.find(item => item.id === id);
    expect(preset?.fx.displacement).toBe(0);
    expect(preset?.fx.impactPulse).toBe(0);
    expect(state.fxRack.displacement).toBe(0);
    expect(state.fxRack.impactPulse).toBe(0);
  });

  it("resets the global FX rack to the original authored factory balance", () => {
    useUiStore.getState().setFxRackValue("displacement", 0);
    useUiStore.getState().setFxRackValue("feedback", 2.7);
    useUiStore.getState().setFxRackValue("screenBloom", 0.2);
    useUiStore.getState().resetFxRack();

    const rack = useUiStore.getState().fxRack;
    for (const value of Object.values(rack)) expect(value).toBe(1);
  });
});
