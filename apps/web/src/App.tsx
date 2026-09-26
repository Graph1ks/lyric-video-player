import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProjectDescriptor } from "@graph1ks/emo-app-contracts";
import { AudioEngine, HtmlAudioClock } from "@graph1ks/emo-audio-web";
import {
  ELRCParser,
  type ParsedLyrics,
} from "@graph1ks/emo-engine-core";
import {
  classifyDroppedFiles,
  fetchMilkdropLibrary,
  fetchMilkdropPresetSource,
  fetchProjectLyrics,
  fetchProjects,
  fetchRuntimeInfo,
  projectAssetUrl,
} from "@graph1ks/emo-platform-web";
import { EngineRenderer } from "@graph1ks/emo-renderer-pixi";
import {
  BACKGROUND_PRESETS,
  COLOR_CANVASES,
  COLOR_HARMONIES,
  COLOR_MOODS,
  COMPOSITION_MOTIONS,
  TYPOGRAPHY_LAYOUTS,
  TYPOGRAPHY_PRESETS,
  TYPOGRAPHY_SEQUENCES,
} from "./directorCatalog";
import { VisualDirector } from "./VisualDirector";
import { LowerThirdOverlay } from "./LowerThirdOverlay";
import { copy } from "./directorI18n";
import { listenDirectorCommands } from "./directorSync";
import { useUiStore } from "./store";
import {
  convertMilkdropPreset,
  loadMilkdropTextureImages,
} from "./milkdrop";
import {
  ensureTypographyFont,
  typographyFontProfile,
} from "./typographyFonts";

const EMPTY_LYRICS: ParsedLyrics = { offsetMs: 0, lines: [], meta: {} };

export function App() {
  const queryClient = useQueryClient();
  const shellRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const seekRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef<HTMLDivElement>(null);
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
  const directorTelemetryRef = useRef(-1);
  const milkdropLoadTokenRef = useRef(0);

  const hudVisible = useUiStore(state => state.hudVisible);
  const uiLanguage = useUiStore(state => state.uiLanguage);
  const t = (en: string, de: string) => copy(uiLanguage, en, de);
  const mode = useUiStore(state => state.mode);
  const intensity = useUiStore(state => state.intensity);
  const fxRack = useUiStore(state => state.fxRack);
  const quality = useUiStore(state => state.quality);
  const typographyPreset = useUiStore(state => state.typographyPreset);
  const typographySequence = useUiStore(state => state.typographySequence);
  const typographyLayout = useUiStore(state => state.typographyLayout);
  const compositionMotion = useUiStore(state => state.compositionMotion);
  const backgroundPreset = useUiStore(state => state.backgroundPreset);
  const backgroundEngine = useUiStore(state => state.backgroundEngine);
  const milkdropPresetId = useUiStore(state => state.milkdropPresetId);
  const milkdropOpacity = useUiStore(state => state.milkdropOpacity);
  const milkdropPaletteInfluence = useUiStore(state => state.milkdropPaletteInfluence);
  const milkdropRenderScale = useUiStore(state => state.milkdropRenderScale);
  const milkdropFxaa = useUiStore(state => state.milkdropFxaa);
  const milkdropBlendSeconds = useUiStore(state => state.milkdropBlendSeconds);
  const typographyFont = useUiStore(state => state.typographyFont);
  const colorHarmony = useUiStore(state => state.colorHarmony);
  const colorMood = useUiStore(state => state.colorMood);
  const colorCanvas = useUiStore(state => state.colorCanvas);
  const colorFlow = useUiStore(state => state.colorFlow);
  const syncMs = useUiStore(state => state.syncMs);
  const performancePresets = useUiStore(state => state.performancePresets);
  const activePerformancePresetId = useUiStore(state => state.activePerformancePresetId);
  const projectDrawerOpen = useUiStore(state => state.projectDrawerOpen);
  const directorDetachedOpen = useUiStore(state => state.directorDetachedOpen);
  const activeScene = useUiStore(state => state.activeScene);
  const setHudVisible = useUiStore(state => state.setHudVisible);
  const setMode = useUiStore(state => state.setMode);
  const setIntensity = useUiStore(state => state.setIntensity);
  const setQuality = useUiStore(state => state.setQuality);
  const setTypographyPreset = useUiStore(state => state.setTypographyPreset);
  const setTypographySequence = useUiStore(state => state.setTypographySequence);
  const setTypographyLayout = useUiStore(state => state.setTypographyLayout);
  const setCompositionMotion = useUiStore(state => state.setCompositionMotion);
  const setBackgroundPreset = useUiStore(state => state.setBackgroundPreset);
  const setBackgroundEngine = useUiStore(state => state.setBackgroundEngine);
  const setMilkdropPresetStatus = useUiStore(state => state.setMilkdropPresetStatus);
  const setColorHarmony = useUiStore(state => state.setColorHarmony);
  const setColorMood = useUiStore(state => state.setColorMood);
  const setColorCanvas = useUiStore(state => state.setColorCanvas);
  const setColorFlow = useUiStore(state => state.setColorFlow);
  const setSyncMs = useUiStore(state => state.setSyncMs);
  const setProjectDrawerOpen = useUiStore(state => state.setProjectDrawerOpen);
  const setActiveScene = useUiStore(state => state.setActiveScene);
  const setActiveTypography = useUiStore(state => state.setActiveTypography);
  const setActiveSequence = useUiStore(state => state.setActiveSequence);
  const setActiveLayout = useUiStore(state => state.setActiveLayout);
  const setActiveMotion = useUiStore(state => state.setActiveMotion);
  const setActiveBackground = useUiStore(state => state.setActiveBackground);
  const setActivePalette = useUiStore(state => state.setActivePalette);
  const setDirectorTrack = useUiStore(state => state.setDirectorTrack);
  const setDirectorPlayback = useUiStore(state => state.setDirectorPlayback);
  const setDirectorPlaying = useUiStore(state => state.setDirectorPlaying);
  const setDirectorMuted = useUiStore(state => state.setDirectorMuted);
  const setDirectorVolume = useUiStore(state => state.setDirectorVolume);
  const setDirectorDetachedOpen = useUiStore(state => state.setDirectorDetachedOpen);
  const setDirectorAudioBands = useUiStore(state => state.setDirectorAudioBands);

  const [engineStatus, setEngineStatus] = useState("ENGINE READY");
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
  const activePerformancePreset = useMemo(
    () => performancePresets.find(item => item.id === activePerformancePresetId),
    [activePerformancePresetId, performancePresets],
  );

  async function activateMilkdropPreset(presetId: string) {
    const renderer = rendererRef.current;
    if (!renderer) return;

    const loadToken = ++milkdropLoadTokenRef.current;
    setMilkdropPresetStatus(presetId, { compatibility: "converting" });

    let library: Awaited<ReturnType<typeof fetchMilkdropLibrary>>;
    let sourceResponse: Awaited<ReturnType<typeof fetchMilkdropPresetSource>>;
    try {
      [library, sourceResponse] = await Promise.all([
        fetchMilkdropLibrary(),
        fetchMilkdropPresetSource(presetId),
      ]);
      queryClient.setQueryData(["milkdrop-library"], library);
    } catch (error) {
      if (loadToken !== milkdropLoadTokenRef.current) return;
      setMilkdropPresetStatus(presetId, {
        compatibility: "runtime-error",
        message: error instanceof Error ? error.message : String(error),
      });
      return;
    }

    const preset = library.presets.find(item => item.id === presetId);
    if (!preset) {
      setMilkdropPresetStatus(presetId, {
        compatibility: "runtime-error",
        message: "Preset disappeared from the selected MilkDrop library.",
      });
      return;
    }

    let converted: unknown;
    try {
      converted = await convertMilkdropPreset(preset, sourceResponse.source);
    } catch (error) {
      if (loadToken !== milkdropLoadTokenRef.current) return;
      const message = error instanceof Error ? error.message : String(error);
      setMilkdropPresetStatus(presetId, {
        compatibility: /unsupported|not supported|shader version/i.test(message)
          ? "unsupported"
          : "conversion-error",
        message,
      });
      return;
    }

    try {
      const [{ audioContext, node }, textures] = await Promise.all([
        audioRef.current.visualizerSource(),
        loadMilkdropTextureImages(library, sourceResponse.source),
      ]);
      if (loadToken !== milkdropLoadTokenRef.current) return;

      const state = useUiStore.getState();
      renderer.initMilkdrop(audioContext, node);
      renderer.setMilkdropSettings({
        opacity: state.milkdropOpacity,
        paletteInfluence: state.milkdropPaletteInfluence,
        renderScale: state.milkdropRenderScale,
        fxaa: state.milkdropFxaa,
      });
      renderer.loadMilkdropImages(textures.images);
      renderer.loadMilkdropPreset(converted, state.milkdropBlendSeconds);
      renderer.setBackgroundEngine("milkdrop");
      setBackgroundEngine("milkdrop");
      setMilkdropPresetStatus(presetId, textures.missing.length
        ? {
            compatibility: "missing-textures",
            message: `Missing textures: ${textures.missing.join(", ")}`,
            missingTextures: textures.missing,
          }
        : { compatibility: "ready" });
      setEngineStatus(`MILKDROP · ${preset.name}`);
    } catch (error) {
      if (loadToken !== milkdropLoadTokenRef.current) return;
      setMilkdropPresetStatus(presetId, {
        compatibility: "runtime-error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

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
    const offSequence = renderer.onTypographySequenceChange(sequence => {
      if (!disposed) setActiveSequence(sequence);
    });
    const offLayout = renderer.onTypographyLayoutChange(layout => {
      if (!disposed) setActiveLayout(layout);
    });
    const offCompositionMotion = renderer.onCompositionMotionChange(motion => {
      if (!disposed) setActiveMotion(motion);
    });
    const offBackground = renderer.onBackgroundPresetChange(preset => {
      if (!disposed) setActiveBackground(preset);
    });
    const offPalette = renderer.onPaletteChange(palette => {
      if (!disposed) setActivePalette(palette);
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
      if (directorTelemetryRef.current < 0 || time - directorTelemetryRef.current >= 0.12) {
        directorTelemetryRef.current = time;
        setDirectorPlayback(time, clock.duration);
        setDirectorAudioBands({
          bass: bands.bass,
          mid: bands.mid,
          treble: bands.treble,
        });
      }
      if (seekRef.current && !seekingRef.current && clock.duration) {
        seekRef.current.value = String(Math.round((time / clock.duration) * 1000));
      }
      if (timeRef.current) timeRef.current.textContent = `${fmt(time)} / ${fmt(clock.duration)}`;
    });

    const syncPlaybackTelemetry = () => {
      setDirectorPlayback(clock.time, clock.duration);
    };
    const onPlay = () => {
      syncPlaybackTelemetry();
      setPlaying(true);
      setDirectorPlaying(true);
      setEngineStatus("PLAYING LIVE");
    };
    const onPause = () => {
      syncPlaybackTelemetry();
      setPlaying(false);
      setDirectorPlaying(false);
      setEngineStatus(audio.hasSource ? "PAUSED" : "ENGINE READY");
    };
    const onEnded = () => {
      syncPlaybackTelemetry();
      setPlaying(false);
      setDirectorPlaying(false);
      setEngineStatus("ENDED");
    };
    const onVolumeChange = () => {
      setMuted(audio.muted || audio.volume < 0.001);
      setDirectorMuted(audio.muted || audio.volume < 0.001);
      setDirectorVolume(audio.volume);
    };

    const playbackEvents: Array<keyof HTMLMediaElementEventMap> = [
      "timeupdate",
      "durationchange",
      "loadedmetadata",
      "seeking",
      "seeked",
      "ratechange",
    ];
    audio.element.addEventListener("play", onPlay);
    audio.element.addEventListener("pause", onPause);
    audio.element.addEventListener("ended", onEnded);
    audio.element.addEventListener("volumechange", onVolumeChange);
    playbackEvents.forEach(event => audio.element.addEventListener(event, syncPlaybackTelemetry));
    const playbackTimer = window.setInterval(syncPlaybackTelemetry, 125);
    onVolumeChange();
    syncPlaybackTelemetry();

    void renderer.init(stage).then(() => {
      if (disposed) return;
      const initialState = useUiStore.getState();
      const initialProfile = initialState.performancePresets.find(
        item => item.id === initialState.activePerformancePresetId,
      );
      renderer.setAutoProfile(initialProfile?.auto);
      renderer.setFxRack(initialState.fxRack);
      renderer.setVisualMode(initialState.mode);
      renderer.setTypographyPreset(useUiStore.getState().typographyPreset);
      renderer.setTypographySequence(useUiStore.getState().typographySequence);
      renderer.setTypographyLayout(useUiStore.getState().typographyLayout);
      renderer.setCompositionMotion(useUiStore.getState().compositionMotion);
      renderer.setBackgroundPreset(initialState.backgroundPreset);
      renderer.setBackgroundEngine(initialState.backgroundEngine);
      renderer.setMilkdropSettings({
        opacity: initialState.milkdropOpacity,
        paletteInfluence: initialState.milkdropPaletteInfluence,
        renderScale: initialState.milkdropRenderScale,
        fxaa: initialState.milkdropFxaa,
      });
      const initialFont = typographyFontProfile(initialState.typographyFont);
      void ensureTypographyFont(initialFont).then(() => {
        if (!disposed) renderer.setTypographyFont(initialFont.family, initialFont.weight);
      });
      renderer.setColorHarmony(useUiStore.getState().colorHarmony);
      renderer.setColorMood(useUiStore.getState().colorMood);
      renderer.setColorCanvas(useUiStore.getState().colorCanvas);
      renderer.setColorFlow(useUiStore.getState().colorFlow);
      renderer.setIntensity(useUiStore.getState().intensity);
      renderer.setQuality(initialState.quality);
      clock.start();
      if (initialState.backgroundEngine === "milkdrop" && initialState.milkdropPresetId) {
        void activateMilkdropPreset(initialState.milkdropPresetId);
      }
    });

    return () => {
      disposed = true;
      clock.stop();
      offTick();
      offMode();
      offTypography();
      offSequence();
      offLayout();
      offCompositionMotion();
      offBackground();
      offPalette();
      audio.element.removeEventListener("play", onPlay);
      audio.element.removeEventListener("pause", onPause);
      audio.element.removeEventListener("ended", onEnded);
      audio.element.removeEventListener("volumechange", onVolumeChange);
      playbackEvents.forEach(event => audio.element.removeEventListener(event, syncPlaybackTelemetry));
      window.clearInterval(playbackTimer);
      rendererRef.current = null;
      clockRef.current = null;
      stage.replaceChildren();
    };
  }, []);

  useEffect(() => {
    syncRef.current = syncMs;
  }, [syncMs]);

  useEffect(() => {
    rendererRef.current?.setAutoProfile(activePerformancePreset?.auto);
  }, [activePerformancePreset]);

  useEffect(() => {
    rendererRef.current?.setVisualMode(mode);
  }, [mode]);

  useEffect(() => {
    rendererRef.current?.setFxRack(fxRack);
    const shell = shellRef.current;
    if (!shell) return;
    shell.style.setProperty("--screen-bloom-level", String(fxRack.screenBloom));
    shell.style.setProperty("--screen-scanline-level", String(fxRack.scanlines));
    shell.style.setProperty("--screen-grain-level", String(fxRack.grain));
    shell.style.setProperty("--screen-vignette-level", String(fxRack.vignette));
  }, [fxRack]);

  useEffect(() => {
    rendererRef.current?.setTypographyPreset(typographyPreset);
  }, [typographyPreset]);

  useEffect(() => {
    rendererRef.current?.setTypographySequence(typographySequence);
  }, [typographySequence]);

  useEffect(() => {
    rendererRef.current?.setTypographyLayout(typographyLayout);
  }, [typographyLayout]);

  useEffect(() => {
    rendererRef.current?.setCompositionMotion(compositionMotion);
  }, [compositionMotion]);

  useEffect(() => {
    rendererRef.current?.setBackgroundPreset(backgroundPreset);
  }, [backgroundPreset]);

  useEffect(() => {
    rendererRef.current?.setBackgroundEngine(backgroundEngine);
  }, [backgroundEngine]);

  useEffect(() => {
    rendererRef.current?.setMilkdropSettings({
      opacity: milkdropOpacity,
      paletteInfluence: milkdropPaletteInfluence,
      renderScale: milkdropRenderScale,
      fxaa: milkdropFxaa,
    });
  }, [milkdropFxaa, milkdropOpacity, milkdropPaletteInfluence, milkdropRenderScale]);

  useEffect(() => {
    if (!milkdropPresetId) return;
    void activateMilkdropPreset(milkdropPresetId);
  }, [milkdropPresetId]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    const profile = typographyFontProfile(typographyFont);
    let cancelled = false;
    void ensureTypographyFont(profile).then(() => {
      if (!cancelled) renderer.setTypographyFont(profile.family, profile.weight);
    });
    return () => { cancelled = true; };
  }, [typographyFont]);

  useEffect(() => {
    rendererRef.current?.setColorHarmony(colorHarmony);
  }, [colorHarmony]);

  useEffect(() => {
    rendererRef.current?.setColorMood(colorMood);
  }, [colorMood]);

  useEffect(() => {
    rendererRef.current?.setColorCanvas(colorCanvas);
  }, [colorCanvas]);

  useEffect(() => {
    rendererRef.current?.setColorFlow(colorFlow);
  }, [colorFlow]);

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
      } else if (event.code === "KeyS") {
        const current = useUiStore.getState().typographySequence;
        const index = TYPOGRAPHY_SEQUENCES.indexOf(current);
        setTypographySequence(TYPOGRAPHY_SEQUENCES[(index + 1) % TYPOGRAPHY_SEQUENCES.length]);
      } else if (event.code === "KeyL") {
        const current = useUiStore.getState().typographyLayout;
        const index = TYPOGRAPHY_LAYOUTS.indexOf(current);
        setTypographyLayout(TYPOGRAPHY_LAYOUTS[(index + 1) % TYPOGRAPHY_LAYOUTS.length]);
      } else if (event.code === "KeyG") {
        const current = useUiStore.getState().compositionMotion;
        const index = COMPOSITION_MOTIONS.indexOf(current);
        setCompositionMotion(COMPOSITION_MOTIONS[(index + 1) % COMPOSITION_MOTIONS.length]);
      } else if (event.code === "KeyB") {
        const current = useUiStore.getState().backgroundPreset;
        const index = BACKGROUND_PRESETS.indexOf(current);
        setBackgroundPreset(BACKGROUND_PRESETS[(index + 1) % BACKGROUND_PRESETS.length]);
      } else if (event.code === "KeyC") {
        const current = useUiStore.getState().colorHarmony;
        const index = COLOR_HARMONIES.indexOf(current);
        setColorHarmony(COLOR_HARMONIES[(index + 1) % COLOR_HARMONIES.length]);
      } else if (event.code === "KeyE") {
        const current = useUiStore.getState().colorMood;
        const index = COLOR_MOODS.indexOf(current);
        setColorMood(COLOR_MOODS[(index + 1) % COLOR_MOODS.length]);
      } else if (event.code === "KeyV") {
        const current = useUiStore.getState().colorCanvas;
        const index = COLOR_CANVASES.indexOf(current);
        setColorCanvas(COLOR_CANVASES[(index + 1) % COLOR_CANVASES.length]);
      } else if (event.code === "KeyR") {
        const current = useUiStore.getState().colorFlow;
        setColorFlow(current === "rainbow" ? "static" : "rainbow");
      } else if (event.code === "Comma") adjustSync(-50);
      else if (event.code === "Period") adjustSync(50);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setBackgroundPreset, setColorCanvas, setColorFlow, setColorHarmony, setColorMood, setCompositionMotion, setHudVisible, setMode, setSyncMs, setTypographyLayout, setTypographyPreset, setTypographySequence]);

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

  useEffect(() => listenDirectorCommands(command => {
    if (command.kind === "toggle-play") {
      void togglePlay();
    } else if (command.kind === "seek") {
      clockRef.current?.seek(command.seconds);
    } else if (command.kind === "seek-relative") {
      const clock = clockRef.current;
      if (clock) clock.seek(clock.time + command.seconds);
    } else if (command.kind === "toggle-mute") {
      toggleMute();
    } else if (command.kind === "set-volume") {
      audioRef.current.setVolume(command.volume);
    } else if (command.kind === "toggle-fullscreen") {
      void toggleFullscreen();
    } else if (command.kind === "load-audio") {
      void loadAudioFile(command.file);
    } else if (command.kind === "load-lyrics") {
      void loadLyricsFile(command.file);
    } else if (command.kind === "presence") {
      setDirectorDetachedOpen(command.open);
      if (command.open) setProjectDrawerOpen(false);
    }
  }), [setDirectorDetachedOpen, setProjectDrawerOpen]);

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
    const mutedNow = isMuted || audioRef.current.volume < 0.001;
    setMuted(mutedNow);
    setDirectorMuted(mutedNow);
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
    const meta = parts.join(" · ") || "Ready";
    setTrackTitle(title);
    setTrackMeta(meta);
    setDirectorTrack(title, meta, lyrics.meta.artist?.trim() || "");
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
      if (defaults?.compositionMotion !== undefined) setCompositionMotion(defaults.compositionMotion);
      if (defaults?.backgroundPreset !== undefined) setBackgroundPreset(defaults.backgroundPreset);
      if (defaults?.colorHarmony !== undefined) setColorHarmony(defaults.colorHarmony);
      if (defaults?.colorMood !== undefined) setColorMood(defaults.colorMood);
      if (defaults?.colorCanvas !== undefined) setColorCanvas(defaults.colorCanvas);
      if (defaults?.colorFlow !== undefined) setColorFlow(defaults.colorFlow);
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

  async function openDirectorWorkspace() {
    if (window.emoDesktop?.openDirectorWindow) {
      await window.emoDesktop.openDirectorWindow();
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set("director", "1");
    const popup = window.open(
      url.toString(),
      "emo-visual-director",
      "popup=yes,width=1180,height=860,resizable=yes,scrollbars=no",
    );
    popup?.focus();
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
      className={`shell ${hudVisible ? "" : "ui-hidden"} ${directorDetachedOpen ? "operator-output" : ""}`}
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

      <LowerThirdOverlay />

      <div className={`drop-overlay ${dropVisible ? "is-visible" : ""}`} aria-hidden={!dropVisible}>
        <div className="drop-card">
          <span className="drop-kicker">E-MO-ENGINE INGEST</span>
          <strong>DROP AUDIO + ENHANCED LRC</strong>
          <span>MP3 · M4A · AAC · LRC</span>
        </div>
      </div>

      <div className="ui-layer">
        <header className="player-command-bar">
          <div className="player-brand">
            <div className="brand-mark">E</div>
            <div>
              <div className="brand">E-MO</div>
              <div className="brand-sub">{t("LYRIC PERFORMANCE ENGINE", "LYRIC-PERFORMANCE-ENGINE")}</div>
            </div>
          </div>

          <div className="player-session-status">
            <span className={playing ? "is-live" : ""}><i /> {engineStatus}</span>
            <div>
              <strong>{trackTitle}</strong>
              <small>{trackMeta}</small>
            </div>
          </div>

          <div className="player-command-actions">
            {projectSummary && <span className="runtime-badge">{projectSummary}</span>}
            {runtimeQuery.isSuccess && (
              <button onClick={() => setProjectDrawerOpen(!projectDrawerOpen)}>
                {t("PROJECTS", "PROJEKTE")}
              </button>
            )}
            {canChooseDirectory && (
              <button onClick={() => void chooseProjectRoot()}>
                {t("FOLDER", "ORDNER")}
              </button>
            )}
            <button className="is-primary" onClick={() => void openDirectorWorkspace()}>
              {t("DIRECTOR", "DIRECTOR")} ↗
            </button>
            <button onClick={() => void toggleFullscreen()} title={t("Fullscreen · F", "Vollbild · F")}>⛶</button>
            <button className="hud-button" onClick={() => setHudVisible(false)} title={t("Hide UI · Ctrl+Shift+H", "UI ausblenden · Ctrl+Shift+H")}>HUD</button>
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
                  <strong>{t("PROJECT ROOT", "PROJEKTORDNER")}</strong>
                  <span>{projectsQuery.data?.rootLabel || runtimeQuery.data.rootLabel}</span>
                </div>
                <button className="micro-button" onClick={() => setProjectDrawerOpen(false)}>{t("CLOSE", "SCHLIESSEN")}</button>
              </div>
              {canChooseDirectory && <button className="project-button" onClick={() => void chooseProjectRoot()}>{t("CHOOSE DIRECTORY", "ORDNER WÄHLEN")}</button>}
              <div className="project-drawer__list">
                {projects.map(project => (
                  <button className="project-row" key={project.id} onClick={() => void loadProject(project)}>
                    <strong>{project.name}</strong>
                    <span>
                      {project.audio?.fileName || t("NO AUDIO", "KEIN AUDIO")} ·{" "}
                      {project.lyrics?.fileName || t("NO LRC", "KEIN LRC")}
                    </span>
                  </button>
                ))}
                {!projects.length && <div className="director-footnote">{t("No E-MO projects found in this root.", "Keine E-MO-Projekte in diesem Ordner gefunden.")}</div>}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <aside className="scene-panel glass-panel">
          <VisualDirector onPopout={() => void openDirectorWorkspace()} />
        </aside>

        <section className={`empty-state ${hasContent ? "is-dismissed" : ""}`}>
          <div className="eyebrow">{t("REALTIME MOTION GRAPHICS", "ECHTZEIT MOTION GRAPHICS")}</div>
          <h1>{t("DROP THE TRACK.", "TRACK REIN.")}<br /><span>{t("LET THE LYRICS MOVE.", "LYRICS IN BEWEGUNG.")}</span></h1>
          <p>{t(
            "MP3 / M4A + Enhanced LRC · word-sync · reactive camera · deterministic director",
            "MP3 / M4A + Enhanced LRC · Wort-Sync · reaktive Kamera · deterministische Regie",
          )}</p>
          <div className="empty-actions">
            <label className="primary-file">{t("LOAD AUDIO", "AUDIO LADEN")}<input type="file" accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,.mp3,.m4a,.aac" onChange={event => {
              const file = event.target.files?.[0];
              if (file) void loadAudioFile(file);
            }} /></label>
            <label className="secondary-file">{t("LOAD LRC", "LRC LADEN")}<input type="file" accept=".lrc,text/plain" onChange={event => {
              const file = event.target.files?.[0];
              if (file) void loadLyricsFile(file);
            }} /></label>
          </div>
          <div className="drop-hint">{t("or drop both files anywhere", "oder beide Dateien irgendwo hineinziehen")}</div>
        </section>

        <footer className="player-transport-console">
          <div className="player-counter-block">
            <span>{t("PLAYHEAD", "PLAYHEAD")}</span>
            <div ref={timeRef} className="player-main-time">00:00.000 / 00:00.000</div>
          </div>

          <div className="player-transport-controls">
            <button className="player-skip" onClick={() => clockRef.current?.seek((clockRef.current?.time ?? 0) - 5)}>−5</button>
            <button className={`player-master-play ${playing ? "is-playing" : ""}`} onClick={() => void togglePlay()} aria-label={t("Play or pause", "Abspielen oder pausieren")}>
              {playing ? "❚❚" : "▶"}
            </button>
            <button className="player-skip" onClick={() => clockRef.current?.seek((clockRef.current?.time ?? 0) + 5)}>+5</button>
          </div>

          <div className="player-timeline-console">
            <div className="player-track-readout">
              <div>
                <strong>{trackTitle}</strong>
                <span>{trackMeta}</span>
              </div>
              <span>{playing ? t("PLAYING", "LÄUFT") : t("READY", "BEREIT")}</span>
            </div>
            <input
              ref={seekRef}
              className="player-seek"
              type="range"
              min="0"
              max="1000"
              defaultValue="0"
              aria-label={t("Playback position", "Wiedergabeposition")}
              onPointerDown={() => { seekingRef.current = true; }}
              onPointerUp={event => {
                seekingRef.current = false;
                seekTo(event.currentTarget.value);
              }}
              onChange={event => seekTo(event.currentTarget.value)}
            />
          </div>

          <div className="player-monitor-controls">
            <button className={muted ? "is-active" : ""} onClick={toggleMute}>{muted ? t("MUTED", "STUMM") : t("MON", "MON")}</button>
            <input className="player-volume" type="range" min="0" max="100" defaultValue="90" aria-label={t("Volume", "Lautstärke")} onChange={event => {
              audioRef.current.setVolume(Number(event.target.value) / 100);
              setDirectorVolume(audioRef.current.volume);
              const mutedNow = audioRef.current.muted || audioRef.current.volume < 0.001;
              setMuted(mutedNow);
              setDirectorMuted(mutedNow);
            }} />
            <label className="player-file-button">AUDIO<input type="file" accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,.mp3,.m4a,.aac" onChange={event => {
              const file = event.target.files?.[0];
              if (file) void loadAudioFile(file);
            }} /></label>
            <label className="player-file-button">LRC<input type="file" accept=".lrc,text/plain" onChange={event => {
              const file = event.target.files?.[0];
              if (file) void loadLyricsFile(file);
            }} /></label>
          </div>
        </footer>
      </div>

      <button className="ui-restore" onClick={() => setHudVisible(true)} aria-label={t("Show interface", "Oberfläche anzeigen")}>{t("SHOW HUD", "HUD ZEIGEN")} · CTRL+SHIFT+H</button>
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
