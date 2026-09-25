import { clamp } from "./math.js";
import type {
  ColorCanvasId,
  ColorCanvasMode,
  ColorHarmonyId,
  ColorHarmonyMode,
  ColorMoodId,
  ColorMoodMode,
  SceneMode,
} from "./types.js";

export interface OklchColor {
  l: number;
  c: number;
  h: number;
}

export interface VisualPalette {
  resolvedHarmony: ColorHarmonyId;
  resolvedMood: ColorMoodId;
  resolvedCanvas: ColorCanvasId;
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
  mood?: ColorMoodMode;
  canvas?: ColorCanvasMode;
  scene: SceneMode;
  lineIndex: number;
  baseHue?: number;
  hueShift?: number;
  allowedHarmonies?: ColorHarmonyId[];
  allowedMoods?: ColorMoodId[];
  allowedCanvases?: ColorCanvasId[];
}

interface MoodProfile {
  hue: number;
  backgroundL: number;
  backgroundC: number;
  surfaceL: number;
  surfaceC: number;
  accentL: number;
  accentC: number;
}

export const COLOR_MOOD_LABELS: Record<ColorMoodId, string> = {
  tender: "Tender",
  heartbreak: "Heartbreak",
  longing: "Longing",
  euphoria: "Euphoria",
  rage: "Rage",
  dream: "Dream",
  tension: "Tension",
  calm: "Calm",
};

const MOOD_PROFILES: Record<ColorMoodId, MoodProfile> = {
  tender: { hue: 342, backgroundL: 0.073, backgroundC: 0.010, surfaceL: 0.15, surfaceC: 0.026, accentL: 0.78, accentC: 0.17 },
  heartbreak: { hue: 258, backgroundL: 0.067, backgroundC: 0.012, surfaceL: 0.14, surfaceC: 0.030, accentL: 0.73, accentC: 0.16 },
  longing: { hue: 304, backgroundL: 0.070, backgroundC: 0.012, surfaceL: 0.145, surfaceC: 0.030, accentL: 0.75, accentC: 0.18 },
  euphoria: { hue: 168, backgroundL: 0.076, backgroundC: 0.010, surfaceL: 0.155, surfaceC: 0.028, accentL: 0.80, accentC: 0.19 },
  rage: { hue: 28, backgroundL: 0.064, backgroundC: 0.008, surfaceL: 0.135, surfaceC: 0.024, accentL: 0.69, accentC: 0.22 },
  dream: { hue: 286, backgroundL: 0.072, backgroundC: 0.012, surfaceL: 0.15, surfaceC: 0.034, accentL: 0.77, accentC: 0.18 },
  tension: { hue: 18, backgroundL: 0.061, backgroundC: 0.006, surfaceL: 0.13, surfaceC: 0.020, accentL: 0.72, accentC: 0.21 },
  calm: { hue: 214, backgroundL: 0.071, backgroundC: 0.010, surfaceL: 0.15, surfaceC: 0.028, accentL: 0.76, accentC: 0.15 },
};

const AUTO_HARMONIES: Record<SceneMode, ColorHarmonyId[]> = {
  poster: ["split-complement", "monochrome", "complement", "triad"],
  neon: ["split-complement", "analogous", "triad", "tetrad"],
  vortex: ["complement", "split-complement", "tetrad", "monochrome"],
};

const AUTO_MOODS: Record<SceneMode, ColorMoodId[]> = {
  poster: ["rage", "heartbreak", "tension", "longing"],
  neon: ["dream", "euphoria", "calm", "tender"],
  vortex: ["tension", "rage", "dream", "longing"],
};

const AUTO_CANVASES: Record<SceneMode, ColorCanvasId[]> = {
  poster: ["paper", "poster", "color-field", "night"],
  neon: ["color-field", "night", "paper", "color-field"],
  vortex: ["night", "color-field", "poster", "night"],
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
  polarity: "light" | "dark" = "light",
) {
  let lightness = desiredL;
  let workingChroma = chroma;
  let color = oklchToHex({ l: lightness, c: workingChroma, h: hue });

  for (let attempt = 0; attempt < 32 && contrastRatio(color, background) < minimum; attempt++) {
    lightness = polarity === "light"
      ? Math.min(0.995, lightness + 0.025)
      : Math.max(0.015, lightness - 0.025);
    workingChroma *= 0.94;
    color = oklchToHex({ l: lightness, c: workingChroma, h: hue });
  }

  if (contrastRatio(color, background) >= minimum) return color;
  const black = 0x050507;
  const white = 0xfafafa;
  return contrastRatio(black, background) >= contrastRatio(white, background) ? black : white;
}

export function resolveColorHarmony(
  harmony: ColorHarmonyMode,
  scene: SceneMode,
  lineIndex: number,
  allowed?: readonly ColorHarmonyId[],
): ColorHarmonyId {
  if (harmony !== "auto") return harmony;
  const preferred = AUTO_HARMONIES[scene];
  const options = allowed?.length
    ? preferred.filter(value => allowed.includes(value))
    : preferred;
  const source = options.length ? options : allowed?.length ? allowed : preferred;
  const safeLine = Math.max(0, lineIndex);
  return source[safeLine % source.length];
}

export function resolveColorMood(
  mood: ColorMoodMode = "auto",
  scene: SceneMode,
  lineIndex: number,
  allowed?: readonly ColorMoodId[],
): ColorMoodId {
  if (mood !== "auto") return mood;
  const preferred = AUTO_MOODS[scene];
  const options = allowed?.length
    ? preferred.filter(value => allowed.includes(value))
    : preferred;
  const source = options.length ? options : allowed?.length ? allowed : preferred;
  const safeLine = Math.max(0, lineIndex);
  return source[safeLine % source.length];
}

export function resolveColorCanvas(
  canvas: ColorCanvasMode = "auto",
  scene: SceneMode,
  lineIndex: number,
  allowed?: readonly ColorCanvasId[],
): ColorCanvasId {
  if (canvas !== "auto") return canvas;
  const preferred = AUTO_CANVASES[scene];
  const options = allowed?.length
    ? preferred.filter(value => allowed.includes(value))
    : preferred;
  const source = options.length ? options : allowed?.length ? allowed : preferred;
  const safeLine = Math.max(0, lineIndex);
  const chapter = Math.floor(safeLine / 3);
  return source[chapter % source.length];
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
  const resolvedHarmony = resolveColorHarmony(
    input.harmony,
    input.scene,
    input.lineIndex,
    input.allowedHarmonies,
  );
  const resolvedMood = resolveColorMood(
    input.mood,
    input.scene,
    input.lineIndex,
    input.allowedMoods,
  );
  const resolvedCanvas = resolveColorCanvas(
    input.canvas,
    input.scene,
    input.lineIndex,
    input.allowedCanvases,
  );
  const profile = MOOD_PROFILES[resolvedMood];
  const cueDrift = input.mood && input.mood !== "auto"
    ? ((Math.max(0, input.lineIndex) % 3) - 1) * 2
    : ((Math.max(0, input.lineIndex) % 5) - 2) * 4;
  const baseHue = normalizeHue((input.baseHue ?? profile.hue) + cueDrift + (input.hueShift ?? 0));
  const [rawA, rawB] = harmonyHues(baseHue, resolvedHarmony);
  const accentAHue = normalizeHue(rawA);
  const accentBHue = normalizeHue(rawB);

  const accentA = oklchToHex({
    l: resolvedHarmony === "monochrome" ? Math.max(0.68, profile.accentL - 0.03) : profile.accentL,
    c: resolvedHarmony === "monochrome" ? 0.075 : profile.accentC,
    h: accentAHue,
  });
  const accentB = oklchToHex({
    l: resolvedHarmony === "monochrome" ? 0.60 : Math.max(0.62, profile.accentL - 0.07),
    c: resolvedHarmony === "monochrome" ? 0.055 : Math.max(0.12, profile.accentC - 0.025),
    h: accentBHue,
  });
  const glow = oklchToHex({
    l: Math.max(0.78, profile.accentL + 0.04),
    c: resolvedHarmony === "monochrome" ? 0.08 : Math.max(0.13, profile.accentC - 0.02),
    h: accentAHue,
  });

  let background: number;
  let surface: number;
  let textPolarity: "light" | "dark";
  let primaryL: number;
  let secondaryL: number;
  let mutedL: number;
  let textChroma: number;

  if (resolvedCanvas === "paper") {
    background = oklchToHex({ l: 0.93, c: 0.026, h: baseHue });
    surface = oklchToHex({ l: 0.84, c: 0.048, h: accentAHue });
    textPolarity = "dark";
    primaryL = 0.16;
    secondaryL = 0.29;
    mutedL = 0.40;
    textChroma = 0.075;
  } else if (resolvedCanvas === "poster") {
    background = oklchToHex({ l: 0.76, c: Math.min(0.15, profile.accentC * 0.82), h: baseHue });
    surface = oklchToHex({ l: 0.66, c: Math.min(0.17, profile.accentC), h: accentAHue });
    textPolarity = "dark";
    primaryL = 0.12;
    secondaryL = 0.25;
    mutedL = 0.36;
    textChroma = 0.085;
  } else if (resolvedCanvas === "color-field") {
    background = oklchToHex({ l: 0.235, c: Math.min(0.105, Math.max(0.065, profile.accentC * 0.52)), h: baseHue });
    surface = oklchToHex({ l: 0.34, c: Math.min(0.13, profile.accentC * 0.72), h: accentAHue });
    textPolarity = "light";
    primaryL = 0.965;
    secondaryL = 0.82;
    mutedL = 0.66;
    textChroma = 0.045;
  } else {
    background = oklchToHex({
      l: profile.backgroundL,
      c: Math.min(profile.backgroundC, resolvedHarmony === "monochrome" ? 0.010 : 0.014),
      h: baseHue,
    });
    surface = oklchToHex({
      l: profile.surfaceL,
      c: Math.min(profile.surfaceC, 0.035),
      h: baseHue,
    });
    textPolarity = "light";
    primaryL = 0.965;
    secondaryL = 0.80;
    mutedL = 0.59;
    textChroma = 0.025;
  }

  const textHue = resolvedHarmony === "monochrome" ? baseHue : accentBHue;
  const textPrimary = foregroundForContrast(background, textHue, primaryL, textChroma, 7, textPolarity);
  const textSecondary = foregroundForContrast(background, textHue, secondaryL, textChroma * 0.78, 4.5, textPolarity);
  const muted = foregroundForContrast(background, baseHue, mutedL, textChroma * 0.55, 3, textPolarity);

  return {
    resolvedHarmony,
    resolvedMood,
    resolvedCanvas,
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
