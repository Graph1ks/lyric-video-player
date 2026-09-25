import { Container, Graphics } from "pixi.js";
import type { AudioBands } from "@graph1ks/emo-audio-web";
import {
  clamp,
  type QualityMode,
  type VisualPalette,
} from "@graph1ks/emo-engine-core";

type SparkSeed = {
  phase: number;
  rate: number;
  source: number;
  direction: number;
  lift: number;
  spread: number;
  size: number;
  brightness: number;
  burstAffinity: number;
  hue: number;
};

export class LegacySparksWorld {
  readonly container = new Container();

  private readonly backdrop = new Graphics();
  private readonly glow = new Graphics();
  private readonly trails = new Graphics();
  private readonly heads = new Graphics();
  private readonly seeds: SparkSeed[] = [];
  private width = 1;
  private height = 1;
  private intensity = 1;
  private detail = 1;
  private quality: QualityMode = "cinema";
  private palette?: VisualPalette;

  constructor() {
    this.glow.blendMode = "add";
    this.heads.blendMode = "add";
    this.container.addChild(this.backdrop, this.glow, this.trails, this.heads);
    this.container.visible = false;
    this.buildSeeds();
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

  update(time: number, audio: AudioBands, transientEnvelope: number) {
    if (!this.container.visible) return;
    this.draw(time, audio, clamp(transientEnvelope, 0, 1));
    this.container.alpha = clamp(this.intensity, 0, 1);
  }

  private buildSeeds() {
    const total = 460;
    for (let index = 0; index < total; index++) {
      this.seeds.push({
        phase: hash(index * 3.17 + 1.2),
        rate: 0.095 + hash(index * 4.83 + 6.1) * 0.16,
        source: Math.floor(hash(index * 7.11 + 2.7) * 4),
        direction: hash(index * 8.29 + 9.3) < 0.5 ? -1 : 1,
        lift: 0.55 + hash(index * 5.43 + 4.1) * 0.58,
        spread: (hash(index * 6.71 + 5.9) - 0.5) * 0.72,
        size: 0.55 + hash(index * 9.31 + 7.7) * 1.45,
        brightness: 0.42 + hash(index * 11.13 + 3.4) * 0.78,
        burstAffinity: hash(index * 13.79 + 8.6),
        hue: hash(index * 15.17 + 1.9),
      });
    }
  }

  private draw(time: number, audio: AudioBands, transientEnvelope: number) {
    this.backdrop.clear();
    this.glow.clear();
    this.trails.clear();
    this.heads.clear();

    const background = this.palette?.background ?? 0x010305;
    const surface = this.palette?.surface ?? 0x101619;
    const accentA = this.palette?.accentA ?? 0xffb45f;
    const accentB = this.palette?.accentB ?? 0xff526f;
    const glowColor = this.palette?.glow ?? 0xfff3db;
    const muted = this.palette?.muted ?? 0x65514c;

    this.backdrop.rect(0, 0, this.width, this.height).fill({ color: background, alpha: 1 });

    const detail01 = clamp(this.detail / 3, 0, 1);
    const qualityScale = this.quality === "cinema" ? 1 : 0.68;
    const count = Math.max(
      130,
      Math.min(
        this.seeds.length,
        Math.round((170 + detail01 * 290) * qualityScale * (0.72 + this.intensity * 0.16)),
      ),
    );

    // A faint floor of smoke/heat keeps the fountain spatially grounded without
    // replacing the ballistic trajectories as the identity layer.
    const floorY = this.height * 0.82;
    this.glow
      .rect(0, floorY - this.height * 0.035, this.width, this.height * 0.07)
      .fill({
        color: mixColor(surface, accentB, 0.18),
        alpha: 0.010 + audio.energy * 0.012,
      });

    for (let index = 0; index < count; index++) {
      const seed = this.seeds[index];
      const cycle = seed.phase + time * seed.rate;
      const age = fract(cycle);
      const born = smoothstep(0.0, 0.035, age);
      const death = 1 - smoothstep(0.58, 0.995, age);
      const lifeAlpha = born * death;
      if (lifeAlpha <= 0.001) continue;

      // Transient response creates extra freshly-born emission only. It never
      // rescales, reverses or bends particles already in flight.
      const freshWindow = 1 - smoothstep(0.08, 0.26, age);
      const burstSpawn = transientEnvelope
        * freshWindow
        * smoothstep(0.58, 0.96, seed.burstAffinity);

      const origin = emitter(seed.source, time, this.width, this.height);
      const scale = Math.min(this.width, this.height);
      const vx = seed.direction * scale * (0.12 + Math.abs(seed.spread) * 0.18)
        + seed.spread * scale * 0.13;
      const vy = -scale * (0.44 + seed.lift * 0.32);
      const gravity = scale * (0.46 + seed.size * 0.08);
      const curl = scale * (0.018 + detail01 * 0.018);

      const position = sparkPosition(origin.x, origin.y, vx, vy, gravity, curl, age, seed, time);
      const trailAge = 0.035 + seed.size * 0.012 + detail01 * 0.016;
      const previous1 = sparkPosition(
        origin.x,
        origin.y,
        vx,
        vy,
        gravity,
        curl,
        Math.max(0, age - trailAge),
        seed,
        time,
      );
      const previous2 = sparkPosition(
        origin.x,
        origin.y,
        vx,
        vy,
        gravity,
        curl,
        Math.max(0, age - trailAge * 2),
        seed,
        time,
      );
      const previous3 = sparkPosition(
        origin.x,
        origin.y,
        vx,
        vy,
        gravity,
        curl,
        Math.max(0, age - trailAge * 3),
        seed,
        time,
      );

      const margin = scale * 0.10;
      if (
        position.x < -margin
        || position.x > this.width + margin
        || position.y < -margin
        || position.y > this.height + margin
      ) continue;

      const baseColor = mixColor(accentA, accentB, seed.hue);
      const hotColor = mixColor(baseColor, glowColor, 0.36 + seed.brightness * 0.32);
      const audioLight = 0.82 + audio.energy * 0.12 + audio.treble * 0.11;
      const alpha = clamp(
        lifeAlpha
          * seed.brightness
          * audioLight
          * (0.36 + this.intensity * 0.26)
          * (1 + burstSpawn * 0.75),
        0,
        0.96,
      );
      const width = (0.62 + seed.size * 0.62) * (0.76 + detail01 * 0.26);

      this.glow
        .moveTo(previous3.x, previous3.y)
        .lineTo(previous2.x, previous2.y)
        .lineTo(previous1.x, previous1.y)
        .lineTo(position.x, position.y)
        .stroke({
          width: width * (4.2 + seed.size * 1.1),
          color: baseColor,
          alpha: alpha * (0.018 + audio.energy * 0.020 + burstSpawn * 0.018),
        });

      this.trails
        .moveTo(previous3.x, previous3.y)
        .lineTo(previous2.x, previous2.y)
        .lineTo(previous1.x, previous1.y)
        .lineTo(position.x, position.y)
        .stroke({
          width,
          color: baseColor,
          alpha: alpha * 0.72,
        });

      const headRadius = (0.62 + seed.size * 0.72) * (1 + burstSpawn * 0.24);
      this.heads
        .circle(position.x, position.y, headRadius * 2.8)
        .fill({
          color: baseColor,
          alpha: alpha * (0.025 + audio.treble * 0.025),
        });
      this.heads
        .circle(position.x, position.y, headRadius)
        .fill({
          color: hotColor,
          alpha,
        });

      if (seed.brightness > 0.90 && age < 0.42) {
        const flare = headRadius * (2.6 + burstSpawn * 1.8);
        this.heads
          .moveTo(position.x - flare, position.y)
          .lineTo(position.x + flare, position.y)
          .stroke({
            width: 0.55,
            color: glowColor,
            alpha: alpha * 0.22,
          });
      }
    }

    // Deterministic hot-source embers communicate emitter locations even in a
    // paused frame; they are material accents, not the moving identity layer.
    for (let source = 0; source < 4; source++) {
      const origin = emitter(source, time, this.width, this.height);
      const sourceColor = source % 2 ? accentB : accentA;
      this.glow
        .circle(origin.x, origin.y, this.height * 0.018)
        .fill({
          color: sourceColor,
          alpha: 0.015 + audio.energy * 0.018,
        });
      this.heads
        .circle(origin.x, origin.y, 1.2 + detail01 * 0.7)
        .fill({
          color: mixColor(sourceColor, glowColor, 0.55),
          alpha: 0.30 + transientEnvelope * 0.22,
        });
    }

    // A few low-energy ash motes establish depth without becoming generic
    // fallback particles.
    const ashCount = this.quality === "cinema" ? 34 : 18;
    for (let i = 0; i < ashCount; i++) {
      const sx = hash(i * 31.7 + 4.1);
      const sy = fract(hash(i * 19.1 + 9.2) + time * (0.006 + hash(i * 8.7) * 0.009));
      const x = sx * this.width + Math.sin(time * 0.07 + i) * this.width * 0.008;
      const y = this.height * (0.92 - sy * 0.82);
      this.heads
        .circle(x, y, 0.45 + hash(i * 3.7) * 0.75)
        .fill({
          color: mixColor(muted, glowColor, 0.28),
          alpha: 0.035 + audio.treble * 0.018,
        });
    }
  }
}

function emitter(source: number, time: number, width: number, height: number) {
  const wobble = Math.sin(time * 0.12 + source * 1.73);
  if (source === 0) return { x: width * (0.16 + wobble * 0.012), y: height * 0.84 };
  if (source === 1) return { x: width * (0.37 + wobble * 0.010), y: height * 0.88 };
  if (source === 2) return { x: width * (0.64 + wobble * 0.010), y: height * 0.87 };
  return { x: width * (0.84 + wobble * 0.012), y: height * 0.83 };
}

function sparkPosition(
  originX: number,
  originY: number,
  vx: number,
  vy: number,
  gravity: number,
  curl: number,
  age: number,
  seed: SparkSeed,
  time: number,
) {
  const flight = age * (1.15 + seed.lift * 0.28);
  return {
    x: originX
      + vx * flight
      + Math.sin(flight * 5.2 + seed.phase * 9.0 + time * 0.045) * curl * flight,
    y: originY
      + vy * flight
      + 0.5 * gravity * flight * flight,
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
