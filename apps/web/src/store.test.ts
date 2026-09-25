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
      lowerThirdMode: "rotate",
      lowerThirdPreset: "poster-stamp",
    });
    useUiStore.getState().addDirectorCue(24, "SPIRAL");
    const cue = useUiStore.getState().directorCues[0];
    expect(cue.snapshot.typographySequence).toBe("spiral-depth");
    expect(cue.snapshot.lowerThirdMode).toBe("rotate");
    expect(cue.snapshot.lowerThirdPreset).toBe("poster-stamp");
  });

  it("keeps UI language and lower-third controls in shared Director state", () => {
    useUiStore.getState().setUiLanguage("de");
    useUiStore.getState().setLowerThirdMode("rotate");
    useUiStore.getState().setLowerThirdPreset("glass-plate");
    useUiStore.getState().setLowerThirdArtistOverride("KÜNSTLER");
    useUiStore.getState().setLowerThirdTitleOverride("SONG");

    const state = useUiStore.getState();
    expect(state.uiLanguage).toBe("de");
    expect(state.lowerThirdMode).toBe("rotate");
    expect(state.lowerThirdPreset).toBe("glass-plate");
    expect(state.lowerThirdArtistOverride).toBe("KÜNSTLER");
    expect(state.lowerThirdTitleOverride).toBe("SONG");
  });
});
