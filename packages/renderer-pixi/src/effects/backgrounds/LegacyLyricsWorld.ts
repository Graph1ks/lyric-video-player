import { Container, Graphics, Text, TextStyle } from "pixi.js";
import type { AudioBands } from "@graph1ks/emo-audio-web";
import {
  clamp,
  type LineCue,
  type QualityMode,
  type VisualPalette,
} from "@graph1ks/emo-engine-core";

export class LegacyLyricsWorld {
  readonly container = new Container();

  private readonly stage = new Graphics();
  private readonly typography = new Container();
  private readonly echoes: Text[] = [];
  private readonly fragments: Text[] = [];
  private width = 1;
  private height = 1;
  private intensity = 1;
  private detail = 1;
  private quality: QualityMode = "cinema";
  private palette?: VisualPalette;
  private text = "";
  private lineIndex = 0;
  private buildKey = "";

  constructor() {
    this.typography.sortableChildren = true;
    this.container.addChild(this.stage, this.typography);
    this.container.visible = false;
  }

  setLine(line: LineCue | undefined, index: number) {
    const next = line?.text?.trim().toUpperCase() ?? "";
    if (next === this.text && index === this.lineIndex) return;
    this.text = next;
    this.lineIndex = index;
    this.rebuild();
  }

  setPalette(palette: VisualPalette) {
    this.palette = palette;
    this.rebuild(true);
  }

  setIntensity(value: number) {
    this.intensity = clamp(value, 0, 3);
  }

  setDetail(value: number) {
    const next = clamp(value, 0, 3);
    if (next === this.detail) return;
    this.detail = next;
    this.rebuild(true);
  }

  setQuality(value: QualityMode) {
    if (value === this.quality) return;
    this.quality = value;
    this.rebuild(true);
  }

  resize(width: number, height: number) {
    const nextW = Math.max(1, width);
    const nextH = Math.max(1, height);
    if (nextW === this.width && nextH === this.height) return;
    this.width = nextW;
    this.height = nextH;
    this.rebuild(true);
  }

  update(time: number, audio: AudioBands) {
    if (!this.container.visible) return;

    const background = this.palette?.background ?? 0x020507;
    const surface = this.palette?.surface ?? 0x0c1820;
    const accentA = this.palette?.accentA ?? 0x66fff1;
    const accentB = this.palette?.accentB ?? 0x9271ff;
    const glow = this.palette?.glow ?? 0xebffff;
    const muted = this.palette?.muted ?? 0x49626b;

    this.stage.clear().rect(0, 0, this.width, this.height).fill({ color: background, alpha: 1 });
    if (!this.text || !this.echoes.length) return;

    const detail01 = clamp(this.detail / 3);
    const cx = this.width * 0.5;
    const cy = this.height * 0.52;
    const focal = Math.min(this.width, this.height) * 1.34;
    const vanishingX = cx + Math.sin(time * 0.073 + this.lineIndex * 0.31) * this.width * 0.018;
    const vanishingY = cy + Math.cos(time * 0.061 + this.lineIndex * 0.19) * this.height * 0.012;
    const lightResponse = 0.88 + audio.energy * 0.08 + audio.treble * 0.07;

    // Perspective typography architecture: these rails are compositional guides
    // for a real z-travelling text corridor, not a substitute for volumetric rays.
    const railCount = this.quality === "cinema"
      ? Math.max(3, Math.round(3 + detail01 * 3))
      : Math.max(2, Math.round(2 + detail01 * 2));
    for (let i = 0; i < railCount; i++) {
      const side = i % 2 ? 1 : -1;
      const spread = 0.30 + Math.floor(i / 2) * 0.13;
      const endX = cx + side * this.width * spread;
      const endY = this.height * (0.12 + (i % 3) * 0.34);
      this.stage
        .moveTo(vanishingX, vanishingY)
        .lineTo(endX, endY)
        .stroke({
          width: 0.55,
          color: i % 3 === 0 ? accentB : muted,
          alpha: 0.025 + detail01 * 0.018,
        });
    }

    // One-way z travel is reconstructed analytically from playback time.
    const near = 1.35;
    const far = 9.4;
    const speed = 0.035;
    for (let index = 0; index < this.echoes.length; index++) {
      const echo = this.echoes[index];
      const seed = fract(index * 0.6180339 + this.lineIndex * 0.0713);
      const phase = fract(seed - time * speed);
      const depth = near + phase * (far - near);
      const perspective = focal / (depth * Math.min(this.width, this.height));
      const lane = ((index % 3) - 1) * (0.74 + detail01 * 0.20)
        + Math.sin(index * 1.91 + this.lineIndex) * 0.12;
      const level = ((index % 5) - 2) * 0.22;
      const x = vanishingX + lane * focal / depth;
      const y = vanishingY + level * focal / depth;
      const scale = clamp(0.13 + perspective * 2.28, 0.12, 1.72);
      const farFade = 1 - smoothstep(7.0, far, depth);
      const nearFade = smoothstep(near, near + 0.62, depth);
      const edgeFade = 1 - smoothstep(this.width * 0.43, this.width * 0.62, Math.abs(x - cx));
      const alpha = clamp(
        (0.035 + (1 - phase) * 0.19)
          * farFade
          * nearFade
          * edgeFade
          * lightResponse
          * (0.48 + this.intensity * 0.20),
        0,
        0.42,
      );

      echo.position.set(x, y);
      echo.scale.set(scale);
      echo.rotation = (index % 2 ? -1 : 1) * (0.012 + index * 0.0012)
        + Math.sin(time * 0.043 + index) * 0.006;
      echo.alpha = alpha;
      echo.zIndex = Math.round(10000 - depth * 500);
    }

    // Oversized cropped fragments create editorial depth at the frame edges.
    for (let index = 0; index < this.fragments.length; index++) {
      const fragment = this.fragments[index];
      const side = index === 0 ? -1 : 1;
      fragment.position.set(
        cx + side * this.width * (0.54 + Math.sin(time * 0.037 + index) * 0.012),
        this.height * (index === 0 ? 0.19 : 0.82),
      );
      fragment.rotation = side * (0.055 + Math.sin(time * 0.031 + index) * 0.008);
      fragment.alpha = (0.025 + audio.energy * 0.014) * (0.55 + this.intensity * 0.15);
    }

    // A restrained title-safe center window pushes the background recursion away
    // from foreground lyrics without erasing the typographic-world identity.
    this.stage
      .rect(this.width * 0.22, this.height * 0.37, this.width * 0.56, this.height * 0.26)
      .fill({ color: surface, alpha: 0.018 + detail01 * 0.008 });
    this.stage
      .moveTo(this.width * 0.26, this.height * 0.66)
      .lineTo(this.width * 0.74, this.height * 0.66)
      .stroke({ width: 0.65, color: glow, alpha: 0.028 + audio.treble * 0.012 });
  }

  destroy() {
    this.destroyTypography();
    this.container.destroy({ children: true });
  }

  private rebuild(force = false) {
    const detail01 = clamp(this.detail / 3);
    const count = this.quality === "cinema"
      ? Math.round(10 + detail01 * 10)
      : Math.round(7 + detail01 * 6);
    const key = [
      this.text,
      this.lineIndex,
      Math.round(this.width),
      Math.round(this.height),
      this.quality,
      count,
      this.palette?.background ?? -1,
      this.palette?.accentA ?? -1,
      this.palette?.accentB ?? -1,
    ].join("|");
    if (!force && key === this.buildKey) return;
    this.buildKey = key;
    this.destroyTypography();
    if (!this.text) return;

    const accentA = this.palette?.accentA ?? 0x66fff1;
    const accentB = this.palette?.accentB ?? 0x9271ff;
    const background = this.palette?.background ?? 0x020507;
    const textLength = Math.max(7, this.text.length);
    const fontSize = clamp(this.width / Math.max(8.5, textLength * 0.44), 34, 112);

    for (let index = 0; index < count; index++) {
      const style = new TextStyle({
        fontFamily: "Arial Black, Impact, Helvetica Neue, Arial, sans-serif",
        fontWeight: "900",
        fontSize,
        fill: background,
        stroke: {
          color: index % 4 === 0 ? accentB : accentA,
          width: index % 4 === 0 ? 1.4 : 0.85,
        },
        letterSpacing: -1.2,
      });
      const echo = new Text({ text: this.text, style, resolution: textResolution() });
      echo.anchor.set(0.5);
      this.typography.addChild(echo);
      this.echoes.push(echo);
    }

    for (let index = 0; index < 2; index++) {
      const style = new TextStyle({
        fontFamily: "Arial Black, Impact, Helvetica Neue, Arial, sans-serif",
        fontWeight: "900",
        fontSize: fontSize * 2.8,
        fill: background,
        stroke: { color: index ? accentB : accentA, width: 1.1 },
        letterSpacing: -2,
      });
      const fragment = new Text({ text: this.text, style, resolution: textResolution() });
      fragment.anchor.set(0.5);
      this.typography.addChild(fragment);
      this.fragments.push(fragment);
    }
  }

  private destroyTypography() {
    for (const item of [...this.echoes, ...this.fragments]) {
      item.removeFromParent();
      item.destroy({ style: true });
    }
    this.echoes.length = 0;
    this.fragments.length = 0;
    for (const child of this.typography.removeChildren()) child.destroy();
  }
}

function textResolution() {
  const dpr = typeof devicePixelRatio === "number" ? devicePixelRatio : 1;
  return Math.max(1.5, Math.min(3, dpr * 1.5));
}

function fract(value: number) {
  return value - Math.floor(value);
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp((value - edge0) / Math.max(0.000001, edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}
