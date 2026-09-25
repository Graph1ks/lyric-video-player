import { Container, Graphics } from "pixi.js";
import type { AudioBands } from "@graph1ks/emo-audio-web";
import {
  clamp,
  hash01,
  type QualityMode,
  type VisualPalette,
} from "@graph1ks/emo-engine-core";

export class LegacyRaysWorld {
  readonly container = new Container();

  private readonly haze = new Graphics();
  private readonly shafts = new Graphics();
  private readonly fixtures = new Graphics();
  private w = 1;
  private h = 1;
  private intensity = 1;
  private detail = 1;
  private quality: QualityMode = "cinema";
  private palette?: VisualPalette;

  constructor() {
    this.haze.blendMode = "add";
    this.shafts.blendMode = "add";
    this.fixtures.blendMode = "add";
    this.container.addChild(this.haze, this.shafts, this.fixtures);
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

  update(time: number, audio: AudioBands, burst = 0) {
    if (!this.container.visible) return;
    this.draw(time, audio, burst);
    this.container.alpha = clamp(this.intensity, 0, 1);
  }

  private draw(time: number, audio: AudioBands, burst: number) {
    this.haze.clear();
    this.shafts.clear();
    this.fixtures.clear();

    const p = this.palette;
    const background = p?.background ?? 0x02070a;
    const surface = p?.surface ?? 0x071a22;
    const accentA = p?.accentA ?? 0x6efff0;
    const accentB = p?.accentB ?? 0x7a63ff;
    const glow = p?.glow ?? 0xd9fffb;
    const power = clamp(this.intensity / 3);
    const detail01 = clamp(this.detail / 3);
    const cinema = this.quality === "cinema";

    this.haze.rect(0, 0, this.w, this.h).fill({ color: background, alpha: 1 });

    // A stable atmospheric stage gives Rays a paused-frame identity. Audio only
    // changes light response; targeting, origin and shaft geometry are time-owned.
    const horizon = this.h * 0.66;
    this.haze
      .rect(0, horizon - this.h * 0.12, this.w, this.h * 0.34)
      .fill({ color: surface, alpha: 0.11 + power * 0.11 });

    const beamCount = Math.max(
      6,
      Math.min(24, Math.round((cinema ? 12 : 8) * (0.72 + detail01 * 0.9))),
    );
    const targetX = this.w * (0.5 + Math.sin(time * 0.071) * 0.11);
    const targetY = this.h * (0.50 + Math.cos(time * 0.053) * 0.07);
    const lightGain = 0.72 + audio.energy * 0.32 + burst * 0.34;

    for (let index = 0; index < beamCount; index++) {
      const seed = hash01(index * 113.17 + 17.3);
      const fromTop = index % 3 !== 2;
      const originX = this.w * (0.04 + hash01(seed * 97.1 + 3.2) * 0.92);
      const originY = fromTop
        ? this.h * (0.018 + hash01(seed * 61.3 + 8.4) * 0.10)
        : this.h * (0.17 + hash01(seed * 41.7 + 4.6) * 0.18);
      const localTargetX = targetX
        + Math.sin(time * (0.043 + seed * 0.018) + index * 1.73)
          * this.w * (0.045 + seed * 0.035);
      const localTargetY = targetY
        + Math.cos(time * (0.037 + seed * 0.014) + index * 0.91)
          * this.h * 0.055;

      const dx = localTargetX - originX;
      const dy = localTargetY - originY;
      const length = Math.hypot(dx, dy) || 1;
      const nx = -dy / length;
      const ny = dx / length;
      const baseWidth = this.w * (0.008 + seed * 0.012) * (0.8 + power * 0.45);
      const endWidth = baseWidth * (2.4 + seed * 1.4);
      const color = index % 3 === 0 ? accentB : accentA;
      const shaftAlpha = (0.018 + seed * 0.018 + power * 0.032) * lightGain;

      // Three nested passes emulate a volumetric falloff without changing the
      // beam footprint when music hits.
      for (let pass = 2; pass >= 0; pass--) {
        const spread = pass === 2 ? 3.6 : pass === 1 ? 2.1 : 1;
        const alpha = shaftAlpha * (pass === 2 ? 0.22 : pass === 1 ? 0.42 : 0.82);
        this.shafts
          .poly([
            originX - nx * baseWidth * spread,
            originY - ny * baseWidth * spread,
            originX + nx * baseWidth * spread,
            originY + ny * baseWidth * spread,
            localTargetX + nx * endWidth * spread,
            localTargetY + ny * endWidth * spread,
            localTargetX - nx * endWidth * spread,
            localTargetY - ny * endWidth * spread,
          ])
          .fill({ color, alpha });
      }

      this.fixtures
        .circle(originX, originY, 2.3 + seed * 2.8)
        .fill({ color: glow, alpha: 0.16 + power * 0.2 + burst * 0.16 });
      this.fixtures
        .circle(localTargetX, localTargetY, 1.2 + seed * 2.0)
        .fill({ color, alpha: 0.06 + audio.treble * 0.08 + burst * 0.08 });
    }

    // Sparse dust catches light but does not move with audio.
    const dustCount = Math.max(8, Math.round((cinema ? 36 : 18) * (0.5 + detail01)));
    for (let index = 0; index < dustCount; index++) {
      const sx = hash01(index * 71.9 + 2.7);
      const sy = hash01(index * 131.3 + 9.2);
      const x = (sx * this.w + time * (2 + sx * 5)) % this.w;
      const y = this.h * (0.12 + sy * 0.78);
      this.haze
        .circle(x, y, 0.5 + sx * 1.1)
        .fill({
          color: index % 4 === 0 ? accentB : glow,
          alpha: 0.018 + audio.treble * 0.028,
        });
    }
  }
}
