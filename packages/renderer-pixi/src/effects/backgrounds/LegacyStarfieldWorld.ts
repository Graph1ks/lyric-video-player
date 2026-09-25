import { Container, Graphics } from "pixi.js";
import type { AudioBands } from "@graph1ks/emo-audio-web";
import {
  clamp,
  hash01,
  type QualityMode,
  type VisualPalette,
} from "@graph1ks/emo-engine-core";

interface FlightStar {
  x: number;
  y: number;
  zSeed: number;
  speed: number;
  size: number;
  tint: number;
  phase: number;
}

export class LegacyStarfieldWorld {
  readonly container = new Container();

  private readonly backdrop = new Graphics();
  private readonly trails = new Graphics();
  private readonly stars = new Graphics();
  private readonly bloom = new Graphics();
  private readonly field: FlightStar[] = [];
  private w = 1;
  private h = 1;
  private intensity = 1;
  private detail = 1;
  private quality: QualityMode = "cinema";
  private palette?: VisualPalette;

  constructor() {
    this.trails.blendMode = "add";
    this.stars.blendMode = "add";
    this.bloom.blendMode = "add";
    this.container.addChild(this.backdrop, this.bloom, this.trails, this.stars);
    this.container.visible = false;

    // Fixed world-space stars. No frame history and no random state are required,
    // so any timestamp reconstructs exactly the same flight volume after a seek.
    for (let index = 0; index < 720; index++) {
      const angleSeed = hash01(index * 31.713 + 4.21);
      const radiusSeed = hash01(index * 79.337 + 9.73);
      const angle = angleSeed * Math.PI * 2;
      // Slight central bias keeps the tunnel dense without a synthetic spoke overlay.
      const radius = Math.pow(radiusSeed, 0.58);
      this.field.push({
        x: Math.cos(angle) * radius * (3.4 + hash01(index * 17.2) * 2.5),
        y: Math.sin(angle) * radius * (2.0 + hash01(index * 53.9) * 1.7),
        zSeed: hash01(index * 131.73 + 4.3),
        speed: 0.072 + hash01(index * 43.17 + 7.6) * 0.052,
        size: 0.44 + hash01(index * 97.11 + 2.8) * 1.75,
        tint: hash01(index * 151.37 + 3.9),
        phase: hash01(index * 191.83 + 5.1),
      });
    }
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

  resize(w: number, h: number) {
    this.w = Math.max(1, w);
    this.h = Math.max(1, h);
  }

  update(time: number, audio: AudioBands) {
    if (!this.container.visible) return;
    this.draw(time, audio);
    this.container.alpha = clamp(this.intensity, 0, 1);
  }

  private draw(time: number, audio: AudioBands) {
    this.backdrop.clear();
    this.trails.clear();
    this.stars.clear();
    this.bloom.clear();

    const p = this.palette;
    const background = p?.background ?? 0x01040a;
    const accentA = p?.accentA ?? 0x8cfff7;
    const accentB = p?.accentB ?? 0x8c6fff;
    const glow = p?.glow ?? 0xf2ffff;
    const power = clamp(this.intensity / 3);
    const detail01 = clamp(this.detail / 3);
    const cinema = this.quality === "cinema";
    const cx = this.w * 0.5;
    const cy = this.h * 0.5;
    const focal = Math.min(this.w, this.h) * 0.82;
    const near = 0.26;
    const far = 9.4;
    const visibleCount = Math.max(
      170,
      Math.min(
        this.field.length,
        Math.round((cinema ? 650 : 390) * (0.46 + detail01 * 0.70)),
      ),
    );

    this.backdrop.rect(0, 0, this.w, this.h).fill({ color: background, alpha: 1 });

    // The flight volume itself carries the depth. Deliberately avoid a radial
    // center disc/halo: that reads as breathing when the optical field is moving.

    const brightness = 0.78 + audio.energy * 0.16 + audio.treble * 0.10;
    const trailSeconds = 0.048 + detail01 * 0.028 + power * 0.018;

    for (let index = 0; index < visibleCount; index++) {
      const star = this.field[index];

      // Camera flight is strictly one-way: phase decreases with absolute time,
      // z decreases toward the camera, then wraps once to the far plane.
      const phase = fract(star.zSeed - time * star.speed);
      const previousPhase = fract(star.zSeed - (time - trailSeconds) * star.speed);
      const z = near + phase * (far - near);
      const perspective = focal / z;
      const x = cx + star.x * perspective;
      const y = cy + star.y * perspective;

      if (x < -90 || x > this.w + 90 || y < -90 || y > this.h + 90) continue;

      // Fade both ends of the z-cycle so the far-plane wrap never reads as a reversal.
      const farFade = clamp((1 - phase) / 0.10);
      const nearFade = clamp(phase / 0.065);
      const edgeX = clamp(Math.min(x + 30, this.w + 30 - x) / 90);
      const edgeY = clamp(Math.min(y + 30, this.h + 30 - y) / 90);
      const lifecycle = farFade * nearFade * Math.min(edgeX, edgeY);
      if (lifecycle <= 0.002) continue;

      const proximity = 1 - clamp((z - near) / (far - near));
      const size = clamp(
        star.size * (0.32 + proximity * proximity * 4.8) * (0.78 + power * 0.30),
        0.38,
        cinema ? 7.2 : 5.4,
      );
      const alpha = clamp(
        lifecycle * (0.11 + proximity * 0.86) * brightness,
        0,
        0.96,
      );
      const color = star.tint > 0.93
        ? accentB
        : star.tint > 0.77
          ? accentA
          : glow;

      // Previous projected position is evaluated analytically at an earlier
      // timestamp. We never trail across the wrap boundary.
      if (previousPhase >= phase && proximity > 0.12) {
        const previousZ = near + previousPhase * (far - near);
        const previousPerspective = focal / previousZ;
        const px = cx + star.x * previousPerspective;
        const py = cy + star.y * previousPerspective;
        const streakLength = Math.hypot(x - px, y - py);

        if (streakLength > 0.75) {
          const streakAlpha = alpha
            * clamp(streakLength / 28)
            * (0.28 + proximity * 0.64);
          this.trails
            .moveTo(px, py)
            .lineTo(x, y)
            .stroke({
              width: Math.max(0.55, size * (0.30 + proximity * 0.18)),
              color,
              alpha: streakAlpha,
            });

          if (cinema && proximity > 0.48) {
            this.bloom
              .moveTo(px, py)
              .lineTo(x, y)
              .stroke({
                width: Math.max(1.2, size * 1.65),
                color,
                alpha: streakAlpha * 0.085,
              });
          }
        }
      }

      if (cinema && proximity > 0.40) {
        this.bloom
          .circle(x, y, size * (2.6 + proximity * 1.7))
          .fill({ color, alpha: alpha * 0.042 });
      }

      this.stars
        .circle(x, y, size)
        .fill({ color, alpha });

      // A tiny hot core makes near stars read as luminous objects, not dots.
      if (proximity > 0.66 && size > 1.35) {
        this.stars
          .circle(x, y, Math.max(0.45, size * 0.28))
          .fill({ color: glow, alpha: alpha * 0.72 });
      }
    }

    // Far dust exists as a separate depth cue and also moves one-way.
    const dustCount = cinema ? 110 : 60;
    for (let index = 0; index < dustCount; index++) {
      const seed = hash01(index * 223.1 + 17.4);
      const phase = fract(seed - time * (0.021 + hash01(index * 83.7) * 0.012));
      const z = 5.4 + phase * 8.0;
      const angle = hash01(index * 37.2 + 2.3) * Math.PI * 2;
      const radius = 1.2 + hash01(index * 61.8 + 8.9) * 5.8;
      const x = cx + Math.cos(angle) * radius * focal / z;
      const y = cy + Math.sin(angle) * radius * 0.62 * focal / z;
      if (x < 0 || x > this.w || y < 0 || y > this.h) continue;
      this.stars
        .circle(x, y, 0.32 + hash01(index * 13.7) * 0.55)
        .fill({ color: glow, alpha: 0.045 + audio.treble * 0.018 });
    }
  }
}

function fract(value: number) {
  return value - Math.floor(value);
}
