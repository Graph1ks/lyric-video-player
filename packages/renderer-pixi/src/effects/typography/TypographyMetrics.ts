import { CanvasTextMetrics, type TextStyle } from "pixi.js";
import type { TypographySpatialMetrics } from "@graph1ks/emo-engine-core";

const CACHE_LIMIT = 2048;
const cache = new Map<string, TypographySpatialMetrics>();

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
  const width = Math.max(1, measured.width + spacingWidth);
  const height = Math.max(1, measured.height);
  const result: TypographySpatialMetrics = {
    width,
    height,
    advanceWidth: Math.max(1, measured.maxLineWidth + spacingWidth),
    lineHeight: Math.max(1, measured.lineHeight),
    ascent: Math.max(1, font.ascent),
    descent: Math.max(0, font.descent),
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
