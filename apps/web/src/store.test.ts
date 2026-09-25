import { describe, expect, it } from "vitest";
import { useUiStore } from "./store";

describe("E-MO UI store", () => {
  it("preserves the HUD toggle and visual controls", () => {
    useUiStore.setState({ hudVisible: true, mode: "auto", typographyPreset: "auto", backgroundPreset: "auto", syncMs: 0 });
    useUiStore.getState().setHudVisible(false);
    useUiStore.getState().setMode("vortex");
    useUiStore.getState().setTypographyPreset("tunnel");
    useUiStore.getState().setBackgroundPreset("starfield");
    useUiStore.getState().setSyncMs(120);
    expect(useUiStore.getState().hudVisible).toBe(false);
    expect(useUiStore.getState().mode).toBe("vortex");
    expect(useUiStore.getState().typographyPreset).toBe("tunnel");
    expect(useUiStore.getState().backgroundPreset).toBe("starfield");
    expect(useUiStore.getState().syncMs).toBe(120);
  });
});
