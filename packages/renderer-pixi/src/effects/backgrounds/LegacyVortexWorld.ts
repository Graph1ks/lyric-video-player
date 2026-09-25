import { Container, Graphics } from "pixi.js";
import type { AudioBands } from "@graph1ks/emo-audio-web";
import type { QualityMode, VisualPalette } from "@graph1ks/emo-engine-core";

type Vec3 = { x: number; y: number; z: number };
type Projected = { x: number; y: number; depth: number };

export class LegacyVortexWorld {
  readonly container = new Container();

  private readonly field = new Graphics();
  private readonly glow = new Graphics();
  private width = 1;
  private height = 1;
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

  resize(width: number, height: number) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
  }

  update(time: number, audio: AudioBands) {
    if (!this.container.visible) return;
    this.draw(time, audio);
    this.container.alpha = clamp(this.intensity, 0, 1);
  }

  private draw(time: number, audio: AudioBands) {
    this.field.clear();
    this.glow.clear();

    const palette = this.palette;
    const background = palette?.background ?? 0x020107;
    const surface = palette?.surface ?? 0x160a24;
    const accentA = palette?.accentA ?? 0x8f55ff;
    const accentB = palette?.accentB ?? 0xff486f;
    const glowColor = palette?.glow ?? 0xe4c8ff;
    const detail01 = clamp(this.detail / 3, 0, 1);
    const power = clamp(this.intensity / 3, 0, 1);
    const qualityScale = this.quality === "cinema" ? 1 : 0.72;

    // The world owns an opaque palette-derived field so the old generic
    // blob/ring/particle stack cannot leak through this preset.
    this.field
      .rect(0, 0, this.width, this.height)
      .fill({ color: background, alpha: 1 });

    const cx = this.width * (0.5 + Math.sin(time * 0.041) * 0.018);
    const cy = this.height * (0.49 + Math.cos(time * 0.033) * 0.014);
    const focal = Math.min(this.width, this.height) * 1.24;
    const cameraDistance = 3.7;
    const yaw = Math.sin(time * 0.027) * 0.08;
    const pitch = Math.cos(time * 0.031) * 0.045;
    const arms = Math.max(5, Math.min(11, Math.round(6 + detail01 * 5)));
    const samples = Math.max(34, Math.round((48 + detail01 * 44) * qualityScale));
    const turns = 2.15 + detail01 * 1.45;
    const rotation = time * 0.145;

    // Structural depth hoops provide paused-frame perspective evidence. Their
    // geometry is entirely timestamp-driven; audio affects light only.
    const hoops = Math.max(7, Math.round((8 + detail01 * 8) * qualityScale));
    for (let hoop = 0; hoop < hoops; hoop++) {
      const t = (hoop + 0.45) / hoops;
      const z = 0.18 + t * 6.9;
      const radius = 3.25 * Math.pow(1 - t, 0.72) + 0.14;
      const segments = 42;
      let previous: Projected | null = null;

      for (let segment = 0; segment <= segments; segment++) {
        const angle = segment / segments * Math.PI * 2 + rotation * 0.32 + t * 1.15;
        const point = project(
          {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius * 0.72,
            z,
          },
          focal,
          cameraDistance,
          yaw,
          pitch,
          cx,
          cy,
        );
        if (!point) {
          previous = null;
          continue;
        }
        if (previous) {
          const alpha = (0.018 + (1 - t) * 0.03) * (0.62 + power * 0.8);
          this.field
            .moveTo(previous.x, previous.y)
            .lineTo(point.x, point.y)
            .stroke({
              width: 0.7 + (1 - t) * 0.8,
              color: hoop % 2 ? surface : accentA,
              alpha,
            });
        }
        previous = point;
      }
    }

    // Helical ribbons are the identity layer: several continuous blades curl
    // into real projected depth instead of faking a vortex by scaling particles.
    for (let arm = 0; arm < arms; arm++) {
      let previous: Projected | null = null;
      const armPhase = arm / arms * Math.PI * 2;
      const armColor = mixColor(accentA, accentB, arm / Math.max(1, arms - 1));

      for (let sample = 0; sample <= samples; sample++) {
        const t = sample / samples;
        const eased = Math.pow(t, 0.92);
        const z = 0.12 + eased * 7.15;
        const radius = 3.55 * Math.pow(1 - eased, 0.67) + 0.10;
        const angle = armPhase
          + eased * turns * Math.PI * 2
          + rotation
          + Math.sin(eased * Math.PI * 3 + arm * 0.7) * 0.055;

        const point = project(
          {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius * 0.74,
            z,
          },
          focal,
          cameraDistance,
          yaw,
          pitch,
          cx,
          cy,
        );
        if (!point) {
          previous = null;
          continue;
        }

        if (previous) {
          const coreFade = 1 - smoothstep(0.84, 1, eased) * 0.68;
          const depthFade = 0.34 + (1 - eased) * 0.66;
          const width = (0.9 + (1 - eased) * (2.6 + power * 1.8)) * qualityScale;
          const alpha = (0.055 + power * 0.105) * depthFade * coreFade;

          this.glow
            .moveTo(previous.x, previous.y)
            .lineTo(point.x, point.y)
            .stroke({
              width: width * 4.6,
              color: armColor,
              alpha: alpha * (0.06 + audio.energy * 0.11),
            });
          this.field
            .moveTo(previous.x, previous.y)
            .lineTo(point.x, point.y)
            .stroke({ width, color: armColor, alpha });
          if (arm % 2 === 0) {
            this.field
              .moveTo(previous.x, previous.y)
              .lineTo(point.x, point.y)
              .stroke({
                width: Math.max(0.55, width * 0.24),
                color: glowColor,
                alpha: alpha * (0.38 + audio.treble * 0.24),
              });
          }
        }
        previous = point;
      }
    }

    // One-way tracer flow. Increasing timestamp advances every tracer deeper
    // into the funnel; audio cannot alter position, speed, direction or phase.
    const tracerCount = Math.max(
      28,
      Math.round((42 + detail01 * 82) * qualityScale),
    );
    const travelSpeed = 0.085 + detail01 * 0.018;
    for (let index = 0; index < tracerCount; index++) {
      const arm = index % arms;
      const seed = fract(index * 0.61803398875 + arm * 0.071);
      const t = fract(seed + time * travelSpeed);
      const eased = Math.pow(t, 0.92);
      const z = 0.12 + eased * 7.15;
      const radius = 3.55 * Math.pow(1 - eased, 0.67) + 0.10;
      const angle = arm / arms * Math.PI * 2
        + eased * turns * Math.PI * 2
        + rotation;
      const point = project(
        {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius * 0.74,
          z,
        },
        focal,
        cameraDistance,
        yaw,
        pitch,
        cx,
        cy,
      );
      if (!point) continue;

      const perspective = focal / Math.max(1, point.depth);
      const radiusPx = clamp((0.008 + (1 - eased) * 0.020) * perspective, 0.65, 5.2);
      const color = mixColor(accentA, accentB, fract(seed + arm / arms));
      const light = 0.72 + audio.energy * 0.18 + audio.transient * 0.12;
      this.glow
        .circle(point.x, point.y, radiusPx * 3.4)
        .fill({ color, alpha: 0.035 * light });
      this.field
        .circle(point.x, point.y, radiusPx)
        .fill({ color: glowColor, alpha: clamp(0.34 + light * 0.28, 0, 0.9) });
    }

    const coreSize = Math.min(this.width, this.height);
    for (let ring = 5; ring >= 0; ring--) {
      const t = ring / 5;
      this.glow
        .circle(cx, cy, coreSize * (0.012 + t * 0.036))
        .fill({
          color: mixColor(glowColor, accentB, t * 0.55),
          alpha: (0.012 + (1 - t) * 0.026)
            * (0.7 + power * 0.45 + audio.energy * 0.16),
        });
    }
    this.field
      .circle(cx, cy, 1.8)
      .fill({ color: glowColor, alpha: 0.52 + audio.transient * 0.12 });
  }
}

function project(
  point: Vec3,
  focal: number,
  cameraDistance: number,
  yaw: number,
  pitch: number,
  cx: number,
  cy: number,
): Projected | null {
  const cosy = Math.cos(yaw);
  const siny = Math.sin(yaw);
  const cosp = Math.cos(pitch);
  const sinp = Math.sin(pitch);

  const x1 = point.x * cosy - point.z * siny;
  const z1 = point.x * siny + point.z * cosy;
  const y2 = point.y * cosp - z1 * sinp;
  const z2 = point.y * sinp + z1 * cosp;
  const depth = cameraDistance + z2;
  if (depth <= 0.08) return null;

  return {
    x: cx + x1 * focal / depth,
    y: cy - y2 * focal / depth,
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

function fract(value: number) {
  return value - Math.floor(value);
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp((value - edge0) / Math.max(0.000001, edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
