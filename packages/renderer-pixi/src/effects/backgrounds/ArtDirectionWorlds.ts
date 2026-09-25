import { Container, Graphics } from "pixi.js";
import type {
  AudioBands,
  BackgroundPresetId,
  QualityMode,
  VisualPalette,
} from "@graph1ks/emo-engine-core";
import { hash01 } from "@graph1ks/emo-engine-core";

const ART_PRESETS = new Set<BackgroundPresetId>([
  "editorial",
  "print",
  "architecture",
  "aurora",
]);

export class ArtDirectionWorlds {
  readonly container = new Container();

  private back = new Graphics();
  private mid = new Graphics();
  private front = new Graphics();
  private preset: BackgroundPresetId = "cinematic";
  private palette?: VisualPalette;
  private quality: QualityMode = "cinema";
  private w = 1;
  private h = 1;
  private intensity = 1;
  private lineIndex = -1;

  constructor() {
    this.container.addChild(this.back, this.mid, this.front);
    this.container.visible = false;
  }

  setPreset(preset: BackgroundPresetId) {
    this.preset = preset;
    this.container.visible = ART_PRESETS.has(preset);
    if (!this.container.visible) this.clear();
  }

  setPalette(palette: VisualPalette) {
    this.palette = palette;
  }

  setQuality(quality: QualityMode) {
    this.quality = quality;
  }

  setIntensity(value: number) {
    this.intensity = Math.max(0.2, Math.min(1.8, value));
  }

  setLineIndex(index: number) {
    this.lineIndex = index;
  }

  resize(w: number, h: number) {
    this.w = Math.max(1, w);
    this.h = Math.max(1, h);
  }

  update(time: number, audio: AudioBands) {
    if (!this.container.visible || !this.palette) return;
    this.clear();

    if (this.preset === "editorial") this.drawEditorial(time, audio);
    else if (this.preset === "print") this.drawPrint(time, audio);
    else if (this.preset === "architecture") this.drawArchitecture(time, audio);
    else if (this.preset === "aurora") this.drawAurora(time, audio);
  }

  private clear() {
    this.back.clear();
    this.mid.clear();
    this.front.clear();
  }

  private drawEditorial(time: number, audio: AudioBands) {
    const p = this.palette!;
    const w = this.w;
    const h = this.h;
    const pulse = 1 + audio.bass * 0.05 * this.intensity;
    const drift = Math.sin(time * 0.28 + this.lineIndex * 0.61);
    const vertical = this.lineIndex % 2 === 0;

    if (vertical) {
      const leftWidth = w * (0.11 + 0.025 * drift);
      const rightWidth = w * (0.14 - 0.02 * drift);
      this.back.rect(0, 0, leftWidth, h).fill({ color: p.accentA, alpha: 0.17 });
      this.back.rect(w - rightWidth, 0, rightWidth, h).fill({ color: p.surface, alpha: 0.78 });
      this.mid.rect(w * 0.025, h * 0.12, w * 0.018, h * 0.76).fill({ color: p.textPrimary, alpha: 0.18 });
      this.mid.rect(w * 0.91, h * 0.08, w * 0.035, h * 0.84).fill({ color: p.accentB, alpha: 0.13 });
    } else {
      const topHeight = h * (0.13 + 0.018 * drift);
      const bottomHeight = h * (0.17 - 0.016 * drift);
      this.back.rect(0, 0, w, topHeight).fill({ color: p.surface, alpha: 0.82 });
      this.back.rect(0, h - bottomHeight, w, bottomHeight).fill({ color: p.accentA, alpha: 0.15 });
      this.mid.rect(w * 0.08, h * 0.045, w * 0.84, h * 0.018).fill({ color: p.accentB, alpha: 0.22 });
      this.mid.rect(w * 0.05, h * 0.9, w * 0.9, h * 0.012).fill({ color: p.textPrimary, alpha: 0.16 });
    }

    const cornerSize = Math.min(w, h) * 0.09 * pulse;
    const inset = Math.min(w, h) * 0.045;
    const alpha = 0.055 + audio.energy * 0.07;
    this.front
      .moveTo(inset, inset + cornerSize)
      .lineTo(inset, inset)
      .lineTo(inset + cornerSize, inset)
      .stroke({ width: 2, color: p.accentA, alpha });
    this.front
      .moveTo(w - inset - cornerSize, h - inset)
      .lineTo(w - inset, h - inset)
      .lineTo(w - inset, h - inset - cornerSize)
      .stroke({ width: 2, color: p.accentB, alpha });

    const markerCount = this.quality === "cinema" ? 7 : 4;
    for (let index = 0; index < markerCount; index++) {
      const y = h * (0.19 + index * 0.095);
      const width = w * (0.025 + hash01(this.lineIndex * 97 + index * 19) * 0.055);
      this.front.rect(w * 0.955 - width, y, width, 2).fill({
        color: index % 2 ? p.muted : p.accentA,
        alpha: 0.11 + audio.mid * 0.07,
      });
    }
  }

  private drawPrint(time: number, audio: AudioBands) {
    const p = this.palette!;
    const w = this.w;
    const h = this.h;
    const cinema = this.quality === "cinema";
    const columns = cinema ? 24 : 16;
    const rows = cinema ? 14 : 9;
    const spacingX = w / columns;
    const spacingY = h / rows;
    const phaseX = (time * 5.5) % spacingX;
    const phaseY = (time * 2.2) % spacingY;
    const quietHalfW = w * 0.29;
    const quietHalfH = h * 0.23;
    const cx = w * 0.5;
    const cy = h * 0.465;

    for (let row = -1; row <= rows; row++) {
      for (let col = -1; col <= columns; col++) {
        const x = col * spacingX + phaseX;
        const y = row * spacingY + phaseY;
        if (Math.abs(x - cx) < quietHalfW && Math.abs(y - cy) < quietHalfH) continue;

        const seed = hash01((row + 11) * 73 + (col + 17) * 131 + this.lineIndex * 29);
        const size = (1.2 + seed * 3.2) * (0.75 + audio.treble * 0.85) * this.intensity;
        const color = (row + col) % 4 === 0 ? p.accentB : p.accentA;
        this.mid.circle(x, y, size).fill({ color, alpha: 0.045 + seed * 0.055 });
      }
    }

    const bandY = h * (0.17 + (hash01(this.lineIndex * 31 + 8) * 0.08));
    this.back.rect(0, bandY, w, h * 0.055).fill({ color: p.surface, alpha: 0.72 });
    this.back.rect(0, h * 0.79, w, h * 0.035).fill({ color: p.accentA, alpha: 0.08 });

    const stripeGap = cinema ? 10 : 16;
    const stripeOffset = (time * 7) % stripeGap;
    for (let x = -h + stripeOffset; x < w + h; x += stripeGap) {
      this.front
        .moveTo(x, 0)
        .lineTo(x - h * 0.22, h)
        .stroke({ width: 1, color: p.textSecondary, alpha: 0.015 + audio.energy * 0.018 });
    }
  }

  private drawArchitecture(time: number, audio: AudioBands) {
    const p = this.palette!;
    const w = this.w;
    const h = this.h;
    const cx = w * 0.5;
    const cy = h * 0.465;
    const cinema = this.quality === "cinema";
    const frames = cinema ? 9 : 6;
    const breathe = 1 + Math.sin(time * 0.38) * 0.012 + audio.bass * 0.018 * this.intensity;

    for (let index = 0; index < frames; index++) {
      const t = index / Math.max(1, frames - 1);
      const fw = w * (0.88 - t * 0.46) * breathe;
      const fh = h * (0.78 - t * 0.38) * breathe;
      const x = cx - fw * 0.5;
      const y = cy - fh * 0.5;
      this.mid.rect(x, y, fw, fh).stroke({
        width: index % 3 === 0 ? 1.6 : 1,
        color: index % 2 ? p.accentA : p.accentB,
        alpha: 0.025 + (1 - t) * 0.035 + audio.energy * 0.025,
      });
    }

    const vanishingOffset = Math.sin(time * 0.17 + this.lineIndex) * w * 0.035;
    const vx = cx + vanishingOffset;
    const vy = cy + h * 0.035;
    const anchors = [
      [w * 0.03, h * 0.08],
      [w * 0.97, h * 0.08],
      [w * 0.03, h * 0.92],
      [w * 0.97, h * 0.92],
    ] as const;
    anchors.forEach(([x, y], index) => {
      this.back.moveTo(vx, vy).lineTo(x, y).stroke({
        width: index % 2 ? 1 : 1.4,
        color: index % 2 ? p.accentB : p.accentA,
        alpha: 0.035 + audio.mid * 0.035,
      });
    });

    const pillarCount = cinema ? 8 : 5;
    for (let index = 0; index < pillarCount; index++) {
      const t = index / Math.max(1, pillarCount - 1);
      const side = index % 2 === 0 ? -1 : 1;
      const x = cx + side * (w * 0.34 + t * w * 0.11);
      const width = w * (0.012 + t * 0.01);
      this.front.rect(x - width * 0.5, h * 0.08, width, h * 0.84).fill({
        color: index % 3 === 0 ? p.surface : p.accentA,
        alpha: index % 3 === 0 ? 0.34 : 0.025 + audio.energy * 0.025,
      });
    }
  }

  private drawAurora(time: number, audio: AudioBands) {
    const p = this.palette!;
    const w = this.w;
    const h = this.h;
    const cinema = this.quality === "cinema";
    const layers = cinema ? 7 : 4;
    const points = cinema ? 18 : 12;

    for (let layer = 0; layer < layers; layer++) {
      const topBand = layer % 2 === 0;
      const baseY = topBand
        ? h * (0.08 + layer * 0.018)
        : h * (0.92 - layer * 0.018);
      const direction = topBand ? 1 : -1;
      const poly: number[] = [];
      const edgeY = topBand ? 0 : h;

      poly.push(0, edgeY);
      for (let index = 0; index <= points; index++) {
        const t = index / points;
        const x = t * w;
        const wave = Math.sin(t * Math.PI * (1.8 + layer * 0.17) + time * (0.22 + layer * 0.025) + layer)
          * h * (0.035 + audio.mid * 0.018);
        const secondary = Math.sin(t * Math.PI * 4.2 - time * 0.16 + layer * 0.7) * h * 0.012;
        poly.push(x, baseY + direction * (wave + secondary));
      }
      poly.push(w, edgeY);

      const color = layer % 2 ? p.accentB : p.accentA;
      this.back.poly(poly).fill({
        color,
        alpha: 0.025 + layer * 0.006 + audio.energy * 0.026,
      });
    }

    const horizon = h * 0.465;
    const glowWidth = w * (0.24 + audio.bass * 0.04);
    this.mid
      .rect(w * 0.5 - glowWidth * 0.5, horizon - 1, glowWidth, 2)
      .fill({ color: p.glow, alpha: 0.035 + audio.energy * 0.04 });

    const moteCount = cinema ? 26 : 14;
    for (let index = 0; index < moteCount; index++) {
      const sx = hash01(this.lineIndex * 101 + index * 13.7);
      const sy = hash01(this.lineIndex * 211 + index * 7.3);
      const x = (sx * w + time * (3 + sx * 8)) % w;
      const y = sy < 0.5
        ? h * (0.04 + sy * 0.42)
        : h * (0.75 + (sy - 0.5) * 0.42);
      this.front.circle(x, y, 0.8 + sx * 1.8).fill({
        color: index % 3 ? p.accentA : p.accentB,
        alpha: 0.025 + audio.treble * 0.045,
      });
    }
  }
}
