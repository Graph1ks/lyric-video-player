import { describe, expect, it } from "vitest";
import { useUiStore } from "./store";

describe("E-MO UI store", () => {
  it("preserves the HUD toggle and visual controls", () => {
    useUiStore.setState({ hudVisible: true, mode: "auto", typographyPreset: "auto", typographyLayout: "auto", compositionMotion: "auto", backgroundPreset: "auto", colorHarmony: "auto", colorMood: "auto", colorFlow: "static", canvasTone: "auto", syncMs: 0 });
    useUiStore.getState().setHudVisible(false);
    useUiStore.getState().setMode("vortex");
    useUiStore.getState().setTypographyPreset("tunnel");
    useUiStore.getState().setTypographyLayout("vertical-accent");
    useUiStore.getState().setCompositionMotion("portal");
    useUiStore.getState().setBackgroundPreset("starfield");
    useUiStore.getState().setColorHarmony("split-complement");
    useUiStore.getState().setColorMood("heartbreak");
    useUiStore.getState().setColorFlow("rainbow");
    useUiStore.getState().setCanvasTone("light");
    useUiStore.getState().setSyncMs(120);
    expect(useUiStore.getState().hudVisible).toBe(false);
    expect(useUiStore.getState().mode).toBe("vortex");
    expect(useUiStore.getState().typographyPreset).toBe("tunnel");
    expect(useUiStore.getState().typographyLayout).toBe("vertical-accent");
    expect(useUiStore.getState().compositionMotion).toBe("portal");
    expect(useUiStore.getState().backgroundPreset).toBe("starfield");
    expect(useUiStore.getState().colorHarmony).toBe("split-complement");
    expect(useUiStore.getState().colorMood).toBe("heartbreak");
    expect(useUiStore.getState().colorFlow).toBe("rainbow");
    expect(useUiStore.getState().canvasTone).toBe("light");
    expect(useUiStore.getState().syncMs).toBe(120);
  });
});
