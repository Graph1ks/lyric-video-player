import { Container, Text, TextStyle } from "pixi.js";
import type { AudioBands } from "@graph1ks/emo-audio-web";
import {
  analyzeKineticReadability,
  clamp,
  deriveTypographySequenceWindow,
  planTypographySequence,
  type LineCue,
  type QualityMode,
  type SequenceTypographyTreatment,
  type TypographySequenceGrammarId,
  type VisualPalette,
} from "@graph1ks/emo-engine-core";

interface SequenceNode {
  node: Text;
  treatment: SequenceTypographyTreatment;
}

export class PersistentTypographySequences {
  readonly container = new Container({ isRenderGroup: false });

  private lines: LineCue[] = [];
  private grammar?: TypographySequenceGrammarId;
  private phraseStartLine = 0;
  private phraseEndLine = -1;
  private nodes = new Map<string, SequenceNode>();
  private palette?: VisualPalette;
  private quality: QualityMode = "cinema";
  private intensity = 1;
  private w = 1;
  private h = 1;
  private baseFontSize = 84;
  private focusX = 0;
  private focusY = 0;
  private hasFocus = false;

  constructor() {
    this.container.sortableChildren = true;
    this.container.visible = false;
  }

  setLyrics(lines: LineCue[]) {
    this.lines = lines;
    this.clear();
  }

  setSequence(
    grammar: TypographySequenceGrammarId | undefined,
    phraseStartLine = 0,
    phraseEndLine = -1,
  ) {
    const changed = this.grammar !== grammar
      || this.phraseStartLine !== phraseStartLine
      || this.phraseEndLine !== phraseEndLine;

    this.grammar = grammar;
    this.phraseStartLine = Math.max(0, phraseStartLine);
    this.phraseEndLine = Math.max(-1, phraseEndLine);
    this.container.visible = Boolean(grammar);

    if (changed) this.clear();
  }

  getGrammar() {
    return this.grammar;
  }

  getFocusPoint() {
    return this.hasFocus
      ? { x: this.focusX, y: this.focusY }
      : { x: 0, y: 0 };
  }

  setPalette(palette: VisualPalette, _refreshStatic = true) {
    this.palette = palette;
    // Outline scenes need independent fill + stroke palette roles. A single Pixi
    // tint would multiply both and corrupt Color Canvas polarity, so even dynamic
    // palette flow refreshes the bounded sequence styles explicitly.
    for (const entry of this.nodes.values()) {
      entry.node.style = this.styleFor(entry.treatment);
      entry.node.tint = 0xffffff;
    }
  }

  setQuality(quality: QualityMode) {
    this.quality = quality;
  }

  setIntensity(value: number) {
    this.intensity = clamp(value, 0.2, 1.8);
  }

  resize(w: number, h: number) {
    this.w = Math.max(1, w);
    this.h = Math.max(1, h);
    this.baseFontSize = clamp(Math.min(this.w, this.h) * 0.095, 42, 104);
    for (const entry of this.nodes.values()) {
      entry.node.style = this.styleFor(entry.treatment);
    }
  }

  update(time: number, audio: AudioBands) {
    if (!this.grammar || !this.lines.length || this.phraseEndLine < this.phraseStartLine) {
      this.container.visible = false;
      return;
    }

    this.container.visible = true;
    const cinema = this.quality === "cinema";
    const activeLine = this.findActiveLine(time);
    const readability = activeLine
      ? analyzeKineticReadability({
          lineStart: activeLine.start,
          lineEnd: activeLine.end,
          words: activeLine.words,
        })
      : undefined;
    const echoBudget = readability?.motion.echoScale ?? 1;
    const structuralShape = this.grammar === "shape-build";
    const historySeconds = structuralShape
      ? (cinema ? 24 : 16)
      : (cinema ? 7.5 : 4.5) * (0.48 + echoBudget * 0.52);
    const maxWords = structuralShape
      ? (cinema ? 64 : 40)
      : Math.max(
          8,
          Math.round((cinema ? 42 : 24) * (0.42 + echoBudget * 0.58)),
        );
    const window = deriveTypographySequenceWindow(this.lines, time, {
      historySeconds,
      recentSeconds: Math.min(historySeconds, cinema ? 1.55 : 1.15),
      leadSeconds: 0.12,
      maxWords,
      lineStartIndex: this.phraseStartLine,
      lineEndIndex: this.phraseEndLine,
    });
    const plan = planTypographySequence({
      grammar: this.grammar,
      window,
      width: this.w,
      height: this.h,
    });
    const refs = new Map(window.words.map(word => [word.id, word]));
    const activeIds = new Set<string>();
    const heroPlacement = plan.heroId
      ? plan.words.find(word => word.id === plan.heroId)
      : undefined;
    this.hasFocus = Boolean(heroPlacement);
    this.focusX = heroPlacement
      ? clamp(heroPlacement.x / Math.max(1, this.w * 0.5), -1, 1)
      : 0;
    this.focusY = heroPlacement
      ? clamp(heroPlacement.y / Math.max(1, this.h * 0.5), -1, 1)
      : 0;

    for (const placement of plan.words) {
      const ref = refs.get(placement.id);
      if (!ref) continue;
      activeIds.add(placement.id);

      const entry = this.ensureNode(placement.id, ref.text, placement.treatment);
      const node = entry.node;
      const progress = ref.role === "active"
        ? clamp((time - ref.start) / Math.max(0.04, ref.end - ref.start))
        : 0;
      const focusPulse = ref.role === "active" ? Math.sin(progress * Math.PI) : 0;
      const activeLift = 1 + focusPulse * 0.055 * this.intensity + audio.bass * 0.018 * this.intensity;
      const maxWidthRatio = this.grammar === "shape-build"
        ? 0.34
        : this.grammar === "ribbon-path"
          ? 0.46
          : placement.id === plan.heroId
            ? (this.grammar === "hero-echo" ? 0.62 : 0.72)
            : 0.72;
      const structuralGeometry = this.grammar === "shape-build"
        || this.grammar === "ribbon-path";
      const travelScale = structuralGeometry
        ? 1
        : readability
          ? 0.7 + readability.motion.travelScale * 0.3
          : 1;
      const rotationScale = readability?.motion.rotationScale ?? 1;
      const scaleExcursion = readability?.motion.scaleExcursion ?? 1;
      const directedScale = 1 + (placement.scale - 1) * scaleExcursion;
      const desiredScale = directedScale * activeLift;
      const baseWidth = Math.max(1, node.width * desiredScale);
      const baseHeight = Math.max(1, node.height * desiredScale);
      const cos = Math.abs(Math.cos(placement.rotation));
      const sin = Math.abs(Math.sin(placement.rotation));
      const rotatedWidth = baseWidth * cos + baseHeight * sin;
      const rotatedHeight = baseWidth * sin + baseHeight * cos;
      const maxHeightRatio = this.grammar === "shape-build"
        ? 0.28
        : this.grammar === "ribbon-path"
          ? 0.42
          : 0.72;
      const fitScale = Math.min(
        1,
        (this.w * maxWidthRatio) / rotatedWidth,
        (this.h * maxHeightRatio) / rotatedHeight,
      );
      const finalScale = Math.max(0.08, desiredScale * fitScale);
      const focusLift = structuralGeometry ? 0.005 : 0.012;

      node.position.set(
        this.w * 0.5 + placement.x * travelScale,
        this.h * 0.5
          + placement.y * travelScale
          - focusPulse * this.h * focusLift * this.intensity,
      );
      node.scale.set(finalScale);
      node.rotation = placement.rotation * rotationScale;
      node.alpha = ref.role === "active" || ref.role === "recent"
        ? Math.max(placement.alpha, readability?.motion.alphaFloor ?? 0)
        : placement.alpha;
      node.zIndex = placement.zIndex;
    }

    for (const [id, entry] of this.nodes) {
      if (activeIds.has(id)) continue;
      entry.node.removeFromParent();
      entry.node.destroy();
      this.nodes.delete(id);
    }
  }

  private findActiveLine(time: number) {
    for (
      let index = this.phraseStartLine;
      index <= Math.min(this.phraseEndLine, this.lines.length - 1);
      index++
    ) {
      const line = this.lines[index];
      if (line && time >= line.start && time < line.end) return line;
    }
    return undefined;
  }

  private ensureNode(
    id: string,
    text: string,
    treatment: SequenceTypographyTreatment,
  ) {
    const existing = this.nodes.get(id);
    if (existing) {
      if (existing.treatment !== treatment) {
        existing.treatment = treatment;
        existing.node.style = this.styleFor(treatment);
      }
      return existing;
    }

    const node = new Text({
      text: text.toUpperCase(),
      style: this.styleFor(treatment),
    });
    node.anchor.set(0.5);
    this.container.addChild(node);
    const entry: SequenceNode = { node, treatment };
    this.nodes.set(id, entry);
    return entry;
  }

  private styleFor(treatment: SequenceTypographyTreatment) {
    const textPrimary = this.palette?.textPrimary ?? 0xffffff;
    const textSecondary = this.palette?.textSecondary ?? 0xb8bcc5;
    const background = this.palette?.background ?? 0x050607;

    if (treatment === "outline") {
      return new TextStyle({
        fontFamily: "Arial Black, Impact, Helvetica Neue, Arial, sans-serif",
        fontSize: this.baseFontSize,
        fontWeight: "900",
        fill: background,
        stroke: { color: textSecondary, width: Math.max(1.2, this.baseFontSize * 0.018) },
        align: "center",
        letterSpacing: -2,
      });
    }

    return new TextStyle({
      fontFamily: "Arial Black, Impact, Helvetica Neue, Arial, sans-serif",
      fontSize: this.baseFontSize,
      fontWeight: "900",
      fill: textPrimary,
      align: "center",
      letterSpacing: -2,
    });
  }

  private clear() {
    for (const entry of this.nodes.values()) {
      entry.node.removeFromParent();
      entry.node.destroy();
    }
    this.nodes.clear();
    this.focusX = 0;
    this.focusY = 0;
    this.hasFocus = false;
  }
}
