import { describe, expect, it } from "vitest";
import {
  BUILTIN_PERFORMANCE_PRESETS,
  clonePerformancePreset,
  createCustomPerformancePreset,
  defaultPerformancePresets,
  type PerformancePresetDefinition,
} from "./performancePresets";
import { DEFAULT_VISUAL_FX_RACK } from "@graph1ks/emo-engine-core";

const fixture: PerformancePresetDefinition = {
  id: "fixture",
  label: "Fixture",
  emotion: "Custom",
  pace: "mid",
  description: "fixture",
  intensity: 1,
  colorFlow: "static",
  auto: {
    scenes: ["neon"],
    backgrounds: ["aurora"],
  },
  fx: { ...DEFAULT_VISUAL_FX_RACK },
};

describe("Director performance preset library", () => {
  it("ships no authored performance presets", () => {
    expect(BUILTIN_PERFORMANCE_PRESETS).toHaveLength(0);
    expect(defaultPerformancePresets()).toHaveLength(0);
  });

  it("deep-clones user presets so edits never mutate the source", () => {
    const cloned = clonePerformancePreset(fixture);
    cloned.auto.scenes?.splice(0, 1);
    cloned.fx.displacement = 0;

    expect(fixture.auto.scenes).toEqual(["neon"]);
    expect(fixture.fx.displacement).toBe(1);
    expect(cloned.auto.scenes).toEqual([]);
    expect(cloned.fx.displacement).toBe(0);
  });

  it("creates user-owned custom presets from the supplied source", () => {
    const created = createCustomPerformancePreset(fixture, 3);
    expect(created.id).toMatch(/^custom-/);
    expect(created.label).toBe("Custom 3");
    expect(created.auto.backgrounds).toEqual(["aurora"]);
    expect(created.fx).toEqual(DEFAULT_VISUAL_FX_RACK);
    expect(created.fx).not.toBe(fixture.fx);
  });
});
