import { Container, Graphics } from "pixi.js";
import type { AudioBands } from "@graph1ks/emo-audio-web";
import type { QualityMode } from "@graph1ks/emo-engine-core";

type Vec3 = { x: number; y: number; z: number };
type Projected = { x: number; y: number; depth: number };
type ParticleSeed = {
  arm: number;
  phase: number;
  size: number;
  hue: number;
  wobble: number;
  brightness: number;
};

const PALETTE = [
  0x8c4dff,
  0x2ec9ff,
  0x54ff95,
  0xe9ff4f,
  0xffb347,
  0xff7b4f,
  0xff4aa2,
] as const;

export class ParticleSpiralVortexWorld {
  readonly container = new Container();

  private readonly particles = new Graphics();
  private readonly glow = new Graphics();
  private readonly seeds: ParticleSeed[] = [];
  private width = 1;
  private height = 1;
  private intensity = 1;
  private detail = 1;
  private quality: QualityMode = "cinema";
  private lastTime = Number.NaN;
  private smoothedBass = 0;
  private smoothedTreble = 0;
  private smoothedEnergy = 0;
  private smoothedTransient = 0;

  constructor() {
    this.glow.blendMode = "add";
    this.container.addChild(this.particles, this.glow);
    this.container.visible = false;
    this.buildSeeds();
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

  update(time: number, audio: AudioBands) {
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
      this.smoothedBass = audio.bass;
      this.smoothedTreble = audio.treble;
      this.smoothedEnergy = audio.energy;
      this.smoothedTransient = audio.transient;
    } else {
      this.smoothedBass = envelope(this.smoothedBass, audio.bass, dt, 0.08, 0.28);
      this.smoothedTreble = envelope(this.smoothedTreble, audio.treble, dt, 0.05, 0.20);
      this.smoothedEnergy = envelope(this.smoothedEnergy, audio.energy, dt, 0.10, 0.34);
      this.smoothedTransient = envelope(this.smoothedTransient, audio.transient, dt, 0.02, 0.13);
    }

    this.draw(time);
    this.container.alpha = clamp(this.intensity, 0, 1);
  }

  private buildSeeds() {
    const total = 920;
    for (let index = 0; index < total; index++) {
      this.seeds.push({
        arm: index % 7,
        phase: fract(index * 0.0371 + hash(index * 3.17 + 11.2) * 0.15),
        size: 0.55 + hash(index * 5.93 + 2.4) * 0.95,
        hue: hash(index * 8.11 + 3.7),
        wobble: (hash(index * 9.41 + 7.1) - 0.5) * 0.32,
        brightness: 0.54 + hash(index * 4.27 + 18.3) * 0.76,
      });
    }
  }

  private draw(time: number) {
    this.particles.clear();
    this.glow.clear();
    this.particles.rect(0, 0, this.width, this.height).fill({ color: 0x010101, alpha: 1 });

    const detail01 = clamp(this.detail / 3, 0, 1);
    const qualityScale = this.quality === "cinema" ? 1 : 0.70;
    const count = Math.max(
      220,
      Math.min(
        this.seeds.length,
        Math.round((320 + detail01 * 580) * qualityScale),
      ),
    );
    const arms = Math.max(4, Math.min(7, Math.round(4 + detail01 * 3)));
    const focal = Math.min(this.width, this.height) * 1.22;
    const cameraDistance = 4.2;
    const yaw = Math.sin(time * 0.041) * 0.075;
    const pitch = Math.sin(time * 0.029 + 0.8) * 0.035;
    const autonomousSpeed = 0.026 + detail01 * 0.006;

    const rendered: Array<{
      depth: number;
      x: number;
      y: number;
      radius: number;
      color: number;
      alpha: number;
      sparkle: number;
    }> = [];

    for (let index = 0; index < count; index++) {
      const seed = this.seeds[index];
      if (seed.arm >= arms) continue;

      // Genuine 3D funnel: progress drives particles deeper into z while radius
      // collapses. Geometry is autonomous; audio cannot reverse or jitter it.
      const progress = fract(seed.phase + time * autonomousSpeed * (0.88 + seed.size * 0.08));
      const eased = Math.pow(progress, 0.90);
      const z = 0.18 + eased * 8.7;
      const radial = 2.85
        * Math.pow(1 - eased, 0.62)
        * (0.90 + seed.wobble * 0.20);
      const angle = seed.arm / arms * Math.PI * 2
        + eased * (2.65 + detail01 * 0.75) * Math.PI * 2
        + time * 0.11
        + seed.wobble;

      const world: Vec3 = {
        x: Math.cos(angle) * radial,
        y: Math.sin(angle) * radial * 0.76,
        z,
      };
      const projected = project(
        world,
        focal,
        cameraDistance,
        yaw,
        pitch,
        this.width,
        this.height,
      );
      if (!projected) continue;

      const pad = 60;
      if (
        projected.x < -pad
        || projected.x > this.width + pad
        || projected.y < -pad
        || projected.y > this.height + pad
      ) continue;

      const perspective = focal / Math.max(1, projected.depth);
      const baseWorldSize = (0.020 + (1 - eased) * 0.050) * seed.size;
      const radiusPx = clamp(
        baseWorldSize * perspective * (1 + this.smoothedBass * 0.10),
        0.55,
        15,
      );

      const warmOuter = smoothstep(0.24, 0.95, radial);
      const spectralInner = 1 - warmOuter;
      const outerColor = mixColor(0xffa341, 0xffd85d, seed.hue);
      const innerColor = paletteColor(
        fract(seed.hue + angle / (Math.PI * 2) + time * 0.004),
      );
      const color = mixColor(outerColor, innerColor, spectralInner);
      const fog = 1 - smoothstep(6.5, 13.0, projected.depth);
      const alpha = clamp(
        (0.24 + fog * 0.64)
          * seed.brightness
          * (0.84 + this.intensity * 0.14),
        0.03,
        0.95,
      );
      const sparkle = smoothstep(0.76, 1.0, seed.brightness)
        * (0.12 + this.smoothedTreble * 0.38 + this.smoothedTransient * 0.32);

      rendered.push({
        depth: projected.depth,
        x: projected.x,
        y: projected.y,
        radius: radiusPx,
        color,
        alpha,
        sparkle,
      });
    }

    rendered.sort((a, b) => b.depth - a.depth);

    for (const particle of rendered) {
      this.glow
        .circle(particle.x, particle.y, particle.radius * 2.6)
        .fill({
          color: particle.color,
          alpha: particle.alpha * (0.035 + this.smoothedEnergy * 0.045),
        });

      this.particles
        .circle(particle.x, particle.y, particle.radius)
        .fill({ color: particle.color, alpha: particle.alpha });

      if (particle.sparkle > 0.035) {
        this.particles
          .circle(
            particle.x - particle.radius * 0.24,
            particle.y - particle.radius * 0.28,
            Math.max(0.35, particle.radius * 0.25),
          )
          .fill({
            color: 0xfffbe8,
            alpha: particle.alpha * particle.sparkle,
          });
      }
    }

    // Bright multicolor whirlpool core.
    const coreRadius = Math.min(this.width, this.height);
    for (let ring = 5; ring >= 0; ring--) {
      const t = ring / 5;
      const color = paletteColor(fract(time * 0.013 + t * 0.72));
      this.glow
        .circle(
          this.width * 0.5,
          this.height * 0.5,
          coreRadius * (0.018 + t * 0.040),
        )
        .fill({
          color,
          alpha: (0.012 + (1 - t) * 0.035)
            * (0.72 + this.smoothedEnergy * 0.45 + this.intensity * 0.08),
        });
    }

    this.particles
      .circle(
        this.width * 0.5,
        this.height * 0.5,
        2.2 + this.smoothedTransient * 2.4,
      )
      .fill({
        color: 0xfff7dc,
        alpha: 0.42 + this.smoothedTransient * 0.30,
      });
  }
}

function project(
  point: Vec3,
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

  const x1 = point.x * cy - point.z * sy;
  const z1 = point.x * sy + point.z * cy;
  const y2 = point.y * cp - z1 * sp;
  const z2 = point.y * sp + z1 * cp;
  const depth = cameraDistance + z2;
  if (depth <= 0.08) return null;

  return {
    x: width * 0.5 + x1 * focal / depth,
    y: height * 0.5 - y2 * focal / depth,
    depth,
  };
}

function paletteColor(position: number) {
  const scaled = fract(position) * PALETTE.length;
  const index = Math.floor(scaled) % PALETTE.length;
  const next = (index + 1) % PALETTE.length;
  return mixColor(PALETTE[index], PALETTE[next], scaled - Math.floor(scaled));
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
  return fract(x);
}

function fract(value: number) {
  return value - Math.floor(value);
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
