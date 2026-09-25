import { Container, Graphics } from "pixi.js";
import type { AudioBands } from "@graph1ks/emo-audio-web";
import {
  clamp,
  hash01,
  type QualityMode,
  type VisualPalette,
} from "@graph1ks/emo-engine-core";

export class LegacyStarfieldWorld {
  readonly container = new Container();

  private readonly field = new Graphics();
  private readonly glow = new Graphics();
  private w = 1;
  private h = 1;
  private intensity = 1;
  private detail = 1;
  private quality: QualityMode = "cinema";
  private palette?: VisualPalette;

  constructor() {
    this.glow.blendMode = "add";
    this.container.addChild(this.field, this.glow);
    this.container.visible = false;
  }

  setPalette(palette: VisualPalette) {
    this.palette = palette;
  }

  setIntensity(value: number) {
    this.intensity = clamp(value, 0, 3);
  }

  setDetail(value: number) {
    this.detail = clamp(value, 0, 3);
  }

  setQuality(value: QualityMode) {
    this.quality = value;
  }

  resize(w: number, h: number) {
    this.w = Math.max(1, w);
    this.h = Math.max(1, h);
  }

  update(time: number, audio: AudioBands) {
    if (!this.container.visible) return;
    this.draw(time, audio);
    this.container.alpha = clamp(this.intensity, 0, 1);
  }

  private draw(time: number, audio: AudioBands) {
    this.field.clear();
    this.glow.clear();

    const p = this.palette;
    const background = p?.background ?? 0x01040a;
    const accentA = p?.accentA ?? 0x8cfff7;
    const accentB = p?.accentB ?? 0x8c6fff;
    const glow = p?.glow ?? 0xf2ffff;
    const power = clamp(this.intensity / 3);
    const detail01 = clamp(this.detail / 3);
    const cinema = this.quality === "cinema";

    this.field.rect(0, 0, this.w, this.h).fill({ color: background, alpha: 1 });

    const cx = this.w * (0.5 + Math.sin(time * 0.021) * 0.018);
    const cy = this.h * (0.48 + Math.cos(time * 0.017) * 0.014);
    const focal = Math.min(this.w, this.h) * 0.88;
    const count = Math.max(
      72,
      Math.round((cinema ? 240 : 132) * (0.45 + detail01 * 0.95)),
    );
    const speed = 0.085 + detail01 * 0.035;
    const brightness = 0.76 + audio.energy * 0.24;

    // Every point owns stable world-space x/y and travels monotonically toward
    // the camera in z. Wrapping creates a continuous field without reversals.
    for (let index = 0; index < count; index++) {
      const seedX = hash01(index * 37.17 + 2.1);
      const seedY = hash01(index * 79.31 + 8.7);
      const seedZ = hash01(index * 131.73 + 4.3);
      const depthProgress = fract(seedZ + time * speed);
      const z = 0.35 + (1 - depthProgress) * 7.8;
      const x3 = (seedX * 2 - 1) * 4.8;
      const y3 = (seedY * 2 - 1) * 3.0;
      const perspective = focal / (z + 1.6);
      const x = cx + x3 * perspective;
      const y = cy + y3 * perspective;
      if (x < -20 || x > this.w + 20 || y < -20 || y > this.h + 20) continue;

      const size = clamp((0.7 + depthProgress * 2.8) * (0.72 + power * 0.35), 0.5, 4.6);
      const alpha = clamp((0.10 + depthProgress * 0.72) * brightness, 0, 0.92);
      const color = index % 7 === 0 ? accentB : index % 3 === 0 ? accentA : glow;

      if (depthProgress > 0.42) {
        const previousDepth = Math.max(0, depthProgress - (0.015 + power * 0.018));
        const previousZ = 0.35 + (1 - previousDepth) * 7.8;
        const previousPerspective = focal / (previousZ + 1.6);
        const px = cx + x3 * previousPerspective;
        const py = cy + y3 * previousPerspective;
        this.glow
          .moveTo(px, py)
          .lineTo(x, y)
          .stroke({
            width: Math.max(0.55, size * 0.42),
            color,
            alpha: alpha * (0.12 + power * 0.16),
          });
      }

      this.glow
        .circle(x, y, size * 2.8)
        .fill({ color, alpha: alpha * 0.045 });
      this.field
        .circle(x, y, size)
        .fill({ color, alpha });
    }

    // Faint perspective spokes make depth readable even in a paused frame.
    const guideCount = Math.max(6, Math.round(8 + detail01 * 8));
    const guideRadius = Math.hypot(this.w, this.h) * 0.72;
    for (let index = 0; index < guideCount; index++) {
      const angle = index / guideCount * Math.PI * 2 + time * 0.008;
      this.field
        .moveTo(cx + Math.cos(angle) * 18, cy + Math.sin(angle) * 18)
        .lineTo(cx + Math.cos(angle) * guideRadius, cy + Math.sin(angle) * guideRadius)
        .stroke({
          width: 0.6,
          color: index % 2 ? accentA : accentB,
          alpha: 0.008 + power * 0.008 + audio.treble * 0.006,
        });
    }
  }
}

function fract(value: number) {
  return value - Math.floor(value);
}
