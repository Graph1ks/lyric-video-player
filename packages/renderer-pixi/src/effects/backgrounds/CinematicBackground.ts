import { Container, Graphics } from "pixi.js";
import type { AudioBands } from "@graph1ks/emo-audio-web";
import type { QualityMode, SceneMode } from "@graph1ks/emo-engine-core";
import { seeded } from "@graph1ks/emo-engine-core";

interface Particle {
  g: Graphics;
  x: number;
  y: number;
  depth: number;
  speed: number;
  phase: number;
  size: number;
}

interface Blob {
  g: Graphics;
  phase: number;
  radius: number;
  orbitX: number;
  orbitY: number;
  speed: number;
}

export class CinematicBackground {
  readonly container = new Container();

  private base = new Graphics();
  private geometry = new Graphics();
  private blobLayer = new Container();
  private particleLayer = new Container();
  private ringLayer = new Container();
  private beamLayer = new Container();
  private flash = new Graphics();
  private particles: Particle[] = [];
  private blobs: Blob[] = [];
  private rings: Graphics[] = [];
  private beams: Graphics[] = [];
  private w = 1;
  private h = 1;
  private mode: SceneMode = "neon";
  private quality: QualityMode = "cinema";
  private intensity = 1;
  private impact = 0;
  private previousTime = 0;

  constructor() {
    this.container.addChild(this.base, this.blobLayer, this.geometry, this.ringLayer, this.beamLayer, this.particleLayer, this.flash);
    this.createBlobs();
    this.createParticles();
    this.createRings();
    this.createBeams();
    this.applyModePalette();
  }

  setMode(mode: SceneMode) {
    if (this.mode === mode) return;
    this.mode = mode;
    this.applyModePalette();
    this.hit(0.85);
  }

  setIntensity(value: number) {
    this.intensity = Math.max(0.2, Math.min(1.8, value));
  }

  setQuality(value: QualityMode) {
    this.quality = value;
    const stride = value === "cinema" ? 1 : 2;
    this.particles.forEach((p, i) => p.g.visible = i % stride === 0);
    this.blobs.forEach((b, i) => b.g.visible = value === "cinema" || i < 3);
  }

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.redrawBase();
  }

  update(time: number, audio: AudioBands) {
    const cx = this.w * 0.5;
    const cy = this.h * 0.5;
    const intensity = this.intensity;
    const bass = audio.bass * intensity;
    const energy = audio.energy * intensity;
    const transient = audio.transient * intensity;

    this.updateGeometry(time, audio);

    this.blobs.forEach((blob, i) => {
      const modeSpeed = this.mode === "vortex" ? 1.8 : this.mode === "poster" ? 0.45 : 1;
      const t = time * blob.speed * modeSpeed + blob.phase;
      const spread = this.mode === "poster" ? 0.5 : 1;
      blob.g.position.set(
        cx + Math.sin(t * 0.83 + i) * blob.orbitX * spread,
        cy + Math.cos(t * 1.11 - i * 0.2) * blob.orbitY * spread,
      );
      const pulse = 1 + bass * (0.12 + i * 0.012) + Math.sin(t * 1.7) * 0.03;
      blob.g.scale.set(pulse);
      blob.g.alpha = (this.mode === "poster" ? 0.045 : 0.055) + energy * 0.06;
      blob.g.rotation = t * 0.05;
    });

    const vortexFactor = this.mode === "vortex" ? 1 : 0;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p.g.visible) continue;
      const phase = p.phase + time * p.speed * (this.mode === "vortex" ? 2.6 : 1);
      let x = p.x * this.w;
      let y = p.y * this.h;

      if (this.mode === "neon") {
        x += Math.sin(phase * 1.4) * (18 + 34 * p.depth);
        y += Math.cos(phase) * (14 + 26 * p.depth);
      } else if (this.mode === "poster") {
        x += Math.sin(phase * 0.75) * 10;
        y += time * (4 + 12 * p.depth);
        y %= this.h + 40;
      } else {
        const dx = x - cx;
        const dy = y - cy;
        const r = Math.hypot(dx, dy) || 1;
        const angle = Math.atan2(dy, dx) + phase * 0.36;
        const breathe = 0.78 + ((Math.sin(phase * 0.55) + 1) * 0.18) + energy * 0.16;
        x = cx + Math.cos(angle) * r * breathe;
        y = cy + Math.sin(angle) * r * breathe;
      }

      const push = 1 + transient * (0.18 + p.depth * 0.35) + this.impact * 0.08;
      p.g.position.set(cx + (x - cx) * push, cy + (y - cy) * push);
      p.g.alpha = this.mode === "poster"
        ? 0.04 + p.depth * 0.12
        : 0.08 + p.depth * 0.5 + audio.treble * 0.18;
      const s = p.size * (0.55 + p.depth * 1.2 + transient * 1.6 + vortexFactor * 0.15);
      p.g.scale.set(s);
    }

    this.rings.forEach((ring, i) => {
      ring.position.set(cx, cy);
      ring.rotation = time * (0.025 + i * 0.011) * (i % 2 ? -1 : 1) * (this.mode === "vortex" ? 3.2 : 1);
      const scale = 0.85 + i * 0.14 + bass * (0.08 + i * 0.015) + this.impact * 0.1;
      ring.scale.set(scale);
      ring.alpha = this.mode === "poster" ? 0.02 : 0.035 + energy * 0.08;
    });

    this.beams.forEach((beam, i) => {
      beam.position.set(cx, cy);
      beam.rotation = time * (0.025 + i * 0.012) + i * 1.9;
      beam.alpha = this.mode === "neon" ? 0.035 + energy * 0.04 : this.mode === "vortex" ? 0.02 : 0.008;
      beam.scale.y = 0.8 + audio.mid * 0.35;
    });

    this.flash.alpha = Math.max(0, this.impact * 0.12 + transient * 0.045);
    const dt = this.previousTime ? Math.min(0.08, Math.max(1 / 240, Math.abs(time - this.previousTime))) : 1 / 60;
    this.previousTime = time;
    this.impact *= Math.pow(0.018, dt);
  }

  hit(strength = 1) {
    this.impact = Math.max(this.impact, strength);
  }

  private createBlobs() {
    const rand = seeded(9031);
    for (let i = 0; i < 6; i++) {
      const radius = 180 + rand() * 300;
      const g = new Graphics()
        .circle(0, 0, radius)
        .fill({ color: 0xffffff, alpha: 0.07 });
      g.blendMode = "add";
      this.blobLayer.addChild(g);
      this.blobs.push({
        g,
        radius,
        phase: rand() * Math.PI * 2,
        orbitX: 160 + rand() * 440,
        orbitY: 100 + rand() * 280,
        speed: 0.04 + rand() * 0.09,
      });
    }
  }

  private createParticles() {
    const rand = seeded(492187);
    for (let i = 0; i < 260; i++) {
      const g = new Graphics().circle(0, 0, 1.2).fill({ color: 0xffffff, alpha: 0.65 });
      g.blendMode = "add";
      this.particleLayer.addChild(g);
      this.particles.push({
        g,
        x: rand(),
        y: rand(),
        depth: rand(),
        speed: 0.025 + rand() * 0.17,
        phase: rand() * Math.PI * 2,
        size: 0.35 + rand() * 1.7,
      });
    }
  }

  private createRings() {
    for (let i = 0; i < 7; i++) {
      const ring = new Graphics();
      const radius = 120 + i * 88;
      ring.circle(0, 0, radius).stroke({ width: i % 2 ? 1 : 1.5, color: 0xffffff, alpha: 0.12 });
      if (i % 2 === 0) {
        ring.moveTo(-radius * 0.7, -radius * 0.7).lineTo(radius * 0.7, radius * 0.7).stroke({ width: 1, color: 0xffffff, alpha: 0.05 });
      }
      ring.blendMode = "add";
      this.ringLayer.addChild(ring);
      this.rings.push(ring);
    }
  }

  private createBeams() {
    for (let i = 0; i < 3; i++) {
      const beam = new Graphics()
        .poly([-40, -900, 40, -900, 140, 900, -140, 900])
        .fill({ color: 0xffffff, alpha: 0.045 });
      beam.blendMode = "add";
      this.beamLayer.addChild(beam);
      this.beams.push(beam);
    }
  }

  private redrawBase() {
    const baseColor = this.mode === "poster" ? 0x080707 : this.mode === "vortex" ? 0x070305 : 0x03090d;
    this.base.clear().rect(0, 0, this.w, this.h).fill({ color: baseColor, alpha: 1 });
    this.flash.clear().rect(0, 0, this.w, this.h).fill({ color: 0xffffff, alpha: 1 });
  }

  private updateGeometry(time: number, audio: AudioBands) {
    this.geometry.clear();
    const w = this.w;
    const h = this.h;
    const cx = w * 0.5;
    const cy = h * 0.5;

    if (this.mode === "poster") {
      const shift = ((time * 22) % 140) - 70;
      for (let i = -2; i < 14; i++) {
        const y = i * 86 + shift;
        this.geometry.moveTo(0, y).lineTo(w, y - 90).stroke({ width: 1, color: 0xff4c57, alpha: 0.065 + audio.energy * 0.035 });
      }
      for (let i = 0; i < 6; i++) {
        const x = (i / 5) * w;
        this.geometry.rect(x - 1, 0, 2, h).fill({ color: 0xffffff, alpha: i % 2 ? 0.018 : 0.008 });
      }
    } else if (this.mode === "neon") {
      const horizon = h * 0.66;
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        const x = t * w;
        this.geometry.moveTo(cx + (x - cx) * 0.08, horizon).lineTo(x, h).stroke({ width: 1, color: 0x70fff2, alpha: 0.06 });
      }
      for (let i = 0; i < 8; i++) {
        const t = i / 8;
        const y = horizon + (h - horizon) * t * t;
        this.geometry.moveTo(0, y).lineTo(w, y).stroke({ width: 1, color: 0x70fff2, alpha: 0.045 });
      }
    } else {
      const rot = time * 0.09;
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2 + rot;
        const r = Math.max(w, h) * 0.82;
        this.geometry.moveTo(cx, cy).lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r).stroke({ width: 1, color: 0xff334d, alpha: 0.055 + audio.bass * 0.03 });
      }
    }
  }

  private applyModePalette() {
    const palette = this.mode === "poster"
      ? { primary: 0xff3d4e, secondary: 0xffffff }
      : this.mode === "vortex"
        ? { primary: 0xff293f, secondary: 0xff6a48 }
        : { primary: 0x56fff1, secondary: 0x7c5cff };

    this.blobs.forEach((blob, i) => blob.g.tint = i % 2 ? palette.primary : palette.secondary);
    this.particles.forEach((p, i) => p.g.tint = i % 5 === 0 ? palette.secondary : palette.primary);
    this.rings.forEach((ring, i) => ring.tint = i % 2 ? palette.primary : palette.secondary);
    this.beams.forEach((beam, i) => beam.tint = i % 2 ? palette.primary : palette.secondary);
    this.redrawBase();
  }
}
