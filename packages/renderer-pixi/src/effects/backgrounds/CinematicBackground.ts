import { Container, Graphics, Text, TextStyle } from "pixi.js";
import type { AudioBands } from "@graph1ks/emo-audio-web";
import type {
  BackgroundPreset,
  BackgroundPresetId,
  LineCue,
  QualityMode,
  SceneMode,
  VisualPalette,
} from "@graph1ks/emo-engine-core";
import { hash01, seeded } from "@graph1ks/emo-engine-core";
import { ArtDirectionWorlds } from "./ArtDirectionWorlds.js";
import { ProceduralLiquidFX } from "./ProceduralLiquidFX.js";

const EMPTY_SPECTRUM = new Float32Array(0);

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

const AUTO_BACKGROUND_PRESETS: Record<SceneMode, BackgroundPresetId[]> = {
  poster: ["editorial", "print", "lyrics", "architecture", "cinematic", "spectrum", "minimal"],
  neon: ["aurora", "architecture", "liquid", "spectrum", "nebula", "editorial", "starfield", "rays"],
  vortex: ["architecture", "print", "vortex", "aurora", "starfield", "lyrics", "liquid", "sparks"],
};

const ART_DIRECTION_PRESETS = new Set<BackgroundPresetId>([
  "editorial",
  "print",
  "architecture",
  "aurora",
]);

export class CinematicBackground {
  readonly container = new Container();

  private base = new Graphics();
  private artDirection = new ArtDirectionWorlds();
  private liquidSurface = new Graphics();
  private liquidFX = new ProceduralLiquidFX();
  private geometry = new Graphics();
  private lyricBackdropLayer = new Container();
  private lyricBackdrop: Text[] = [];
  private lyricBackdropKey = "";
  private sparkLayer = new Graphics();
  private spectrumLayer = new Graphics();
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
  private preset: BackgroundPreset = "auto";
  private resolvedPreset: BackgroundPresetId = "nebula";
  private autoAllowed?: BackgroundPresetId[];
  private lineIndex = -1;
  private currentLine?: LineCue;
  private quality: QualityMode = "cinema";
  private intensity = 1;
  private worldIntensity = 1;
  private worldDetail = 1;
  private impact = 0;
  private previousTime = 0;
  private palette?: VisualPalette;

  constructor() {
    this.container.addChild(
      this.base,
      this.artDirection.container,
      this.liquidSurface,
      this.lyricBackdropLayer,
      this.blobLayer,
      this.geometry,
      this.ringLayer,
      this.beamLayer,
      this.particleLayer,
      this.sparkLayer,
      this.spectrumLayer,
      this.flash,
    );
    this.liquidSurface.filters = [this.liquidFX.filter];
    this.sparkLayer.blendMode = "add";
    this.spectrumLayer.blendMode = "add";
    this.createBlobs();
    this.createParticles();
    this.createRings();
    this.createBeams();
    this.resolvePreset();
    this.applyModePalette();
    this.applyPresetVisibility();
  }

  setMode(mode: SceneMode) {
    if (this.mode === mode) return;
    this.mode = mode;
    this.liquidFX.setMode(mode);
    const previous = this.resolvedPreset;
    this.resolvePreset();
    this.applyModePalette();
    this.applyPresetVisibility();
    this.rebuildLyricBackdrop();
    this.hit(previous === this.resolvedPreset ? 0.55 : 0.85);
  }

  setPreset(preset: BackgroundPreset) {
    if (this.preset === preset) return;
    this.preset = preset;
    const previous = this.resolvedPreset;
    this.resolvePreset();
    this.applyPresetVisibility();
    this.redrawBase();
    this.rebuildLyricBackdrop();
    if (previous !== this.resolvedPreset) this.hit(0.78);
  }

  setAutoAllowed(presets?: readonly BackgroundPresetId[]) {
    this.autoAllowed = presets?.length ? [...presets] : undefined;
    if (this.preset !== "auto") return;

    const previous = this.resolvedPreset;
    this.resolvePreset();
    if (previous !== this.resolvedPreset) {
      this.applyPresetVisibility();
      this.redrawBase();
      this.rebuildLyricBackdrop();
      this.hit(0.62);
    }
  }

  getPreset() {
    return this.preset;
  }

  getResolvedPreset() {
    return this.resolvedPreset;
  }

  setLine(line: LineCue | undefined, index: number) {
    this.currentLine = line;
    this.setLineIndex(index);
    this.rebuildLyricBackdrop();
  }

  setLineIndex(index: number) {
    if (index === this.lineIndex) return;
    this.lineIndex = index;
    this.artDirection.setLineIndex(index);
    if (this.preset !== "auto") return;
    const previous = this.resolvedPreset;
    this.resolvePreset();
    if (previous !== this.resolvedPreset) {
      this.applyPresetVisibility();
      this.redrawBase();
      this.hit(0.62);
    }
  }

  setPalette(palette: VisualPalette, refreshStatic = true) {
    this.palette = palette;
    this.artDirection.setPalette(palette);
    this.applyModePalette();
    if (refreshStatic) this.rebuildLyricBackdrop();
  }

  setIntensity(value: number) {
    this.intensity = Math.max(0.2, Math.min(1.8, value));
    this.syncWorldPower();
  }

  setWorldIntensity(value: number) {
    this.worldIntensity = Math.max(0, Math.min(3, value));
    this.syncWorldPower();
  }

  setWorldDetail(value: number) {
    this.worldDetail = Math.max(0, Math.min(3, value));
    this.artDirection.setDetail(this.worldDetail);
    this.applyPresetVisibility();
    this.rebuildLyricBackdrop();
  }

  private syncWorldPower() {
    const power = this.intensity * this.worldIntensity;
    this.artDirection.setIntensity(power);
    this.artDirection.setDetail(this.worldDetail);
    this.liquidFX.setIntensity(power);
  }

  setQuality(value: QualityMode) {
    this.quality = value;
    this.artDirection.setQuality(value);
    this.liquidFX.setQuality(value);
    this.applyPresetVisibility();
  }

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.artDirection.resize(w, h);
    this.redrawBase();
    this.redrawLiquidSurface();
    this.liquidFX.resize(w, h);
    this.rebuildLyricBackdrop();
  }

  update(time: number, audio: AudioBands, spectrum: Float32Array = EMPTY_SPECTRUM) {
    const cx = this.w * 0.5;
    const cy = this.h * 0.5;
    const intensity = this.intensity * this.worldIntensity;
    const bass = audio.bass * intensity;
    const energy = audio.energy * intensity;
    const transient = audio.transient * intensity;

    this.artDirection.update(time, audio);
    if (this.liquidSurface.visible) this.liquidFX.update(time, audio);
    this.updateGeometry(time, audio);
    this.updateLyricBackdrop(time, audio);
    this.updateSparks(time, audio);
    this.updateSpectrum(time, audio, spectrum);
    this.updateBlobs(time, audio, cx, cy, bass, energy);
    this.updateParticles(time, audio, cx, cy, transient, energy);
    this.updateRings(time, audio, cx, cy, bass, energy);
    this.updateBeams(time, audio, cx, cy, energy);

    this.flash.alpha = Math.max(0, this.impact * 0.12 + transient * 0.045);
    const dt = this.previousTime
      ? Math.min(0.08, Math.max(1 / 240, Math.abs(time - this.previousTime)))
      : 1 / 60;
    this.previousTime = time;
    this.impact *= Math.pow(0.018, dt);
  }

  hit(strength = 1) {
    this.impact = Math.max(this.impact, strength);
  }

  private resolvePreset() {
    if (this.preset !== "auto") {
      this.resolvedPreset = this.preset;
      return;
    }
    const preferred = AUTO_BACKGROUND_PRESETS[this.mode];
    const filtered = this.autoAllowed?.length
      ? preferred.filter(value => this.autoAllowed?.includes(value))
      : preferred;
    const options = filtered.length
      ? filtered
      : this.autoAllowed?.length
        ? this.autoAllowed
        : preferred;
    const safeLine = Math.max(0, this.lineIndex);
    this.resolvedPreset = options[safeLine % options.length];
  }

  private applyPresetVisibility() {
    const cinema = this.quality === "cinema";
    const artWorld = ART_DIRECTION_PRESETS.has(this.resolvedPreset);
    this.artDirection.setPreset(this.resolvedPreset);
    this.artDirection.setLineIndex(this.lineIndex);
    this.liquidSurface.visible = this.resolvedPreset === "liquid";
    this.lyricBackdropLayer.visible = this.resolvedPreset === "lyrics";
    this.sparkLayer.visible = this.resolvedPreset === "sparks";
    this.spectrumLayer.visible = this.resolvedPreset === "spectrum";
    const particleStride = this.resolvedPreset === "minimal"
      ? cinema ? 4 : 7
      : this.resolvedPreset === "liquid"
        ? cinema ? 4 : 7
        : this.resolvedPreset === "spectrum"
          ? cinema ? 5 : 8
          : this.resolvedPreset === "sparks"
            ? cinema ? 5 : 9
            : this.resolvedPreset === "lyrics"
              ? cinema ? 6 : 10
              : this.resolvedPreset === "rays"
            ? cinema ? 3 : 5
            : this.resolvedPreset === "grid"
              ? cinema ? 2 : 4
              : cinema ? 1 : 2;

    const detailStride = Math.max(1, Math.round(particleStride / Math.max(0.35, this.worldDetail)));
    this.particles.forEach((particle, index) => {
      particle.g.visible = !artWorld && index % detailStride === 0;
    });

    const blobLimit = artWorld
      ? 0
      : this.resolvedPreset === "nebula"
      ? cinema ? 6 : 4
      : this.resolvedPreset === "cinematic"
        ? cinema ? 4 : 2
        : this.resolvedPreset === "rays"
          ? 2
          : this.resolvedPreset === "minimal"
            ? 1
            : 0;
    const detailedBlobLimit = Math.min(this.blobs.length, Math.round(blobLimit * Math.max(0.35, this.worldDetail)));
    this.blobs.forEach((blob, index) => {
      blob.g.visible = index < detailedBlobLimit;
    });

    const ringsVisible = !artWorld && (
      this.resolvedPreset === "vortex"
      || this.resolvedPreset === "rays"
      || this.resolvedPreset === "cinematic"
    );
    this.rings.forEach((ring, index) => {
      ring.visible = ringsVisible && (cinema || index % 2 === 0);
    });

    const beamsVisible = !artWorld && (
      this.resolvedPreset === "rays"
      || this.resolvedPreset === "cinematic"
      || this.resolvedPreset === "nebula"
    );
    this.beams.forEach((beam, index) => {
      beam.visible = beamsVisible && (cinema || index < 2);
    });
  }

  private updateBlobs(
    time: number,
    audio: AudioBands,
    cx: number,
    cy: number,
    bass: number,
    energy: number,
  ) {
    this.blobs.forEach((blob, index) => {
      if (!blob.g.visible) return;
      const speedScale = this.resolvedPreset === "nebula"
        ? 1.6
        : this.resolvedPreset === "rays"
          ? 0.55
          : this.mode === "poster"
            ? 0.45
            : 1;
      const t = time * blob.speed * speedScale + blob.phase;
      const spread = this.resolvedPreset === "nebula"
        ? 1.16
        : this.resolvedPreset === "minimal"
          ? 0.22
          : this.mode === "poster"
            ? 0.5
            : 1;

      blob.g.position.set(
        cx + Math.sin(t * 0.83 + index) * blob.orbitX * spread,
        cy + Math.cos(t * 1.11 - index * 0.2) * blob.orbitY * spread,
      );
      const pulse = 1
        + bass * (0.1 + index * 0.01)
        + Math.sin(t * 1.7) * (this.resolvedPreset === "nebula" ? 0.055 : 0.025);
      blob.g.scale.set(pulse);
      const blobAlpha = this.resolvedPreset === "nebula"
        ? 0.07 + energy * 0.08
        : this.resolvedPreset === "minimal"
          ? 0.022 + energy * 0.018
          : 0.04 + energy * 0.05;
      blob.g.alpha = Math.min(0.9, blobAlpha * (0.25 + this.worldIntensity * 1.35));
      blob.g.rotation = t * 0.05;
    });
  }

  private updateParticles(
    time: number,
    audio: AudioBands,
    cx: number,
    cy: number,
    transient: number,
    energy: number,
  ) {
    for (let index = 0; index < this.particles.length; index++) {
      const particle = this.particles[index];
      if (!particle.g.visible) continue;

      const phase = particle.phase + time * particle.speed;
      let x = particle.x * this.w;
      let y = particle.y * this.h;
      let scaleBoost = 1;

      if (this.resolvedPreset === "starfield") {
        const nx = particle.x * 2 - 1;
        const ny = particle.y * 2 - 1;
        const length = Math.hypot(nx, ny) || 1;
        const dx = nx / length;
        const dy = ny / length;
        const z = (particle.depth + time * (0.045 + particle.speed * 0.16)) % 1;
        const radius = Math.pow(z, 1.8) * Math.hypot(this.w, this.h) * 0.64;
        x = cx + dx * radius;
        y = cy + dy * radius;
        scaleBoost = 0.35 + z * 2.8;
        particle.g.alpha = 0.08 + z * 0.75 + audio.treble * 0.18;
      } else if (this.resolvedPreset === "vortex") {
        const dx = x - cx;
        const dy = y - cy;
        const radius = Math.hypot(dx, dy) || 1;
        const angle = Math.atan2(dy, dx) + phase * 0.9 + time * 0.08;
        const breathe = 0.68 + ((Math.sin(phase * 0.7) + 1) * 0.2) + energy * 0.16;
        x = cx + Math.cos(angle) * radius * breathe;
        y = cy + Math.sin(angle) * radius * breathe;
        scaleBoost = 1.15;
        particle.g.alpha = 0.08 + particle.depth * 0.56 + audio.treble * 0.18;
      } else if (this.resolvedPreset === "grid") {
        x += Math.sin(phase * 0.7) * 7;
        y = (y + time * (7 + 18 * particle.depth)) % (this.h + 30);
        particle.g.alpha = 0.04 + particle.depth * 0.2 + audio.treble * 0.08;
      } else if (this.resolvedPreset === "rays") {
        const dx = x - cx;
        const dy = y - cy;
        const expansion = 1 + Math.sin(phase) * 0.03 + transient * 0.16;
        x = cx + dx * expansion;
        y = cy + dy * expansion;
        particle.g.alpha = 0.035 + particle.depth * 0.24 + audio.treble * 0.08;
      } else if (this.resolvedPreset === "minimal") {
        x += Math.sin(phase * 0.33) * 3;
        y += Math.cos(phase * 0.27) * 3;
        particle.g.alpha = 0.018 + particle.depth * 0.08;
        scaleBoost = 0.5;
      } else if (this.resolvedPreset === "nebula") {
        x += Math.sin(phase * 1.55) * (26 + 48 * particle.depth);
        y += Math.cos(phase * 0.92) * (18 + 36 * particle.depth);
        particle.g.alpha = 0.09 + particle.depth * 0.52 + audio.treble * 0.2;
        scaleBoost = 1.15;
      } else if (this.mode === "poster") {
        x += Math.sin(phase * 0.75) * 10;
        y = (y + time * (4 + 12 * particle.depth)) % (this.h + 40);
        particle.g.alpha = 0.04 + particle.depth * 0.12;
      } else if (this.mode === "vortex") {
        const dx = x - cx;
        const dy = y - cy;
        const radius = Math.hypot(dx, dy) || 1;
        const angle = Math.atan2(dy, dx) + phase * 0.36;
        const breathe = 0.78 + ((Math.sin(phase * 0.55) + 1) * 0.18) + energy * 0.16;
        x = cx + Math.cos(angle) * radius * breathe;
        y = cy + Math.sin(angle) * radius * breathe;
        particle.g.alpha = 0.08 + particle.depth * 0.5 + audio.treble * 0.18;
      } else {
        x += Math.sin(phase * 1.4) * (18 + 34 * particle.depth);
        y += Math.cos(phase) * (14 + 26 * particle.depth);
        particle.g.alpha = 0.08 + particle.depth * 0.5 + audio.treble * 0.18;
      }

      const push = 1 + transient * (0.18 + particle.depth * 0.35) + this.impact * 0.08;
      particle.g.position.set(cx + (x - cx) * push, cy + (y - cy) * push);
      const scale = particle.size
        * scaleBoost
        * (0.55 + particle.depth * 1.2 + transient * 1.6);
      particle.g.alpha = Math.min(1, particle.g.alpha * (0.18 + this.worldIntensity * 1.42));
      particle.g.scale.set(scale * (0.72 + this.worldIntensity * 0.38));
    }
  }

  private updateRings(
    time: number,
    audio: AudioBands,
    cx: number,
    cy: number,
    bass: number,
    energy: number,
  ) {
    this.rings.forEach((ring, index) => {
      if (!ring.visible) return;
      ring.position.set(cx, cy);
      const speed = this.resolvedPreset === "vortex"
        ? 4.4
        : this.resolvedPreset === "rays"
          ? 1.7
          : this.mode === "vortex"
            ? 3.2
            : 1;
      ring.rotation = time * (0.025 + index * 0.011) * (index % 2 ? -1 : 1) * speed;
      const scale = 0.85 + index * 0.14 + bass * (0.08 + index * 0.015) + this.impact * 0.1;
      ring.scale.set(scale);
      const ringAlpha = this.resolvedPreset === "vortex"
        ? 0.04 + energy * 0.12
        : this.resolvedPreset === "rays"
          ? 0.025 + energy * 0.07
          : this.mode === "poster"
            ? 0.02
            : 0.035 + energy * 0.08;
      ring.alpha = Math.min(0.9, ringAlpha * (0.22 + this.worldIntensity * 1.5));
    });
  }

  private updateBeams(
    time: number,
    audio: AudioBands,
    cx: number,
    cy: number,
    energy: number,
  ) {
    this.beams.forEach((beam, index) => {
      if (!beam.visible) return;
      beam.position.set(cx, cy);
      const speed = this.resolvedPreset === "rays" ? 2.1 : this.resolvedPreset === "nebula" ? 0.7 : 1;
      beam.rotation = time * (0.025 + index * 0.012) * speed + index * 1.9;
      const beamAlpha = this.resolvedPreset === "rays"
        ? 0.075 + energy * 0.1
        : this.resolvedPreset === "nebula"
          ? 0.025 + energy * 0.04
          : this.mode === "neon"
            ? 0.035 + energy * 0.04
            : this.mode === "vortex"
              ? 0.02
              : 0.008;
      beam.alpha = Math.min(0.95, beamAlpha * (0.2 + this.worldIntensity * 1.65));
      beam.scale.y = 0.8 + audio.mid * (this.resolvedPreset === "rays" ? 0.55 : 0.35);
      beam.scale.x = this.resolvedPreset === "rays" ? 1.15 + audio.bass * 0.14 : 1;
    });
  }

  private createBlobs() {
    const rand = seeded(9031);
    for (let index = 0; index < 6; index++) {
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
    for (let index = 0; index < 260; index++) {
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
    for (let index = 0; index < 7; index++) {
      const ring = new Graphics();
      const radius = 120 + index * 88;
      ring.circle(0, 0, radius).stroke({
        width: index % 2 ? 1 : 1.5,
        color: 0xffffff,
        alpha: 0.12,
      });
      if (index % 2 === 0) {
        ring
          .moveTo(-radius * 0.7, -radius * 0.7)
          .lineTo(radius * 0.7, radius * 0.7)
          .stroke({ width: 1, color: 0xffffff, alpha: 0.05 });
      }
      ring.blendMode = "add";
      this.ringLayer.addChild(ring);
      this.rings.push(ring);
    }
  }

  private createBeams() {
    for (let index = 0; index < 3; index++) {
      const beam = new Graphics()
        .poly([-40, -900, 40, -900, 140, 900, -140, 900])
        .fill({ color: 0xffffff, alpha: 0.045 });
      beam.blendMode = "add";
      this.beamLayer.addChild(beam);
      this.beams.push(beam);
    }
  }

  private redrawBase() {
    const baseColor = this.resolvedPreset === "minimal"
      ? 0x010203
      : this.resolvedPreset === "liquid"
        ? 0x010306
        : this.resolvedPreset === "spectrum"
          ? this.mode === "vortex" ? 0x090207 : 0x010609
          : this.resolvedPreset === "sparks"
            ? this.mode === "vortex" ? 0x070204 : 0x010305
            : this.resolvedPreset === "lyrics"
              ? this.mode === "poster" ? 0x070707 : this.mode === "vortex" ? 0x080204 : 0x020608
              : this.resolvedPreset === "starfield"
        ? 0x01040a
        : this.resolvedPreset === "nebula"
          ? this.mode === "vortex" ? 0x080209 : 0x020910
          : this.resolvedPreset === "grid"
            ? this.mode === "poster" ? 0x070707 : 0x02080b
            : this.mode === "poster"
              ? 0x080707
              : this.mode === "vortex"
                ? 0x070305
                : 0x03090d;

    const bleed = Math.max(this.w, this.h) * 0.12;
    this.base
      .clear()
      .rect(-bleed, -bleed, this.w + bleed * 2, this.h + bleed * 2)
      .fill({
        color: this.palette?.background ?? baseColor,
        alpha: 1,
      });
    this.flash
      .clear()
      .rect(-bleed, -bleed, this.w + bleed * 2, this.h + bleed * 2)
      .fill({ color: 0xffffff, alpha: 1 });
  }

  private redrawLiquidSurface() {
    const bleed = Math.max(this.w, this.h) * 0.12;
    this.liquidSurface
      .clear()
      .rect(-bleed, -bleed, this.w + bleed * 2, this.h + bleed * 2)
      .fill({ color: 0xffffff, alpha: 1 });
  }

  private rebuildLyricBackdrop() {
    const text = this.currentLine?.text?.toUpperCase() ?? "";
    const shouldBuild = this.resolvedPreset === "lyrics" && Boolean(text);
    const key = shouldBuild
      ? [
          text,
          this.mode,
          this.quality,
          Math.round(this.w),
          Math.round(this.h),
          this.palette?.accentA ?? -1,
          this.palette?.background ?? -1,
        ].join("|")
      : "";

    if (key === this.lyricBackdropKey) return;

    this.destroyLyricBackdrop();
    this.lyricBackdropKey = key;
    if (!shouldBuild) return;

    const baseCount = this.quality === "cinema" ? 14 : 8;
    const count = Math.max(4, Math.min(32, Math.round(baseCount * Math.max(0.4, this.worldDetail))));
    const textLength = Math.max(6, text.length);
    const fontSize = Math.max(22, Math.min(68, this.w / Math.max(10, textLength * 0.58)));
    const primary = this.palette?.accentA ?? (
      this.mode === "poster"
        ? 0xffffff
        : this.mode === "vortex"
          ? 0xff4960
          : 0x65fff2
    );
    const textBackground = this.palette?.background ?? (this.mode === "poster" ? 0x050505 : 0x020405);

    for (let index = 0; index < count; index++) {
      const style = new TextStyle({
        fontFamily: "Arial Black, Impact, Helvetica Neue, Arial, sans-serif",
        fontWeight: "900",
        fontSize: fontSize * (1 + index * 0.012),
        fill: textBackground,
        stroke: {
          color: primary,
          width: index % 3 === 0 ? 1.4 : 0.7,
        },
        letterSpacing: -1,
      });
      const echo = new Text({
        text,
        style,
        resolution: backgroundTextResolution(),
      });
      echo.anchor.set(0.5);
      this.lyricBackdropLayer.addChild(echo);
      this.lyricBackdrop.push(echo);
    }
  }

  private destroyLyricBackdrop() {
    for (const echo of this.lyricBackdrop) {
      echo.removeFromParent();
      echo.destroy({ style: true });
    }
    for (const child of this.lyricBackdropLayer.removeChildren()) child.destroy();
    this.lyricBackdrop = [];
  }

  private updateLyricBackdrop(time: number, audio: AudioBands) {
    if (!this.lyricBackdropLayer.visible || !this.lyricBackdrop.length) return;
    const cx = this.w * 0.5;
    const cy = this.h * 0.5;

    this.lyricBackdrop.forEach((echo, index) => {
      const t = index / Math.max(1, this.lyricBackdrop.length - 1);
      if (this.mode === "poster") {
        const row = index - (this.lyricBackdrop.length - 1) * 0.5;
        echo.position.set(
          cx + Math.sin(time * 0.18 + index) * 10,
          cy + row * echo.height * 0.88,
        );
        echo.rotation = (index % 2 ? -1 : 1) * 0.008;
        echo.scale.set(0.82 + t * 0.11);
        echo.alpha = 0.045 + (1 - Math.abs(t - 0.5) * 2) * 0.08 + audio.energy * 0.025;
      } else if (this.mode === "vortex") {
        const scale = 2.8 - t * 2.55;
        const direction = index % 2 ? -1 : 1;
        echo.position.set(
          cx + Math.cos(time * 0.13 + index) * (1 - t) * 28,
          cy + Math.sin(time * 0.11 + index * 0.7) * (1 - t) * 28,
        );
        echo.rotation = direction * (time * 0.035 + index * 0.018);
        echo.scale.set(Math.max(0.12, scale * (1 + audio.bass * 0.035)));
        echo.alpha = 0.028 + t * 0.16 + audio.energy * 0.025;
      } else {
        const row = index - (this.lyricBackdrop.length - 1) * 0.5;
        echo.position.set(
          cx + row * 11 + Math.sin(time * 0.23 + index * 0.5) * 18,
          cy + row * echo.height * 0.62,
        );
        echo.rotation = row * 0.004;
        echo.scale.set(0.9 + t * 0.16 + audio.bass * 0.015);
        echo.alpha = 0.035 + audio.energy * 0.055;
      }
    });
  }

  private updateSparks(time: number, audio: AudioBands) {
    this.sparkLayer.clear();
    if (!this.sparkLayer.visible) return;

    const cx = this.w * 0.5;
    const cy = this.h * 0.5;
    const count = this.quality === "cinema" ? 76 : 38;
    const radiusMax = Math.hypot(this.w, this.h) * 0.46;
    const primary = this.palette?.accentA ?? (
      this.mode === "poster"
        ? 0xffffff
        : this.mode === "vortex"
          ? 0xff4259
          : 0x69fff2
    );
    const secondary = this.palette?.accentB ?? (
      this.mode === "poster"
        ? 0xff5260
        : this.mode === "vortex"
          ? 0xff9a69
          : 0x9b76ff
    );
    const burst = 0.35 + audio.treble * 0.9 + audio.transient * 2.4 + this.impact * 0.55;

    for (let index = 0; index < count; index++) {
      const seed = hash01((this.lineIndex + 17) * 131.7 + index * 43.19);
      const speed = 0.18 + hash01(seed * 97 + 3.7) * 0.42;
      const life = (seed * 4.3 + time * speed) % 1;
      const angle = seed * Math.PI * 2
        + this.lineIndex * 0.31
        + Math.sin(time * 0.19 + index) * 0.08;
      const radius = Math.pow(life, 1.38) * radiusMax;
      const bend = (hash01(seed * 181 + 8.2) - 0.5) * 0.28 * life;
      const a = angle + bend;
      const x = cx + Math.cos(a) * radius;
      const y = cy + Math.sin(a) * radius;
      const length = (6 + hash01(seed * 211 + 1.3) * 34)
        * burst
        * (1 - life * 0.72)
        * this.intensity;
      const width = 0.55 + hash01(seed * 71 + 4.8) * 1.35;
      const alpha = Math.max(0, (1 - life) * (0.08 + burst * 0.16));
      const color = index % 5 === 0 ? secondary : primary;

      this.sparkLayer
        .moveTo(x, y)
        .lineTo(x - Math.cos(a) * length, y - Math.sin(a) * length)
        .stroke({ width, color, alpha });

      if (index % 6 === 0) {
        this.sparkLayer
          .circle(x, y, 0.8 + burst * 0.7)
          .fill({ color, alpha: alpha * 0.7 });
      }
    }
  }

  private updateSpectrum(time: number, audio: AudioBands, spectrum: Float32Array) {
    this.spectrumLayer.clear();
    if (!this.spectrumLayer.visible || spectrum.length < 2) return;

    const count = this.quality === "cinema"
      ? Math.min(64, spectrum.length)
      : Math.min(36, spectrum.length);
    const top: number[] = [];
    const bottom: number[] = [];
    const area: number[] = [];
    const cx = this.w * 0.5;
    const cy = this.h * 0.5;
    const width = this.w * 0.86;
    const left = cx - width * 0.5;
    const amplitude = this.h * (0.11 + audio.energy * 0.08) * this.intensity;

    for (let index = 0; index < count; index++) {
      const t = index / Math.max(1, count - 1);
      const sourceIndex = Math.min(
        spectrum.length - 1,
        Math.round(t * (spectrum.length - 1)),
      );
      const previous = spectrum[Math.max(0, sourceIndex - 1)] ?? 0;
      const current = spectrum[sourceIndex] ?? 0;
      const next = spectrum[Math.min(spectrum.length - 1, sourceIndex + 1)] ?? 0;
      const value = previous * 0.2 + current * 0.6 + next * 0.2;
      const wave = Math.sin(t * Math.PI * 5 + time * 1.7) * (4 + audio.mid * 13);
      const height = value * amplitude + wave;
      const x = left + t * width;
      top.push(x, cy - height);
      bottom.push(x, cy + height);
    }

    area.push(...top);
    for (let index = bottom.length - 2; index >= 0; index -= 2) {
      area.push(bottom[index], bottom[index + 1]);
    }

    const primary = this.palette?.accentA ?? (
      this.mode === "poster"
        ? 0xff5365
        : this.mode === "vortex"
          ? 0xff3c58
          : 0x64fff1
    );
    const secondary = this.palette?.accentB ?? (
      this.mode === "poster"
        ? 0xffffff
        : this.mode === "vortex"
          ? 0xff8b64
          : 0x8b6cff
    );

    this.spectrumLayer
      .poly(area)
      .fill({ color: primary, alpha: 0.018 + audio.energy * 0.035 });
    this.spectrumLayer
      .poly(top)
      .stroke({ width: 2.2, color: primary, alpha: 0.34 + audio.energy * 0.36 });
    this.spectrumLayer
      .poly(bottom)
      .stroke({ width: 1.4, color: secondary, alpha: 0.2 + audio.treble * 0.3 });
    this.spectrumLayer
      .moveTo(left, cy)
      .lineTo(left + width, cy)
      .stroke({ width: 1, color: secondary, alpha: 0.045 + audio.energy * 0.05 });
  }

  private updateGeometry(time: number, audio: AudioBands) {
    this.geometry.clear();
    const w = this.w;
    const h = this.h;
    const cx = w * 0.5;
    const cy = h * 0.5;

    if (
      ART_DIRECTION_PRESETS.has(this.resolvedPreset)
      || this.resolvedPreset === "liquid"
      || this.resolvedPreset === "spectrum"
      || this.resolvedPreset === "sparks"
      || this.resolvedPreset === "lyrics"
    ) return;

    if (this.resolvedPreset === "minimal") {
      for (let index = 0; index < 3; index++) {
        const y = h * (0.32 + index * 0.18) + Math.sin(time * 0.15 + index) * 4;
        this.geometry.moveTo(w * 0.08, y).lineTo(w * 0.92, y).stroke({
          width: 1,
          color: this.mode === "vortex" ? 0xff435b : 0x7cfff2,
          alpha: 0.018 + audio.energy * 0.012,
        });
      }
      return;
    }

    if (this.resolvedPreset === "grid") {
      const horizon = h * (this.mode === "poster" ? 0.58 : 0.63);
      const color = this.palette?.accentA ?? (this.mode === "poster" ? 0xff5362 : 0x70fff2);
      for (let index = 0; index <= 16; index++) {
        const t = index / 16;
        const x = t * w;
        this.geometry
          .moveTo(cx + (x - cx) * 0.04, horizon)
          .lineTo(x, h)
          .stroke({ width: 1, color, alpha: 0.055 + audio.energy * 0.025 });
      }
      const scroll = (time * 0.12) % 1;
      for (let index = 0; index < 11; index++) {
        const t = (index + scroll) / 11;
        const curve = t * t;
        const y = horizon + (h - horizon) * curve;
        this.geometry.moveTo(0, y).lineTo(w, y).stroke({
          width: 1,
          color,
          alpha: 0.035 + audio.energy * 0.02,
        });
      }
      return;
    }

    if (this.resolvedPreset === "rays") {
      const color = this.palette?.accentA ?? (this.mode === "vortex" ? 0xff4a54 : 0x70fff2);
      const rotation = time * 0.045;
      for (let index = 0; index < 14; index++) {
        const angle = (index / 14) * Math.PI * 2 + rotation;
        const radius = Math.max(w, h) * 0.85;
        this.geometry
          .moveTo(cx, cy)
          .lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius)
          .stroke({ width: index % 3 === 0 ? 2 : 1, color, alpha: 0.035 + audio.energy * 0.035 });
      }
      return;
    }

    if (this.resolvedPreset === "vortex") {
      const rotation = time * 0.13;
      for (let index = 0; index < 24; index++) {
        const angle = (index / 24) * Math.PI * 2 + rotation;
        const radius = Math.max(w, h) * (0.72 + (index % 3) * 0.05);
        this.geometry
          .moveTo(cx, cy)
          .lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius)
          .stroke({ width: 1, color: index % 2 ? 0xff334d : 0xff795f, alpha: 0.05 + audio.bass * 0.04 });
      }
      return;
    }

    if (this.resolvedPreset === "starfield") {
      const color = this.palette?.accentA ?? (this.mode === "vortex" ? 0xff5060 : 0x8cfff7);
      const rotation = time * 0.018;
      for (let index = 0; index < 10; index++) {
        const angle = (index / 10) * Math.PI * 2 + rotation;
        const radius = Math.max(w, h) * 0.72;
        this.geometry
          .moveTo(cx + Math.cos(angle) * 30, cy + Math.sin(angle) * 30)
          .lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius)
          .stroke({ width: 1, color, alpha: 0.012 + audio.energy * 0.016 });
      }
      return;
    }

    if (this.resolvedPreset === "nebula") {
      const color = this.palette?.accentA ?? (this.mode === "vortex" ? 0xff4e67 : 0x72fff3);
      const shift = Math.sin(time * 0.17) * h * 0.06;
      for (let index = 0; index < 7; index++) {
        const y = h * (0.16 + index * 0.115) + shift * (index % 2 ? -1 : 1);
        this.geometry
          .moveTo(w * 0.05, y)
          .lineTo(w * 0.95, y + Math.sin(time * 0.23 + index) * 34)
          .stroke({ width: 1, color, alpha: 0.018 + audio.mid * 0.025 });
      }
      return;
    }

    if (this.mode === "poster") {
      const shift = ((time * 22) % 140) - 70;
      for (let index = -2; index < 14; index++) {
        const y = index * 86 + shift;
        this.geometry
          .moveTo(0, y)
          .lineTo(w, y - 90)
          .stroke({ width: 1, color: 0xff4c57, alpha: 0.065 + audio.energy * 0.035 });
      }
      for (let index = 0; index < 6; index++) {
        const x = (index / 5) * w;
        this.geometry.rect(x - 1, 0, 2, h).fill({
          color: 0xffffff,
          alpha: index % 2 ? 0.018 : 0.008,
        });
      }
    } else if (this.mode === "neon") {
      const horizon = h * 0.66;
      for (let index = 0; index <= 12; index++) {
        const t = index / 12;
        const x = t * w;
        this.geometry
          .moveTo(cx + (x - cx) * 0.08, horizon)
          .lineTo(x, h)
          .stroke({ width: 1, color: 0x70fff2, alpha: 0.06 });
      }
      for (let index = 0; index < 8; index++) {
        const t = index / 8;
        const y = horizon + (h - horizon) * t * t;
        this.geometry.moveTo(0, y).lineTo(w, y).stroke({
          width: 1,
          color: 0x70fff2,
          alpha: 0.045,
        });
      }
    } else {
      const rotation = time * 0.09;
      for (let index = 0; index < 18; index++) {
        const angle = (index / 18) * Math.PI * 2 + rotation;
        const radius = Math.max(w, h) * 0.82;
        this.geometry
          .moveTo(cx, cy)
          .lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius)
          .stroke({ width: 1, color: 0xff334d, alpha: 0.055 + audio.bass * 0.03 });
      }
    }
  }

  private applyModePalette() {
    const fallback = this.mode === "poster"
      ? { primary: 0xff3d4e, secondary: 0xffffff }
      : this.mode === "vortex"
        ? { primary: 0xff293f, secondary: 0xff6a48 }
        : { primary: 0x56fff1, secondary: 0x7c5cff };
    const palette = {
      primary: this.palette?.accentA ?? fallback.primary,
      secondary: this.palette?.accentB ?? fallback.secondary,
    };

    this.blobs.forEach((blob, index) => {
      blob.g.tint = index % 2 ? palette.primary : palette.secondary;
    });
    this.particles.forEach((particle, index) => {
      particle.g.tint = index % 5 === 0 ? palette.secondary : palette.primary;
    });
    this.rings.forEach((ring, index) => {
      ring.tint = index % 2 ? palette.primary : palette.secondary;
    });
    this.beams.forEach((beam, index) => {
      beam.tint = index % 2 ? palette.primary : palette.secondary;
    });
    this.redrawBase();
  }
}


function backgroundTextResolution() {
  const dpr = typeof devicePixelRatio === "number" ? devicePixelRatio : 1;
  return Math.max(1.5, Math.min(3, dpr * 1.5));
}
