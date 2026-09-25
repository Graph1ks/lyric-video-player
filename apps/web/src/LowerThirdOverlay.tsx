import { useEffect, useState } from "react";
import { resolveLowerThirdPreset, shouldShowLowerThird } from "./lowerThirds";
import { useUiStore } from "./store";

export function LowerThirdOverlay() {
  const mode = useUiStore(state => state.lowerThirdMode);
  const requestedPreset = useUiStore(state => state.lowerThirdPreset);
  const artistOverride = useUiStore(state => state.lowerThirdArtistOverride);
  const titleOverride = useUiStore(state => state.lowerThirdTitleOverride);
  const artistImage = useUiStore(state => state.lowerThirdArtistImage);
  const previewUntil = useUiStore(state => state.lowerThirdPreviewUntil);
  const playback = useUiStore(state => state.directorPlaybackSeconds);
  const artist = useUiStore(state => state.directorArtist);
  const title = useUiStore(state => state.directorTrackTitle);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (previewUntil <= Date.now()) return;
    const timer = window.setInterval(() => setNow(Date.now()), 180);
    return () => window.clearInterval(timer);
  }, [previewUntil]);

  const visible = shouldShowLowerThird(mode, playback, previewUntil, now);
  const preset = resolveLowerThirdPreset(requestedPreset, playback);
  const displayArtist = artistOverride.trim() || artist || "ARTIST";
  const displayTitle = titleOverride.trim() || title || "TRACK";

  return (
    <div
      className={`lower-third lower-third--${preset} ${visible ? "is-visible" : ""}`}
      data-lower-third={preset}
      aria-hidden={!visible}
    >
      <div className="lower-third__safe">
        <div className="lower-third__plate">
          {artistImage && (
            <div className="lower-third__image">
              <img src={artistImage} alt="" />
            </div>
          )}
          <div className="lower-third__accent" />
          <div className="lower-third__copy">
            <span className="lower-third__artist">{displayArtist}</span>
            <strong className="lower-third__title">{displayTitle}</strong>
          </div>
          <div className="lower-third__rule" />
        </div>
      </div>
    </div>
  );
}
