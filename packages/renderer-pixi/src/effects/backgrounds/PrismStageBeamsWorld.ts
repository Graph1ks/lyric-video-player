import { Container, Graphics } from "pixi.js";
import type { AudioBands } from "@graph1ks/emo-audio-web";
import type { QualityMode } from "@graph1ks/emo-engine-core";

interface BeamSpec {
  angle: number;
  width: number;
  color: number;
  phase: number;
  speed: number;
  ghost: boolean;
}

const COLORS = [0x2d69ff, 0x5feaff, 0xfff0a0, 0xff635e, 0x48f6a0, 0xff63ce, 0xd8e8ff];

export class PrismStageBeamsWorld {
  readonly container = new Container();

  private readonly backdrop = new Graphics();
  private readonly haze = new Graphics();
  private readonly beams = new Graphics();
  private readonly hub = new Graphics();
  private readonly fixtures = new Graphics();
  private readonly flare = new Graphics();

  private width = 1;
  private height = 1;
  private intensity = 1;
  private detail = 1;
  private quality: QualityMode = "cinema";
  private beamSpecs: BeamSpec[] = [];

  constructor() {
    this.beams.blendMode = "add";
    this.hub.blendMode = "add";
    this.flare.blendMode = "add";
    this.container.addChild(this.backdrop, this.haze, this.beams, this.hub, this.fixtures, this.flare);
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
  }

  update(time: number, audio: AudioBands) {
    if (!this.container.visible) return;

    const power = this.intensity;
    const cx = this.width * 0.5;
    const cy = this.height * 0.49;
    const maxDim = Math.max(this.width, this.height);
    const bleed = maxDim * 0.18;
    const bass = clamp(audio.bass, 0, 1);
    const energy = clamp(audio.energy, 0, 1);
    const treble = clamp(audio.treble, 0, 1);
    const transient = clamp(audio.transient, 0, 1);

    this.backdrop.clear();
    this.haze.clear();
    this.beams.clear();
    this.hub.clear();
    this.fixtures.clear();
    this.flare.clear();

    this.backdrop
      .rect(-bleed, -bleed, this.width + bleed * 2, this.height + bleed * 2)
      .fill({ color: 0x02030a, alpha: 1 });

    const roomGlow = clamp(0.08 + power * 0.055 + energy * 0.08, 0, 0.34);
    this.haze
      .circle(cx, cy, maxDim * 0.56)
      .fill({ color: 0x121b45, alpha: roomGlow });
    this.haze
      .circle(cx, cy, maxDim * 0.28)
      .fill({ color: 0x301243, alpha: roomGlow * 0.45 });

    const amplitude = (0.55 + power * 0.58) * (0.72 + energy * 0.52);
    const hit = 1 + transient * 0.52;
    const reach = Math.hypot(this.width, this.height) * 1.12;

    for (let index = 0; index < this.beamSpecs.length; index++) {
      const spec = this.beamSpecs[index];
      const sweep = Math.sin(time * spec.speed + spec.phase) * (0.035 + power * 0.018);
      const angle = spec.angle + sweep;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      const px = -dy;
      const py = dx;
      const farX = cx + dx * reach;
      const farY = cy + dy * reach;
      const farHalf = spec.width * amplitude * hit * (spec.ghost ? 0.42 : 0.72);
      const nearHalf = 2.2 + farHalf * 0.028;
      const alpha = clamp(
        (spec.ghost ? 0.022 : 0.052) * (0.55 + power * 0.5) * (0.68 + energy * 0.62),
        0,
        spec.ghost ? 0.11 : 0.22,
      );

      this.beams
        .poly([
          cx - px * nearHalf, cy - py * nearHalf,
          cx + px * nearHalf, cy + py * nearHalf,
          farX + px * farHalf, farY + py * farHalf,
          farX - px * farHalf, farY - py * farHalf,
        ])
        .fill({ color: spec.color, alpha });

      if (!spec.ghost) {
        const coreHalf = farHalf * 0.34;
        this.beams
          .poly([
            cx - px, cy - py,
            cx + px, cy + py,
            farX + px * coreHalf, farY + py * coreHalf,
            farX - px * coreHalf, farY - py * coreHalf,
          ])
          .fill({ color: spec.color, alpha: clamp(alpha * 1.35, 0, 0.24) });

        if (index % 3 === 0) {
          const hotHalf = farHalf * 0.11;
          this.beams
            .poly([
              cx - px * 0.4, cy - py * 0.4,
              cx + px * 0.4, cy + py * 0.4,
              farX + px * hotHalf, farY + py * hotHalf,
              farX - px * hotHalf, farY - py * hotHalf,
            ])
            .fill({ color: 0xffffff, alpha: clamp(0.018 + energy * 0.035 + transient * 0.035, 0, 0.11) });
        }
      }
    }

    const bloom = (0.75 + bass * 0.85 + transient * 0.55) * (0.55 + power * 0.35);
    this.hub.circle(cx, cy, 86 * bloom).fill({ color: 0x768dff, alpha: clamp(0.045 + power * 0.025, 0, 0.15) });
    this.hub.circle(cx, cy, 45 * bloom).fill({ color: 0xe8efff, alpha: clamp(0.09 + bass * 0.09 + transient * 0.08, 0, 0.28) });
    this.hub.circle(cx, cy, 20 + bass * 8).fill({ color: 0xffffff, alpha: 0.78 });

    const fixtureCount = this.quality === "cinema" ? 10 : 7;
    for (let i = 0; i < fixtureCount; i++) {
      const t = i / Math.max(1, fixtureCount - 1);
      const x = cx + (t - 0.5) * 190 + Math.sin(time * 0.22 + i * 1.7) * 4;
      const y = cy + Math.sin(i * 1.8) * 34;
      const radius = 12 + (i % 3) * 2;
      const color = COLORS[i % COLORS.length];
      this.fixtures.circle(x, y, radius + 3).fill({ color: 0xb8c5dd, alpha: 0.2 });
      this.fixtures.circle(x, y, radius).fill({ color: 0xf8fbff, alpha: 0.9 });
      this.fixtures.circle(x - radius * 0.22, y - radius * 0.22, radius * 0.45).fill({ color, alpha: 0.42 + treble * 0.2 });
      this.flare.circle(x, y, radius * (1.8 + transient * 0.8)).fill({ color, alpha: clamp(0.025 + transient * 0.055, 0, 0.12) });
    }

    const flareAlpha = clamp(transient * 0.16 + bass * 0.035, 0, 0.2);
    if (flareAlpha > 0.005) {
      this.flare.roundRect(cx - 2, cy - this.height * 0.24, 4, this.height * 0.48, 2).fill({ color: 0xffffff, alpha: flareAlpha * 0.5 });
      this.flare.roundRect(cx - this.width * 0.22, cy - 2, this.width * 0.44, 4, 2).fill({ color: 0xffffff, alpha: flareAlpha * 0.28 });
    }

    this.container.alpha = clamp(power, 0, 1);
  }

  private rebuild() {
    const mainCount = Math.max(8, Math.min(18, Math.round((this.quality === "cinema" ? 11 : 8) * Math.max(0.7, this.detail))));
    const ghostCount = Math.max(3, Math.min(10, Math.round(mainCount * 0.45)));
    const total = mainCount + ghostCount;
    const specs: BeamSpec[] = [];

    for (let i = 0; i < total; i++) {
      const t = i / Math.max(1, total - 1);
      const ghost = i >= mainCount;
      const base = ghost ? i - mainCount + 0.5 : i;
      const angle = -2.85 + (base / Math.max(1, mainCount - 1)) * 3.7;
      specs.push({
        angle: angle + Math.sin(i * 3.11) * (ghost ? 0.18 : 0.055),
        width: (ghost ? 72 : 150) * (0.72 + pseudo(i * 9.17) * 0.55),
        color: COLORS[i % COLORS.length],
        phase: pseudo(i * 17.7 + 4.2) * Math.PI * 2,
        speed: 0.12 + pseudo(i * 23.1 + 1.3) * 0.2,
        ghost,
      });
    }

    this.beamSpecs = specs;
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function pseudo(value: number) {
  const raw = Math.sin(value * 12.9898) * 43758.5453;
  return raw - Math.floor(raw);
}
