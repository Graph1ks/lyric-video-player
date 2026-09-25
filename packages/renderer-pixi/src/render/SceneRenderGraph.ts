import { BlurFilter, Container, RenderTexture, Sprite } from "pixi.js";
import type { QualityMode, SceneMode } from "@graph1ks/emo-engine-core";
import { CinematicPostFX } from "./CinematicPostFX";
import { ReactiveDisplacementFX } from "./ReactiveDisplacementFX";
import { ReactiveVelocitySmearFX } from "./ReactiveVelocitySmearFX";
import { ReactiveBloomThresholdFX } from "./ReactiveBloomThresholdFX";

interface RenderLike {
  render(options: {
    container: Container;
    target?: RenderTexture;
    clear?: boolean;
  }): void;
}

export class SceneRenderGraph {
  readonly output = new Container();

  private sceneTexture?: RenderTexture;
  private feedbackA?: RenderTexture;
  private feedbackB?: RenderTexture;
  private feedbackRead?: RenderTexture;
  private feedbackWrite?: RenderTexture;

  private fallback?: Sprite;
  private sharp?: Sprite;
  private bloom?: Sprite;
  private currentFrame?: Sprite;
  private previousFrame?: Sprite;
  private readonly feedbackStage = new Container();

  private quality: QualityMode = "cinema";
  private mode: SceneMode = "neon";
  private intensity = 1;
  private feedbackMix = 1;
  private bloomMix = 1;
  private width = 1;
  private height = 1;
  private resolution = 1;
  private feedbackPrimed = false;
  private lastFeedbackTime?: number;

  private readonly bloomFilter = new BlurFilter({
    strength: 18,
    quality: 2,
    kernelSize: 9,
    resolution: 0.5,
  });

  constructor(
    private readonly displacementFX: ReactiveDisplacementFX,
    private readonly velocitySmearFX: ReactiveVelocitySmearFX,
    private readonly bloomThresholdFX: ReactiveBloomThresholdFX,
    private readonly postFX: CinematicPostFX,
  ) {}

  resize(width: number, height: number, resolution: number) {
    const nextWidth = Math.max(1, Math.round(width));
    const nextHeight = Math.max(1, Math.round(height));
    const nextResolution = Math.max(0.5, Math.min(2, resolution));

    if (
      this.sceneTexture &&
      this.width === nextWidth &&
      this.height === nextHeight &&
      Math.abs(this.resolution - nextResolution) < 0.001
    ) {
      return;
    }

    this.width = nextWidth;
    this.height = nextHeight;
    this.resolution = nextResolution;

    const oldTextures = [this.sceneTexture, this.feedbackA, this.feedbackB].filter(Boolean) as RenderTexture[];

    this.sceneTexture = this.createTarget("E-MO Scene");
    this.feedbackA = this.createTarget("E-MO Feedback A");
    this.feedbackB = this.createTarget("E-MO Feedback B");
    this.feedbackRead = this.feedbackA;
    this.feedbackWrite = this.feedbackB;

    if (!this.currentFrame) {
      this.currentFrame = new Sprite(this.sceneTexture);
      this.feedbackStage.addChild(this.currentFrame);
    } else {
      this.currentFrame.texture = this.sceneTexture;
    }

    if (!this.previousFrame) {
      this.previousFrame = new Sprite(this.feedbackRead);
      this.previousFrame.anchor.set(0.5);
      this.previousFrame.blendMode = "add";
      this.feedbackStage.addChild(this.previousFrame);
    } else {
      this.previousFrame.texture = this.feedbackRead;
    }

    // Keep an unfiltered copy under the entire presentation stack. Spatial
    // filters are allowed to distort the scene, but a clipped/transparent filter
    // sample must reveal the same current frame rather than the canvas clear
    // color. This is deliberately a Sprite, not another RenderTexture.
    if (!this.fallback) {
      this.fallback = new Sprite(this.sceneTexture);
      this.output.addChild(this.fallback);
    } else {
      this.fallback.texture = this.sceneTexture;
    }

    if (!this.bloom) {
      this.bloom = new Sprite(this.sceneTexture);
      this.bloom.blendMode = "add";
      this.bloom.filters = [this.bloomThresholdFX.filter, this.bloomFilter];
      this.output.addChild(this.bloom);
    } else {
      this.bloom.texture = this.sceneTexture;
    }

    if (!this.sharp) {
      this.sharp = new Sprite(this.sceneTexture);
      this.sharp.filters = [this.displacementFX.filter, this.velocitySmearFX.filter, this.postFX.filter];
      this.output.addChild(this.sharp);
    } else {
      this.sharp.texture = this.sceneTexture;
    }

    this.resetFeedback();
    this.applyPresentation();
    oldTextures.forEach(texture => texture.destroy(true));
  }

  setQuality(quality: QualityMode) {
    if (this.quality === quality) return;
    this.quality = quality;
    this.resetFeedback();
    this.applyPresentation();
  }

  setMode(mode: SceneMode) {
    if (this.mode === mode) return;
    this.mode = mode;
    this.resetFeedback();
    this.applyFeedbackTransform();
  }

  setIntensity(value: number) {
    const next = Math.max(0.2, Math.min(1.8, value));
    if (Math.abs(this.intensity - next) < 0.001) return;
    this.intensity = next;
    this.applyPresentation();
    this.applyFeedbackTransform();
  }

  setFeedbackMix(value: number) {
    this.feedbackMix = Math.max(0, Math.min(3, value));
    this.applyFeedbackTransform();
  }

  setBloomMix(value: number) {
    this.bloomMix = Math.max(0, Math.min(3, value));
    this.applyPresentation();
  }

  resetFeedback() {
    this.feedbackPrimed = false;
    this.lastFeedbackTime = undefined;
    if (this.previousFrame) this.previousFrame.visible = false;
  }

  capture(renderer: RenderLike, scene: Container, time: number) {
    if (!this.sceneTexture) return;

    renderer.render({
      container: scene,
      target: this.sceneTexture,
      clear: true,
    });

    if (
      this.quality !== "cinema" ||
      !this.feedbackRead ||
      !this.feedbackWrite ||
      !this.currentFrame ||
      !this.previousFrame
    ) {
      this.present(this.sceneTexture);
      this.lastFeedbackTime = time;
      return;
    }

    const delta = this.lastFeedbackTime === undefined ? undefined : time - this.lastFeedbackTime;
    const discontinuity = delta !== undefined && (delta < -0.01 || delta > 0.35);
    if (discontinuity) this.feedbackPrimed = false;

    const shouldAdvance = !this.feedbackPrimed || delta === undefined || delta > 1 / 240;

    if (shouldAdvance) {
      this.currentFrame.texture = this.sceneTexture;
      this.previousFrame.texture = this.feedbackRead;
      this.previousFrame.visible = this.feedbackPrimed;
      this.applyFeedbackTransform();

      renderer.render({
        container: this.feedbackStage,
        target: this.feedbackWrite,
        clear: true,
      });

      const presented = this.feedbackWrite;
      const oldRead = this.feedbackRead;
      this.feedbackRead = presented;
      this.feedbackWrite = oldRead;
      this.feedbackPrimed = true;
      this.present(presented);
    } else if (this.feedbackPrimed) {
      this.present(this.feedbackRead);
    } else {
      this.present(this.sceneTexture);
    }

    this.lastFeedbackTime = time;
  }

  destroy() {
    for (const child of this.output.removeChildren()) child.destroy();
    for (const child of this.feedbackStage.removeChildren()) child.destroy();
    this.sceneTexture?.destroy(true);
    this.feedbackA?.destroy(true);
    this.feedbackB?.destroy(true);
    this.sceneTexture = undefined;
    this.feedbackA = undefined;
    this.feedbackB = undefined;
    this.feedbackRead = undefined;
    this.feedbackWrite = undefined;
    this.fallback = undefined;
    this.sharp = undefined;
    this.bloom = undefined;
    this.currentFrame = undefined;
    this.previousFrame = undefined;
  }

  private createTarget(label: string) {
    return RenderTexture.create({
      width: this.width,
      height: this.height,
      resolution: this.resolution,
      antialias: true,
      label,
    });
  }

  private present(texture: RenderTexture) {
    if (this.fallback) this.fallback.texture = texture;
    if (this.sharp) this.sharp.texture = texture;
    if (this.bloom) this.bloom.texture = texture;
  }

  private applyPresentation() {
    if (!this.bloom) return;
    const qualityScale = this.quality === "cinema" ? 1 : 0.45;
    this.bloom.alpha = Math.min(1, (0.16 + this.intensity * 0.1) * qualityScale * this.bloomMix);
  }

  private applyFeedbackTransform() {
    if (!this.previousFrame) return;

    const baseAlpha = this.mode === "vortex"
      ? 0.11
      : this.mode === "poster"
        ? 0.055
        : 0.075;
    const scaleLift = this.mode === "vortex"
      ? 0.012
      : this.mode === "poster"
        ? 0.0035
        : 0.006;

    this.previousFrame.position.set(this.width * 0.5, this.height * 0.5);
    this.previousFrame.alpha = Math.min(0.52, baseAlpha * this.intensity * this.feedbackMix);
    this.previousFrame.scale.set(1 + scaleLift * this.intensity * this.feedbackMix);
    this.previousFrame.rotation = this.mode === "vortex" ? 0.0025 * this.intensity * this.feedbackMix : 0;
  }
}
