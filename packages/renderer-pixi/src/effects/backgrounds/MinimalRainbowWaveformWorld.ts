import { Container, Graphics } from "pixi.js";
import type { AudioBands } from "@graph1ks/emo-audio-web";
import type { QualityMode } from "@graph1ks/emo-engine-core";

const EMPTY_SPECTRUM = new Float32Array(0);
const PALETTE = [
  0x24d6ff,
  0x4effc3,
  0xe9ff4f,
  0xffc44d,
  0xff6f61,
  0xff45a9,
  0xb25cff,
  0x6578ff,
] as const;

export class MinimalRainbowWaveformWorld {
  readonly container = new Container();

  private readonly glow = new Graphics();
  private readonly core = new Graphics();
  private readonly needles = new Graphics();
  private width = 1;
  private height = 1;
  private intensity = 1;
  private detail = 1;
  private quality: QualityMode = "cinema";
  private smoothed = new Float32Array(0);
  private lastTime = Number.NaN;
  private smoothedTransient = 0;
  private smoothedEnergy = 0;

  constructor() {
    this.glow.blendMode = "add";
    this.core.blendMode = "add";
    this.needles.blendMode = "add";
    this.container.addChild(this.glow, this.core, this.needles);
    this.container.visible = false;
    this.resize(1, 1);
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

    if (discontinuity) {
      this.smoothedTransient = audio.transient;
      this.smoothedEnergy = audio.energy;
    } else {
      this.smoothedTransient = envelope(this.smoothedTransient, audio.transient, dt, 0.015, 0.11);
      this.smoothedEnergy = envelope(this.smoothedEnergy, audio.energy, dt, 0.06, 0.24);
    }

    const detail01 = clamp(this.detail / 3, 0, 1);
    const baseCount = this.quality === "cinema" ? 78 : 52;
    const count = Math.max(32, Math.min(128, Math.round(baseCount * (0.72 + detail01 * 0.88))));
    this.ensureBuffer(count);
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
    const count = this.smoothed.length;

    for (let index = 0; index < count; index++) {
      const t = index / Math.max(1, count - 1);
      let target = 0;

      if (spectrum.length >= 2) {
        const position = t * (spectrum.length - 1);
        const leftIndex = Math.floor(position);
        const rightIndex = Math.min(spectrum.length - 1, leftIndex + 1);
        const mix = position - leftIndex;
        const raw = (spectrum[leftIndex] ?? 0) * (1 - mix) + (spectrum[rightIndex] ?? 0) * mix;

        const previous = spectrum[Math.max(0, leftIndex - 1)] ?? raw;
        const next = spectrum[Math.min(spectrum.length - 1, rightIndex + 1)] ?? raw;
        target = raw * 0.64 + previous * 0.18 + next * 0.18;
      } else {
        // Safe preview fallback before an analyser is available.
        const bassShape = Math.exp(-Math.pow((t - 0.10) / 0.13, 2)) * audio.bass;
        const midShape = Math.exp(-Math.pow((t - 0.43) / 0.24, 2)) * audio.mid;
        const trebleShape = Math.exp(-Math.pow((t - 0.78) / 0.18, 2)) * audio.treble;
        target = bassShape * 0.88 + midShape * 0.78 + trebleShape * 0.74;
      }

      // Per-bin attack/release keeps the waveform musical without the raw FFT
      // chatter that makes visualizers look cheap.
      if (discontinuity) {
        this.smoothed[index] = target;
      } else {
        const current = this.smoothed[index];
        const attack = 0.018 + t * 0.014;
        const release = 0.10 + t * 0.10;
        this.smoothed[index] = envelope(current, target, dt, attack, release);
      }
    }
  }

  private draw(time: number, audio: AudioBands) {
    this.glow.clear();
    this.core.clear();
    this.needles.clear();

    // True reference identity: nearly black frame, one horizontal rainbow
    // signal, mirrored spikes and large negative space.
    this.core.rect(0, 0, this.width, this.height).fill({ color: 0x010206, alpha: 1 });

    const count = this.smoothed.length;
    if (!count) return;

    const detail01 = clamp(this.detail / 3, 0, 1);
    const left = this.width * 0.055;
    const right = this.width * 0.945;
    const width = right - left;
    const centerY = this.height * 0.50;
    const maxAmplitude = this.height
      * (0.105 + detail01 * 0.050)
      * (0.74 + this.intensity * 0.42);
    const energyGain = 0.72 + this.smoothedEnergy * 0.62;
    const transientGain = 1 + this.smoothedTransient * 0.42;

    // Horizontal luminous core is segmented so its hue continuously follows x.
    for (let index = 0; index < count - 1; index++) {
      const t0 = index / Math.max(1, count - 1);
      const t1 = (index + 1) / Math.max(1, count - 1);
      const x0 = left + t0 * width;
      const x1 = left + t1 * width;
      const color = paletteColor(t0);

      this.glow
        .moveTo(x0, centerY)
        .lineTo(x1, centerY)
        .stroke({
          width: 7 + this.intensity * 2.5,
          color,
          alpha: 0.025 + this.smoothedEnergy * 0.035,
        });

      this.core
        .moveTo(x0, centerY)
        .lineTo(x1, centerY)
        .stroke({
          width: 1.0 + this.intensity * 0.34,
          color,
          alpha: 0.34 + this.smoothedEnergy * 0.24,
        });
    }

    const topPoints: number[] = [];
    const bottomPoints: number[] = [];

    for (let index = 0; index < count; index++) {
      const t = index / Math.max(1, count - 1);
      const x = left + t * width;
      const value = clamp(this.smoothed[index], 0, 1);

      // Keep broad spectral shape but exaggerate small sharp peaks enough to
      // resemble the supplied reference's needle detail.
      const shaped = Math.pow(value, 1.28);
      const localNeedle = hash(index * 13.17 + Math.floor(time * 7.0) * 0.13);
      const spikeGate = smoothstep(0.82, 0.99, localNeedle)
        * this.smoothedTransient
        * (0.55 + detail01 * 0.60);
      const height = maxAmplitude
        * clamp(shaped * energyGain * transientGain + spikeGate * 0.46, 0, 1.38);

      topPoints.push(x, centerY - height);
      bottomPoints.push(x, centerY + height);

      const color = paletteColor(t);
      const glowAlpha = 0.025
        + value * 0.075
        + this.smoothedTransient * 0.025;
      const lineWidth = 0.8 + value * 1.4 + detail01 * 0.35;

      this.glow
        .moveTo(x, centerY - height)
        .lineTo(x, centerY + height)
        .stroke({
          width: 4.5 + value * 6.5,
          color,
          alpha: glowAlpha,
        });

      this.core
        .moveTo(x, centerY - height)
        .lineTo(x, centerY + height)
        .stroke({
          width: lineWidth,
          color,
          alpha: 0.42 + value * 0.48,
        });

      if (index % (this.quality === "cinema" ? 2 : 3) === 0) {
        const needle = height
          + this.height
            * (0.004 + detail01 * 0.007)
            * (0.35 + localNeedle * 0.65)
            * (0.40 + audio.treble * 0.90);

        this.needles
          .moveTo(x, centerY - needle)
          .lineTo(x, centerY + needle)
          .stroke({
            width: 0.55,
            color: mixColor(color, 0xffffff, 0.36),
            alpha: 0.10 + audio.treble * 0.18 + this.smoothedTransient * 0.12,
          });
      }
    }

    // Thin mirrored envelopes bind the individual spectral columns into one
    // coherent waveform without filling the negative space.
    for (let index = 0; index < count - 1; index++) {
      const offset = index * 2;
      const color = paletteColor(index / Math.max(1, count - 1));

      this.core
        .moveTo(topPoints[offset], topPoints[offset + 1])
        .lineTo(topPoints[offset + 2], topPoints[offset + 3])
        .stroke({
          width: 0.7,
          color,
          alpha: 0.24 + this.smoothedEnergy * 0.16,
        });

      this.core
        .moveTo(bottomPoints[offset], bottomPoints[offset + 1])
        .lineTo(bottomPoints[offset + 2], bottomPoints[offset + 3])
        .stroke({
          width: 0.7,
          color,
          alpha: 0.18 + this.smoothedEnergy * 0.13,
        });
    }

    // Center glow remains compact by design; this world must stay minimal.
    this.glow
      .ellipse(
        this.width * 0.5,
        centerY,
        this.width * 0.24,
        this.height * 0.055,
      )
      .fill({
        color: 0x8fdcff,
        alpha: 0.007 + this.smoothedEnergy * 0.012 + this.smoothedTransient * 0.010,
      });
  }
}

function paletteColor(position: number) {
  const scaled = clamp(position, 0, 0.999999) * (PALETTE.length - 1);
  const index = Math.floor(scaled);
  const next = Math.min(PALETTE.length - 1, index + 1);
  return mixColor(PALETTE[index], PALETTE[next], scaled - index);
}

function mixColor(a: number, b: number, t: number) {
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;
  const br = (b >> 16) & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = b & 0xff;
  return (
    (Math.round(ar + (br - ar) * t) << 16)
    | (Math.round(ag + (bg - ag) * t) << 8)
    | Math.round(ab + (bb - ab) * t)
  );
}

function hash(value: number) {
  const x = Math.sin(value * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp((value - edge0) / Math.max(0.000001, edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
