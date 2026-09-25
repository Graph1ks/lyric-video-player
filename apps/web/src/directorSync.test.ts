import { describe, expect, it } from "vitest";
import { diffDirectorSharedState } from "./directorSync";
import { directorSharedState, useUiStore } from "./store";

describe("Director cross-window delta sync", () => {
  it("sends only changed telemetry fields instead of the complete shared state", () => {
    const previous = directorSharedState(useUiStore.getState());
    useUiStore.getState().setDirectorPlayback(12.5, 180);
    useUiStore.getState().setDirectorAudioBands({ bass: 0.4, mid: 0.3, treble: 0.2 });
    const next = directorSharedState(useUiStore.getState());

    const patch = diffDirectorSharedState(previous, next);
    expect(patch.directorPlaybackSeconds).toBe(12.5);
    expect(patch.directorDurationSeconds).toBe(180);
    expect(patch.directorAudioBands).toEqual({ bass: 0.4, mid: 0.3, treble: 0.2 });
    expect("lowerThirdArtistImage" in patch).toBe(false);
    expect("directorCues" in patch).toBe(false);
  });

  it("transmits an artist image only when that image changes", () => {
    useUiStore.getState().setLowerThirdArtistImage("");
    const previous = directorSharedState(useUiStore.getState());
    useUiStore.getState().setLowerThirdArtistImage("data:image/png;base64,TEST");
    const next = directorSharedState(useUiStore.getState());
    const patch = diffDirectorSharedState(previous, next);

    expect(patch.lowerThirdArtistImage).toBe("data:image/png;base64,TEST");
  });
});
