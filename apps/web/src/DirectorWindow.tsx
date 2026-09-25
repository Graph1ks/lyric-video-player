import { useEffect, useMemo, useState } from "react";
import { VisualDirector } from "./VisualDirector";
import { sendDirectorCommand } from "./directorSync";
import { formatDirectorTime, parseDirectorTime } from "./directorPlanning";
import { copy } from "./directorI18n";
import { useUiStore } from "./store";

export function DirectorWindow() {
  const [view, setView] = useState<"live" | "plan">("live");
  const [cueLabel, setCueLabel] = useState("");
  const [cueTime, setCueTime] = useState("00:00.000");
  const [clearArmed, setClearArmed] = useState(false);

  const language = useUiStore(state => state.uiLanguage);
  const t = (en: string, de: string) => copy(language, en, de);
  const title = useUiStore(state => state.directorTrackTitle);
  const meta = useUiStore(state => state.directorTrackMeta);
  const playing = useUiStore(state => state.directorPlaying);
  const muted = useUiStore(state => state.directorMuted);
  const volume = useUiStore(state => state.directorVolume);
  const playback = useUiStore(state => state.directorPlaybackSeconds);
  const duration = useUiStore(state => state.directorDurationSeconds);
  const cues = useUiStore(state => state.directorCues);
  const addCue = useUiStore(state => state.addDirectorCue);
  const removeCue = useUiStore(state => state.removeDirectorCue);
  const clearCues = useUiStore(state => state.clearDirectorCues);
  const applyCue = useUiStore(state => state.applyDirectorCue);

  useEffect(() => {
    document.title = "E-MO Visual Director";
    sendDirectorCommand({ kind: "presence", open: true });
    const close = () => sendDirectorCommand({ kind: "presence", open: false });
    window.addEventListener("beforeunload", close);
    return () => {
      window.removeEventListener("beforeunload", close);
      close();
    };
  }, []);

  useEffect(() => {
    if (view === "plan") setCueTime(formatDirectorTime(playback));
  }, [view]);

  const trackProgress = duration > 0 ? Math.max(0, Math.min(1, playback / duration)) : 0;
  const sortedCues = useMemo(() => [...cues].sort((a, b) => a.at - b.at), [cues]);

  function captureCue() {
    addCue(parseDirectorTime(cueTime), cueLabel);
    setCueLabel("");
  }

  function confirmClear() {
    if (!clearArmed) {
      setClearArmed(true);
      window.setTimeout(() => setClearArmed(false), 2200);
      return;
    }
    clearCues();
    setClearArmed(false);
  }

  return (
    <main className="director-window-shell">
      <header className="director-window-topbar">
        <div className="director-window-brand">
          <span>E</span>
          <div>
            <b>E-MO DIRECTOR</b>
            <small>{t("SECOND-SCREEN VISUAL CONTROL", "VISUELLE REGIE AUF ZWEITEM BILDSCHIRM")}</small>
          </div>
        </div>

        <div className="director-window-track director-window-transport">
          <button
            className="director-transport-play"
            onClick={() => sendDirectorCommand({ kind: "toggle-play" })}
            aria-label={playing ? t("Pause", "Pause") : t("Play", "Abspielen")}
          >
            {playing ? "❚❚" : "▶"}
          </button>
          <button
            className="director-transport-step"
            onClick={() => sendDirectorCommand({ kind: "seek-relative", seconds: -5 })}
            aria-label={t("Back 5 seconds", "5 Sekunden zurück")}
          >−5</button>
          <div className="director-window-track__meta">
            <span className={playing ? "is-live" : ""}><i /> {playing ? "LIVE" : t("READY", "BEREIT")}</span>
            <div>
              <b>{title}</b>
              <small>{meta || t("Waiting for main player", "Warte auf Hauptplayer")}</small>
            </div>
          </div>
          <div className="director-window-timeline">
            <input
              type="range"
              min="0"
              max={Math.max(0.001, duration)}
              step="0.01"
              value={Math.min(playback, Math.max(0.001, duration))}
              aria-label={t("Playback position", "Wiedergabeposition")}
              onChange={event => sendDirectorCommand({ kind: "seek", seconds: Number(event.target.value) })}
            />
            <time>{formatDirectorTime(playback)} / {formatDirectorTime(duration)}</time>
          </div>
          <button
            className="director-transport-step"
            onClick={() => sendDirectorCommand({ kind: "seek-relative", seconds: 5 })}
            aria-label={t("Forward 5 seconds", "5 Sekunden vor")}
          >+5</button>
          <button
            className={`director-transport-mute ${muted ? "is-active" : ""}`}
            onClick={() => sendDirectorCommand({ kind: "toggle-mute" })}
          >{muted ? t("MUTED", "STUMM") : t("VOL", "LAUT")}</button>
          <input
            className="director-transport-volume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            aria-label={t("Volume", "Lautstärke")}
            onChange={event => sendDirectorCommand({ kind: "set-volume", volume: Number(event.target.value) })}
          />
        </div>

        <div className="director-window-actions">
          <label className="director-window-file">AUDIO<input type="file" accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,.mp3,.m4a,.aac" onChange={event => {
            const file = event.target.files?.[0];
            if (file) sendDirectorCommand({ kind: "load-audio", file });
            event.currentTarget.value = "";
          }} /></label>
          <label className="director-window-file">LRC<input type="file" accept=".lrc,text/plain" onChange={event => {
            const file = event.target.files?.[0];
            if (file) sendDirectorCommand({ kind: "load-lyrics", file });
            event.currentTarget.value = "";
          }} /></label>
          <button onClick={() => sendDirectorCommand({ kind: "toggle-fullscreen" })}>{t("PLAYER", "PLAYER")} ⛶</button>
          <button className={view === "live" ? "is-active" : ""} onClick={() => setView("live")}>LIVE</button>
          <button className={view === "plan" ? "is-active" : ""} onClick={() => setView("plan")}>PLAN</button>
          <button onClick={() => window.close()} title={t("Close Director window", "Director-Fenster schließen")}>×</button>
        </div>
      </header>

      <div className="director-window-progress"><i style={{ transform: `scaleX(${trackProgress})` }} /></div>

      {view === "live" ? (
        <div className="director-window-live">
          <VisualDirector variant="window" />
        </div>
      ) : (
        <div className="director-planner">
          <section className="director-planner__composer">
            <div className="planner-kicker">{t("CUE PLAN / SESSION DRAFT", "CUE-PLAN / SESSION-ENTWURF")}</div>
            <h1>{t("Pre-plan the visual performance.", "Plane die visuelle Performance vor.")}</h1>
            <p>
              {t(
                "Capture the complete current look at a timestamp. APPLY recalls it live in both windows. Cue execution and per-song persistence will attach to the project/playlist scene format instead of creating a competing save format here.",
                "Speichere den kompletten aktuellen Look an einem Zeitpunkt. ANWENDEN ruft ihn live in beiden Fenstern ab. Automatische Cue-Ausführung und Song-Persistenz werden an das Projekt-/Playlist-Szenenformat angebunden, statt hier ein zweites Speicherformat zu erfinden.",
              )}
            </p>

            <div className="planner-capture">
              <label>
                <span>{t("CUE NAME", "CUE-NAME")}</span>
                <input
                  value={cueLabel}
                  onChange={event => setCueLabel(event.target.value)}
                  placeholder={`Cue ${cues.length + 1}`}
                />
              </label>
              <label>
                <span>{t("AT", "ZEIT")}</span>
                <input
                  value={cueTime}
                  onChange={event => setCueTime(event.target.value)}
                  placeholder="01:24.500"
                />
              </label>
              <button onClick={() => setCueTime(formatDirectorTime(playback))}>
                {t("USE LIVE TIME", "LIVE-ZEIT ÜBERNEHMEN")}
              </button>
              <button className="is-primary" onClick={captureCue}>
                {t("CAPTURE LOOK", "LOOK SPEICHERN")}
              </button>
            </div>

            <div className="planner-track">
              <div className="planner-track__head">
                <span>{title}</span>
                <b>{cues.length} CUES</b>
              </div>
              <div className="planner-track__rail">
                <i className="planner-playhead" style={{ left: `${trackProgress * 100}%` }} />
                {duration > 0 && sortedCues.map(cue => (
                  <button
                    key={cue.id}
                    className="planner-marker"
                    style={{ left: `${Math.max(0, Math.min(100, cue.at / duration * 100))}%` }}
                    title={`${formatDirectorTime(cue.at)} · ${cue.label}`}
                    onClick={() => applyCue(cue.id)}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="director-cue-list">
            <div className="director-cue-list__head">
              <div>
                <span>{t("PLANNED LOOKS", "GEPLANTE LOOKS")}</span>
                <b>{t("Recall deck", "Recall-Deck")}</b>
              </div>
              {cues.length > 0 && (
                <button className={clearArmed ? "is-danger" : ""} onClick={confirmClear}>
                  {clearArmed ? t("CONFIRM CLEAR", "LÖSCHEN BESTÄTIGEN") : t("CLEAR PLAN", "PLAN LEEREN")}
                </button>
              )}
            </div>

            <div className="director-cues">
              {sortedCues.map((cue, index) => (
                <article className="director-cue" key={cue.id}>
                  <div className="director-cue__index">{String(index + 1).padStart(2, "0")}</div>
                  <div className="director-cue__copy">
                    <div>
                      <time>{formatDirectorTime(cue.at)}</time>
                      <b>{cue.label}</b>
                    </div>
                    <p>
                      {cue.snapshot.mode.toUpperCase()} · {cue.snapshot.typographyPreset.toUpperCase()} ·
                      {" "}{cue.snapshot.typographySequence.replaceAll("-", " ").toUpperCase()} ·
                      {" "}{cue.snapshot.typographyLayout.replaceAll("-", " ").toUpperCase()}
                    </p>
                    <small>
                      {cue.snapshot.compositionMotion.replaceAll("-", " ")} / {cue.snapshot.backgroundPreset} /
                      {" "}{cue.snapshot.colorMood} / {cue.snapshot.colorCanvas}
                    </small>
                  </div>
                  <div className="director-cue__actions">
                    <button onClick={() => applyCue(cue.id)}>{t("APPLY", "ANWENDEN")}</button>
                    <button onClick={() => removeCue(cue.id)}>{t("DELETE", "LÖSCHEN")}</button>
                  </div>
                </article>
              ))}
              {!sortedCues.length && (
                <div className="director-cues-empty">
                  <span>{t("NO CUES YET", "NOCH KEINE CUES")}</span>
                  <b>{t("Build a look in LIVE, then capture it here.", "Baue den Look in LIVE und speichere ihn anschließend hier.")}</b>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
