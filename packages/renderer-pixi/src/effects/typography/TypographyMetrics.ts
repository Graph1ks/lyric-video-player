import { CanvasTextMetrics, type TextStyle } from "pixi.js";
import type { TypographySpatialMetrics } from "@graph1ks/emo-engine-core";

const CACHE_LIMIT = 2048;
const cache = new Map<string, TypographySpatialMetrics>();
let metricsCanvas: HTMLCanvasElement | undefined;

export function measureTypographyText(
  text: string,
  style: TextStyle,
  extraPadding = 0,
): TypographySpatialMetrics {
  const normalized = text || " ";
  const key = [
    normalized,
    String(style.fontFamily),
    String(style.fontSize),
    String(style.fontWeight),
    String(style.fontStyle),
    String(style.letterSpacing),
    strokeWidth(style),
    extraPadding,
  ].join("|");

  const cached = cache.get(key);
  if (cached) return cached;

  const measured = CanvasTextMetrics.measureText(normalized, style);
  const font = measured.fontProperties;
  const letterSpacing = numeric(style.letterSpacing);
  const graphemeCount = Math.max(1, [...normalized].length);
  const spacingWidth = Math.max(0, graphemeCount - 1) * letterSpacing;
  const stroke = strokeWidth(style);
  const padding = Math.max(0, stroke * 0.5 + extraPadding);
  const native = measureNativeInk(normalized, style);

  // Pixi's block metrics match its layout model; Canvas actualBoundingBox*
  // catches glyph ink that can spill beyond advance width / nominal font size.
  // Use the larger envelope so collision geometry is conservative.
  const advanceWidth = Math.max(
    1,
    measured.maxLineWidth + spacingWidth,
    native?.advanceWidth ?? 0,
  );
  const inkWidth = native
    ? native.left + native.right + spacingWidth
    : 0;
  const ascent = Math.max(
    1,
    font.ascent,
    native?.ascent ?? 0,
  );
  const descent = Math.max(
    0,
    font.descent,
    native?.descent ?? 0,
  );
  const inkHeight = native ? native.ascent + native.descent : 0;

  const result: TypographySpatialMetrics = {
    width: Math.max(1, measured.width + spacingWidth, inkWidth, advanceWidth),
    height: Math.max(1, measured.height, inkHeight),
    advanceWidth,
    lineHeight: Math.max(1, measured.lineHeight, ascent + descent),
    ascent,
    descent,
    padding,
  };

  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, result);
  return result;
}

export function clearTypographyMetricsCache() {
  cache.clear();
}

function measureNativeInk(text: string, style: TextStyle) {
  if (typeof document === "undefined") return undefined;
  metricsCanvas ??= document.createElement("canvas");
  const context = metricsCanvas.getContext("2d");
  if (!context) return undefined;

  const fontSize = Math.max(1, numeric(style.fontSize) || 16);
  const family = fontFamilyCss(style.fontFamily);
  const fontStyle = String(style.fontStyle || "normal");
  const fontWeight = String(style.fontWeight || "normal");
  context.font = `${fontStyle} ${fontWeight} ${fontSize}px ${family}`;
  context.textBaseline = "alphabetic";

  const metrics = context.measureText(text);
  return {
    advanceWidth: Math.max(0, metrics.width),
    left: Math.max(0, metrics.actualBoundingBoxLeft || 0),
    right: Math.max(0, metrics.actualBoundingBoxRight || metrics.width || 0),
    ascent: Math.max(0, metrics.actualBoundingBoxAscent || fontSize * 0.78),
    descent: Math.max(0, metrics.actualBoundingBoxDescent || fontSize * 0.22),
  };
}

function fontFamilyCss(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(item => quoteFamily(String(item))).join(", ");
  }
  return String(value || "sans-serif");
}

function quoteFamily(value: string) {
  if (
    value.includes(" ")
    && !value.startsWith("\"")
    && !value.startsWith("'")
  ) {
    return `"${value.replaceAll('"', '\\"')}"`;
  }
  return value;
}

function numeric(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function strokeWidth(style: TextStyle) {
  const stroke = style.stroke as unknown;
  if (stroke && typeof stroke === "object" && "width" in stroke) {
    const width = (stroke as { width?: unknown }).width;
    return numeric(width);
  }
  return 0;
}
