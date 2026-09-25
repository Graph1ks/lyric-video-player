import { clamp } from "./math.js";
import type {
  ColorHarmonyId,
  ColorHarmonyMode,
  SceneMode,
} from "./types.js";

export interface OklchColor {
  l: number;
  c: number;
  h: number;
}

export interface VisualPalette {
  resolvedHarmony: ColorHarmonyId;
  baseHue: number;
  accentAHue: number;
  accentBHue: number;
  background: number;
  surface: number;
  textPrimary: number;
  textSecondary: number;
  accentA: number;
  accentB: number;
  glow: number;
  muted: number;
  primaryContrast: number;
  secondaryContrast: number;
}

export interface VisualPaletteInput {
  harmony: ColorHarmonyMode;
  scene: SceneMode;
  lineIndex: number;
  baseHue?: number;
}

const AUTO_HARMONIES: Record<SceneMode, ColorHarmonyId[]> = {
  poster: ["split-complement", "monochrome", "complement", "triad"],
  neon: ["split-complement", "analogous", "triad", "tetrad"],
  vortex: ["complement", "split-complement", "tetrad", "monochrome"],
};

function normalizeHue(value: number) {
  return ((value % 360) + 360) % 360;
}

function srgbEncode(value: number) {
  return value <= 0.0031308
    ? 12.92 * value
    : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
}

function oklchToLinearRgb(color: OklchColor) {
  const hue = normalizeHue(color.h) * Math.PI / 180;
  const a = color.c * Math.cos(hue);
  const b = color.c * Math.sin(hue);

  const lRoot = color.l + 0.3963377774 * a + 0.2158037573 * b;
  const mRoot = color.l - 0.1055613458 * a - 0.0638541728 * b;
  const sRoot = color.l - 0.0894841775 * a - 1.291485548 * b;

  const l = lRoot * lRoot * lRoot;
  const m = mRoot * mRoot * mRoot;
  const s = sRoot * sRoot * sRoot;

  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ] as const;
}

function inSrgbGamut(rgb: readonly number[]) {
  return rgb.every(channel => channel >= 0 && channel <= 1);
}

export function oklchToRgb(color: OklchColor) {
  const lightness = clamp(color.l);
  let chroma = Math.max(0, color.c);
  let linear = oklchToLinearRgb({ l: lightness, c: chroma, h: color.h });

  for (let attempt = 0; attempt < 18 && !inSrgbGamut(linear); attempt++) {
    chroma *= 0.88;
    linear = oklchToLinearRgb({ l: lightness, c: chroma, h: color.h });
  }

  return linear.map(channel => clamp(srgbEncode(clamp(channel)))) as [number, number, number];
}

export function oklchToHex(color: OklchColor) {
  const [r, g, b] = oklchToRgb(color).map(channel => Math.round(clamp(channel) * 255));
  return (r << 16) | (g << 8) | b;
}

function hexChannels(hex: number) {
  return [
    ((hex >> 16) & 255) / 255,
    ((hex >> 8) & 255) / 255,
    (hex & 255) / 255,
  ] as const;
}

function srgbToLinear(value: number) {
  return value <= 0.04045
    ? value / 12.92
    : Math.pow((value + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: number) {
  const [r, g, b] = hexChannels(hex).map(srgbToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(foreground: number, background: number) {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const light = Math.max(a, b);
  const dark = Math.min(a, b);
  return (light + 0.05) / (dark + 0.05);
}

function foregroundForContrast(
  background: number,
  hue: number,
  desiredL: number,
  chroma: number,
  minimum: number,
) {
  let lightness = desiredL;
  let color = oklchToHex({ l: lightness, c: chroma, h: hue });
  while (contrastRatio(color, background) < minimum && lightness < 0.995) {
    lightness = Math.min(0.995, lightness + 0.025);
    color = oklchToHex({ l: lightness, c: chroma * 0.9, h: hue });
    chroma *= 0.9;
  }
  return color;
}

export function resolveColorHarmony(
  harmony: ColorHarmonyMode,
  scene: SceneMode,
  lineIndex: number,
): ColorHarmonyId {
  if (harmony !== "auto") return harmony;
  const options = AUTO_HARMONIES[scene];
  const safeLine = Math.max(0, lineIndex);
  return options[safeLine % options.length];
}

function harmonyHues(baseHue: number, harmony: ColorHarmonyId) {
  if (harmony === "analogous") return [baseHue - 32, baseHue + 32] as const;
  if (harmony === "complement") return [baseHue + 180, baseHue + 8] as const;
  if (harmony === "triad") return [baseHue + 120, baseHue + 240] as const;
  if (harmony === "tetrad") return [baseHue + 90, baseHue + 180] as const;
  if (harmony === "monochrome") return [baseHue, baseHue] as const;
  return [baseHue + 150, baseHue + 210] as const;
}

export function createVisualPalette(input: VisualPaletteInput): VisualPalette {
  const resolvedHarmony = resolveColorHarmony(input.harmony, input.scene, input.lineIndex);
  const sceneBase = input.scene === "poster" ? 14 : input.scene === "neon" ? 198 : 350;
  const cueDrift = ((Math.max(0, input.lineIndex) % 5) - 2) * 6;
  const baseHue = normalizeHue(input.baseHue ?? sceneBase + cueDrift);
  const [rawA, rawB] = harmonyHues(baseHue, resolvedHarmony);
  const accentAHue = normalizeHue(rawA);
  const accentBHue = normalizeHue(rawB);

  const background = oklchToHex({
    l: input.scene === "poster" ? 0.095 : 0.075,
    c: resolvedHarmony === "monochrome" ? 0.025 : 0.04,
    h: baseHue,
  });
  const surface = oklchToHex({
    l: 0.155,
    c: resolvedHarmony === "monochrome" ? 0.035 : 0.055,
    h: baseHue,
  });

  const accentA = oklchToHex({
    l: resolvedHarmony === "monochrome" ? 0.72 : 0.74,
    c: resolvedHarmony === "monochrome" ? 0.08 : 0.2,
    h: accentAHue,
  });
  const accentB = oklchToHex({
    l: resolvedHarmony === "monochrome" ? 0.58 : 0.68,
    c: resolvedHarmony === "monochrome" ? 0.055 : 0.18,
    h: accentBHue,
  });
  const glow = oklchToHex({
    l: 0.8,
    c: resolvedHarmony === "monochrome" ? 0.09 : 0.18,
    h: accentAHue,
  });

  const textPrimary = foregroundForContrast(background, baseHue, 0.965, 0.018, 7);
  const textSecondary = foregroundForContrast(background, baseHue, 0.78, 0.03, 4.5);
  const muted = foregroundForContrast(background, baseHue, 0.58, 0.025, 3);

  return {
    resolvedHarmony,
    baseHue,
    accentAHue,
    accentBHue,
    background,
    surface,
    textPrimary,
    textSecondary,
    accentA,
    accentB,
    glow,
    muted,
    primaryContrast: contrastRatio(textPrimary, background),
    secondaryContrast: contrastRatio(textSecondary, background),
  };
}

export function hexColorToCss(hex: number) {
  return `#${Math.max(0, Math.min(0xffffff, Math.round(hex))).toString(16).padStart(6, "0")}`;
}
