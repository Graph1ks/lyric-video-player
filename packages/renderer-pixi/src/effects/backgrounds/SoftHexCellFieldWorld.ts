import { Container, Graphics } from "pixi.js";
import type { AudioBands } from "@graph1ks/emo-audio-web";
import type { QualityMode } from "@graph1ks/emo-engine-core";

type Vec3 = { x: number; y: number; z: number };
type Vec2 = { x: number; y: number };
type Projected = { x: number; y: number; depth: number };
type RenderCell = {
  depth: number;
  top: Projected[];
  bottom: Projected[];
  center: Projected;
  color: number;
  sideLight: number;
  sideDark: number;
  outline: number;
  glint: number;
  alpha: number;
};

const SQRT3 = Math.sqrt(3);
const PALETTE = [
  0x99f7ce,
  0xd4ff74,
  0xfff17d,
  0xffcb86,
  0xff9d7a,
  0xff799c,
  0xf368d3,
  0xa876ff,
  0x55bfff,
] as const;

export class SoftHexCellFieldWorld {
  readonly container = new Container();

  private readonly field = new Graphics();
  private readonly glow = new Graphics();
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
    this.container.addChild(this.field, this.glow);
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
      this.smoothedBass = envelope(this.smoothedBass, audio.bass, dt, 0.11, 0.38);
      this.smoothedTreble = envelope(this.smoothedTreble, audio.treble, dt, 0.06, 0.24);
      this.smoothedEnergy = envelope(this.smoothedEnergy, audio.energy, dt, 0.12, 0.40);
      this.smoothedTransient = envelope(this.smoothedTransient, audio.transient, dt, 0.025, 0.16);
    }

    this.draw(time);
    this.container.alpha = clamp(this.intensity, 0, 1);
  }

  private draw(time: number) {
    this.field.clear();
    this.glow.clear();
    this.field.rect(0, 0, this.width, this.height).fill({ color: 0x010102, alpha: 1 });

    const detail01 = clamp(this.detail / 3, 0, 1);
    const qualityScale = this.quality === "cinema" ? 1 : 0.78;

    // Explicit 3D camera + look-at basis, inspired by the proven 3D projection
    // used by the website's Circuit Grid background. This is a real projected
    // hex-prism field, not a screen-space honeycomb mask.
    const orbit = time * 0.035;
    const camera: Vec3 = {
      x: Math.sin(orbit) * 1.15,
      y: 6.7 + Math.sin(time * 0.021) * 0.24,
      z: 8.9 + Math.cos(orbit) * 0.42,
    };
    const target: Vec3 = {
      x: Math.sin(time * 0.018) * 0.32,
      y: 0.46,
      z: Math.cos(time * 0.016) * 0.28,
    };
    const basis = cameraBasis(camera, target);
    const focal = Math.min(this.width, this.height) * 1.08;

    const radius = lerp(1.03, 0.67, detail01) / Math.sqrt(qualityScale);
    const rangeQ = Math.ceil(9.8 / (SQRT3 * radius)) + 4;
    const rangeR = Math.ceil(9.0 / (1.5 * radius)) + 5;
    const rendered: RenderCell[] = [];
    const lightBoost = 0.86
      + this.intensity * 0.18
      + this.smoothedEnergy * 0.08
      + this.smoothedBass * 0.035;

    for (let r = -rangeR; r <= rangeR; r++) {
      for (let q = -rangeQ; q <= rangeQ; q++) {
        // Pointy-top axial coordinates guarantee a correctly packed hex field.
        // Cell footprint variation is deliberately tiny so black channels are
        // narrow, consistent and never become giant accidental holes.
        const x = SQRT3 * radius * (q + r * 0.5);
        const z = 1.5 * radius * r;
        const seed = hash2(q, r);
        const seedB = hash2(q + 91, r - 47);
        const seedC = hash2(q - 33, r + 73);

        const fieldWave = Math.sin(
          time * (0.13 + seed * 0.05)
          + x * 0.18
          - z * 0.16
          + seed * Math.PI * 2,
        );
        const height = 0.18
          + Math.pow(seed, 1.65) * 1.42
          + fieldWave * (0.07 + seedB * 0.06);
        const footprint = radius * (0.935 + seedC * 0.045);
        const rotation = (q - r) * 0.014 + (seedB - 0.5) * 0.055;

        const bottomWorld = hexXZ({ x, y: 0, z }, footprint, rotation);
        const topWorld = hexXZ({ x, y: height, z }, footprint, rotation);
        const bottom = bottomWorld.map(point => project(point, camera, basis, focal, this.width, this.height));
        const top = topWorld.map(point => project(point, camera, basis, focal, this.width, this.height));
        if (bottom.some(point => !point) || top.some(point => !point)) continue;

        const topProjected = top as Projected[];
        const bottomProjected = bottom as Projected[];
        const center = project({ x, y: height, z }, camera, basis, focal, this.width, this.height);
        if (!center) continue;

        const pad = Math.max(this.width, this.height) * 0.13;
        if (center.x < -pad || center.x > this.width + pad || center.y < -pad || center.y > this.height + pad) continue;

        const palettePosition = fract(
          0.08
          + x * 0.023
          + z * 0.020
          + seed * 0.24
          + time * 0.0018,
        );
        let color = paletteColor(palettePosition);
        const muted = seed < 0.11 || (seed > 0.46 && seed < 0.51);
        if (muted) color = mixColor(color, 0x5a594f, 0.58);

        const topNormalLight = clamp(
          0.80 + (camera.x - x) * 0.016 + (camera.z - z) * 0.008,
          0.68,
          1.08,
        );
        color = multiplyColor(color, lightBoost * topNormalLight);

        const fog = 1 - smoothstep(7.5, 17.0, center.depth);
        const alpha = clamp(0.62 + fog * 0.38, 0.55, 1);
        const sideLight = multiplyColor(color, 0.48);
        const sideDark = multiplyColor(color, 0.28);
        const outline = multiplyColor(color, 0.12);

        rendered.push({
          depth: center.depth,
          top: topProjected,
          bottom: bottomProjected,
          center,
          color,
          sideLight,
          sideDark,
          outline,
          glint: mixColor(color, 0xffffff, 0.74),
          alpha,
        });
      }
    }

    rendered.sort((a, b) => b.depth - a.depth);

    for (const cell of rendered) {
      // Draw all six prism sides before the top. Perspective and back-to-front
      // sorting create actual occlusion/depth, unlike the previous 2D masks.
      for (let edge = 0; edge < 6; edge++) {
        const next = (edge + 1) % 6;
        this.field
          .poly([
            cell.bottom[edge].x, cell.bottom[edge].y,
            cell.bottom[next].x, cell.bottom[next].y,
            cell.top[next].x, cell.top[next].y,
            cell.top[edge].x, cell.top[edge].y,
          ])
          .fill({
            color: edge === 0 || edge === 1 || edge === 5 ? cell.sideLight : cell.sideDark,
            alpha: cell.alpha,
          });
      }

      this.field
        .poly(flatten(cell.top))
        .fill({ color: cell.color, alpha: cell.alpha })
        .stroke({
          width: 0.75 + this.detail * 0.36,
          color: cell.outline,
          alpha: 0.92,
        });

      // Small bevel ring makes each cap feel cut/extruded rather than like a
      // flat colored SVG polygon.
      const bevel = scalePolygon(cell.top, 0.86);
      this.field
        .poly(flatten(bevel))
        .stroke({
          width: 0.55 + this.detail * 0.18,
          color: mixColor(cell.color, 0xffffff, 0.34),
          alpha: 0.15 + this.smoothedEnergy * 0.04,
        });

      const glintSeed = hash(cell.center.x * 0.017 + cell.center.y * 0.031);
      if (glintSeed > 0.78) {
        const center = polygonCenter(cell.top);
        const a = cell.top[4];
        const b = cell.top[5];
        this.field
          .poly([
            center.x + (a.x - center.x) * 0.18,
            center.y + (a.y - center.y) * 0.18,
            center.x + (b.x - center.x) * 0.44,
            center.y + (b.y - center.y) * 0.44,
            center.x + (a.x - center.x) * 0.50,
            center.y + (a.y - center.y) * 0.50,
          ])
          .fill({
            color: cell.glint,
            alpha: 0.12 + this.smoothedTreble * 0.13 + this.smoothedTransient * 0.10,
          });
      }
    }

    // Restrained horizon haze separates near/far geometry while preserving the
    // reference's black channels.
    this.glow
      .ellipse(
        this.width * 0.50,
        this.height * 0.43,
        this.width * 0.42,
        this.height * 0.12,
      )
      .fill({
        color: 0x9b6cff,
        alpha: 0.008 + this.smoothedEnergy * 0.010 + this.intensity * 0.003,
      });
  }
}

function hexXZ(center: Vec3, radius: number, rotation: number): Vec3[] {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = rotation + Math.PI / 6 + index * Math.PI / 3;
    return {
      x: center.x + Math.cos(angle) * radius,
      y: center.y,
      z: center.z + Math.sin(angle) * radius,
    };
  });
}

function cameraBasis(camera: Vec3, target: Vec3) {
  const forward = normalize({
    x: target.x - camera.x,
    y: target.y - camera.y,
    z: target.z - camera.z,
  });
  const right = normalize(cross(forward, { x: 0, y: 1, z: 0 }));
  const up = cross(right, forward);
  return { forward, right, up };
}

function project(
  point: Vec3,
  camera: Vec3,
  basis: ReturnType<typeof cameraBasis>,
  focal: number,
  width: number,
  height: number,
): Projected | null {
  const relative = {
    x: point.x - camera.x,
    y: point.y - camera.y,
    z: point.z - camera.z,
  };
  const depth = dot(relative, basis.forward);
  if (depth <= 0.08) return null;

  const viewX = dot(relative, basis.right);
  const viewY = dot(relative, basis.up);
  return {
    x: width * 0.5 + viewX * focal / depth,
    y: height * 0.53 - viewY * focal / depth,
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

function polygonCenter(points: Projected[]): Vec2 {
  let x = 0;
  let y = 0;
  for (const point of points) {
    x += point.x;
    y += point.y;
  }
  return { x: x / points.length, y: y / points.length };
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

function multiplyColor(color: number, gain: number) {
  const r = clamp(Math.round(((color >> 16) & 0xff) * gain), 0, 255);
  const g = clamp(Math.round(((color >> 8) & 0xff) * gain), 0, 255);
  const b = clamp(Math.round((color & 0xff) * gain), 0, 255);
  return (r << 16) | (g << 8) | b;
}

function normalize(value: Vec3): Vec3 {
  const length = Math.max(0.000001, Math.hypot(value.x, value.y, value.z));
  return { x: value.x / length, y: value.y / length, z: value.z / length };
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function dot(a: Vec3, b: Vec3) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function hash2(a: number, b: number) {
  return hash(a * 127.1 + b * 311.7);
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

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
