import { describe, expect, it } from "vitest";
import { useUiStore } from "./store";

describe("E-MO UI store", () => {
  it("preserves the HUD toggle and visual controls", () => {
    useUiStore.setState({ hudVisible: true, mode: "auto", typographyPreset: "auto", typographyLayout: "auto", backgroundPreset: "auto", colorHarmony: "auto", syncMs: 0 });
    useUiStore.getState().setHudVisible(false);
    useUiStore.getState().setMode("vortex");
    useUiStore.getState().setTypographyPreset("tunnel");
    useUiStore.getState().setTypographyLayout("vertical-accent");
    useUiStore.getState().setBackgroundPreset("starfield");
    useUiStore.getState().setColorHarmony("split-complement");
    useUiStore.getState().setSyncMs(120);
    expect(useUiStore.getState().hudVisible).toBe(false);
    expect(useUiStore.getState().mode).toBe("vortex");
    expect(useUiStore.getState().typographyPreset).toBe("tunnel");
    expect(useUiStore.getState().typographyLayout).toBe("vertical-accent");
    expect(useUiStore.getState().backgroundPreset).toBe("starfield");
    expect(useUiStore.getState().colorHarmony).toBe("split-complement");
    expect(useUiStore.getState().syncMs).toBe(120);
  });
});
