import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProjectDescriptor } from "@graph1ks/emo-app-contracts";
import { AudioEngine, HtmlAudioClock } from "@graph1ks/emo-audio-web";
import {
  ELRCParser,
  SCENE_LABELS,
  hexColorToCss,
  type BackgroundPreset,
  type BackgroundPresetId,
  type ColorHarmonyId,
  type ColorHarmonyMode,
  type ParsedLyrics,
  type QualityMode,
  type SceneMode,
  type TypographyLayoutId,
  type TypographyLayoutPreset,
  type TypographyPreset,
  type TypographyPresetId,
  type VisualMode,
  type VisualPalette,
} from "@graph1ks/emo-engine-core";
import {
  classifyDroppedFiles,
  fetchProjectLyrics,
  fetchProjects,
  fetchRuntimeInfo,
  projectAssetUrl,
} from "@graph1ks/emo-platform-web";
import { EngineRenderer } from "@graph1ks/emo-renderer-pixi";
import { useUiStore } from "./store";

const EMPTY_LYRICS: ParsedLyrics = { offsetMs: 0, lines: [], meta: {} };

const TYPOGRAPHY_PRESETS: TypographyPreset[] = [
  "auto",
  "impact",
  "cascade",
  "wave",
  "scatter",
  "elastic",
  "outline",
  "tunnel",
  "glitch",
];

const TYPOGRAPHY_LAYOUTS: TypographyLayoutPreset[] = [
  "auto",
  "center-stack",
  "directional-stage",
  "editorial",
  "vertical-accent",
  "split-stage",
  "crossword",
];

const COLOR_HARMONIES: ColorHarmonyMode[] = [
  "auto",
  "split-complement",
  "analogous",
  "complement",
  "triad",
  "tetrad",
  "monochrome",
];

const BACKGROUND_PRESETS: BackgroundPreset[] = [
  "auto",
  "cinematic",
  "nebula",
  "grid",
  "starfield",
  "rays",
  "vortex",
  "liquid",
  "spectrum",
  "sparks",
  "lyrics",
  "minimal",
];

export function App() {
  const queryClient = useQueryClient();
  const shellRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const seekRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef<HTMLDivElement>(null);
  const bassRef = useRef<HTMLElement>(null);
  const midRef = useRef<HTMLElement>(null);
  const trebleRef = useRef<HTMLElement>(null);
  const rendererRef = useRef<EngineRenderer | null>(null);
  const audioRef = useRef(new AudioEngine());
  const clockRef = useRef<HtmlAudioClock | null>(null);
  const parserRef = useRef(new ELRCParser());
  const lyricsRef = useRef<ParsedLyrics>(EMPTY_LYRICS);
  const syncRef = useRef(0);
  const seekingRef = useRef(false);
  const dragDepthRef = useRef(0);
  const audioNameRef = useRef("");
  const lyricsNameRef = useRef("");

  const hudVisible = useUiStore(state => state.hudVisible);
  const mode = useUiStore(state => state.mode);
  const intensity = useUiStore(state => state.intensity);
  const quality = useUiStore(state => state.quality);
  const typographyPreset = useUiStore(state => state.typographyPreset);
  const typographyLayout = useUiStore(state => state.typographyLayout);
  const backgroundPreset = useUiStore(state => state.backgroundPreset);
  const colorHarmony = useUiStore(state => state.colorHarmony);
  const syncMs = useUiStore(state => state.syncMs);
  const projectDrawerOpen = useUiStore(state => state.projectDrawerOpen);
  const setHudVisible = useUiStore(state => state.setHudVisible);
  const setMode = useUiStore(state => state.setMode);
  const setIntensity = useUiStore(state => state.setIntensity);
  const setQuality = useUiStore(state => state.setQuality);
  const setTypographyPreset = useUiStore(state => state.setTypographyPreset);
  const setTypographyLayout = useUiStore(state => state.setTypographyLayout);
  const setBackgroundPreset = useUiStore(state => state.setBackgroundPreset);
  const setColorHarmony = useUiStore(state => state.setColorHarmony);
  const setSyncMs = useUiStore(state => state.setSyncMs);
  const setProjectDrawerOpen = useUiStore(state => state.setProjectDrawerOpen);

  const [engineStatus, setEngineStatus] = useState("ENGINE READY");
  const [activeScene, setActiveScene] = useState<SceneMode>("neon");
  const [activeTypography, setActiveTypography] = useState<TypographyPresetId>("elastic");
  const [activeLayout, setActiveLayout] = useState<TypographyLayoutId>("directional-stage");
  const [activeBackground, setActiveBackground] = useState<BackgroundPresetId>("nebula");
  const [activeHarmony, setActiveHarmony] = useState<ColorHarmonyId>("split-complement");
  const [activePalette, setActivePalette] = useState<VisualPalette | null>(null);
  const [hasContent, setHasContent] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [trackTitle, setTrackTitle] = useState("NO TRACK LOADED");
  const [trackMeta, setTrackMeta] = useState("Load an audio file + Enhanced LRC");
  const [dropVisible, setDropVisible] = useState(false);

  const runtimeQuery = useQuery({
    queryKey: ["runtime"],
    queryFn: fetchRuntimeInfo,
    retry: false,
  });

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
    retry: false,
    enabled: runtimeQuery.isSuccess,
  });

  const runtimeMode = runtimeQuery.data?.capabilities.mode;
  const projects = projectsQuery.data?.projects ?? [];
  const canChooseDirectory = runtimeQuery.data?.capabilities.canChooseDirectory && Boolean(window.emoDesktop);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const audio = audioRef.current;
    const renderer = new EngineRenderer();
    const clock = new HtmlAudioClock(audio.element);
    rendererRef.current = renderer;
    clockRef.current = clock;
    let disposed = false;

    const offMode = renderer.onModeChange(scene => {
      if (!disposed) setActiveScene(scene);
    });
    const offTypography = renderer.onTypographyPresetChange(preset => {
      if (!disposed) setActiveTypography(preset);
    });
    const offLayout = renderer.onTypographyLayoutChange(layout => {
      if (!disposed) setActiveLayout(layout);
    });
    const offBackground = renderer.onBackgroundPresetChange(preset => {
      if (!disposed) setActiveBackground(preset);
    });
    const offPalette = renderer.onPaletteChange(palette => {
      if (disposed) return;
      setActiveHarmony(palette.resolvedHarmony);
      setActivePalette(palette);
    });

    const offTick = clock.onTick(time => {
      if (disposed) return;
      const bands = audio.bands();
      const spectrum = audio.spectrum(64);
      const lyricTime = time + syncRef.current / 1000;
      const lyrics = lyricsRef.current;
      const index = activeLineIndex(lyrics, lyricTime);

      renderer.setLine(index >= 0 ? lyrics.lines[index] : undefined, index);
      renderer.update(time, bands, lyricTime, spectrum);

      const shell = shellRef.current;
      if (shell) {
        shell.style.setProperty("--bass", bands.bass.toFixed(3));
        shell.style.setProperty("--energy", bands.energy.toFixed(3));
        shell.style.setProperty("--transient", bands.transient.toFixed(3));
      }
      if (bassRef.current) bassRef.current.style.transform = `scaleY(${Math.max(0.04, bands.bass)})`;
      if (midRef.current) midRef.current.style.transform = `scaleY(${Math.max(0.04, bands.mid)})`;
      if (trebleRef.current) trebleRef.current.style.transform = `scaleY(${Math.max(0.04, bands.treble)})`;
      if (seekRef.current && !seekingRef.current && clock.duration) {
        seekRef.current.value = String(Math.round((time / clock.duration) * 1000));
      }
      if (timeRef.current) timeRef.current.textContent = `${fmt(time)} / ${fmt(clock.duration)}`;
    });

    const onPlay = () => {
      setPlaying(true);
      setEngineStatus("PLAYING LIVE");
    };
    const onPause = () => {
      setPlaying(false);
      setEngineStatus(audio.hasSource ? "PAUSED" : "ENGINE READY");
    };
    const onEnded = () => {
      setPlaying(false);
      setEngineStatus("ENDED");
    };

    audio.element.addEventListener("play", onPlay);
    audio.element.addEventListener("pause", onPause);
    audio.element.addEventListener("ended", onEnded);

    void renderer.init(stage).then(() => {
      if (disposed) return;
      renderer.setVisualMode(useUiStore.getState().mode);
      renderer.setTypographyPreset(useUiStore.getState().typographyPreset);
      renderer.setTypographyLayout(useUiStore.getState().typographyLayout);
      renderer.setBackgroundPreset(useUiStore.getState().backgroundPreset);
      renderer.setColorHarmony(useUiStore.getState().colorHarmony);
      renderer.setIntensity(useUiStore.getState().intensity);
      renderer.setQuality(useUiStore.getState().quality);
      clock.start();
    });

    return () => {
      disposed = true;
      clock.stop();
      offTick();
      offMode();
      offTypography();
      offLayout();
      offBackground();
      offPalette();
      audio.element.removeEventListener("play", onPlay);
      audio.element.removeEventListener("pause", onPause);
      audio.element.removeEventListener("ended", onEnded);
      rendererRef.current = null;
      clockRef.current = null;
      stage.replaceChildren();
    };
  }, []);

  useEffect(() => {
    syncRef.current = syncMs;
  }, [syncMs]);

  useEffect(() => {
    rendererRef.current?.setVisualMode(mode);
  }, [mode]);

  useEffect(() => {
    rendererRef.current?.setTypographyPreset(typographyPreset);
  }, [typographyPreset]);

  useEffect(() => {
    rendererRef.current?.setTypographyLayout(typographyLayout);
  }, [typographyLayout]);

  useEffect(() => {
    rendererRef.current?.setBackgroundPreset(backgroundPreset);
  }, [backgroundPreset]);

  useEffect(() => {
    rendererRef.current?.setColorHarmony(colorHarmony);
  }, [colorHarmony]);

  useEffect(() => {
    rendererRef.current?.setIntensity(intensity);
  }, [intensity]);

  useEffect(() => {
    rendererRef.current?.setQuality(quality);
  }, [quality]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.code === "KeyH") {
        event.preventDefault();
        setHudVisible(!useUiStore.getState().hudVisible);
        return;
      }
      if (isTextControl(event.target)) return;

      if (event.code === "Space") {
        event.preventDefault();
        void togglePlay();
      } else if (event.code === "KeyF") {
        event.preventDefault();
        void toggleFullscreen();
      } else if (event.code === "KeyM") {
        event.preventDefault();
        toggleMute();
      } else if (event.code === "ArrowLeft") {
        event.preventDefault();
        const clock = clockRef.current;
        if (clock) clock.seek(clock.time - (event.shiftKey ? 15 : 5));
      } else if (event.code === "ArrowRight") {
        event.preventDefault();
        const clock = clockRef.current;
        if (clock) clock.seek(clock.time + (event.shiftKey ? 15 : 5));
      } else if (event.code === "Escape" && !useUiStore.getState().hudVisible) {
        setHudVisible(true);
      } else if (event.code === "Digit0") setMode("auto");
      else if (event.code === "Digit1") setMode("poster");
      else if (event.code === "Digit2") setMode("neon");
      else if (event.code === "Digit3") setMode("vortex");
      else if (event.code === "KeyT") {
        const current = useUiStore.getState().typographyPreset;
        const index = TYPOGRAPHY_PRESETS.indexOf(current);
        setTypographyPreset(TYPOGRAPHY_PRESETS[(index + 1) % TYPOGRAPHY_PRESETS.length]);
      } else if (event.code === "KeyL") {
        const current = useUiStore.getState().typographyLayout;
        const index = TYPOGRAPHY_LAYOUTS.indexOf(current);
        setTypographyLayout(TYPOGRAPHY_LAYOUTS[(index + 1) % TYPOGRAPHY_LAYOUTS.length]);
      } else if (event.code === "KeyB") {
        const current = useUiStore.getState().backgroundPreset;
        const index = BACKGROUND_PRESETS.indexOf(current);
        setBackgroundPreset(BACKGROUND_PRESETS[(index + 1) % BACKGROUND_PRESETS.length]);
      } else if (event.code === "KeyC") {
        const current = useUiStore.getState().colorHarmony;
        const index = COLOR_HARMONIES.indexOf(current);
        setColorHarmony(COLOR_HARMONIES[(index + 1) % COLOR_HARMONIES.length]);
      } else if (event.code === "Comma") adjustSync(-50);
      else if (event.code === "Period") adjustSync(50);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setBackgroundPreset, setColorHarmony, setHudVisible, setMode, setSyncMs, setTypographyLayout, setTypographyPreset]);

  useEffect(() => {
    const onDragEnter = (event: DragEvent) => {
      event.preventDefault();
      dragDepthRef.current += 1;
      setDropVisible(true);
    };
    const onDragOver = (event: DragEvent) => event.preventDefault();
    const onDragLeave = (event: DragEvent) => {
      event.preventDefault();
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) setDropVisible(false);
    };
    const onDrop = (event: DragEvent) => {
      event.preventDefault();
      dragDepthRef.current = 0;
      setDropVisible(false);
      const found = classifyDroppedFiles(event.dataTransfer?.files ?? []);
      if (found.audio) void loadAudioFile(found.audio);
      if (found.lyrics) void loadLyricsFile(found.lyrics);
    };
    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, []);

  const projectSummary = useMemo(() => {
    if (!runtimeQuery.data) return undefined;
    const label = projectsQuery.data?.rootLabel || runtimeQuery.data.rootLabel;
    return `${runtimeQuery.data.capabilities.mode.toUpperCase()} · ${label}`;
  }, [runtimeQuery.data, projectsQuery.data]);

  async function togglePlay() {
    await audioRef.current.toggle();
  }

  function toggleMute() {
    const isMuted = audioRef.current.toggleMute();
    setMuted(isMuted || audioRef.current.volume < 0.001);
  }

  async function toggleFullscreen() {
    const shell = shellRef.current;
    if (!shell) return;
    try {
      if (!document.fullscreenElement) await shell.requestFullscreen();
      else await document.exitFullscreen();
    } catch (error) {
      console.warn("Fullscreen unavailable", error);
    }
  }

  function adjustSync(delta: number) {
    const next = Math.max(-1500, Math.min(1500, Math.round((useUiStore.getState().syncMs + delta) / 10) * 10));
    setSyncMs(next);
  }

  function seekTo(value: string) {
    const clock = clockRef.current;
    if (!clock?.duration) return;
    clock.seek((Number(value) / 1000) * clock.duration);
  }

  function updateTrackMeta() {
    const lyrics = lyricsRef.current;
    const title = lyrics.meta.title?.trim() || audioNameRef.current.replace(/\.[^.]+$/, "") || "TRACK LOADED";
    const parts = [
      lyrics.meta.artist?.trim(),
      lyricsNameRef.current ? `${lyrics.lines.length} lyric cues` : undefined,
      audioNameRef.current ? audioNameRef.current.split(".").pop()?.toUpperCase() : undefined,
    ].filter(Boolean);
    setTrackTitle(title);
    setTrackMeta(parts.join(" · ") || "Ready");
  }

  async function loadAudioFile(file: File) {
    setEngineStatus("LOADING AUDIO");
    try {
      await audioRef.current.load(file);
      audioNameRef.current = file.name;
      setHasContent(true);
      setEngineStatus("AUDIO READY");
      updateTrackMeta();
    } catch (error) {
      console.error(error);
      setEngineStatus("AUDIO ERROR");
    }
  }

  async function loadLyricsFile(file: File) {
    try {
      const parsed = parserRef.current.parse(await file.text());
      lyricsRef.current = parsed;
      lyricsNameRef.current = file.name;
      rendererRef.current?.setLyrics(parsed.lines);
      setHasContent(true);
      setEngineStatus(`${parsed.lines.length} CUES READY`);
      updateTrackMeta();
    } catch (error) {
      console.error(error);
      setEngineStatus("LRC ERROR");
    }
  }

  async function loadProject(project: ProjectDescriptor) {
    if (!project.audio || !project.lyrics) return;
    setEngineStatus("LOADING PROJECT");
    try {
      const [lyricText] = await Promise.all([
        fetchProjectLyrics(project),
        audioRef.current.loadUrl(projectAssetUrl(project.id, project.audio.id)),
      ]);
      const parsed = parserRef.current.parse(lyricText);
      lyricsRef.current = parsed;
      audioNameRef.current = project.audio.fileName;
      lyricsNameRef.current = project.lyrics.fileName;

      const defaults = project.manifest?.defaults;
      if (defaults?.visualMode !== undefined) setMode(defaults.visualMode);
      if (defaults?.intensity !== undefined) setIntensity(defaults.intensity);
      if (defaults?.quality !== undefined) setQuality(defaults.quality);
      if (defaults?.typographyPreset !== undefined) setTypographyPreset(defaults.typographyPreset);
      if (defaults?.typographyLayout !== undefined) setTypographyLayout(defaults.typographyLayout);
      if (defaults?.backgroundPreset !== undefined) setBackgroundPreset(defaults.backgroundPreset);
      if (defaults?.colorHarmony !== undefined) setColorHarmony(defaults.colorHarmony);
      if (defaults?.syncMs !== undefined) {
        syncRef.current = defaults.syncMs;
        setSyncMs(defaults.syncMs);
      }

      rendererRef.current?.setLyrics(parsed.lines);
      setHasContent(true);
      updateTrackMeta();
      setEngineStatus(`${parsed.lines.length} CUES READY`);
      setProjectDrawerOpen(false);
    } catch (error) {
      console.error(error);
      setEngineStatus("PROJECT ERROR");
    }
  }

  async function chooseProjectRoot() {
    if (!window.emoDesktop) return;
    const result = await window.emoDesktop.chooseProjectRoot();
    if (!result) return;
    queryClient.setQueryData(["projects"], result);
    await queryClient.invalidateQueries({ queryKey: ["runtime"] });
    setProjectDrawerOpen(true);
  }

  return (
    <main
      ref={shellRef}
      className={`shell ${hudVisible ? "" : "ui-hidden"}`}
      data-ui-visible={hudVisible}
      data-scene={activeScene}
    >
      <div ref={stageRef} id="stage" aria-label="Realtime lyric rendering stage" />
      <div className="screen-fx" aria-hidden="true">
        <div className="screen-fx__bloom" />
        <div className="screen-fx__scanlines" />
        <div className="screen-fx__grain" />
        <div className="screen-fx__vignette" />
      </div>

      <div className={`drop-overlay ${dropVisible ? "is-visible" : ""}`} aria-hidden={!dropVisible}>
        <div className="drop-card">
          <span className="drop-kicker">E-MO-ENGINE INGEST</span>
          <strong>DROP AUDIO + ENHANCED LRC</strong>
          <span>MP3 · M4A · AAC · LRC</span>
        </div>
      </div>

      <div className="ui-layer">
        <header className="topbar glass-panel">
          <div className="brand-lockup">
            <div className="brand-mark">E</div>
            <div>
              <div className="brand">E-MO-ENGINE</div>
              <div className="brand-sub">EXTENSIVE MOTION ENGINE FOR ENHANCED LRC · v0.7 ALPHA</div>
            </div>
          </div>
          <div className="top-actions">
            {projectSummary && <span className="runtime-badge">{projectSummary}</span>}
            {runtimeQuery.isSuccess && (
              <button className="project-button" onClick={() => setProjectDrawerOpen(!projectDrawerOpen)}>
                PROJECTS
              </button>
            )}
            {canChooseDirectory && (
              <button className="project-button" onClick={() => void chooseProjectRoot()}>
                OPEN FOLDER
              </button>
            )}
            <div className="status-pill"><span className="status-dot" /><span>{engineStatus}</span></div>
            <button className="icon-button" onClick={() => void toggleFullscreen()} title="Fullscreen · F" aria-label="Toggle fullscreen">⛶</button>
            <button className="icon-button" onClick={() => setHudVisible(false)} title="Hide UI · Ctrl+Shift+H" aria-label="Hide interface">HUD</button>
          </div>
        </header>

        <AnimatePresence>
          {projectDrawerOpen && runtimeQuery.isSuccess && (
            <motion.aside
              className="project-drawer glass-panel"
              initial={{ opacity: 0, x: -14, scale: 0.985 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -10, scale: 0.99 }}
              transition={{ duration: 0.18 }}
            >
              <div className="project-drawer__head">
                <div>
                  <strong>PROJECT ROOT</strong>
                  <span>{projectsQuery.data?.rootLabel || runtimeQuery.data.rootLabel}</span>
                </div>
                <button className="micro-button" onClick={() => setProjectDrawerOpen(false)}>CLOSE</button>
              </div>
              {canChooseDirectory && <button className="project-button" onClick={() => void chooseProjectRoot()}>CHOOSE DIRECTORY</button>}
              <div className="project-drawer__list">
                {projects.map(project => (
                  <button className="project-row" key={project.id} onClick={() => void loadProject(project)}>
                    <strong>{project.name}</strong>
                    <span>{project.audio?.fileName || "NO AUDIO"} · {project.lyrics?.fileName || "NO LRC"}</span>
                  </button>
                ))}
                {!projects.length && <div className="director-footnote">No E-MO projects found in this root.</div>}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <aside className="scene-panel glass-panel">
          <div className="panel-kicker">VISUAL DIRECTOR</div>
          <div className="scene-tabs" role="group" aria-label="Visual mode">
            {(["auto", "poster", "neon", "vortex"] as VisualMode[]).map(value => (
              <button
                key={value}
                className={`scene-tab ${mode === value ? "is-active" : ""}`}
                onClick={() => setMode(value)}
              >
                {value.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="readout-row">
            <span>ACTIVE SCENE</span><strong>{SCENE_LABELS[activeScene]}</strong>
          </div>

          <div className="typography-control">
            <div className="control-heading">
              <span>TYPOGRAPHY</span>
              <b>{activeTypography.toUpperCase()}</b>
            </div>
            <div className="typography-grid" role="group" aria-label="Typography preset">
              {TYPOGRAPHY_PRESETS.map(value => (
                <button
                  key={value}
                  className={`typography-button ${typographyPreset === value ? "is-active" : ""}`}
                  onClick={() => setTypographyPreset(value)}
                  title={value === "auto" ? "Auto variation by scene/line · T" : `${value} typography`}
                >
                  {value.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="composition-control">
            <div className="control-heading">
              <span>COMPOSITION</span>
              <b>{activeLayout.replaceAll("-", " ").toUpperCase()}</b>
            </div>
            <div className="composition-grid" role="group" aria-label="Typography composition">
              {TYPOGRAPHY_LAYOUTS.map(value => (
                <button
                  key={value}
                  className={`composition-button ${typographyLayout === value ? "is-active" : ""}`}
                  onClick={() => setTypographyLayout(value)}
                  title={value === "auto" ? "Auto word composition · L" : `${value} composition`}
                >
                  {value.replaceAll("-", " ").toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="harmony-control">
            <div className="control-heading">
              <span>COLOR HARMONY</span>
              <b>{activeHarmony.replaceAll("-", " ").toUpperCase()}</b>
            </div>
            <div className="harmony-grid" role="group" aria-label="OKLCH color harmony">
              {COLOR_HARMONIES.map(value => (
                <button
                  key={value}
                  className={`harmony-button ${colorHarmony === value ? "is-active" : ""}`}
                  onClick={() => setColorHarmony(value)}
                  title={value === "auto" ? "Auto OKLCH harmony · C" : `${value} OKLCH harmony`}
                >
                  {value.replaceAll("-", " ").toUpperCase()}
                </button>
              ))}
            </div>
            {activePalette && (
              <div className="palette-preview" aria-label="Active generated palette">
                {([
                  ["BG", activePalette.background],
                  ["TEXT", activePalette.textPrimary],
                  ["A", activePalette.accentA],
                  ["B", activePalette.accentB],
                  ["GLOW", activePalette.glow],
                ] as const).map(([label, color]) => (
                  <span key={label} title={`${label} · ${hexColorToCss(color)}`}>
                    <i style={{ background: hexColorToCss(color) }} />
                    <small>{label}</small>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="background-control">
            <div className="control-heading">
              <span>BACKGROUND</span>
              <b>{activeBackground.toUpperCase()}</b>
            </div>
            <div className="background-grid" role="group" aria-label="Background preset">
              {BACKGROUND_PRESETS.map(value => (
                <button
                  key={value}
                  className={`background-button ${backgroundPreset === value ? "is-active" : ""}`}
                  onClick={() => setBackgroundPreset(value)}
                  title={value === "auto" ? "Auto background variation · B" : `${value} background`}
                >
                  {value.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="audio-meter" aria-label="Audio reactive bands">
            <div><span className="meter-track"><i ref={bassRef} /></span><b>BASS</b></div>
            <div><span className="meter-track"><i ref={midRef} /></span><b>MID</b></div>
            <div><span className="meter-track"><i ref={trebleRef} /></span><b>AIR</b></div>
          </div>

          <label className="control-row">
            <span>INTENSITY <b>{Math.round(intensity * 100)}%</b></span>
            <input
              type="range"
              min="20"
              max="180"
              value={Math.round(intensity * 100)}
              step="1"
              onChange={event => setIntensity(Number(event.target.value) / 100)}
            />
          </label>

          <div className="sync-control">
            <div className="control-heading"><span>LYRIC SYNC</span><b>{syncMs >= 0 ? "+" : ""}{syncMs} ms</b></div>
            <input
              type="range"
              min="-1500"
              max="1500"
              value={syncMs}
              step="10"
              aria-label="Lyric sync offset"
              onChange={event => setSyncMs(Number(event.target.value))}
            />
            <div className="sync-buttons">
              <button className="micro-button" onClick={() => adjustSync(-50)}>−50</button>
              <button className="micro-button" onClick={() => setSyncMs(0)}>RESET</button>
              <button className="micro-button" onClick={() => adjustSync(50)}>+50</button>
            </div>
          </div>

          <div className="quality-toggle" role="group" aria-label="Render quality">
            {(["performance", "cinema"] as QualityMode[]).map(value => (
              <button
                key={value}
                className={`quality-button ${quality === value ? "is-active" : ""}`}
                onClick={() => setQuality(value)}
              >
                {value === "performance" ? "PERF" : "CINEMA"}
              </button>
            ))}
          </div>

          <div className="director-footnote">Scene AUTO directs the visual family. Typography, Composition, Background and OKLCH Harmony can AUTO-direct per line. T/L/B/C cycle them.</div>
        </aside>

        <section className={`empty-state ${hasContent ? "is-dismissed" : ""}`}>
          <div className="eyebrow">REALTIME MOTION GRAPHICS</div>
          <h1>DROP THE TRACK.<br /><span>LET THE LYRICS MOVE.</span></h1>
          <p>MP3 / M4A + Enhanced LRC · word-sync · reactive camera · deterministic director</p>
          <div className="empty-actions">
            <label className="primary-file">LOAD AUDIO<input type="file" accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,.mp3,.m4a,.aac" onChange={event => {
              const file = event.target.files?.[0];
              if (file) void loadAudioFile(file);
            }} /></label>
            <label className="secondary-file">LOAD LRC<input type="file" accept=".lrc,text/plain" onChange={event => {
              const file = event.target.files?.[0];
              if (file) void loadLyricsFile(file);
            }} /></label>
          </div>
          <div className="drop-hint">or drop both files anywhere</div>
        </section>

        <footer className="transport glass-panel">
          <div className="transport-left">
            <button className={`play-button ${playing ? "is-playing" : ""}`} onClick={() => void togglePlay()} aria-label="Play or pause">
              <span>{playing ? "❚❚" : "▶"}</span>
            </button>
            <button className={`mini-button ${muted ? "is-muted" : ""}`} onClick={toggleMute} aria-label="Mute or unmute">{muted ? "MUTED" : "VOL"}</button>
            <input className="volume" type="range" min="0" max="100" defaultValue="90" aria-label="Volume" onChange={event => {
              audioRef.current.setVolume(Number(event.target.value) / 100);
              setMuted(audioRef.current.muted || audioRef.current.volume < 0.001);
            }} />
          </div>

          <div className="timeline-wrap">
            <div className="track-meta">
              <div className="track-text">
                <strong>{trackTitle}</strong>
                <span>{trackMeta}</span>
              </div>
              <div ref={timeRef} className="time">00:00.000 / 00:00.000</div>
            </div>
            <input
              ref={seekRef}
              className="seek"
              type="range"
              min="0"
              max="1000"
              defaultValue="0"
              aria-label="Playback position"
              onPointerDown={() => { seekingRef.current = true; }}
              onPointerUp={event => {
                seekingRef.current = false;
                seekTo(event.currentTarget.value);
              }}
              onChange={event => seekTo(event.currentTarget.value)}
            />
          </div>

          <div className="transport-right">
            <label className="compact-file">AUDIO<input type="file" accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,.mp3,.m4a,.aac" onChange={event => {
              const file = event.target.files?.[0];
              if (file) void loadAudioFile(file);
            }} /></label>
            <label className="compact-file">LRC<input type="file" accept=".lrc,text/plain" onChange={event => {
              const file = event.target.files?.[0];
              if (file) void loadLyricsFile(file);
            }} /></label>
            <div className="shortcut-hint"><kbd>CTRL</kbd><kbd>SHIFT</kbd><kbd>H</kbd><span>HUD</span></div>
          </div>
        </footer>
      </div>

      <button className="ui-restore" onClick={() => setHudVisible(true)} aria-label="Show interface">SHOW HUD · CTRL+SHIFT+H</button>
    </main>
  );
}

function activeLineIndex(data: ParsedLyrics, time: number) {
  let lo = 0;
  let hi = data.lines.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const line = data.lines[mid];
    if (time < line.start) hi = mid - 1;
    else if (time >= line.end) lo = mid + 1;
    else return mid;
  }
  return -1;
}

function isTextControl(target: EventTarget | null) {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
}

function fmt(value: number) {
  if (!Number.isFinite(value)) value = 0;
  const m = Math.floor(value / 60).toString().padStart(2, "0");
  const s = Math.floor(value % 60).toString().padStart(2, "0");
  const ms = Math.floor((value % 1) * 1000).toString().padStart(3, "0");
  return `${m}:${s}.${ms}`;
}
