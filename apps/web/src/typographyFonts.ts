export type TypographyFontId =
  | "inter"
  | "space-grotesk"
  | "oswald"
  | "playfair"
  | "ibm-plex-mono"
  | "caveat"
  | "bangers";

export type TypographyFontCategory =
  | "sans"
  | "display"
  | "condensed"
  | "serif"
  | "mono"
  | "handwritten"
  | "graphic";

export interface TypographyFontProfile {
  id: TypographyFontId;
  label: string;
  category: TypographyFontCategory;
  family: string;
  weight: "400" | "700" | "800" | "900";
}

export const TYPOGRAPHY_FONTS: TypographyFontProfile[] = [
  { id: "inter", label: "Inter", category: "sans", family: '"Inter Variable", Inter, sans-serif', weight: "800" },
  { id: "space-grotesk", label: "Space Grotesk", category: "display", family: '"Space Grotesk Variable", "Space Grotesk", sans-serif', weight: "700" },
  { id: "oswald", label: "Oswald", category: "condensed", family: '"Oswald Variable", Oswald, sans-serif', weight: "700" },
  { id: "playfair", label: "Playfair Display", category: "serif", family: '"Playfair Display Variable", "Playfair Display", serif', weight: "800" },
  { id: "ibm-plex-mono", label: "IBM Plex Mono", category: "mono", family: '"IBM Plex Mono", monospace', weight: "700" },
  { id: "caveat", label: "Caveat", category: "handwritten", family: '"Caveat Variable", Caveat, cursive', weight: "700" },
  { id: "bangers", label: "Bangers", category: "graphic", family: 'Bangers, Impact, sans-serif', weight: "400" },
];

export function typographyFontProfile(id: TypographyFontId) {
  return TYPOGRAPHY_FONTS.find(font => font.id === id) ?? TYPOGRAPHY_FONTS[0];
}

export async function ensureTypographyFont(profile: TypographyFontProfile) {
  if (typeof document === "undefined" || !document.fonts) return;
  await document.fonts.load(`${profile.weight} 48px ${profile.family}`);
}
