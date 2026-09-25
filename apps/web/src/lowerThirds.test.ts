import { describe, expect, it } from "vitest";
import {
  resolveLowerThirdPreset,
  shouldShowLowerThird,
} from "./lowerThirds";

describe("Lower Third scheduling", () => {
  it("shows intro mode only during the opening window", () => {
    expect(shouldShowLowerThird("intro", 2, 0, 100)).toBe(true);
    expect(shouldShowLowerThird("intro", 8.01, 0, 100)).toBe(false);
  });

  it("rotates on a bounded recurring window", () => {
    expect(shouldShowLowerThird("rotate", 46, 0, 100)).toBe(true);
    expect(shouldShowLowerThird("rotate", 53, 0, 100)).toBe(false);
  });

  it("preview overrides an off schedule temporarily", () => {
    expect(shouldShowLowerThird("off", 100, 2_000, 1_500)).toBe(true);
    expect(shouldShowLowerThird("off", 100, 1_000, 1_500)).toBe(false);
  });

  it("auto style changes only on the 45-second presentation chapter", () => {
    const a = resolveLowerThirdPreset("auto", 10);
    const b = resolveLowerThirdPreset("auto", 44.9);
    const c = resolveLowerThirdPreset("auto", 45.1);
    expect(a).toBe(b);
    expect(c).not.toBe(a);
  });
});
