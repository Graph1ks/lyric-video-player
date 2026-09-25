import { Container, Graphics } from "pixi.js";
import type { AudioBands } from "@graph1ks/emo-audio-web";
import type { QualityMode } from "@graph1ks/emo-engine-core";

interface EmitterSpec {
  x: number;
  y: number;
  phase: number;
  bias: number;
}

const RED = 0xff4259;
const CYAN = 0x55efff;
const MINT = 0x42ffc2;
const WHITE = 0xf7fbff;

export class LaserCanopyGridWorld {
  readonly container = new Container();

  private readonly backdrop = new Graphics();
  private readonly haze = new Graphics();
  private readonly rig = new Graphics();
  private readonly glow = new Graphics();
  private readonly beams = new Graphics();
  private readonly floor = new Graphics();
  private readonly sparkles = new Graphics();

  private width = 1;
  private height = 1;
  private intensity = 1;
  private detail = 1;
  private quality: QualityMode = "cinema";
  private emitters: EmitterSpec[] = [];

  constructor() {
    this.glow.blendMode = "add";
    this.beams.blendMode = "add";
    this.floor.blendMode = "add";
    this.sparkles.blendMode = "add";
    this.container.addChild(this.backdrop, this.haze, this.rig, this.glow, this.beams, this.floor, this.sparkles);
    this.container.visible = false;
    this.rebuild();
  }

  setIntensity(value: number) {
    this.intensity = clamp(value, 0, 3);
  }

  setDetail(value: number) {
    const next = clamp(value, 0, 3);
    if (next === this.detail) return;
    this.detail = next;
    this.rebuild();
  }

  setQuality(value: QualityMode) {
    if (value === this.quality) return;
    this.quality = value;
    this.rebuild();
  }

  resize(width: number, height: number) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.rebuild();
  }

  update(time: number, audio: AudioBands) {
    if (!this.container.visible) return;

    const power = this.intensity;
    const bass = clamp(audio.bass, 0, 1);
    const mid = clamp(audio.mid, 0, 1);
    const treble = clamp(audio.treble, 0, 1);
    const energy = clamp(audio.energy, 0, 1);
    const transient = clamp(audio.transient, 0, 1);
    const bleed = Math.max(this.width, this.height) * 0.16;
    const floorY = this.height * 0.9;

    this.backdrop.clear();
    this.haze.clear();
    this.rig.clear();
    this.glow.clear();
    this.beams.clear();
    this.floor.clear();
    this.sparkles.clear();

    this.backdrop
      .rect(-bleed, -bleed, this.width + bleed * 2, this.height + bleed * 2)
      .fill({ color: 0x020305, alpha: 1 });

    this.haze
      .ellipse(this.width * 0.5, this.height * 0.47, this.width * 0.52, this.height * 0.42)
      .fill({ color: 0x09131b, alpha: clamp(0.04 + energy * 0.035 + power * 0.018, 0, 0.16) });

    const rigLeft = this.width * 0.17;
    const rigRight = this.width * 0.83;
    const rigY = this.height * 0.085;
    this.rig
      .roundRect(rigLeft, rigY, rigRight - rigLeft, 8, 4)
      .fill({ color: 0x161a22, alpha: 0.98 });
    this.rig
      .roundRect(rigLeft, rigY + 9, rigRight - rigLeft, 2, 1)
      .fill({ color: 0x39424f, alpha: 0.46 });

    const raysPerEmitter = Math.max(2, Math.min(7, Math.round((this.quality === "cinema" ? 3.5 : 2.4) * Math.max(0.65, this.detail))));
    const spread = this.width * (0.045 + 0.03 * Math.min(3, power)) * (0.75 + bass * 0.38);
    let laserIndex = 0;

    for (let emitterIndex = 0; emitterIndex < this.emitters.length; emitterIndex++) {
      const emitter = this.emitters[emitterIndex];
      const ex = emitter.x;
      const ey = emitter.y;
      const fixtureColor = emitterIndex % 2 === 0 ? RED : CYAN;

      this.rig.circle(ex, ey, 5.5).fill({ color: WHITE, alpha: 0.95 });
      this.rig.circle(ex, ey, 10 + transient * 3).stroke({ width: 1, color: fixtureColor, alpha: clamp(0.18 + treble * 0.18, 0, 0.5) });

      const sweep = Math.sin(time * (0.22 + emitter.bias * 0.16) + emitter.phase) * spread;
      const fanCenter = this.width * (0.5 + (emitter.bias - 0.5) * 0.16);

      for (let ray = 0; ray < raysPerEmitter; ray++) {
        const t = raysPerEmitter <= 1 ? 0.5 : ray / (raysPerEmitter - 1);
        const fan = (t - 0.5) * 2;
        const color = laserColor(laserIndex);
        const landingX = clamp(
          fanCenter + fan * spread * (1.8 + emitter.bias * 1.3) + sweep,
          this.width * 0.055,
          this.width * 0.945,
        );
        const landingY = floorY - Math.abs(fan) * this.height * 0.055 - emitter.bias * this.height * 0.02;
        const baseAlpha = (0.23 + energy * 0.28 + transient * 0.17) * (0.48 + power * 0.34);
        const alpha = clamp(baseAlpha, 0, 0.82);
        const crispWidth = ray % 3 === 0 ? 1.35 : 0.9;

        this.glow.moveTo(ex, ey).lineTo(landingX, landingY).stroke({
          width: crispWidth + 3.5 + power * 0.55,
          color,
          alpha: alpha * 0.08,
        });
        this.beams.moveTo(ex, ey).lineTo(landingX, landingY).stroke({
          width: crispWidth,
          color,
          alpha,
        });
        this.beams.moveTo(ex, ey).lineTo(landingX, landingY).stroke({
          width: 0.38,
          color: WHITE,
          alpha: clamp(alpha * 0.42, 0, 0.34),
        });

        const hitRadius = 1.6 + bass * 2.2 + transient * 3.4;
        this.floor.circle(landingX, landingY, hitRadius + 5).fill({ color, alpha: clamp(0.025 + bass * 0.055 + transient * 0.05, 0, 0.16) });
        this.floor.circle(landingX, landingY, hitRadius).fill({ color, alpha: clamp(0.22 + bass * 0.26 + transient * 0.24, 0, 0.86) });
        this.floor.circle(landingX, landingY, Math.max(0.7, hitRadius * 0.35)).fill({ color: WHITE, alpha: 0.55 });

        const dustCount = this.quality === "cinema" ? 4 : 2;
        for (let dust = 0; dust < dustCount; dust++) {
          const dt = (dust + 1) / (dustCount + 1);
          const flicker = 0.5 + 0.5 * Math.sin(time * (2.6 + dust * 0.5) + emitter.phase + ray);
          const px = ex + (landingX - ex) * dt;
          const py = ey + (landingY - ey) * dt;
          this.sparkles.circle(px, py, 0.55 + treble * 0.8).fill({
            color,
            alpha: clamp((0.018 + treble * 0.06) * flicker, 0, 0.1),
          });
        }

        laserIndex += 1;
      }
    }

    const perspectiveRows = Math.max(3, Math.min(8, Math.round(3 + this.detail * 1.4)));
    for (let row = 0; row < perspectiveRows; row++) {
      const t = row / Math.max(1, perspectiveRows - 1);
      const y = this.height * (0.72 + t * t * 0.24);
      this.floor.moveTo(this.width * 0.06, y).lineTo(this.width * 0.94, y).stroke({
        width: 1,
        color: 0x66d9e8,
        alpha: clamp(0.008 + power * 0.007 + mid * 0.008, 0, 0.035),
      });
    }

    const dotCount = Math.max(20, Math.min(100, Math.round((this.quality === "cinema" ? 42 : 24) * Math.max(0.55, this.detail))));
    for (let i = 0; i < dotCount; i++) {
      const x = this.width * pseudo(i * 7.81 + 2.2);
      const y = this.height * (0.72 + pseudo(i * 11.29 + 3.7) * 0.25);
      const color = i % 3 === 0 ? MINT : i % 2 === 0 ? CYAN : RED;
      const twinkle = 0.45 + 0.55 * Math.sin(time * (1.1 + pseudo(i * 3.4)) + i);
      this.floor.circle(x, y, 0.7 + pseudo(i * 9.2) * 1.2).fill({
        color,
        alpha: clamp((0.02 + treble * 0.035) * twinkle * (0.7 + power * 0.2), 0, 0.09),
      });
    }

    this.container.alpha = clamp(power, 0, 1);
  }

  private rebuild() {
    const count = Math.max(6, Math.min(22, Math.round((this.quality === "cinema" ? 10 : 7) * Math.max(0.65, this.detail))));
    const emitters: EmitterSpec[] = [];
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count;
      emitters.push({
        x: this.width * (0.18 + t * 0.64),
        y: this.height * (0.115 + pseudo(i * 5.1) * 0.055),
        phase: pseudo(i * 12.7 + 1.8) * Math.PI * 2,
        bias: pseudo(i * 19.4 + 0.9),
      });
    }
    this.emitters = emitters;
  }
}

function laserColor(index: number) {
  const phase = index % 7;
  if (phase <= 2) return RED;
  if (phase <= 4) return CYAN;
  if (phase === 5) return MINT;
  return WHITE;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function pseudo(value: number) {
  const raw = Math.sin(value * 12.9898) * 43758.5453;
  return raw - Math.floor(raw);
}
