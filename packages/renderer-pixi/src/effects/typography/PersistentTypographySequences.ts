import { Container, Text, TextStyle } from "pixi.js";
import type { AudioBands } from "@graph1ks/emo-audio-web";
import {
  analyzeKineticReadability,
  buildManifestoPageLayout,
  buildShapeFillLayout,
  clamp,
  deriveTypographySequenceWindow,
  planTypographySequence,
  shapeFillVariantForScope,
  type LineCue,
  spatialBoxFor,
  spatialEnvelope,
  type QualityMode,
  type SequenceTypographyTreatment,
  type TypographySequenceGrammarId,
  type TypographyPackingSlot,
  type TypographySpatialMetrics,
  type VisualPalette,
  type WorldTypographyTreatment,
} from "@graph1ks/emo-engine-core";
import { measureTypographyText } from "./TypographyMetrics.js";

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
  private worldTreatment?: WorldTypographyTreatment;
  private quality: QualityMode = "cinema";
  private intensity = 1;
  private w = 1;
  private h = 1;
  private baseFontSize = 84;
  private scopeMetrics = new Map<string, TypographySpatialMetrics>();
  private staticLayout?: Map<string, TypographyPackingSlot>;
  private staticLayoutKey = "";
  private framingCenterX = 0;
  private framingCenterY = 0;
  private framingScale = 1;
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

  getCameraFraming() {
    return {
      center: {
        x: this.framingCenterX,
        y: this.framingCenterY,
      },
      fitScale: this.framingScale,
    };
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


  setWorldTypographyTreatment(treatment?: WorldTypographyTreatment) {
    const previous = this.worldTreatment;
    if (
      previous?.polarity === treatment?.polarity
      && previous?.primary === treatment?.primary
      && previous?.secondary === treatment?.secondary
      && previous?.muted === treatment?.muted
      && previous?.accent === treatment?.accent
      && previous?.supportColor === treatment?.supportColor
      && previous?.supportLevel === treatment?.supportLevel
    ) return;

    this.worldTreatment = treatment;
    for (const entry of this.nodes.values()) {
      entry.node.style = this.styleFor(entry.treatment);
      entry.node.tint = 0xffffff;
    }

    // Stroke/support width changes measured extents. Invalidate cached phrase
    // geometry once per discrete treatment change, never on every animation frame.
    this.scopeMetrics.clear();
    this.staticLayout = undefined;
    this.staticLayoutKey = "";
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
    this.scopeMetrics.clear();
    this.staticLayout = undefined;
    this.staticLayoutKey = "";
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
    const structuralShape = this.grammar === "shape-fill" || this.grammar === "shape-build";
    const architecturalWall = this.grammar === "manifesto-wall";
    const persistentStructure = structuralShape || architecturalWall;
    const historySeconds = persistentStructure
      ? 3600
      : (cinema ? 7.5 : 4.5) * (0.48 + echoBudget * 0.52);
    const phraseWordCount = this.lines
      .slice(
        this.phraseStartLine,
        Math.min(this.lines.length, this.phraseEndLine + 1),
      )
      .reduce((sum, line) => sum + line.words.length, 0);
    const maxWords = persistentStructure
      ? Math.max(1, phraseWordCount)
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
    const metricsById: Record<string, TypographySpatialMetrics> = {};
    const solidMetricStyle = this.styleFor("solid");
    const outlineMetricStyle = persistentStructure
      ? undefined
      : this.styleFor("outline");
    for (const scopeWord of window.scopeWords) {
      let metrics = this.scopeMetrics.get(scopeWord.id);
      if (!metrics) {
        const solid = measureTypographyText(
          scopeWord.text.toUpperCase(),
          solidMetricStyle,
          Math.max(2, this.baseFontSize * 0.035),
        );
        if (outlineMetricStyle) {
          const outline = measureTypographyText(
            scopeWord.text.toUpperCase(),
            outlineMetricStyle,
            Math.max(2, this.baseFontSize * 0.035),
          );
          metrics = {
            width: Math.max(solid.width, outline.width),
            height: Math.max(solid.height, outline.height),
            advanceWidth: Math.max(solid.advanceWidth, outline.advanceWidth),
            lineHeight: Math.max(solid.lineHeight, outline.lineHeight),
            ascent: Math.max(solid.ascent, outline.ascent),
            descent: Math.max(solid.descent, outline.descent),
            padding: Math.max(solid.padding, outline.padding),
          };
        } else {
          metrics = solid;
        }
        this.scopeMetrics.set(scopeWord.id, metrics);
      }
      metricsById[scopeWord.id] = metrics;
    }

    let staticLayout: Map<string, TypographyPackingSlot> | undefined;
    if (persistentStructure) {
      const layoutKey = [
        this.grammar,
        this.phraseStartLine,
        this.phraseEndLine,
        Math.round(this.w),
        Math.round(this.h),
        Math.round(this.baseFontSize * 100),
        window.scopeWords.length,
      ].join(":");

      if (!this.staticLayout || this.staticLayoutKey !== layoutKey) {
        this.staticLayout = architecturalWall
          ? buildManifestoPageLayout(
              window.scopeWords,
              metricsById,
              this.w,
              this.h,
            )
          : buildShapeFillLayout(
              shapeFillVariantForScope(window.scopeStartLineIndex),
              window.scopeWords,
              metricsById,
              this.w,
              this.h,
            );
        this.staticLayoutKey = layoutKey;
      }
      staticLayout = this.staticLayout;
    } else if (this.staticLayout) {
      this.staticLayout = undefined;
      this.staticLayoutKey = "";
    }

    const plan = planTypographySequence({
      grammar: this.grammar,
      window,
      width: this.w,
      height: this.h,
      metricsById,
      staticLayout,
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

    const framingBoxes = [];
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
      const structuralGeometry = structuralShape
        || architecturalWall
        || this.grammar === "ribbon-path";
      const activeLift = architecturalWall
        ? 1
        : structuralShape
          ? 1 + focusPulse * 0.012 * this.intensity
          : 1 + focusPulse * 0.055 * this.intensity + audio.bass * 0.018 * this.intensity;
      const maxWidthRatio = structuralShape
        ? 0.72
        : architecturalWall
          ? 0.82
          : this.grammar === "ribbon-path"
            ? 0.46
            : placement.id === plan.heroId
              ? (this.grammar === "hero-echo" ? 0.62 : 0.72)
              : 0.72;
      const travelScale = structuralGeometry
        ? 1
        : readability
          ? 0.7 + readability.motion.travelScale * 0.3
          : 1;
      const rotationScale = structuralGeometry
        ? 1
        : readability?.motion.rotationScale ?? 1;
      const scaleExcursion = structuralGeometry
        ? 1
        : readability?.motion.scaleExcursion ?? 1;
      const directedScale = 1 + (placement.scale - 1) * scaleExcursion;
      const desiredScale = directedScale * activeLift;
      const localBounds = node.getLocalBounds();
      const baseWidth = Math.max(1, localBounds.width * desiredScale);
      const baseHeight = Math.max(1, localBounds.height * desiredScale);
      const cos = Math.abs(Math.cos(placement.rotation));
      const sin = Math.abs(Math.sin(placement.rotation));
      const rotatedWidth = baseWidth * cos + baseHeight * sin;
      const rotatedHeight = baseWidth * sin + baseHeight * cos;
      const maxHeightRatio = structuralShape
        ? 0.72
        : architecturalWall
          ? 0.72
          : this.grammar === "ribbon-path"
            ? 0.42
            : 0.72;
      const targetWidth = placement.maxWidth ?? this.w * maxWidthRatio;
      const targetHeight = placement.maxHeight ?? this.h * maxHeightRatio;
      const rawFitScale = Math.min(
        targetWidth / rotatedWidth,
        targetHeight / rotatedHeight,
      );
      const fitScale = placement.maxWidth && placement.maxHeight
        ? clamp(rawFitScale, 0.08, 3.6)
        : Math.min(1, rawFitScale);
      const finalScale = Math.max(0.08, desiredScale * fitScale);
      const focusLift = structuralGeometry ? 0 : 0.012;

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

      const metrics = metricsById[placement.id];
      if (metrics && placement.role !== "incoming") {
        framingBoxes.push(spatialBoxFor(metrics, {
          x: placement.x * travelScale,
          y: placement.y * travelScale - focusPulse * this.h * focusLift * this.intensity,
          scale: finalScale,
          rotation: node.rotation,
        }));
      }
    }

    const envelope = spatialEnvelope(framingBoxes);
    if (framingBoxes.length) {
      this.framingCenterX = clamp(envelope.cx / Math.max(1, this.w * 0.5), -0.9, 0.9);
      this.framingCenterY = clamp(envelope.cy / Math.max(1, this.h * 0.5), -0.86, 0.86);
      this.framingScale = clamp(Math.min(
        this.w * 0.88 / Math.max(1, envelope.width),
        this.h * 0.8 / Math.max(1, envelope.height),
      ), 0.78, 1.18);
    } else {
      this.framingCenterX = 0;
      this.framingCenterY = 0;
      this.framingScale = 1;
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
      resolution: textTextureResolution(),
    });
    node.anchor.set(0.5);
    this.container.addChild(node);
    const entry: SequenceNode = { node, treatment };
    this.nodes.set(id, entry);
    return entry;
  }

  private styleFor(treatment: SequenceTypographyTreatment) {
    const world = this.worldTreatment;
    const textPrimary = world?.primary ?? this.palette?.textPrimary ?? 0xffffff;
    const textSecondary = world?.secondary ?? this.palette?.textSecondary ?? 0xb8bcc5;
    const background = world?.supportColor ?? this.palette?.background ?? 0x050607;
    const supportWidths = [
      0,
      Math.max(1.0, this.baseFontSize * 0.010),
      Math.max(1.7, this.baseFontSize * 0.018),
      Math.max(2.5, this.baseFontSize * 0.028),
    ];
    const supportWidth = world ? supportWidths[world.supportLevel] : 0;

    if (treatment === "outline") {
      return new TextStyle({
        fontFamily: "Arial Black, Impact, Helvetica Neue, Arial, sans-serif",
        fontSize: this.baseFontSize,
        fontWeight: "900",
        fill: background,
        stroke: {
          color: textSecondary,
          width: Math.max(
            1.2,
            this.baseFontSize * 0.018,
            supportWidth,
          ),
        },
        align: "center",
        letterSpacing: -2,
      });
    }

    return new TextStyle({
      fontFamily: "Arial Black, Impact, Helvetica Neue, Arial, sans-serif",
      fontSize: this.baseFontSize,
      fontWeight: "900",
      fill: textPrimary,
      stroke: world?.supportLevel
        ? { color: world.supportColor, width: supportWidth }
        : { color: textPrimary, width: 0 },
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
    this.scopeMetrics.clear();
    this.staticLayout = undefined;
    this.staticLayoutKey = "";
    this.framingCenterX = 0;
    this.framingCenterY = 0;
    this.framingScale = 1;
    this.focusX = 0;
    this.focusY = 0;
    this.hasFocus = false;
  }
}


function textTextureResolution() {
  const dpr = typeof devicePixelRatio === "number" ? devicePixelRatio : 1;
  return Math.max(3, Math.min(4, dpr * 2));
}
