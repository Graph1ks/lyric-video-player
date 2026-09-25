import { Container, Text, TextStyle } from "pixi.js";
import type { AudioBands } from "@graph1ks/emo-audio-web";
import {
  audioSelector,
  clamp,
  dampedPulse,
  easeOutBack,
  easeOutElastic,
  easeOutExpo,
  hash01,
  lerp,
  randomSelector,
  staggerSelector,
  waveSelector,
  wiggleSelector,
  type GlyphSelectorContext,
  type LineCue,
  type SceneMode,
  type TypographyPreset,
  type TypographyPresetId,
  type WordCue,
} from "@graph1ks/emo-engine-core";

interface GlyphVisual {
  node: Text;
  baseX: number;
  baseY: number;
  seed: number;
  globalIndex: number;
  wordIndex: number;
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

interface GlyphMotion {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  alpha: number;
}

const AUTO_PRESETS: Record<SceneMode, TypographyPresetId[]> = {
  poster: ["impact", "outline", "cascade", "scatter"],
  neon: ["elastic", "wave", "glitch", "cascade"],
  vortex: ["tunnel", "scatter", "wave", "impact"],
};

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
  private preset: TypographyPreset = "auto";
  private resolvedPreset: TypographyPresetId = "elastic";
  private w = 1;
  private h = 1;
  private intensity = 1;
  private fontSize = 84;
  private glyphCount = 0;
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
    const previous = this.resolvedPreset;
    this.resolvePreset();
    if (this.line && previous !== this.resolvedPreset) this.rebuild(false);
    else if (this.line) {
      this.configureStyle();
      this.remeasureWords();
      this.layout();
      this.rebuildEchoLayers();
    }
  }

  setPreset(preset: TypographyPreset) {
    if (this.preset === preset) return;
    this.preset = preset;
    const previous = this.resolvedPreset;
    this.resolvePreset();
    if (this.line && previous !== this.resolvedPreset) this.rebuild(false);
  }

  getPreset() {
    return this.preset;
  }

  getResolvedPreset() {
    return this.resolvedPreset;
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
    this.resolvePreset();
    this.rebuild(true);
  }

  update(time: number, audio: AudioBands) {
    if (!this.line || !this.words.length) return;

    const wi = this.findActiveWord(time);
    if (wi !== this.activeWord && wi >= 0) {
      this.activeWord = wi;
      for (const listener of this.wordHitListeners) listener(wi, audio);
    }

    const lineDuration = Math.max(0.08, this.line.end - this.line.start);
    const lineProgress = clamp((time - this.line.start) / lineDuration);
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
      const floatAmount = this.resolvedPreset === "outline"
        ? 0.25
        : this.mode === "poster"
          ? 0.65
          : this.mode === "vortex"
            ? 3.5
            : 1.8;

      this.updateWordMotion(word, wordIndex, time, audio);
      word.slot.position.set(
        word.baseX + Math.sin(wordPhase * 0.53) * floatAmount * this.intensity,
        word.baseY + Math.cos(wordPhase) * floatAmount * this.intensity,
      );

      const wordDuration = Math.max(0.04, word.cue.end - word.cue.start);
      const wordProgress = clamp((time - word.cue.start) / wordDuration);

      word.glyphs.forEach((glyph, glyphIndex) => {
        const node = glyph.node;
        const glyphProgress = active ? activeProgress * word.glyphs.length - glyphIndex : past ? 2 : -1;
        const filled = glyphProgress >= 0;
        const current = glyphProgress >= 0 && glyphProgress < 1;
        const context: GlyphSelectorContext = {
          index: glyph.globalIndex,
          count: this.glyphCount,
          wordIndex,
          wordCount: this.words.length,
          lineIndex: this.lineIndex,
          time,
          lineProgress,
          wordProgress,
          seed: glyph.seed,
          audio,
        };
        const motion = this.glyphMotion(
          context,
          glyphIndex,
          word.glyphs.length,
          active,
          past,
          current,
          glyphProgress,
        );

        node.position.set(glyph.baseX + motion.x, glyph.baseY + motion.y);
        node.rotation = motion.rotation;
        node.scale.set(motion.scaleX, motion.scaleY);
        node.alpha = motion.alpha;
        node.tint = this.glyphTint(active, past, filled);
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
    this.glyphCount = 0;
  }

  private rebuild(animateEntry: boolean) {
    if (!this.line) return;

    this.clear();
    this.updateFontSize();
    this.configureStyle();

    let globalIndex = 0;
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
        const baseX = cursor + half;
        node.position.set(baseX, 0);
        cursor += node.width + Math.max(-1, this.fontSize * -0.018);
        motion.addChild(node);
        glyphs.push({
          node,
          baseX,
          baseY: 0,
          globalIndex,
          wordIndex,
          seed: hash01(this.lineIndex * 157 + wordIndex * 31 + glyphIndex * 17),
        });
        globalIndex += 1;
      });

      const width = Math.max(1, cursor);
      glyphs.forEach(glyph => {
        glyph.baseX -= width * 0.5;
        glyph.node.x = glyph.baseX;
      });
      motion.alpha = animateEntry ? 0 : 1;
      motion.scale.set(animateEntry ? 0.64 : 1);
      motion.rotation = animateEntry ? (wordIndex % 2 ? 0.09 : -0.09) : 0;

      this.words.push({ cue, slot, motion, glyphs, width, baseX: 0, baseY: 0 });
    });

    this.glyphCount = Math.max(1, globalIndex);
    this.rebuildEchoLayers();
    this.layout();
    this.layoutEchoes();
  }

  private rebuildEchoLayers() {
    this.echoLayer.removeChildren();
    this.chromaLayer.removeChildren();
    this.echoes = [];
    this.chromaEchoes = [];
    this.buildEchoes();
    this.layoutEchoes();
  }

  private resolvePreset() {
    if (this.preset !== "auto") {
      this.resolvedPreset = this.preset;
      return;
    }
    const options = AUTO_PRESETS[this.mode];
    const safeLine = Math.max(0, this.lineIndex);
    this.resolvedPreset = options[safeLine % options.length];
  }

  private glyphMotion(
    context: GlyphSelectorContext,
    glyphIndex: number,
    glyphsInWord: number,
    active: boolean,
    past: boolean,
    current: boolean,
    glyphProgress: number,
  ): GlyphMotion {
    const currentPulse = current
      ? Math.sin(clamp(glyphProgress) * Math.PI) * 0.22 * this.intensity
      : 0;
    const baseAlpha = active ? 1 : past ? 0.62 : this.mode === "poster" ? 0.2 : 0.28;
    const jitter = (wiggleSelector(context, { frequency: 3.8, seed: context.seed * 91 }) - 0.5) * 2;
    const sign = context.index % 2 ? 1 : -1;

    if (this.resolvedPreset === "cascade") {
      const entry = staggerSelector(context, {
        progress: clamp((context.time - (this.line?.start ?? 0)) / 0.9),
        spread: 0.82,
        order: this.lineIndex % 2 ? "reverse" : "forward",
      });
      const ease = easeOutBack(entry, 1.45);
      return {
        x: sign * (1 - entry) * 20 * this.intensity,
        y: (1 - ease) * (105 + glyphIndex * 2) * this.intensity,
        rotation: sign * (1 - entry) * 0.18,
        scaleX: Math.max(0.08, 0.45 + ease * 0.55 + currentPulse),
        scaleY: Math.max(0.08, 0.45 + ease * 0.55 + currentPulse * 0.65),
        alpha: baseAlpha * entry,
      };
    }

    if (this.resolvedPreset === "wave") {
      const wave = waveSelector(context, {
        cycles: 1.15 + Math.min(1.4, this.glyphCount / 18),
        speed: active ? 4.1 : 2.2,
        phase: this.lineIndex * 0.43,
        amplitude: 0.5,
      });
      const centered = (wave - 0.5) * 2;
      const amp = (active ? 24 : 10) * this.intensity * (0.7 + context.audio.mid * 0.5);
      return {
        x: centered * 5 * this.intensity,
        y: centered * amp,
        rotation: centered * 0.095 * this.intensity,
        scaleX: Math.max(0.2, 1 + centered * 0.09 + currentPulse),
        scaleY: Math.max(0.2, 1 - centered * 0.035 + currentPulse * 0.5),
        alpha: baseAlpha,
      };
    }

    if (this.resolvedPreset === "scatter") {
      const entry = staggerSelector(context, {
        progress: clamp((context.time - (this.line?.start ?? 0)) / 0.78),
        spread: 0.72,
        order: "random",
        seed: this.lineIndex * 17 + 9,
      });
      const angle = randomSelector(context, 4) * Math.PI * 2;
      const radius = (80 + randomSelector(context, 9) * 180) * (1 - easeOutExpo(entry)) * this.intensity;
      const scale = 0.32 + easeOutBack(entry, 1.2) * 0.68;
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        rotation: sign * (1 - entry) * (0.3 + randomSelector(context, 12) * 0.45),
        scaleX: Math.max(0.08, scale + currentPulse),
        scaleY: Math.max(0.08, scale + currentPulse * 0.6),
        alpha: baseAlpha * entry,
      };
    }

    if (this.resolvedPreset === "elastic") {
      const age = context.time - ((this.words[context.wordIndex]?.cue.start ?? context.time) + glyphIndex * 0.018);
      const bounce = dampedPulse(age, 15 + glyphIndex * 0.07, 5.1);
      const entry = clamp((age + 0.08) / 0.48);
      const elastic = easeOutElastic(entry);
      const audioLift = context.audio.bass * 0.14 * (active ? 1 : 0.25) * this.intensity;
      return {
        x: sign * bounce * 6 * this.intensity,
        y: -bounce * 19 * this.intensity,
        rotation: sign * bounce * 0.075 * this.intensity,
        scaleX: Math.max(0.12, 0.4 + elastic * 0.6 + bounce * 0.18 + audioLift + currentPulse),
        scaleY: Math.max(0.12, 0.4 + elastic * 0.6 - bounce * 0.1 + currentPulse * 0.45),
        alpha: baseAlpha * entry,
      };
    }

    if (this.resolvedPreset === "outline") {
      const wave = waveSelector(context, { cycles: 0.7, speed: 1.35, phase: this.lineIndex, amplitude: 0.5 });
      const centered = (wave - 0.5) * 2;
      return {
        x: centered * 2.5 * this.intensity,
        y: centered * 4 * this.intensity,
        rotation: centered * 0.018,
        scaleX: 1 + currentPulse * 0.7,
        scaleY: 1 + currentPulse * 0.5,
        alpha: active ? 1 : past ? 0.78 : 0.42,
      };
    }

    if (this.resolvedPreset === "tunnel") {
      const wave = waveSelector(context, { cycles: 1.6, speed: 1.7, phase: this.lineIndex * 0.9, amplitude: 0.5 });
      const centered = (wave - 0.5) * 2;
      const radial = 1 + context.audio.bass * 0.12 * this.intensity;
      return {
        x: centered * 10 * this.intensity,
        y: centered * 15 * this.intensity,
        rotation: centered * 0.11 + sign * context.audio.transient * 0.04,
        scaleX: Math.max(0.2, radial + centered * 0.07 + currentPulse),
        scaleY: Math.max(0.2, radial - centered * 0.05 + currentPulse * 0.55),
        alpha: active ? 1 : past ? 0.68 : 0.32,
      };
    }

    if (this.resolvedPreset === "glitch") {
      const audioGate = audioSelector(context, { energy: 0.65, transient: 1.8, treble: 0.35, gain: 1.4 });
      const wiggleX = (wiggleSelector(context, { frequency: 18, seed: context.seed * 181, smooth: false }) - 0.5) * 2;
      const wiggleY = (wiggleSelector(context, { frequency: 13, seed: context.seed * 271, smooth: false }) - 0.5) * 2;
      const gate = Math.max(active ? 0.12 : 0.03, audioGate);
      const flicker = 0.72 + wiggleSelector(context, { frequency: 22, seed: context.seed * 401, smooth: false }) * 0.28;
      return {
        x: wiggleX * 18 * gate * this.intensity,
        y: wiggleY * 7 * gate * this.intensity,
        rotation: wiggleX * 0.035 * gate,
        scaleX: Math.max(0.2, 1 + Math.abs(wiggleX) * 0.08 * gate + currentPulse),
        scaleY: Math.max(0.2, 1 - Math.abs(wiggleY) * 0.045 * gate + currentPulse * 0.45),
        alpha: baseAlpha * flicker,
      };
    }

    const activeJitter = jitter * (active ? 1.7 : 0.45) * this.intensity;
    return {
      x: 0,
      y: activeJitter,
      rotation: (this.mode === "vortex" ? activeJitter * 0.008 : activeJitter * 0.0028)
        + (current ? Math.sin(clamp(glyphProgress) * Math.PI) * 0.025 : 0),
      scaleX: 1 + currentPulse,
      scaleY: 1 + currentPulse,
      alpha: baseAlpha,
    };
  }

  private glyphTint(active: boolean, past: boolean, filled: boolean) {
    if (this.mode === "poster") {
      return active ? (filled ? 0xffffff : 0x8f9097) : past ? 0xd6d6d9 : 0x6f7077;
    }
    if (this.mode === "vortex") {
      return active ? (filled ? 0xffe6e0 : 0xff4557) : past ? 0xff7565 : 0x7b2432;
    }
    return active ? (filled ? 0xffffff : 0x76d9dc) : past ? 0x8bfff2 : 0x688690;
  }

  private updateWordMotion(word: WordVisual, index: number, time: number, audio: AudioBands) {
    if (!this.line) return;

    const glyphOwnedEntry = this.resolvedPreset === "cascade"
      || this.resolvedPreset === "scatter"
      || this.resolvedPreset === "wave"
      || this.resolvedPreset === "outline"
      || this.resolvedPreset === "glitch";
    const delay = glyphOwnedEntry ? 0 : index * 0.035;
    const duration = glyphOwnedEntry ? 0.22 : this.mode === "poster" ? 0.56 : 0.78;
    const entryT = clamp((time - this.line.start - delay) / duration);
    const entryEase = easeOutExpo(entryT);
    const entryScaleEase = this.mode === "poster" ? easeOutBack(entryT, 1.8) : easeOutElastic(entryT);

    const fromX = glyphOwnedEntry
      ? 0
      : this.mode === "poster"
        ? (index % 2 ? 90 : -90)
        : this.mode === "vortex"
          ? 0
          : (index % 2 ? 36 : -36);
    const fromY = glyphOwnedEntry ? 0 : this.mode === "vortex" ? (index % 2 ? 140 : -140) : 18;
    const fromRotation = glyphOwnedEntry ? 0 : index % 2 ? 0.09 : -0.09;
    const startScale = glyphOwnedEntry ? 1 : 0.64;

    let x = lerp(fromX * this.intensity, 0, entryEase);
    let y = lerp(fromY * this.intensity, 0, entryEase);
    let rotation = lerp(fromRotation, 0, entryEase);
    let scaleX = lerp(startScale, 1, entryScaleEase);
    let scaleY = lerp(startScale, 1, entryScaleEase);

    const age = time - word.cue.start;
    if (!glyphOwnedEntry && age >= 0 && age <= 1.15) {
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
    const count = this.resolvedPreset === "tunnel"
      ? 18
      : this.resolvedPreset === "outline"
        ? 12
        : this.resolvedPreset === "glitch"
          ? 4
          : this.mode === "poster"
            ? 7
            : this.mode === "vortex"
              ? 10
              : 3;

    for (let i = 0; i < count; i++) {
      const echo = new Text({ text: lineText, style: this.echoStyle(i) });
      echo.anchor.set(0.5);
      this.echoLayer.addChild(echo);
      this.echoes.push(echo);
    }

    if (this.mode === "neon" || this.resolvedPreset === "glitch") {
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
    if (this.resolvedPreset === "outline") {
      return new TextStyle({
        fontFamily: "Arial Black, Impact, Helvetica Neue, Arial, sans-serif",
        fontWeight: "900",
        fontSize: this.fontSize * (1 + index * 0.003),
        fill: 0x050607,
        stroke: {
          color: index % 3 === 0 ? 0xffffff : this.mode === "vortex" ? 0xff5260 : 0x73767e,
          width: index % 3 === 0 ? 2.6 : 1.1,
        },
        letterSpacing: -2,
      });
    }

    if (this.resolvedPreset === "tunnel") {
      return new TextStyle({
        fontFamily: "Arial Black, Impact, Helvetica Neue, Arial, sans-serif",
        fontWeight: "900",
        fontSize: this.fontSize * 1.14,
        fill: 0x030304,
        stroke: {
          color: this.mode === "neon" ? (index % 2 ? 0x5dfff3 : 0xff447c) : (index % 2 ? 0xff3348 : 0xff704d),
          width: 1.4,
        },
        letterSpacing: -2,
      });
    }

    if (this.mode === "poster") {
      return new TextStyle({
        fontFamily: "Arial Black, Impact, Helvetica Neue, Arial, sans-serif",
        fontWeight: "900",
        fontSize: this.fontSize * 1.02,
        fill: 0x070707,
        stroke: { color: index === 3 ? 0xffffff : 0x8c8e93, width: index === 3 ? 3 : 1.2 },
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

    if (this.resolvedPreset === "outline") {
      this.echoes.forEach((echo, i) => {
        const center = (this.echoes.length - 1) * 0.5;
        const d = i - center;
        const spread = this.fontSize * 0.56;
        echo.position.set(
          cx + d * 3.5 + Math.sin(time * 0.7 + i * 0.8) * 2,
          cy + d * spread,
        );
        echo.scale.set(0.78 + Math.abs(d) * 0.006);
        echo.rotation = d * 0.003;
        echo.alpha = Math.abs(d) < 0.6 ? 0.34 : 0.1 + (1 - Math.min(1, Math.abs(d) / 8)) * 0.06;
      });
    } else if (this.resolvedPreset === "tunnel") {
      this.echoes.forEach((echo, i) => {
        const t = i / Math.max(1, this.echoes.length - 1);
        const scale = 2.45 - t * 2.2 + Math.sin(time * 0.9 + i * 0.23) * 0.018;
        const spinDirection = i % 2 ? -1 : 1;
        const angle = time * 0.055 * spinDirection + (i - this.echoes.length * 0.5) * 0.016;
        const orbit = (1 - t) * 18 * this.intensity;
        echo.position.set(
          cx + Math.cos(time * 0.18 + i) * orbit,
          cy + Math.sin(time * 0.14 + i * 0.6) * orbit,
        );
        echo.scale.set(Math.max(0.08, scale * (1 + audio.bass * 0.035)));
        echo.rotation = angle;
        echo.alpha = 0.045 + t * 0.27;
      });
    } else if (this.resolvedPreset === "glitch") {
      this.echoes.forEach((echo, i) => {
        const gate = 0.25 + audio.transient * 1.4 + audio.treble * 0.35;
        const x = (hash01(Math.floor(time * 18) * 41 + i * 13) - 0.5) * 34 * gate * this.intensity;
        const y = (hash01(Math.floor(time * 14) * 29 + i * 17) - 0.5) * 12 * gate * this.intensity;
        echo.position.set(cx + x, cy + y);
        echo.scale.set(1 + i * 0.006);
        echo.alpha = 0.04 + audio.energy * 0.08;
      });
    } else if (this.mode === "poster") {
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
    }

    this.chromaEchoes.forEach((echo, i) => {
      const impulse = (audio.transient * 14 + (this.resolvedPreset === "glitch" ? audio.treble * 9 : 0)) * this.intensity;
      echo.position.set(cx + (i ? impulse : -impulse), cy + (i ? -2 : 2));
      echo.scale.set(1 + audio.bass * 0.018);
      echo.alpha = 0.07 + audio.energy * 0.13 + (activeWord >= 0 ? 0.03 : 0);
    });
  }

  private updateFontSize() {
    const textLength = Math.max(6, this.line?.text.length ?? 18);
    const widthDriven = this.w / Math.max(7.5, Math.min(18, textLength * 0.54));
    const heightCap = this.h * (this.mode === "poster" ? 0.17 : 0.16);
    const presetScale = this.resolvedPreset === "tunnel"
      ? 0.91
      : this.resolvedPreset === "outline"
        ? 0.96
        : this.resolvedPreset === "impact"
          ? 1.05
          : 1;
    const sceneBoost = this.mode === "poster" ? 1.12 : this.mode === "vortex" ? 1.03 : 1;
    this.fontSize = Math.max(42, Math.min(148, widthDriven * sceneBoost * presetScale, heightCap));
    this.mainStyle.fontSize = this.fontSize;
  }

  private configureStyle() {
    this.mainStyle.fontFamily = "Arial Black, Impact, Helvetica Neue, Arial, sans-serif";
    this.mainStyle.fontWeight = "900";
    this.mainStyle.letterSpacing = this.resolvedPreset === "outline"
      ? -1
      : this.mode === "poster"
        ? -3
        : -2;
    this.mainStyle.fill = this.mode === "vortex" ? 0xfff0eb : 0xffffff;
    this.mainStyle.stroke = this.resolvedPreset === "outline"
      ? { color: 0xffffff, width: 1.3 }
      : { color: 0xffffff, width: 0 };
  }

  private remeasureWords() {
    for (const word of this.words) {
      let cursor = 0;
      for (const glyph of word.glyphs) {
        glyph.node.style = this.mainStyle;
        const half = glyph.node.width * 0.5;
        glyph.baseX = cursor + half;
        cursor += glyph.node.width + Math.max(-1, this.fontSize * -0.018);
      }
      word.width = Math.max(1, cursor);
      word.glyphs.forEach(glyph => {
        glyph.baseX -= word.width * 0.5;
        glyph.node.x = glyph.baseX;
      });
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

    const xBias = this.mode === "poster" && (this.resolvedPreset === "impact" || this.resolvedPreset === "outline")
      ? this.w * 0.17
      : 0;
    this.mainLayer.position.set(this.w * 0.5 + xBias, this.h * 0.5);
  }

  private layoutEchoes() {
    if (!this.line) return;
    const cx = this.w * 0.5;
    const cy = this.h * 0.5;
    this.echoes.forEach(echo => echo.position.set(cx, cy));
    this.chromaEchoes.forEach(echo => echo.position.set(cx, cy));
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
