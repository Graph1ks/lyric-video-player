import { Container, Text, TextStyle } from "pixi.js";
import type { LineCue, WordCue } from "@graph1ks/emo-engine-core";
import type { AudioBands } from "@graph1ks/emo-audio-web";
import type { SceneMode } from "@graph1ks/emo-engine-core";
import { clamp, dampedPulse, easeOutBack, easeOutElastic, easeOutExpo, hash01, lerp, smoothstep } from "@graph1ks/emo-engine-core";

interface GlyphVisual {
  node: Text;
  baseY: number;
  seed: number;
}

interface WordVisual {
  cue: WordCue;
  slot: Container;
  motion: Container;
  glyphs: GlyphVisual[];
  width: number;
  baseX: number;
  baseY: number;
}

export class KineticLyrics {
  readonly container = new Container();

  private echoLayer = new Container();
  private chromaLayer = new Container();
  private mainLayer = new Container();
  private accentLayer = new Container();
  private line?: LineCue;
  private words: WordVisual[] = [];
  private echoes: Text[] = [];
  private chromaEchoes: Text[] = [];
  private lineIndex = -1;
  private activeWord = -1;
  private mode: SceneMode = "neon";
  private w = 1;
  private h = 1;
  private intensity = 1;
  private fontSize = 84;
  private wordHitListeners = new Set<(index: number, audio: AudioBands) => void>();

  private mainStyle = new TextStyle({
    fontFamily: "Arial Black, Impact, Helvetica Neue, Arial, sans-serif",
    fontSize: 84,
    fontWeight: "900",
    fill: 0xffffff,
    align: "center",
    letterSpacing: -2,
  });

  constructor() {
    this.container.addChild(this.echoLayer, this.chromaLayer, this.mainLayer, this.accentLayer);
  }

  setMode(mode: SceneMode) {
    if (this.mode === mode) return;
    this.mode = mode;
    if (this.line) this.rebuild(false);
  }

  setIntensity(value: number) {
    this.intensity = Math.max(0.2, Math.min(1.8, value));
  }

  onWordHit(listener: (index: number, audio: AudioBands) => void) {
    this.wordHitListeners.add(listener);
    return () => this.wordHitListeners.delete(listener);
  }

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
    if (this.line) {
      this.updateFontSize();
      this.remeasureWords();
      this.layout();
      this.layoutEchoes();
    }
  }

  setLine(line: LineCue | undefined, index: number) {
    if (!line) {
      if (index === this.lineIndex && !this.line) return;
      this.line = undefined;
      this.lineIndex = index;
      this.activeWord = -1;
      this.clear();
      return;
    }
    if (index === this.lineIndex) return;
    this.line = line;
    this.lineIndex = index;
    this.activeWord = -1;
    this.rebuild(true);
  }

  update(time: number, audio: AudioBands) {
    if (!this.line || !this.words.length) return;

    const wi = this.findActiveWord(time);
    if (wi !== this.activeWord && wi >= 0) {
      this.activeWord = wi;
      this.punchWord(wi, audio);
      for (const listener of this.wordHitListeners) listener(wi, audio);
    }

    const activeCue = wi >= 0 ? this.words[wi]?.cue : undefined;
    const activeProgress = activeCue
      ? clamp((time - activeCue.start) / Math.max(0.04, activeCue.end - activeCue.start))
      : 0;

    const sceneScale = this.mode === "poster"
      ? 1 + audio.bass * 0.018 * this.intensity
      : this.mode === "vortex"
        ? 1 + audio.bass * 0.03 * this.intensity
        : 1 + audio.bass * 0.012 * this.intensity;
    this.mainLayer.scale.set(sceneScale);

    this.words.forEach((word, wordIndex) => {
      const active = wordIndex === wi;
      const past = time >= word.cue.end;
      const wordPhase = time * (active ? 3.1 : 1.25) + wordIndex * 0.87;
      const floatAmount = this.mode === "poster" ? 0.65 : this.mode === "vortex" ? 3.5 : 1.8;
      this.updateWordMotion(word, wordIndex, time, audio);
      word.slot.position.set(
        word.baseX + Math.sin(wordPhase * 0.53) * floatAmount * this.intensity,
        word.baseY + Math.cos(wordPhase) * floatAmount * this.intensity,
      );

      word.glyphs.forEach((glyph, glyphIndex) => {
        const node = glyph.node;
        const glyphProgress = active ? activeProgress * word.glyphs.length - glyphIndex : past ? 2 : -1;
        const filled = glyphProgress >= 0;
        const current = glyphProgress >= 0 && glyphProgress < 1;
        const jitter = Math.sin(time * (2.2 + glyph.seed) + glyph.seed * 11) * (active ? 1.7 : 0.45) * this.intensity;

        node.y = glyph.baseY + jitter;
        node.rotation = (this.mode === "vortex" ? jitter * 0.008 : jitter * 0.0028) + (current ? Math.sin(activeProgress * Math.PI) * 0.025 : 0);
        node.alpha = active ? 1 : past ? 0.62 : this.mode === "poster" ? 0.2 : 0.28;

        if (this.mode === "poster") {
          node.tint = active ? (filled ? 0xffffff : 0x8f9097) : past ? 0xd6d6d9 : 0x6f7077;
        } else if (this.mode === "vortex") {
          node.tint = active ? (filled ? 0xffe6e0 : 0xff4557) : past ? 0xff7565 : 0x7b2432;
        } else {
          node.tint = active ? (filled ? 0xffffff : 0x76d9dc) : past ? 0x8bfff2 : 0x688690;
        }

        const characterPulse = current ? 1 + Math.sin(smoothstep(0, 1, glyphProgress) * Math.PI) * 0.22 * this.intensity : 1;
        node.scale.set(characterPulse);
      });
    });

    this.updateEchoes(time, audio, wi);
  }

  private clear() {
    this.echoLayer.removeChildren();
    this.chromaLayer.removeChildren();
    this.mainLayer.removeChildren();
    this.accentLayer.removeChildren();
    this.words = [];
    this.echoes = [];
    this.chromaEchoes = [];
  }

  private rebuild(animateEntry: boolean) {
    if (!this.line) return;

    this.echoLayer.removeChildren();
    this.chromaLayer.removeChildren();
    this.mainLayer.removeChildren();
    this.accentLayer.removeChildren();
    this.words = [];
    this.echoes = [];
    this.chromaEchoes = [];

    this.updateFontSize();
    this.configureStyle();

    this.line.words.forEach((cue, wordIndex) => {
      const slot = new Container();
      const motion = new Container();
      slot.addChild(motion);
      this.mainLayer.addChild(slot);

      const glyphs: GlyphVisual[] = [];
      let cursor = 0;
      const chars = [...cue.text];
      chars.forEach((char, glyphIndex) => {
        const node = new Text({ text: char, style: this.mainStyle });
        node.anchor.set(0.5);
        const half = node.width * 0.5;
        node.position.set(cursor + half, 0);
        cursor += node.width + Math.max(-1, this.fontSize * -0.018);
        motion.addChild(node);
        glyphs.push({ node, baseY: 0, seed: hash01(this.lineIndex * 157 + wordIndex * 31 + glyphIndex * 17) });
      });

      const width = Math.max(1, cursor);
      glyphs.forEach(g => g.node.x -= width * 0.5);
      motion.alpha = animateEntry ? 0 : 1;
      motion.scale.set(animateEntry ? 0.64 : 1);
      motion.rotation = animateEntry ? (wordIndex % 2 ? 0.09 : -0.09) : 0;

      this.words.push({ cue, slot, motion, glyphs, width, baseX: 0, baseY: 0 });
    });

    this.buildEchoes();
    this.layout();
    this.layoutEchoes();
  }

  private punchWord(_index: number, _audio: AudioBands) {
    // Motion is evaluated analytically from lyric timestamps in updateWordMotion().
    // Keeping this hook makes word-hit side effects (camera/background impulses) explicit.
  }

  private updateWordMotion(word: WordVisual, index: number, time: number, audio: AudioBands) {
    if (!this.line) return;

    const delay = index * 0.035;
    const duration = this.mode === "poster" ? 0.56 : 0.78;
    const entryT = clamp((time - this.line.start - delay) / duration);
    const entryEase = easeOutExpo(entryT);
    const entryScaleEase = this.mode === "poster" ? easeOutBack(entryT, 1.8) : easeOutElastic(entryT);
    const fromX = this.mode === "poster" ? (index % 2 ? 90 : -90) : this.mode === "vortex" ? 0 : (index % 2 ? 36 : -36);
    const fromY = this.mode === "vortex" ? (index % 2 ? 140 : -140) : 18;
    const fromRotation = index % 2 ? 0.09 : -0.09;

    let x = lerp(fromX * this.intensity, 0, entryEase);
    let y = lerp(fromY * this.intensity, 0, entryEase);
    let rotation = lerp(fromRotation, 0, entryEase);
    let scaleX = lerp(0.64, 1, entryScaleEase);
    let scaleY = lerp(0.64, 1, entryScaleEase);

    const age = time - word.cue.start;
    if (age >= 0 && age <= 1.15) {
      const sign = index % 2 ? 1 : -1;
      const strength = this.intensity * (1 + audio.transient * 0.7);
      const fast = Math.exp(-age * (this.mode === "vortex" ? 5.4 : 6.8));
      const bounce = dampedPulse(age, this.mode === "neon" ? 15 : 12, this.mode === "neon" ? 5.2 : 6.4);

      if (this.mode === "poster") {
        scaleX += (0.45 + audio.bass * 0.25) * fast;
        scaleY -= 0.36 * fast;
        y += -12 * strength * fast;
        rotation += sign * 0.045 * strength * fast;
      } else if (this.mode === "vortex") {
        scaleX += 1.1 * fast;
        scaleY -= 0.6 * fast;
        rotation += sign * 0.18 * strength * fast;
      } else {
        scaleX += (0.7 + audio.bass * 0.45) * fast + bounce * 0.08;
        scaleY -= 0.28 * fast - bounce * 0.04;
        y += -16 * strength * fast;
        rotation += sign * 0.05 * fast;
      }
    }

    word.motion.position.set(x, y);
    word.motion.rotation = rotation;
    word.motion.alpha = entryT;
    word.motion.scale.set(Math.max(0.08, scaleX), Math.max(0.08, scaleY));
  }

  private buildEchoes() {
    if (!this.line) return;
    const lineText = this.line.text.toUpperCase();
    const count = this.mode === "vortex" ? 16 : this.mode === "poster" ? 9 : 3;

    for (let i = 0; i < count; i++) {
      const style = this.echoStyle(i);
      const echo = new Text({ text: lineText, style });
      echo.anchor.set(0.5);
      this.echoLayer.addChild(echo);
      this.echoes.push(echo);
    }

    if (this.mode === "neon") {
      for (let i = 0; i < 2; i++) {
        const style = new TextStyle({
          fontFamily: "Arial Black, Impact, Helvetica Neue, Arial, sans-serif",
          fontWeight: "900",
          fontSize: this.fontSize * 1.02,
          fill: i === 0 ? 0x36fff0 : 0xff387f,
          letterSpacing: -2,
        });
        const echo = new Text({ text: lineText, style });
        echo.anchor.set(0.5);
        echo.alpha = 0.15;
        echo.blendMode = "add";
        this.chromaLayer.addChild(echo);
        this.chromaEchoes.push(echo);
      }
    }
  }

  private echoStyle(index: number) {
    if (this.mode === "poster") {
      return new TextStyle({
        fontFamily: "Arial Black, Impact, Helvetica Neue, Arial, sans-serif",
        fontWeight: "900",
        fontSize: this.fontSize * 1.02,
        fill: 0x070707,
        stroke: { color: index === 4 ? 0xffffff : 0x8c8e93, width: index === 4 ? 3 : 1.2 },
        letterSpacing: -2,
      });
    }

    if (this.mode === "vortex") {
      return new TextStyle({
        fontFamily: "Arial Black, Impact, Helvetica Neue, Arial, sans-serif",
        fontWeight: "900",
        fontSize: this.fontSize * 1.18,
        fill: 0x050304,
        stroke: { color: index % 2 ? 0xff3348 : 0xff704d, width: 1.6 },
        letterSpacing: -2,
      });
    }

    return new TextStyle({
      fontFamily: "Arial Black, Impact, Helvetica Neue, Arial, sans-serif",
      fontWeight: "900",
      fontSize: this.fontSize * 1.04,
      fill: 0x58fff1,
      letterSpacing: -2,
    });
  }

  private updateEchoes(time: number, audio: AudioBands, activeWord: number) {
    const cx = this.w * 0.5;
    const cy = this.h * 0.5;

    if (this.mode === "poster") {
      this.echoes.forEach((echo, i) => {
        const center = (this.echoes.length - 1) * 0.5;
        const d = i - center;
        echo.position.set(cx - this.w * 0.23 + Math.sin(time * 0.8 + i) * 5, cy + d * this.fontSize * 0.92);
        echo.scale.set(0.72 + Math.abs(d) * 0.006);
        echo.alpha = i === Math.round(center) ? 0.28 : 0.13;
      });
    } else if (this.mode === "vortex") {
      this.echoes.forEach((echo, i) => {
        const t = i / Math.max(1, this.echoes.length - 1);
        const scale = 2.2 - t * 1.92 + Math.sin(time * 0.8 + i * 0.2) * 0.015;
        const angle = time * 0.035 * (i % 2 ? -1 : 1) + (i - 8) * 0.012;
        echo.position.set(cx, cy);
        echo.scale.set(scale * (1 + audio.bass * 0.025));
        echo.rotation = angle;
        echo.alpha = 0.055 + t * 0.24;
      });
    } else {
      this.echoes.forEach((echo, i) => {
        echo.position.set(cx, cy + (i - 1) * 8);
        echo.scale.set(1.04 + i * 0.01 + audio.bass * 0.015);
        echo.alpha = 0.035 + audio.energy * 0.025;
      });
      this.chromaEchoes.forEach((echo, i) => {
        const impulse = audio.transient * 14 * this.intensity;
        echo.position.set(cx + (i ? impulse : -impulse), cy + (i ? -2 : 2));
        echo.scale.set(1 + audio.bass * 0.018);
        echo.alpha = 0.07 + audio.energy * 0.13 + (activeWord >= 0 ? 0.03 : 0);
      });
    }
  }

  private updateFontSize() {
    const textLength = Math.max(6, this.line?.text.length ?? 18);
    const widthDriven = this.w / Math.max(7.5, Math.min(18, textLength * 0.54));
    const heightCap = this.h * (this.mode === "poster" ? 0.17 : 0.16);
    const sceneBoost = this.mode === "poster" ? 1.12 : this.mode === "vortex" ? 1.03 : 1;
    this.fontSize = Math.max(42, Math.min(148, widthDriven * sceneBoost, heightCap));
    this.mainStyle.fontSize = this.fontSize;
  }

  private configureStyle() {
    this.mainStyle.fontFamily = "Arial Black, Impact, Helvetica Neue, Arial, sans-serif";
    this.mainStyle.fontWeight = "900";
    this.mainStyle.letterSpacing = this.mode === "poster" ? -3 : -2;
    this.mainStyle.fill = this.mode === "vortex" ? 0xfff0eb : 0xffffff;
  }

  private remeasureWords() {
    for (const word of this.words) {
      let cursor = 0;
      for (const glyph of word.glyphs) {
        glyph.node.style = this.mainStyle;
        const half = glyph.node.width * 0.5;
        glyph.node.x = cursor + half;
        cursor += glyph.node.width + Math.max(-1, this.fontSize * -0.018);
      }
      word.width = Math.max(1, cursor);
      word.glyphs.forEach(g => g.node.x -= word.width * 0.5);
    }
  }

  private layout() {
    if (!this.words.length) return;
    const maxWidth = Math.min(this.w * (this.mode === "poster" ? 0.76 : 0.84), 1480);
    const gap = this.fontSize * (this.mode === "poster" ? 0.25 : 0.31);
    const rows: WordVisual[][] = [[]];
    let rowWidth = 0;

    for (const word of this.words) {
      const next = word.width + (rows[rows.length - 1].length ? gap : 0);
      if (rowWidth + next > maxWidth && rows[rows.length - 1].length) {
        rows.push([]);
        rowWidth = 0;
      }
      rows[rows.length - 1].push(word);
      rowWidth += word.width + (rows[rows.length - 1].length > 1 ? gap : 0);
    }

    const lineHeight = this.fontSize * (this.mode === "poster" ? 1.02 : 1.08);
    const totalHeight = (rows.length - 1) * lineHeight;
    let y = -totalHeight * 0.5;

    rows.forEach(row => {
      const width = row.reduce((sum, word, i) => sum + word.width + (i ? gap : 0), 0);
      let x = -width * 0.5;
      row.forEach(word => {
        word.baseX = x + word.width * 0.5;
        word.baseY = y;
        word.slot.position.set(word.baseX, word.baseY);
        x += word.width + gap;
      });
      y += lineHeight;
    });

    const xBias = this.mode === "poster" ? this.w * 0.17 : 0;
    this.mainLayer.position.set(this.w * 0.5 + xBias, this.h * 0.5);
  }

  private layoutEchoes() {
    if (!this.line) return;
    const cx = this.w * 0.5;
    const cy = this.h * 0.5;
    this.echoes.forEach(e => e.position.set(cx, cy));
    this.chromaEchoes.forEach(e => e.position.set(cx, cy));
  }

  private findActiveWord(time: number) {
    if (!this.line) return -1;
    for (let i = 0; i < this.line.words.length; i++) {
      const word = this.line.words[i];
      if (time >= word.start && time < word.end) return i;
    }
    return -1;
  }
}
