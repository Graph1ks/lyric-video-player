import { Application, Container } from "pixi.js";
import type { AudioBands } from "@graph1ks/emo-audio-web";
import { SceneDirector } from "@graph1ks/emo-engine-core";
import type {
  BackgroundPreset,
  BackgroundPresetId,
  LineCue,
  QualityMode,
  SceneMode,
  TypographyPreset,
  TypographyPresetId,
  VisualMode,
} from "@graph1ks/emo-engine-core";
import { CinematicBackground } from "../effects/backgrounds/CinematicBackground";
import { KineticLyrics } from "../effects/typography/KineticLyrics";
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

  private camera = new Container();
  private background = new CinematicBackground();
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
  private lastLineIndex = -1;
  private intensity = 1;
  private host?: HTMLElement;
  private modeListeners = new Set<(mode: SceneMode) => void>();
  private typographyListeners = new Set<(preset: TypographyPresetId) => void>();
  private backgroundListeners = new Set<(preset: BackgroundPresetId) => void>();
  private lastTypographyPreset?: TypographyPresetId;
  private lastBackgroundPreset?: BackgroundPresetId;
  private sceneTransition = 0;
  private previousTime = 0;
  private resizeListener?: () => void;

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
    this.camera.addChild(this.background.container, this.lyrics.container);
    this.root.addChild(this.renderGraph.output);
    this.app.stage.addChild(this.root);

    this.applyMode("neon", false);
    this.renderGraph.setQuality(this.quality);
    this.renderGraph.setIntensity(this.intensity);
    this.resize();
    this.resizeListener = () => this.resize();
    window.addEventListener("resize", this.resizeListener);
  }

  onModeChange(listener: (mode: SceneMode) => void) {
    this.modeListeners.add(listener);
    return () => this.modeListeners.delete(listener);
  }

  setLyrics(lines: LineCue[]) {
    this.director.load(lines);
    this.renderGraph.resetFeedback();
    if (this.director.getMode() === "auto" && this.lastLineIndex >= 0) {
      this.applyMode(this.director.sceneFor(this.lastLineIndex).mode, true);
    }
  }

  setVisualMode(mode: VisualMode) {
    this.director.setMode(mode);
    if (mode !== "auto") this.applyMode(mode, true);
    else if (this.lastLineIndex >= 0) this.applyMode(this.director.sceneFor(this.lastLineIndex).mode, true);
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

  setTypographyPreset(preset: TypographyPreset) {
    this.lyrics.setPreset(preset);
    this.renderGraph.resetFeedback();
    this.emitTypographyPreset();
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

    if (index >= 0) {
      const directed = this.director.sceneFor(index);
      this.applyMode(directed.mode, true);
    }

    this.emitBackgroundPreset();
    this.lyrics.setLine(line, index);
    this.emitTypographyPreset();
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

    this.displacementFX.update(time, audio);
    this.velocitySmearFX.update(time, audio);
    this.bloomThresholdFX.update(time, audio);
    this.postFX.update(time, audio);
    this.background.update(time, audio, spectrum);
    this.lyrics.update(lyricTime, audio);
    this.cameraRig.update(time, audio);

    this.renderGraph.capture(this.app.renderer, this.camera, time);
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
    this.cameraRig.setMode(mode);
    this.displacementFX.setMode(mode);
    this.velocitySmearFX.setMode(mode);
    this.bloomThresholdFX.setMode(mode);
    this.postFX.setMode(mode);
    this.renderGraph.setMode(mode);
    this.host?.setAttribute("data-scene", mode);

    if (animate) this.sceneTransition = 1;

    for (const listener of this.modeListeners) listener(mode);
  }

  private emitBackgroundPreset() {
    const preset = this.background.getResolvedPreset();
    if (preset === this.lastBackgroundPreset) return;
    this.lastBackgroundPreset = preset;
    for (const listener of this.backgroundListeners) listener(preset);
  }

  private emitTypographyPreset() {
    const preset = this.lyrics.getResolvedPreset();
    if (preset === this.lastTypographyPreset) return;
    this.lastTypographyPreset = preset;
    for (const listener of this.typographyListeners) listener(preset);
  }

  private resize() {
    if (!this.app.renderer) return;
    const w = this.app.renderer.width / this.app.renderer.resolution;
    const h = this.app.renderer.height / this.app.renderer.resolution;
    this.background.resize(w, h);
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
