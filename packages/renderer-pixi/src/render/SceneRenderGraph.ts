import { BlurFilter, Container, RenderTexture, Sprite } from "pixi.js";
import type { QualityMode } from "@graph1ks/emo-engine-core";
import { CinematicPostFX } from "./CinematicPostFX";

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
  private sharp?: Sprite;
  private bloom?: Sprite;
  private quality: QualityMode = "cinema";
  private intensity = 1;
  private width = 1;
  private height = 1;
  private resolution = 1;
  private readonly bloomFilter = new BlurFilter({
    strength: 18,
    quality: 2,
    kernelSize: 9,
    resolution: 0.5,
  });

  constructor(private readonly postFX: CinematicPostFX) {}

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

    const texture = RenderTexture.create({
      width: nextWidth,
      height: nextHeight,
      resolution: nextResolution,
      antialias: true,
      label: "E-MO Scene Composite",
    });

    const previous = this.sceneTexture;
    this.sceneTexture = texture;

    if (!this.bloom) {
      this.bloom = new Sprite(texture);
      this.bloom.blendMode = "add";
      this.bloom.filters = [this.bloomFilter];
      this.output.addChild(this.bloom);
    } else {
      this.bloom.texture = texture;
    }

    if (!this.sharp) {
      this.sharp = new Sprite(texture);
      this.sharp.filters = [this.postFX.filter];
      this.output.addChild(this.sharp);
    } else {
      this.sharp.texture = texture;
    }

    this.applyPresentation();
    previous?.destroy(true);
  }

  setQuality(quality: QualityMode) {
    this.quality = quality;
    this.applyPresentation();
  }

  setIntensity(value: number) {
    this.intensity = Math.max(0.2, Math.min(1.8, value));
    this.applyPresentation();
  }

  capture(renderer: RenderLike, scene: Container) {
    if (!this.sceneTexture) return;
    renderer.render({
      container: scene,
      target: this.sceneTexture,
      clear: true,
    });
  }

  destroy() {
    this.output.removeChildren();
    this.sceneTexture?.destroy(true);
    this.sceneTexture = undefined;
    this.sharp = undefined;
    this.bloom = undefined;
  }

  private applyPresentation() {
    if (!this.bloom) return;
    const qualityScale = this.quality === "cinema" ? 1 : 0.45;
    this.bloom.alpha = Math.min(0.5, (0.16 + this.intensity * 0.1) * qualityScale);
  }
}
