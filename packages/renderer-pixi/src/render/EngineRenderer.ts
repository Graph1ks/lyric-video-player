import { Application, Container } from "pixi.js";
import type { AudioBands } from "@graph1ks/emo-audio-web";
import { SceneDirector } from "@graph1ks/emo-engine-core";
import type { LineCue, QualityMode, SceneMode, VisualMode } from "@graph1ks/emo-engine-core";
import { CinematicBackground } from "../effects/backgrounds/CinematicBackground";
import { KineticLyrics } from "../effects/typography/KineticLyrics";
import { CameraRig } from "./CameraRig";
import { CinematicPostFX } from "./CinematicPostFX";
import { SceneRenderGraph } from "./SceneRenderGraph";

export class EngineRenderer {
  readonly app = new Application();
  readonly root = new Container();

  private camera = new Container();
  private background = new CinematicBackground();
  private lyrics = new KineticLyrics();
  private director = new SceneDirector();
  private cameraRig = new CameraRig(this.camera);
  private postFX = new CinematicPostFX();
  private renderGraph = new SceneRenderGraph(this.postFX);
  private activeMode: SceneMode = "neon";
  private quality: QualityMode = "cinema";
  private lastLineIndex = -1;
  private intensity = 1;
  private host?: HTMLElement;
  private modeListeners = new Set<(mode: SceneMode) => void>();
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
    if (this.director.getMode() === "auto" && this.lastLineIndex >= 0) {
      this.applyMode(this.director.sceneFor(this.lastLineIndex).mode, true);
    }
  }

  setVisualMode(mode: VisualMode) {
    this.director.setMode(mode);
    if (mode !== "auto") this.applyMode(mode, true);
    else if (this.lastLineIndex >= 0) this.applyMode(this.director.sceneFor(this.lastLineIndex).mode, true);
  }

  setIntensity(value: number) {
    this.intensity = Math.max(0.2, Math.min(1.8, value));
    this.background.setIntensity(this.intensity);
    this.lyrics.setIntensity(this.intensity);
    this.cameraRig.setIntensity(this.intensity);
    this.postFX.setIntensity(this.intensity);
    this.renderGraph.setIntensity(this.intensity);
  }

  setQuality(quality: QualityMode) {
    this.quality = quality;
    this.background.setQuality(quality);
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
    this.lastLineIndex = index;

    if (index >= 0) {
      const directed = this.director.sceneFor(index);
      this.applyMode(directed.mode, true);
    }

    this.lyrics.setLine(line, index);
    if (line) {
      this.background.hit(0.92 + (index % 3) * 0.08);
      this.cameraRig.lineHit(index);
    }
  }

  update(time: number, audio: AudioBands, lyricTime = time) {
    if (!this.app.renderer) return;

    const rawDt = this.previousTime ? time - this.previousTime : 1 / 60;
    const dt = Math.min(0.08, Math.max(1 / 240, Math.abs(rawDt)));
    this.previousTime = time;
    this.sceneTransition *= Math.pow(0.006, dt);
    this.root.alpha = 1 - this.sceneTransition * 0.28;
    const rootScale = 1 + this.sceneTransition * 0.045;
    this.root.scale.set(rootScale);

    this.postFX.update(time, audio);
    this.background.update(time, audio);
    this.lyrics.update(lyricTime, audio);
    this.cameraRig.update(time, audio);

    this.renderGraph.capture(this.app.renderer, this.camera);
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
    this.lyrics.setMode(mode);
    this.cameraRig.setMode(mode);
    this.postFX.setMode(mode);
    this.host?.setAttribute("data-scene", mode);

    if (animate) this.sceneTransition = 1;

    for (const listener of this.modeListeners) listener(mode);
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
