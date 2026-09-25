import {
  oklchToHex,
  relativeLuminance,
} from "./colorHarmony.js";
import type { VisualPalette } from "./colorHarmony.js";
import { clamp } from "./math.js";

export type WorldTextPolarity = "light" | "dark";

export interface WorldColorContext {
  representativeColor: number;
  representativeHue: number;
  representativeLuminance: number;
  titleSafeLuminance: number;
  highlightRisk: number;
  chromaPressure: number;
  busyness: number;
  recommendedPolarity: WorldTextPolarity;
  outlineStrength: number;
}

export interface WorldColorContextInput {
  palette: VisualPalette;
  representativeColor?: number;
  representativeHue?: number;
  titleSafeLuminance?: number;
  highlightRisk?: number;
  chromaPressure?: number;
  busyness?: number;
  previousPolarity?: WorldTextPolarity;
}

export interface WorldTypographyTreatment {
  polarity: WorldTextPolarity;
  primary: number;
  secondary: number;
  muted: number;
  accent: number;
  supportColor: number;
  supportStrength: number;
  supportLevel: 0 | 1 | 2 | 3;
  primaryContrast: number;
  secondaryContrast: number;
  mutedContrast: number;
}

const LIGHT_TEXT = 0xfafafa;
const DARK_TEXT = 0x050507;
const POLARITY_SWITCH_MARGIN = 0.7;

export function contrastRatioForLuminance(foreground: number, backgroundLuminance: number) {
  const foregroundLuminance = relativeLuminance(foreground);
  const background = clamp(backgroundLuminance);
  const light = Math.max(foregroundLuminance, background);
  const dark = Math.min(foregroundLuminance, background);
  return (light + 0.05) / (dark + 0.05);
}

export function chooseWorldTextPolarity(
  titleSafeLuminance: number,
  previousPolarity?: WorldTextPolarity,
): WorldTextPolarity {
  const luminance = clamp(titleSafeLuminance);
  const lightContrast = contrastRatioForLuminance(LIGHT_TEXT, luminance);
  const darkContrast = contrastRatioForLuminance(DARK_TEXT, luminance);

  if (!previousPolarity) return lightContrast >= darkContrast ? "light" : "dark";

  if (
    previousPolarity === "light"
    && darkContrast > lightContrast + POLARITY_SWITCH_MARGIN
  ) return "dark";

  if (
    previousPolarity === "dark"
    && lightContrast > darkContrast + POLARITY_SWITCH_MARGIN
  ) return "light";

  return previousPolarity;
}

export function createWorldColorContext(input: WorldColorContextInput): WorldColorContext {
  const representativeColor = input.representativeColor ?? input.palette.background;
  const representativeLuminance = relativeLuminance(representativeColor);
  const titleSafeLuminance = clamp(input.titleSafeLuminance ?? representativeLuminance);
  const highlightRisk = clamp(input.highlightRisk ?? 0);
  const chromaPressure = clamp(input.chromaPressure ?? 0);
  const busyness = clamp(input.busyness ?? 0);
  const recommendedPolarity = chooseWorldTextPolarity(
    titleSafeLuminance,
    input.previousPolarity,
  );

  const bestSolidContrast = Math.max(
    contrastRatioForLuminance(LIGHT_TEXT, titleSafeLuminance),
    contrastRatioForLuminance(DARK_TEXT, titleSafeLuminance),
  );
  const contrastDeficit = clamp((7 - bestSolidContrast) / 7);
  const outlineStrength = clamp(Math.max(
    contrastDeficit,
    highlightRisk * 0.72,
    busyness * 0.58,
  ));

  return {
    representativeColor,
    representativeHue: ((input.representativeHue ?? input.palette.baseHue) % 360 + 360) % 360,
    representativeLuminance,
    titleSafeLuminance,
    highlightRisk,
    chromaPressure,
    busyness,
    recommendedPolarity,
    outlineStrength,
  };
}

function bestWorldTextColor(
  base: number,
  context: WorldColorContext,
  targetContrast: number,
  hue: number,
) {
  const polarity = context.recommendedPolarity;
  const tintedExtreme = oklchToHex({
    l: polarity === "light" ? 0.97 : 0.055,
    c: 0.018 + (1 - context.chromaPressure) * 0.018,
    h: hue,
  });
  const absoluteExtreme = polarity === "light" ? LIGHT_TEXT : DARK_TEXT;

  const candidates = [base, tintedExtreme, absoluteExtreme];
  let best = candidates[0];
  let bestContrast = contrastRatioForLuminance(best, context.titleSafeLuminance);

  for (let index = 1; index < candidates.length; index++) {
    const candidate = candidates[index];
    const contrast = contrastRatioForLuminance(candidate, context.titleSafeLuminance);
    if (contrast > bestContrast) {
      best = candidate;
      bestContrast = contrast;
    }
  }

  if (contrastRatioForLuminance(base, context.titleSafeLuminance) >= targetContrast) {
    return base;
  }
  return best;
}

export function resolveWorldTypographyTreatment(
  palette: VisualPalette,
  context: WorldColorContext,
): WorldTypographyTreatment {
  const primary = bestWorldTextColor(
    palette.textPrimary,
    context,
    7,
    palette.accentBHue,
  );
  const secondary = bestWorldTextColor(
    palette.textSecondary,
    context,
    4.5,
    palette.accentBHue,
  );
  const muted = bestWorldTextColor(
    palette.muted,
    context,
    3,
    palette.baseHue,
  );

  const accentBase = contrastRatioForLuminance(
    palette.accentA,
    context.titleSafeLuminance,
  ) >= contrastRatioForLuminance(
    palette.accentB,
    context.titleSafeLuminance,
  )
    ? palette.accentA
    : palette.accentB;
  const accent = bestWorldTextColor(
    accentBase,
    context,
    3,
    palette.accentAHue,
  );

  const primaryContrast = contrastRatioForLuminance(
    primary,
    context.titleSafeLuminance,
  );
  const secondaryContrast = contrastRatioForLuminance(
    secondary,
    context.titleSafeLuminance,
  );
  const mutedContrast = contrastRatioForLuminance(
    muted,
    context.titleSafeLuminance,
  );

  // Mid-tone worlds can make a literal 7:1 solid fill mathematically impossible.
  // In that case support is structural: an opposite-polarity glyph outline creates
  // a stable local contrast boundary instead of flickering the fill between black
  // and white every frame.
  const contrastSupport = Math.max(
    clamp((7 - primaryContrast) / 7),
    clamp((4.5 - secondaryContrast) / 4.5),
    clamp((3 - mutedContrast) / 3),
  );
  const supportStrength = clamp(Math.max(
    context.outlineStrength,
    contrastSupport,
  ));
  const supportLevel: 0 | 1 | 2 | 3 = supportStrength < 0.16
    ? 0
    : supportStrength < 0.40
      ? 1
      : supportStrength < 0.68
        ? 2
        : 3;

  return {
    polarity: context.recommendedPolarity,
    primary,
    secondary,
    muted,
    accent,
    supportColor: context.recommendedPolarity === "light" ? DARK_TEXT : LIGHT_TEXT,
    supportStrength,
    supportLevel,
    primaryContrast,
    secondaryContrast,
    mutedContrast,
  };
}
