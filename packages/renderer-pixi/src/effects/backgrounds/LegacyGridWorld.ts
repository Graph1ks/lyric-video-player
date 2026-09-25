import { Container, Graphics } from "pixi.js";
import type { AudioBands } from "@graph1ks/emo-audio-web";
import {
  clamp,
  hash01,
  type QualityMode,
  type VisualPalette,
} from "@graph1ks/emo-engine-core";

export class LegacyGridWorld {
  readonly container = new Container();

  private readonly floor = new Graphics();
  private readonly glow = new Graphics();
  private readonly structure = new Graphics();
  private w = 1;
  private h = 1;
  private intensity = 1;
  private detail = 1;
  private quality: QualityMode = "cinema";
  private palette?: VisualPalette;

  constructor() {
    this.glow.blendMode = "add";
    this.container.addChild(this.floor, this.glow, this.structure);
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
    this.floor.clear();
    this.glow.clear();
    this.structure.clear();

    const p = this.palette;
    const background = p?.background ?? 0x02080b;
    const surface = p?.surface ?? 0x07151b;
    const accentA = p?.accentA ?? 0x70fff2;
    const accentB = p?.accentB ?? 0x7568ff;
    const glow = p?.glow ?? 0xe8fffc;
    const power = clamp(this.intensity / 3);
    const detail01 = clamp(this.detail / 3);
    const cinema = this.quality === "cinema";

    this.floor.rect(0, 0, this.w, this.h).fill({ color: background, alpha: 1 });

    const horizon = this.h * 0.57;
    const vx = this.w * (0.5 + Math.sin(time * 0.026) * 0.035);
    const vy = horizon + Math.cos(time * 0.021) * this.h * 0.008;
    const columns = Math.max(
      10,
      Math.min(36, Math.round((cinema ? 20 : 14) * (0.72 + detail01 * 0.72))),
    );
    const lineGain = 0.74 + audio.energy * 0.24;

    // Ground-plane rays establish perspective explicitly.
    for (let index = 0; index <= columns; index++) {
      const t = index / columns;
      const bottomX = (t - 0.5) * this.w * 1.45 + this.w * 0.5;
      this.glow
        .moveTo(vx, vy)
        .lineTo(bottomX, this.h)
        .stroke({
          width: 2.8 + power * 1.2,
          color: index % 4 === 0 ? accentB : accentA,
          alpha: (0.012 + power * 0.012) * lineGain,
        });
      this.floor
        .moveTo(vx, vy)
        .lineTo(bottomX, this.h)
        .stroke({
          width: index % 4 === 0 ? 1.25 : 0.8,
          color: index % 4 === 0 ? accentB : accentA,
          alpha: (0.06 + power * 0.045) * lineGain,
        });
    }

    // Horizontal depth slices scroll monotonically toward the camera.
    const rows = Math.max(
      8,
      Math.min(30, Math.round((cinema ? 18 : 11) * (0.7 + detail01 * 0.72))),
    );
    const scroll = fract(time * (0.16 + detail01 * 0.035));
    for (let index = 0; index < rows; index++) {
      const phase = (index + scroll) / rows;
      const depth = phase * phase;
      const y = vy + (this.h - vy) * depth;
      const halfWidth = this.w * (0.035 + depth * 0.69);
      const alpha = (0.045 + depth * 0.12) * lineGain;
      this.floor
        .moveTo(vx - halfWidth, y)
        .lineTo(vx + halfWidth, y)
        .stroke({
          width: 0.7 + depth * 1.2,
          color: index % 5 === 0 ? accentB : accentA,
          alpha,
        });
    }

    // Side architecture turns the floor into a spatial wireframe environment
    // instead of a flat retro grid.
    const towerPairs = Math.max(3, Math.round(4 + detail01 * 5));
    for (let index = 0; index < towerPairs; index++) {
      const t = index / Math.max(1, towerPairs - 1);
      const depth = 0.15 + t * 0.85;
      const yBase = vy + (this.h - vy) * depth * depth;
      const height = this.h * (0.06 + depth * 0.27);
      const offset = this.w * (0.11 + depth * 0.53);
      const width = this.w * (0.012 + depth * 0.024);
      const sway = Math.sin(time * 0.019 + index * 0.83) * this.w * 0.006;

      for (const side of [-1, 1] as const) {
        const x = vx + side * offset + sway * side;
        const top = yBase - height;
        const color = (index + (side > 0 ? 1 : 0)) % 2 ? accentB : accentA;
        this.structure
          .rect(x - width * 0.5, top, width, height)
          .stroke({
            width: 0.9 + depth * 0.7,
            color,
            alpha: 0.035 + depth * 0.07 + power * 0.02,
          });
        this.structure
          .moveTo(x - width * 0.5, top)
          .lineTo(vx, vy)
          .stroke({
            width: 0.55,
            color: surface,
            alpha: 0.05 + depth * 0.04,
          });
      }
    }

    this.glow
      .circle(vx, vy, 5 + power * 4)
      .fill({ color: glow, alpha: 0.08 + audio.treble * 0.08 });
    this.glow
      .rect(0, vy - 1, this.w, 2)
      .fill({ color: accentA, alpha: 0.03 + power * 0.025 });
  }
}

function fract(value: number) {
  return value - Math.floor(value);
}
