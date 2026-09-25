import { relativeLuminance } from "./colorHarmony.js";
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
