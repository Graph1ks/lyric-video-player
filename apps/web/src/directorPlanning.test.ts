import { describe, expect, it } from "vitest";
import { formatDirectorTime, parseDirectorTime, sortDirectorCues } from "./directorPlanning";

describe("Director planning helpers", () => {
  it("formats and parses director cue time", () => {
    expect(formatDirectorTime(84.5)).toBe("01:24.500");
    expect(parseDirectorTime("01:24.500")).toBeCloseTo(84.5);
    expect(parseDirectorTime("84.5")).toBeCloseTo(84.5);
  });

  it("sorts cue drafts by timestamp without mutating input", () => {
    const cues = [
      { id: "b", at: 9, label: "B", trackLabel: "Track", snapshot: {} as never },
      { id: "a", at: 3, label: "A", trackLabel: "Track", snapshot: {} as never },
    ];
    const sorted = sortDirectorCues(cues);
    expect(sorted.map(cue => cue.id)).toEqual(["a", "b"]);
    expect(cues.map(cue => cue.id)).toEqual(["b", "a"]);
  });
});
