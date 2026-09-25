import { Application, Container } from "pixi.js";
import type { AudioBands } from "@graph1ks/emo-audio-web";
import {
  analyzeKineticReadability,
  clamp,
  createVisualPalette,
  evaluateCinematicCameraPlan,
  resolveManifestoPageScope,
  SceneDirector,
} from "@graph1ks/emo-engine-core";
import type {
  BackgroundPreset,
  BackgroundPresetId,
  ColorCanvasId,
  ColorCanvasMode,
  ColorFlowMode,
  ColorHarmonyId,
  ColorMoodId,
  ColorMoodMode,
  CompositionMotionId,
  DirectedScene,
  CompositionMotionPreset,
  ColorHarmonyMode,
  LineCue,
  QualityMode,
  SceneMode,
  TypographyLayoutId,
  TypographyLayoutPreset,
  TypographyPreset,
  TypographyPresetId,
  TypographySequenceGrammarId,
  TypographySequenceMode,
  ResolvedTypographySequence,
  VisualMode,
  VisualPalette,
} from "@graph1ks/emo-engine-core";
import { CinematicBackground } from "../effects/backgrounds/CinematicBackground";
import { KineticLyrics } from "../effects/typography/KineticLyrics";
import { PersistentTypographySequences } from "../effects/typography/PersistentTypographySequences";
import { CameraRig } from "./CameraRig";
import { CinematicPostFX } from "./CinematicPostFX";
import { SceneRenderGraph } from "./SceneRenderGraph";
import { ReactiveDisplacementFX } from "./ReactiveDisplacementFX";
import { ReactiveVelocitySmearFX } from "./ReactiveVelocitySmearFX";
import { ReactiveBloomThresholdFX } from "./ReactiveBloomThresholdFX";

const EMPTY_SPECTRUM = new Float32Array(0);

export class EngineRenderer {
  readonly app = new Application();
  readonly root = new Container();

  private scene = new Container();
  private camera = new Container();
  private background = new CinematicBackground();
  private sequenceLyrics = new PersistentTypographySequences();
  private lyrics = new KineticLyrics();
  private director = new SceneDirector();
  private cameraRig = new CameraRig(this.camera);
  private displacementFX = new ReactiveDisplacementFX();
  private velocitySmearFX = new ReactiveVelocitySmearFX();
  private bloomThresholdFX = new ReactiveBloomThresholdFX();
  private postFX = new CinematicPostFX();
  private renderGraph = new SceneRenderGraph(
    this.displacementFX,
    this.velocitySmearFX,
    this.bloomThresholdFX,
    this.postFX,
  );
  private activeMode: SceneMode = "neon";
  private quality: QualityMode = "cinema";
  private colorHarmony: ColorHarmonyMode = "auto";
  private colorMood: ColorMoodMode = "auto";
  private colorCanvas: ColorCanvasMode = "auto";
  private colorFlow: ColorFlowMode = "static";
  private typographySequence: TypographySequenceMode = "auto";
  private lastLineIndex = -1;
  private currentDirection?: DirectedScene;
  private lines: LineCue[] = [];
  private intensity = 1;
  private host?: HTMLElement;
  private modeListeners = new Set<(mode: SceneMode) => void>();
  private typographyListeners = new Set<(preset: TypographyPresetId) => void>();
  private layoutListeners = new Set<(layout: TypographyLayoutId) => void>();
  private compositionMotionListeners = new Set<(motion: CompositionMotionId) => void>();
  private backgroundListeners = new Set<(preset: BackgroundPresetId) => void>();
  private paletteListeners = new Set<(palette: VisualPalette) => void>();
  private sequenceListeners = new Set<(sequence: ResolvedTypographySequence) => void>();
  private lastTypographyPreset?: TypographyPresetId;
  private lastTypographySequence?: ResolvedTypographySequence;
  private lastTypographyLayout?: TypographyLayoutId;
  private lastCompositionMotion?: CompositionMotionId;
  private lastBackgroundPreset?: BackgroundPresetId;
  private lastPaletteKey = "";
  private sceneTransition = 0;
  private previousTime = 0;
  private lastLyricTime = 0;
  private lastPaletteFlowTick = -1;
  private resizeListener?: () => void;
  private fullscreenListener?: () => void;
  private visualViewportListener?: () => void;
  private resizeObserver?: ResizeObserver;

  constructor() {
    this.lyrics.onWordHit((index, audio) => {
      this.cameraRig.wordHit(index, audio);
      this.background.hit(0.22 + audio.transient * 0.36);
    });
  }

  async init(host: HTMLElement) {
    this.host = host;
    await this.app.init({
      resizeTo: host,
      antialias: true,
      backgroundAlpha: 0,
      preference: "webgl",
      powerPreference: "high-performance",
      resolution: Math.min(devicePixelRatio, 2),
      autoDensity: true,
      autoStart: false,
      sharedTicker: false,
    });

    host.appendChild(this.app.canvas);
    // Background/world stays screen-anchored. Only typography lives inside the
    // camera rig. This prevents camera/lyric travel from exposing transparent
    // render-target edges as black bars.
    this.camera.addChild(
      this.sequenceLyrics.container,
      this.lyrics.container,
    );
    this.scene.addChild(this.background.container, this.camera);
    this.root.addChild(this.renderGraph.output);
    this.app.stage.addChild(this.root);

    this.applyMode("neon", false);
    this.renderGraph.setQuality(this.quality);
    this.renderGraph.setIntensity(this.intensity);
    this.resize();
    this.resizeListener = () => this.resize();
    this.fullscreenListener = () => {
      // Fullscreen layout settles asynchronously in Chromium. Resize once now
      // and again on the next frame so the render targets match the final box.
      this.resize();
      requestAnimationFrame(() => this.resize());
    };
    this.visualViewportListener = () => this.resize();
    window.addEventListener("resize", this.resizeListener);
    document.addEventListener("fullscreenchange", this.fullscreenListener);
    window.visualViewport?.addEventListener("resize", this.visualViewportListener);
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(host);
    }
  }

  onModeChange(listener: (mode: SceneMode) => void) {
    this.modeListeners.add(listener);
    return () => this.modeListeners.delete(listener);
  }

  setLyrics(lines: LineCue[]) {
    this.lines = lines;
    this.director.load(lines);
    this.sequenceLyrics.setLyrics(lines);
    this.renderGraph.resetFeedback();
    if (this.director.getMode() === "auto" && this.lastLineIndex >= 0) {
      this.applyMode(this.director.sceneFor(this.lastLineIndex).mode, true);
    }
  }

  setVisualMode(mode: VisualMode) {
    this.director.setMode(mode);
    if (mode !== "auto") {
      this.applyMode(mode, true);
      if (this.lastLineIndex >= 0) {
        this.currentDirection = this.director.sceneFor(this.lastLineIndex);
        this.lyrics.setCinematicDirection(this.currentDirection.typography);
        this.refreshTypographyPresentation();
        this.emitTypographyPreset();
        this.emitTypographyLayout();
        this.emitCompositionMotion();
      }
    } else if (this.lastLineIndex >= 0) {
      const directed = this.director.sceneFor(this.lastLineIndex);
      this.currentDirection = directed;
      this.applyMode(directed.mode, true);
      this.lyrics.setCinematicDirection(directed.typography);
      this.refreshTypographyPresentation();
      this.emitTypographyPreset();
      this.emitTypographyLayout();
      this.emitCompositionMotion();
    }
  }

  setColorHarmony(harmony: ColorHarmonyMode) {
    if (this.colorHarmony === harmony) return;
    this.colorHarmony = harmony;
    this.renderGraph.resetFeedback();
    this.refreshPalette();
  }

  onPaletteChange(listener: (palette: VisualPalette) => void) {
    this.paletteListeners.add(listener);
    return () => this.paletteListeners.delete(listener);
  }

  getColorHarmony() {
    return this.colorHarmony;
  }

  getResolvedColorHarmony(): ColorHarmonyId {
    return createVisualPalette({
      harmony: this.colorHarmony,
      mood: this.colorMood,
      canvas: this.colorCanvas,
      scene: this.activeMode,
      lineIndex: this.lastLineIndex,
      hueShift: this.colorFlow === "rainbow" ? this.lastLyricTime * 2.4 : 0,
    }).resolvedHarmony;
  }

  setColorMood(mood: ColorMoodMode) {
    if (this.colorMood === mood) return;
    this.colorMood = mood;
    this.renderGraph.resetFeedback();
    this.refreshPalette(this.lastLyricTime);
  }

  getColorMood() {
    return this.colorMood;
  }

  getResolvedColorMood(): ColorMoodId {
    return createVisualPalette({
      harmony: this.colorHarmony,
      mood: this.colorMood,
      canvas: this.colorCanvas,
      scene: this.activeMode,
      lineIndex: this.lastLineIndex,
      hueShift: this.colorFlow === "rainbow" ? this.lastLyricTime * 2.4 : 0,
    }).resolvedMood;
  }

  setColorCanvas(canvas: ColorCanvasMode) {
    if (this.colorCanvas === canvas) return;
    this.colorCanvas = canvas;
    this.renderGraph.resetFeedback();
    this.refreshPalette(this.lastLyricTime);
  }

  getColorCanvas() {
    return this.colorCanvas;
  }

  getResolvedColorCanvas(): ColorCanvasId {
    return createVisualPalette({
      harmony: this.colorHarmony,
      mood: this.colorMood,
      canvas: this.colorCanvas,
      scene: this.activeMode,
      lineIndex: this.lastLineIndex,
      hueShift: this.colorFlow === "rainbow" ? this.lastLyricTime * 2.4 : 0,
    }).resolvedCanvas;
  }

  setColorFlow(flow: ColorFlowMode) {
    if (this.colorFlow === flow) return;
    this.colorFlow = flow;
    this.lastPaletteFlowTick = -1;
    this.renderGraph.resetFeedback();
    this.refreshPalette(this.lastLyricTime);
  }

  getColorFlow() {
    return this.colorFlow;
  }

  setBackgroundPreset(preset: BackgroundPreset) {
    this.background.setPreset(preset);
    this.renderGraph.resetFeedback();
    this.emitBackgroundPreset();
  }

  onBackgroundPresetChange(listener: (preset: BackgroundPresetId) => void) {
    this.backgroundListeners.add(listener);
    return () => this.backgroundListeners.delete(listener);
  }

  getBackgroundPreset() {
    return this.background.getPreset();
  }

  getResolvedBackgroundPreset() {
    return this.background.getResolvedPreset();
  }

  setTypographySequence(sequence: TypographySequenceMode) {
    if (this.typographySequence === sequence) return;
    this.typographySequence = sequence;
    this.refreshTypographyPresentation();
    this.renderGraph.resetFeedback();
  }

  getTypographySequence() {
    return this.typographySequence;
  }

  getResolvedTypographySequence(): ResolvedTypographySequence {
    return this.sequenceLyrics.getGrammar() ?? "off";
  }

  onTypographySequenceChange(listener: (sequence: ResolvedTypographySequence) => void) {
    this.sequenceListeners.add(listener);
    return () => this.sequenceListeners.delete(listener);
  }

  setTypographyPreset(preset: TypographyPreset) {
    this.lyrics.setPreset(preset);
    this.refreshTypographyPresentation();
    this.renderGraph.resetFeedback();
    this.emitTypographyPreset();
  }

  setTypographyLayout(preset: TypographyLayoutPreset) {
    this.lyrics.setLayoutPreset(preset);
    this.refreshTypographyPresentation();
    this.renderGraph.resetFeedback();
    this.emitTypographyLayout();
  }

  onTypographyLayoutChange(listener: (layout: TypographyLayoutId) => void) {
    this.layoutListeners.add(listener);
    return () => this.layoutListeners.delete(listener);
  }

  getTypographyLayout() {
    return this.lyrics.getLayoutPreset();
  }

  getResolvedTypographyLayout() {
    return this.lyrics.getResolvedLayout();
  }

  setCompositionMotion(preset: CompositionMotionPreset) {
    this.lyrics.setCompositionMotion(preset);
    this.refreshTypographyPresentation();
    this.renderGraph.resetFeedback();
    this.emitCompositionMotion();
  }

  onCompositionMotionChange(listener: (motion: CompositionMotionId) => void) {
    this.compositionMotionListeners.add(listener);
    return () => this.compositionMotionListeners.delete(listener);
  }

  getCompositionMotion() {
    return this.lyrics.getCompositionMotion();
  }

  getResolvedCompositionMotion() {
    return this.lyrics.getResolvedCompositionMotion();
  }

  onTypographyPresetChange(listener: (preset: TypographyPresetId) => void) {
    this.typographyListeners.add(listener);
    return () => this.typographyListeners.delete(listener);
  }

  getTypographyPreset() {
    return this.lyrics.getPreset();
  }

  getResolvedTypographyPreset() {
    return this.lyrics.getResolvedPreset();
  }

  setIntensity(value: number) {
    this.intensity = Math.max(0.2, Math.min(1.8, value));
    this.background.setIntensity(this.intensity);
    this.sequenceLyrics.setIntensity(this.intensity);
    this.lyrics.setIntensity(this.intensity);
    this.cameraRig.setIntensity(this.intensity);
    this.displacementFX.setIntensity(this.intensity);
    this.velocitySmearFX.setIntensity(this.intensity);
    this.bloomThresholdFX.setIntensity(this.intensity);
    this.postFX.setIntensity(this.intensity);
    this.renderGraph.setIntensity(this.intensity);
  }

  setQuality(quality: QualityMode) {
    this.quality = quality;
    this.background.setQuality(quality);
    this.sequenceLyrics.setQuality(quality);
    this.displacementFX.setQuality(quality);
    this.velocitySmearFX.setQuality(quality);
    this.bloomThresholdFX.setQuality(quality);
    this.postFX.setQuality(quality);
    this.renderGraph.setQuality(quality);

    if (this.app.renderer) {
      this.app.renderer.resolution = quality === "cinema"
        ? Math.min(devicePixelRatio, 2)
        : Math.min(devicePixelRatio, 1.25);
      this.resize();
    }
  }

  setLine(line: LineCue | undefined, index: number) {
    if (index === this.lastLineIndex) return;
    const previousIndex = this.lastLineIndex;
    this.lastLineIndex = index;

    if (previousIndex >= 0 && index >= 0 && Math.abs(index - previousIndex) > 1) {
      this.renderGraph.resetFeedback();
    }

    this.background.setLine(line, index);

    const directed = index >= 0 ? this.director.sceneFor(index) : undefined;
    this.currentDirection = directed;
    if (directed) {
      this.applyMode(directed.mode, true);
    }

    this.emitBackgroundPreset();
    this.refreshPalette();
    this.lyrics.setLine(line, index, directed?.typography);
    this.refreshTypographyPresentation();
    this.emitTypographyPreset();
    this.emitTypographyLayout();
    this.emitCompositionMotion();
    if (line) {
      this.background.hit(0.92 + (index % 3) * 0.08);
      this.cameraRig.lineHit(index);
    }
  }

  update(
    time: number,
    audio: AudioBands,
    lyricTime = time,
    spectrum: Float32Array = EMPTY_SPECTRUM,
  ) {
    if (!this.app.renderer) return;

    const rawDt = this.previousTime ? time - this.previousTime : 1 / 60;
    const dt = Math.min(0.08, Math.max(1 / 240, Math.abs(rawDt)));
    this.previousTime = time;
    this.sceneTransition *= Math.pow(0.006, dt);
    this.root.alpha = 1 - this.sceneTransition * 0.28;
    const rootScale = 1 + this.sceneTransition * 0.045;
    this.root.scale.set(rootScale);

    this.lastLyricTime = lyricTime;
    if (this.colorFlow === "rainbow") {
      const paletteTick = Math.floor(lyricTime * 4);
      if (paletteTick !== this.lastPaletteFlowTick) {
        this.lastPaletteFlowTick = paletteTick;
        this.refreshPalette(lyricTime, true);
      }
    }

    this.displacementFX.update(time, audio);
    this.velocitySmearFX.update(time, audio);
    this.bloomThresholdFX.update(time, audio);
    this.postFX.update(time, audio);
    this.background.update(time, audio, spectrum);
    this.lyrics.update(lyricTime, audio);
    this.sequenceLyrics.update(lyricTime, audio);
    this.updateCinematicCamera(lyricTime);
    this.cameraRig.update(time, audio);

    this.renderGraph.capture(this.app.renderer, this.scene, time);
    this.app.renderer.render({
      container: this.app.stage,
      clear: true,
    });
  }

  getMode() {
    return this.activeMode;
  }

  destroy() {
    if (this.resizeListener) window.removeEventListener("resize", this.resizeListener);
    if (this.fullscreenListener) document.removeEventListener("fullscreenchange", this.fullscreenListener);
    if (this.visualViewportListener) window.visualViewport?.removeEventListener("resize", this.visualViewportListener);
    this.resizeObserver?.disconnect();
    this.renderGraph.destroy();
    this.app.destroy();
  }

  private applyMode(mode: SceneMode, animate: boolean) {
    if (this.activeMode === mode && animate) return;
    this.activeMode = mode;
    this.background.setMode(mode);
    this.emitBackgroundPreset();
    this.lyrics.setMode(mode);
    this.emitTypographyPreset();
    this.emitTypographyLayout();
    this.emitCompositionMotion();
    this.cameraRig.setMode(mode);
    this.displacementFX.setMode(mode);
    this.velocitySmearFX.setMode(mode);
    this.bloomThresholdFX.setMode(mode);
    this.postFX.setMode(mode);
    this.renderGraph.setMode(mode);
    this.refreshPalette();
    this.host?.setAttribute("data-scene", mode);

    if (animate) this.sceneTransition = 1;

    for (const listener of this.modeListeners) listener(mode);
  }

  private updateCinematicCamera(lyricTime: number) {
    const direction = this.currentDirection;
    if (!direction) {
      this.cameraRig.setCinematicPlan(undefined);
      return;
    }

    const phraseStart = this.lines[direction.phraseStartLine]?.start ?? lyricTime;
    const phraseEnd = this.lines[direction.phraseEndLine]?.end ?? phraseStart + 1;
    const phraseProgress = clamp(
      (lyricTime - phraseStart) / Math.max(0.08, phraseEnd - phraseStart),
    );
    const persistent = Boolean(this.sequenceLyrics.getGrammar());
    const sequenceGrammar = persistent ? this.sequenceLyrics.getGrammar() : undefined;
    const focus = persistent
      ? this.sequenceLyrics.getFocusPoint()
      : this.lyrics.getFocusPoint(lyricTime);
    const framing = persistent
      ? this.sequenceLyrics.getCameraFraming()
      : undefined;
    const activeLine = this.lines[this.lastLineIndex];
    const readability = activeLine
      ? analyzeKineticReadability({
          lineStart: activeLine.start,
          lineEnd: activeLine.end,
          words: activeLine.words,
        })
      : undefined;

    this.cameraRig.setCinematicPlan(evaluateCinematicCameraPlan({
      mode: direction.mode,
      shotRole: direction.shotRole,
      sequenceGrammar,
      phraseProgress,
      focus,
      contentCenter: framing?.center,
      contentFitScale: framing?.fitScale,
      readabilityPressure: readability?.pressure ?? 0,
      intensity: this.intensity,
    }));
  }

  private refreshPalette(time = this.lastLyricTime, dynamic = false) {
    const palette = createVisualPalette({
      harmony: this.colorHarmony,
      mood: this.colorMood,
      canvas: this.colorCanvas,
      scene: this.activeMode,
      lineIndex: this.lastLineIndex,
      hueShift: this.colorFlow === "rainbow" ? time * 2.4 : 0,
    });
    this.background.setPalette(palette, !dynamic);
    this.sequenceLyrics.setPalette(palette, !dynamic);
    this.lyrics.setPalette(palette, !dynamic);
    this.host?.setAttribute("data-harmony", palette.resolvedHarmony);
    this.host?.setAttribute("data-mood", palette.resolvedMood);
    this.host?.setAttribute("data-color-canvas", palette.resolvedCanvas);
    this.host?.setAttribute("data-color-flow", this.colorFlow);

    const key = [
      palette.resolvedHarmony,
      palette.resolvedMood,
      palette.resolvedCanvas,
      Math.round(palette.baseHue * 10),
      palette.background,
      palette.textPrimary,
      palette.accentA,
      palette.accentB,
    ].join(":");
    if (key === this.lastPaletteKey) return;
    this.lastPaletteKey = key;
    for (const listener of this.paletteListeners) listener(palette);
  }

  private refreshTypographyPresentation() {
    const direction = this.currentDirection;
    const autoAuthored = this.lyrics.getPreset() === "auto"
      && this.lyrics.getLayoutPreset() === "auto"
      && this.lyrics.getCompositionMotion() === "auto";
    let grammar: TypographySequenceGrammarId | undefined;
    if (this.typographySequence === "auto") {
      grammar = autoAuthored ? direction?.typography.sequenceGrammar : undefined;
    } else if (this.typographySequence !== "off") {
      grammar = this.typographySequence;
    }

    let scopeStart = direction?.phraseStartLine ?? Math.max(0, this.lastLineIndex);
    let scopeEnd = direction?.phraseEndLine ?? Math.max(-1, this.lastLineIndex);

    // Explicit/manual Manifesto is a continuing book/page treatment, not a
    // four-line Director phrase. Keep writing one page for a longer chapter,
    // then turn to a fresh page at a deterministic boundary.
    if (this.typographySequence === "manifesto-wall") {
      const page = resolveManifestoPageScope(
        Math.max(0, this.lastLineIndex),
        this.lines.length,
        12,
      );
      scopeStart = page.startLine;
      scopeEnd = page.endLine;
    }

    this.sequenceLyrics.setSequence(
      grammar,
      scopeStart,
      scopeEnd,
    );
    const persistent = Boolean(grammar);
    this.sequenceLyrics.container.visible = persistent;
    this.lyrics.container.visible = !persistent;
    this.host?.setAttribute("data-typography-sequence", grammar ?? "none");
    this.emitTypographySequence();
  }

  private emitBackgroundPreset() {
    const preset = this.background.getResolvedPreset();
    if (preset === this.lastBackgroundPreset) return;
    this.lastBackgroundPreset = preset;
    for (const listener of this.backgroundListeners) listener(preset);
  }

  private emitTypographySequence() {
    const sequence = this.getResolvedTypographySequence();
    if (sequence === this.lastTypographySequence) return;
    this.lastTypographySequence = sequence;
    for (const listener of this.sequenceListeners) listener(sequence);
  }

  private emitTypographyPreset() {
    const preset = this.lyrics.getResolvedPreset();
    if (preset === this.lastTypographyPreset) return;
    this.lastTypographyPreset = preset;
    for (const listener of this.typographyListeners) listener(preset);
  }

  private emitTypographyLayout() {
    const layout = this.lyrics.getResolvedLayout();
    if (layout === this.lastTypographyLayout) return;
    this.lastTypographyLayout = layout;
    for (const listener of this.layoutListeners) listener(layout);
  }

  private emitCompositionMotion() {
    const motion = this.lyrics.getResolvedCompositionMotion();
    if (motion === this.lastCompositionMotion) return;
    this.lastCompositionMotion = motion;
    for (const listener of this.compositionMotionListeners) listener(motion);
  }

  private resize() {
    if (!this.app.renderer) return;
    const rect = this.host?.getBoundingClientRect();
    const requestedW = Math.max(1, Math.round(rect?.width ?? window.innerWidth));
    const requestedH = Math.max(1, Math.round(rect?.height ?? window.innerHeight));
    const currentW = this.app.renderer.width / this.app.renderer.resolution;
    const currentH = this.app.renderer.height / this.app.renderer.resolution;
    if (Math.abs(currentW - requestedW) > 0.5 || Math.abs(currentH - requestedH) > 0.5) {
      this.app.renderer.resize(requestedW, requestedH);
    }
    const w = this.app.renderer.width / this.app.renderer.resolution;
    const h = this.app.renderer.height / this.app.renderer.resolution;
    this.background.resize(w, h);
    this.sequenceLyrics.resize(w, h);
    this.lyrics.resize(w, h);
    this.cameraRig.setViewport(w, h);

    this.root.pivot.set(w * 0.5, h * 0.5);
    this.root.position.set(w * 0.5, h * 0.5);

    const compositionResolution = this.quality === "cinema"
      ? Math.min(devicePixelRatio, 1.5)
      : Math.min(devicePixelRatio, 1);
    this.renderGraph.resize(w, h, compositionResolution);
  }
}
