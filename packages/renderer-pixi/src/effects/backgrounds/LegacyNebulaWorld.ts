import { Container, Graphics } from "pixi.js";
import type { AudioBands } from "@graph1ks/emo-audio-web";
import {
  clamp,
  hash01,
  type QualityMode,
  type VisualPalette,
} from "@graph1ks/emo-engine-core";

export class LegacyNebulaWorld {
  readonly container = new Container();

  private readonly body = new Graphics();
  private readonly glow = new Graphics();
  private readonly dust = new Graphics();
  private w = 1;
  private h = 1;
  private intensity = 1;
  private detail = 1;
  private quality: QualityMode = "cinema";
  private palette?: VisualPalette;

  constructor() {
    this.glow.blendMode = "add";
    this.dust.blendMode = "add";
    this.container.addChild(this.body, this.glow, this.dust);
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
    this.body.clear();
    this.glow.clear();
    this.dust.clear();

    const p = this.palette;
    const background = p?.background ?? 0x020910;
    const surface = p?.surface ?? 0x071c24;
    const accentA = p?.accentA ?? 0x72fff3;
    const accentB = p?.accentB ?? 0x8c65ff;
    const glow = p?.glow ?? 0xe8fffb;
    const power = clamp(this.intensity / 3);
    const detail01 = clamp(this.detail / 3);
    const cinema = this.quality === "cinema";

    this.body.rect(0, 0, this.w, this.h).fill({ color: background, alpha: 1 });

    // Dedicated cloud masses are layered by depth. Their trajectories and
    // footprints are deterministic functions of time, never of analyser bands.
    const cloudCount = Math.max(
      7,
      Math.round((cinema ? 16 : 10) * (0.6 + detail01 * 0.9)),
    );
    const minDim = Math.min(this.w, this.h);
    const lightGain = 0.72 + audio.energy * 0.24;

    for (let index = cloudCount - 1; index >= 0; index--) {
      const sx = hash01(index * 53.17 + 1.2);
      const sy = hash01(index * 97.31 + 8.8);
      const depth = hash01(index * 149.73 + 4.4);
      const orbit = time * (0.018 + depth * 0.026) + index * 0.63;
      const x = this.w * (0.08 + sx * 0.84)
        + Math.sin(orbit * 0.91) * this.w * (0.035 + depth * 0.045);
      const y = this.h * (0.12 + sy * 0.76)
        + Math.cos(orbit * 0.73) * this.h * (0.025 + depth * 0.04);
      const rx = minDim * (0.11 + depth * 0.15) * (0.82 + power * 0.22);
      const ry = rx * (0.42 + hash01(index * 211.9 + 7.1) * 0.34);
      const color = index % 3 === 0 ? accentB : index % 2 === 0 ? accentA : surface;
      const alpha = (0.018 + depth * 0.026 + power * 0.018) * lightGain;

      // Multiple nested ellipses create a coherent volume instead of generic
      // independent blobs.
      this.glow
        .ellipse(x, y, rx * 1.42, ry * 1.42)
        .fill({ color, alpha: alpha * 0.22 });
      this.body
        .ellipse(x, y, rx, ry)
        .fill({ color, alpha });
      this.body
        .ellipse(
          x + Math.sin(orbit + 1.7) * rx * 0.22,
          y + Math.cos(orbit - 0.8) * ry * 0.18,
          rx * 0.58,
          ry * 0.62,
        )
        .fill({ color: index % 2 ? accentA : accentB, alpha: alpha * 0.64 });
    }

    // Long filaments give the cloud field directional structure and a strong
    // paused-frame silhouette.
    const filamentCount = Math.max(3, Math.round(4 + detail01 * 6));
    for (let index = 0; index < filamentCount; index++) {
      const yBase = this.h * (0.16 + index / Math.max(1, filamentCount - 1) * 0.68);
      const amplitude = this.h * (0.025 + hash01(index * 83.4 + 2.9) * 0.04);
      const phase = time * (0.07 + index * 0.004) + index * 1.4;
      const segments = 28;
      let prevX = 0;
      let prevY = 0;
      for (let segment = 0; segment <= segments; segment++) {
        const t = segment / segments;
        const x = t * this.w;
        const y = yBase
          + Math.sin(t * Math.PI * (1.6 + index * 0.11) + phase) * amplitude
          + Math.sin(t * Math.PI * 5.2 - phase * 0.43) * amplitude * 0.18;
        if (segment > 0) {
          this.glow
            .moveTo(prevX, prevY)
            .lineTo(x, y)
            .stroke({
              width: 2.2 + power * 1.2,
              color: index % 2 ? accentA : accentB,
              alpha: 0.012 + audio.energy * 0.012,
            });
        }
        prevX = x;
        prevY = y;
      }
    }

    const dustCount = Math.max(
      20,
      Math.round((cinema ? 92 : 48) * (0.45 + detail01 * 0.8)),
    );
    for (let index = 0; index < dustCount; index++) {
      const sx = hash01(index * 43.1 + 5.5);
      const sy = hash01(index * 101.7 + 2.2);
      const depth = hash01(index * 173.9 + 9.9);
      const x = (sx * this.w + time * (1.2 + depth * 4.5)) % this.w;
      const y = sy * this.h + Math.sin(time * 0.025 + index) * (2 + depth * 7);
      this.dust
        .circle(x, y, 0.35 + depth * 1.25)
        .fill({
          color: index % 5 === 0 ? accentB : glow,
          alpha: 0.016 + depth * 0.035 + audio.treble * 0.018,
        });
    }
  }
}
