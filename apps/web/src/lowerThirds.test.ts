import { describe, expect, it } from "vitest";
import {
  resolveLowerThirdPreset,
  shouldShowLowerThird,
} from "./lowerThirds";

function visible(overrides: Partial<Parameters<typeof shouldShowLowerThird>[0]> = {}) {
  return shouldShowLowerThird({
    mode: "scheduled",
    playbackSeconds: 0,
    trackDurationSeconds: 180,
    manualUntil: 0,
    startSeconds: 10,
    visibleSeconds: 8,
    outroEnabled: false,
    outroLeadSeconds: 10,
    now: 1_000,
    ...overrides,
  });
}

describe("Lower Third scheduling", () => {
  it("shows scheduled mode only during its configured opening window", () => {
    expect(visible({ playbackSeconds: 9.99 })).toBe(false);
    expect(visible({ playbackSeconds: 10 })).toBe(true);
    expect(visible({ playbackSeconds: 17.99 })).toBe(true);
    expect(visible({ playbackSeconds: 18 })).toBe(false);
  });

  it("can stay permanently visible", () => {
    expect(visible({ mode: "always", playbackSeconds: 0 })).toBe(true);
    expect(visible({ mode: "always", playbackSeconds: 175 })).toBe(true);
  });

  it("can trigger a second configured window before the song ends", () => {
    expect(visible({
      playbackSeconds: 169.99,
      outroEnabled: true,
      outroLeadSeconds: 10,
    })).toBe(false);
    expect(visible({
      playbackSeconds: 170,
      outroEnabled: true,
      outroLeadSeconds: 10,
    })).toBe(true);
    expect(visible({
      playbackSeconds: 177.99,
      outroEnabled: true,
      outroLeadSeconds: 10,
    })).toBe(true);
    expect(visible({
      playbackSeconds: 178,
      outroEnabled: true,
      outroLeadSeconds: 10,
    })).toBe(false);
  });

  it("manual Director trigger overrides an off schedule temporarily", () => {
    expect(visible({
      mode: "off",
      playbackSeconds: 100,
      manualUntil: 2_000,
      now: 1_500,
    })).toBe(true);
    expect(visible({
      mode: "off",
      playbackSeconds: 100,
      manualUntil: 1_000,
      now: 1_500,
    })).toBe(false);
  });

  it("auto style changes only on the 45-second presentation chapter", () => {
    const a = resolveLowerThirdPreset("auto", 10);
    const b = resolveLowerThirdPreset("auto", 44.9);
    const c = resolveLowerThirdPreset("auto", 45.1);
    expect(a).toBe(b);
    expect(c).not.toBe(a);
  });
});
