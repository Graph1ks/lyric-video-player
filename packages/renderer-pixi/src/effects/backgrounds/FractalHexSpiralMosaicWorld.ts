import { Container, Graphics } from "pixi.js";
import type { AudioBands } from "@graph1ks/emo-audio-web";
import type { QualityMode } from "@graph1ks/emo-engine-core";

type Vec3 = { x: number; y: number; z: number };
type Projected = { x: number; y: number; depth: number };
type SpiralTileSeed = {
  sink: number;
  arm: number;
  phase: number;
  hue: number;
  size: number;
  thickness: number;
  twist: number;
};

const PALETTE = [
  0x35c9ff,
  0x68f2bd,
  0xf2f05d,
  0xffa55f,
  0xff6ba8,
  0xcd63ff,
  0x665cff,
] as const;

const SINKS = [
  { x: -1.72, y: 0.72 },
  { x: 0.05, y: -0.48 },
  { x: 1.58, y: 0.44 },
] as const;

export class FractalHexSpiralMosaicWorld {
  readonly container = new Container();

  private readonly body = new Graphics();
  private readonly glow = new Graphics();
  private readonly seeds: SpiralTileSeed[] = [];
  private width = 1;
  private height = 1;
  private intensity = 1;
  private detail = 1;
  private quality: QualityMode = "cinema";
  private lastTime = Number.NaN;
  private smoothedEnergy = 0;
  private smoothedTreble = 0;
  private smoothedTransient = 0;

  constructor() {
    this.glow.blendMode = "add";
    this.container.addChild(this.body, this.glow);
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
      this.smoothedEnergy = audio.energy;
      this.smoothedTreble = audio.treble;
      this.smoothedTransient = audio.transient;
    } else {
      this.smoothedEnergy = envelope(this.smoothedEnergy, audio.energy, dt, 0.09, 0.34);
      this.smoothedTreble = envelope(this.smoothedTreble, audio.treble, dt, 0.06, 0.22);
      this.smoothedTransient = envelope(this.smoothedTransient, audio.transient, dt, 0.02, 0.14);
    }

    this.draw(time);
    this.container.alpha = clamp(this.intensity, 0, 1);
  }

  private buildSeeds() {
    // Stable deterministic population. These are independent moving 3D tiles,
    // not a 2D texture being warped.
    const total = 480;
    for (let index = 0; index < total; index++) {
      const sink = index % SINKS.length;
      const arm = Math.floor(index / SINKS.length) % 7;
      const sequence = Math.floor(index / (SINKS.length * 7));
      const random = hash(index * 12.73 + 4.91);
      this.seeds.push({
        sink,
        arm,
        phase: fract(sequence * 0.083 + random * 0.18),
        hue: hash(index * 3.71 + 19.2),
        size: 0.78 + hash(index * 7.13 + 1.4) * 0.50,
        thickness: 0.13 + hash(index * 4.31 + 8.8) * 0.22,
        twist: (hash(index * 9.17 + 3.2) - 0.5) * 0.5,
      });
    }
  }

  private draw(time: number) {
    this.body.clear();
    this.glow.clear();
    this.body.rect(0, 0, this.width, this.height).fill({ color: 0x020205, alpha: 1 });

    const detail01 = clamp(this.detail / 3, 0, 1);
    const qualityScale = this.quality === "cinema" ? 1 : 0.68;
    const requested = Math.round(170 + detail01 * 300);
    const count = Math.max(120, Math.min(this.seeds.length, Math.round(requested * qualityScale)));
    const focal = Math.min(this.width, this.height) * 1.27;
    const cameraDistance = 4.15;
    const cameraYaw = Math.sin(time * 0.052) * 0.105;
    const cameraPitch = Math.sin(time * 0.039 + 1.3) * 0.042;

    const rendered: Array<{
      depth: number;
      front: Projected[];
      back: Projected[];
      color: number;
      sideA: number;
      sideB: number;
      accent: number;
      alpha: number;
      sinkStrength: number;
    }> = [];

    const arms = Math.max(4, Math.min(7, Math.round(4 + detail01 * 3)));
    const turns = 2.15 + detail01 * 1.35;
    const autonomousSpeed = 0.018 + detail01 * 0.006;
    const powerLight = 0.74 + this.intensity * 0.22 + this.smoothedEnergy * 0.10;

    for (let index = 0; index < count; index++) {
      const seed = this.seeds[index];
      if (seed.arm >= arms) continue;

      const progress = fract(seed.phase + time * autonomousSpeed * (0.82 + seed.size * 0.14));
      const eased = Math.pow(progress, 0.92);
      const sink = SINKS[seed.sink];

      // True z-depth: tiles physically travel away from the camera while their
      // spiral radius collapses. Perspective therefore creates real parallax,
      // scale change and a deep sink instead of a flat domain warp.
      const z = 0.25 + eased * (7.6 + seed.sink * 0.34);
      const radius = (2.55 - seed.sink * 0.10)
        * Math.pow(1 - eased, 0.63)
        * (0.90 + seed.size * 0.12);
      const angle = seed.arm / arms * Math.PI * 2
        + eased * turns * Math.PI * 2
        + time * (0.10 + seed.sink * 0.012)
        + seed.twist;

      const x = sink.x + Math.cos(angle) * radius;
      const y = sink.y + Math.sin(angle) * radius * 0.78;
      const tileRadius = (0.31 + (1 - eased) * 0.11)
        * seed.size
        * (0.92 + detail01 * 0.08);
      const thickness = seed.thickness * (0.86 + (1 - eased) * 0.42);

      const frontWorld = hexPlane({ x, y, z }, tileRadius, angle * 0.34 + seed.twist);
      const backWorld = hexPlane({ x, y, z: z + thickness }, tileRadius * 0.96, angle * 0.34 + seed.twist);

      const front = frontWorld.map(point => project(point, focal, cameraDistance, cameraYaw, cameraPitch, this.width, this.height));
      const back = backWorld.map(point => project(point, focal, cameraDistance, cameraYaw, cameraPitch, this.width, this.height));
      if (front.some(point => !point) || back.some(point => !point)) continue;

      const frontProjected = front as Projected[];
      const backProjected = back as Projected[];
      const center = project({ x, y, z }, focal, cameraDistance, cameraYaw, cameraPitch, this.width, this.height);
      if (!center) continue;

      const pad = Math.max(this.width, this.height) * 0.14;
      if (center.x < -pad || center.x > this.width + pad || center.y < -pad || center.y > this.height + pad) continue;

      const palettePosition = fract(seed.hue + eased * 0.34 + time * 0.0035);
      const color = paletteColor(palettePosition, powerLight);
      const sideA = multiplyColor(color, 0.40);
      const sideB = multiplyColor(color, 0.24);
      const accent = mixColor(color, 0xffffff, 0.46);
      const fog = 1 - smoothstep(5.2, 12.0, cameraDistance + z);
      const alpha = clamp((0.52 + fog * 0.48) * (0.82 + this.intensity * 0.08), 0, 1);

      rendered.push({
        depth: center.depth,
        front: frontProjected,
        back: backProjected,
        color,
        sideA,
        sideB,
        accent,
        alpha,
        sinkStrength: 1 - eased,
      });
    }

    rendered.sort((a, b) => b.depth - a.depth);

    for (const tile of rendered) {
      // Back-to-front side faces create actual prism depth.
      for (let edge = 0; edge < 6; edge++) {
        const next = (edge + 1) % 6;
        const face = [
          tile.front[edge].x, tile.front[edge].y,
          tile.front[next].x, tile.front[next].y,
          tile.back[next].x, tile.back[next].y,
          tile.back[edge].x, tile.back[edge].y,
        ];
        this.body
          .poly(face)
          .fill({
            color: edge < 3 ? tile.sideA : tile.sideB,
            alpha: tile.alpha * 0.94,
          });
      }

      const frontPoints = flatten(tile.front);
      this.body
        .poly(frontPoints)
        .fill({ color: tile.color, alpha: tile.alpha })
        .stroke({
          width: 1.2 + this.detail * 0.42,
          color: 0x08080c,
          alpha: 0.96,
        });

      // Inset face detail from the reference, now correctly bound to a moving
      // 3D tile rather than stamped into a flat warped screenshot.
      const inner = scalePolygon(tile.front, 0.32);
      this.body
        .poly(flatten(inner))
        .fill({ color: multiplyColor(tile.color, 0.42), alpha: tile.alpha * 0.92 })
        .stroke({ width: 0.8, color: 0x111018, alpha: 0.86 });

      const highlight = [
        tile.front[4].x, tile.front[4].y,
        tile.front[5].x, tile.front[5].y,
        tile.front[0].x, tile.front[0].y,
      ];
      this.body
        .poly(highlight)
        .stroke({
          width: 0.65 + this.smoothedTreble * 1.2,
          color: tile.accent,
          alpha: 0.10 + this.smoothedTreble * 0.12,
        });

      if (tile.sinkStrength < 0.33) {
        const center = polygonCenter(tile.front);
        this.glow
          .circle(center.x, center.y, 1.2 + this.smoothedTransient * 2.5)
          .fill({
            color: tile.accent,
            alpha: 0.018 + this.smoothedTransient * 0.06,
          });
      }
    }

    // Deep chromatic sinks sit behind the geometry and make depth readable even
    // in a paused frame.
    for (let index = 0; index < SINKS.length; index++) {
      const sink = SINKS[index];
      const projected = project(
        { x: sink.x, y: sink.y, z: 7.9 + index * 0.3 },
        focal,
        cameraDistance,
        cameraYaw,
        cameraPitch,
        this.width,
        this.height,
      );
      if (!projected) continue;
      const color = PALETTE[(index * 2 + 1) % PALETTE.length];
      this.glow
        .circle(projected.x, projected.y, 22 + detail01 * 18)
        .fill({
          color,
          alpha: 0.025 + this.smoothedEnergy * 0.035 + this.intensity * 0.008,
        });
      this.glow
        .circle(projected.x, projected.y, 3 + this.smoothedTransient * 3)
        .fill({
          color: 0xffffff,
          alpha: 0.09 + this.smoothedTransient * 0.16,
        });
    }
  }
}

function hexPlane(center: Vec3, radius: number, rotation: number): Vec3[] {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = rotation + index * Math.PI / 3;
    return {
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
      z: center.z,
    };
  });
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
  // Small camera orbit creates real parallax across z-depth.
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

function flatten(points: Projected[]) {
  const output: number[] = [];
  for (const point of points) output.push(point.x, point.y);
  return output;
}

function scalePolygon(points: Projected[], scale: number): Projected[] {
  const center = polygonCenter(points);
  return points.map(point => ({
    x: center.x + (point.x - center.x) * scale,
    y: center.y + (point.y - center.y) * scale,
    depth: point.depth,
  }));
}

function polygonCenter(points: Projected[]) {
  let x = 0;
  let y = 0;
  for (const point of points) {
    x += point.x;
    y += point.y;
  }
  return { x: x / points.length, y: y / points.length };
}

function paletteColor(position: number, gain: number) {
  const scaled = fract(position) * PALETTE.length;
  const index = Math.floor(scaled) % PALETTE.length;
  const next = (index + 1) % PALETTE.length;
  return multiplyColor(mixColor(PALETTE[index], PALETTE[next], scaled - Math.floor(scaled)), gain);
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

function multiplyColor(color: number, gain: number) {
  const r = clamp(Math.round(((color >> 16) & 0xff) * gain), 0, 255);
  const g = clamp(Math.round(((color >> 8) & 0xff) * gain), 0, 255);
  const b = clamp(Math.round((color & 0xff) * gain), 0, 255);
  return (r << 16) | (g << 8) | b;
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
