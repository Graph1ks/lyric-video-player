import { describe, expect, it } from "vitest";
import {
  BUILTIN_PERFORMANCE_PRESETS,
  clonePerformancePreset,
  defaultPerformancePresets,
} from "./performancePresets";

describe("Director performance preset library", () => {
  it("covers the complete emotion vocabulary with deliberate AUTO pools", () => {
    const emotions = new Set(BUILTIN_PERFORMANCE_PRESETS.map(item => item.emotion.toLowerCase()));
    for (const emotion of ["tender", "heartbreak", "longing", "euphoria", "rage", "dream", "tension", "calm"]) {
      expect(emotions.has(emotion)).toBe(true);
    }

    for (const preset of BUILTIN_PERFORMANCE_PRESETS) {
      expect(preset.auto.scenes?.length).toBeGreaterThan(0);
      expect(preset.auto.typographyPresets?.length).toBeGreaterThan(0);
      expect(preset.auto.sequences?.length).toBeGreaterThan(0);
      expect(preset.auto.layouts?.length).toBeGreaterThan(0);
      expect(preset.auto.motions?.length).toBeGreaterThan(0);
      expect(preset.auto.backgrounds?.length).toBeGreaterThan(0);
      expect(preset.auto.harmonies?.length).toBeGreaterThan(0);
      expect(preset.auto.moods?.length).toBeGreaterThan(0);
      expect(preset.auto.canvases?.length).toBeGreaterThan(0);
    }
  });

  it("deep-clones editable pools so one preset edit cannot mutate the authored baseline", () => {
    const [authored] = BUILTIN_PERFORMANCE_PRESETS;
    const cloned = clonePerformancePreset(authored);
    cloned.auto.scenes?.splice(0, 1);
    expect(cloned.auto.scenes).not.toEqual(authored.auto.scenes);

    const defaults = defaultPerformancePresets();
    expect(defaults[0]).not.toBe(BUILTIN_PERFORMANCE_PRESETS[0]);
    expect(defaults[0].auto.scenes).not.toBe(BUILTIN_PERFORMANCE_PRESETS[0].auto.scenes);
  });
});
