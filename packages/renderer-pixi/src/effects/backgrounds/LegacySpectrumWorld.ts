import { Container, Graphics } from "pixi.js";
import type { AudioBands } from "@graph1ks/emo-audio-web";
import {
  clamp,
  type QualityMode,
  type VisualPalette,
} from "@graph1ks/emo-engine-core";

const EMPTY_SPECTRUM = new Float32Array(0);

type Projected = {
  x: number;
  y: number;
  depth: number;
};

export class LegacySpectrumWorld {
  readonly container = new Container();

  private readonly backdrop = new Graphics();
  private readonly terrain = new Graphics();
  private readonly glow = new Graphics();
  private width = 1;
  private height = 1;
  private intensity = 1;
  private detail = 1;
  private quality: QualityMode = "cinema";
  private palette?: VisualPalette;
  private smoothed = new Float32Array(0);
  private lastTime = Number.NaN;

  constructor() {
    this.glow.blendMode = "add";
    this.container.addChild(this.backdrop, this.glow, this.terrain);
    this.container.visible = false;
    this.resize(1, 1);
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

  resize(width: number, height: number) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
  }

  update(
    time: number,
    audio: AudioBands,
    spectrum: Float32Array = EMPTY_SPECTRUM,
  ) {
    if (!this.container.visible) {
      this.lastTime = Number.NaN;
      return;
    }

    const discontinuity = !Number.isFinite(this.lastTime)
      || time < this.lastTime
      || time - this.lastTime > 0.5;
    const dt = discontinuity ? 1 / 60 : clamp(time - this.lastTime, 0, 0.1);
    this.lastTime = time;

    const detail01 = clamp(this.detail / 3, 0, 1);
    const baseBins = this.quality === "cinema" ? 82 : 56;
    const bins = Math.max(36, Math.min(128, Math.round(baseBins * (0.72 + detail01 * 0.78))));
    this.ensureBuffer(bins);
    this.updateSpectrum(spectrum, audio, dt, discontinuity);
    this.draw(time, audio);
    this.container.alpha = clamp(this.intensity, 0, 1);
  }

  private ensureBuffer(count: number) {
    if (this.smoothed.length === count) return;
    this.smoothed = new Float32Array(count);
  }

  private updateSpectrum(
    spectrum: Float32Array,
    audio: AudioBands,
    dt: number,
    discontinuity: boolean,
  ) {
    for (let index = 0; index < this.smoothed.length; index++) {
      const t = index / Math.max(1, this.smoothed.length - 1);
      let target = 0;

      if (spectrum.length >= 2) {
        // A logarithmic-ish sampling curve gives the low/mid structure enough
        // screen real estate while still retaining the full high-frequency tail.
        const sourceT = Math.pow(t, 1.56);
        const position = sourceT * (spectrum.length - 1);
        const left = Math.floor(position);
        const right = Math.min(spectrum.length - 1, left + 1);
        const mix = position - left;
        const current = (spectrum[left] ?? 0) * (1 - mix) + (spectrum[right] ?? 0) * mix;
        const previous = spectrum[Math.max(0, left - 1)] ?? current;
        const next = spectrum[Math.min(spectrum.length - 1, right + 1)] ?? current;
        target = current * 0.68 + previous * 0.16 + next * 0.16;
      } else {
        // Preview fallback before analyser data is available.
        const bass = Math.exp(-Math.pow((t - 0.12) / 0.15, 2)) * audio.bass;
        const mid = Math.exp(-Math.pow((t - 0.46) / 0.25, 2)) * audio.mid;
        const treble = Math.exp(-Math.pow((t - 0.80) / 0.16, 2)) * audio.treble;
        target = bass * 0.92 + mid * 0.80 + treble * 0.68;
      }

      if (discontinuity) {
        this.smoothed[index] = target;
      } else {
        const current = this.smoothed[index];
        const attack = 0.020 + t * 0.014;
        const release = 0.13 + t * 0.11;
        this.smoothed[index] = envelope(current, target, dt, attack, release);
      }
    }
  }

  private draw(time: number, audio: AudioBands) {
    this.backdrop.clear();
    this.terrain.clear();
    this.glow.clear();

    const background = this.palette?.background ?? 0x010609;
    const surface = this.palette?.surface ?? 0x08202a;
    const accentA = this.palette?.accentA ?? 0x5dfff0;
    const accentB = this.palette?.accentB ?? 0x8b68ff;
    const glowColor = this.palette?.glow ?? 0xeaffff;
    const muted = this.palette?.muted ?? 0x43616b;

    this.backdrop.rect(0, 0, this.width, this.height).fill({ color: background, alpha: 1 });

    if (!this.smoothed.length) return;

    const detail01 = clamp(this.detail / 3, 0, 1);
    const laneBase = this.quality === "cinema" ? 11 : 7;
    const lanes = Math.max(5, Math.min(15, Math.round(laneBase * (0.72 + detail01 * 0.64))));
    const focal = Math.min(this.width, this.height) * 1.26;
    const cameraDistance = 4.6;
    const yaw = Math.sin(time * 0.031) * 0.045;
    const pitch = -0.18 + Math.sin(time * 0.023 + 0.8) * 0.025;
    const amplitudeScale = 1.08 * (0.55 + this.intensity * 0.34);

    // The identity layer is a projected spectral topography: multiple depth
    // contours built from the real FFT, not a duplicate horizontal waveform.
    for (let lane = lanes - 1; lane >= 0; lane--) {
      const laneT = lane / Math.max(1, lanes - 1);
      const z = 0.55 + laneT * 6.8;
      const baseline: number[] = [];
      const ridge: number[] = [];

      for (let index = 0; index < this.smoothed.length; index++) {
        const t = index / Math.max(1, this.smoothed.length - 1);
        const value = clamp(this.smoothed[index], 0, 1);
        const shaped = Math.pow(value, 1.22);
        const harmonic = 0.90
          + Math.sin(t * Math.PI * 6 + lane * 0.72 + time * 0.11) * 0.05
          + Math.sin(t * Math.PI * 17 - lane * 0.37) * 0.025;
        const worldX = (t - 0.5) * 6.25;
        const worldY = -0.68 + shaped * harmonic * amplitudeScale * (1.0 - laneT * 0.16);

        const baseProjected = project(
          worldX,
          -0.72,
          z,
          focal,
          cameraDistance,
          yaw,
          pitch,
          this.width,
          this.height,
        );
        const ridgeProjected = project(
          worldX,
          worldY,
          z,
          focal,
          cameraDistance,
          yaw,
          pitch,
          this.width,
          this.height,
        );

        if (!baseProjected || !ridgeProjected) continue;
        baseline.push(baseProjected.x, baseProjected.y);
        ridge.push(ridgeProjected.x, ridgeProjected.y);
      }

      if (ridge.length < 4 || baseline.length < 4) continue;

      const fill: number[] = [...ridge];
      for (let i = baseline.length - 2; i >= 0; i -= 2) {
        fill.push(baseline[i], baseline[i + 1]);
      }

      const laneColor = mixColor(accentA, accentB, Math.pow(laneT, 0.82));
      const depthFade = 1 - laneT * 0.62;
      const material = mixColor(surface, laneColor, 0.38);

      this.terrain.poly(fill).fill({
        color: material,
        alpha: 0.018 + depthFade * (0.018 + detail01 * 0.018),
      });

      this.glow.poly(ridge).stroke({
        width: 5.5 + (1 - laneT) * 2.5,
        color: laneColor,
        alpha: (0.018 + audio.energy * 0.020) * depthFade,
      });

      this.terrain.poly(ridge).stroke({
        width: 0.9 + (1 - laneT) * 0.7,
        color: laneColor,
        alpha: 0.22 + depthFade * 0.36 + audio.energy * 0.10,
      });

      if (lane % 2 === 0) {
        const baselineColor = mixColor(muted, laneColor, 0.26);
        this.terrain.poly(baseline).stroke({
          width: 0.55,
          color: baselineColor,
          alpha: 0.07 + depthFade * 0.07,
        });
      }
    }

    // Peak pillars turn the near contour into an unmistakable 3D analyser
    // landscape while preserving large negative space around the title area.
    const nearZ = 0.72;
    const pillarStep = this.quality === "cinema" ? 4 : 6;
    for (let index = 0; index < this.smoothed.length; index += pillarStep) {
      const t = index / Math.max(1, this.smoothed.length - 1);
      const value = clamp(this.smoothed[index], 0, 1);
      if (value < 0.12) continue;

      const worldX = (t - 0.5) * 6.25;
      const peakY = -0.68 + Math.pow(value, 1.16) * amplitudeScale;
      const base = project(worldX, -0.72, nearZ, focal, cameraDistance, yaw, pitch, this.width, this.height);
      const peak = project(worldX, peakY, nearZ, focal, cameraDistance, yaw, pitch, this.width, this.height);
      if (!base || !peak) continue;

      const color = mixColor(accentA, glowColor, clamp(value * 0.78, 0, 1));
      this.glow
        .moveTo(base.x, base.y)
        .lineTo(peak.x, peak.y)
        .stroke({
          width: 4 + value * 7,
          color,
          alpha: 0.018 + value * 0.035 + audio.treble * 0.015,
        });
      this.terrain
        .moveTo(base.x, base.y)
        .lineTo(peak.x, peak.y)
        .stroke({
          width: 0.65 + value * 1.25,
          color,
          alpha: 0.20 + value * 0.50,
        });
    }

    // A restrained horizon haze separates the spectral stage from the void.
    const horizonY = this.height * 0.61;
    this.glow
      .rect(0, horizonY - this.height * 0.018, this.width, this.height * 0.036)
      .fill({
        color: mixColor(accentB, glowColor, 0.32),
        alpha: 0.006 + audio.energy * 0.010,
      });
  }
}

function project(
  x: number,
  y: number,
  z: number,
  focal: number,
  cameraDistance: number,
  yaw: number,
  pitch: number,
  width: number,
  height: number,
): Projected | null {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);

  const x1 = x * cy - z * sy;
  const z1 = x * sy + z * cy;
  const y2 = y * cp - z1 * sp;
  const z2 = y * sp + z1 * cp;
  const depth = cameraDistance + z2;
  if (depth <= 0.08) return null;

  return {
    x: width * 0.5 + x1 * focal / depth,
    y: height * 0.58 - y2 * focal / depth,
    depth,
  };
}

function mixColor(a: number, b: number, t: number) {
  const amount = clamp(t, 0, 1);
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;
  const br = (b >> 16) & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = b & 0xff;
  return (
    (Math.round(ar + (br - ar) * amount) << 16)
    | (Math.round(ag + (bg - ag) * amount) << 8)
    | Math.round(ab + (bb - ab) * amount)
  );
}

function envelope(
  current: number,
  target: number,
  dt: number,
  attackSeconds: number,
  releaseSeconds: number,
) {
  const tau = target > current ? attackSeconds : releaseSeconds;
  const amount = 1 - Math.exp(-dt / Math.max(0.001, tau));
  return current + (target - current) * amount;
}
