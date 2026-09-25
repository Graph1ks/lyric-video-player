export type LowerThirdMode = "off" | "always" | "scheduled";

export type LowerThirdPresetId =
  | "clean-broadcast"
  | "minimal-underline"
  | "editorial-split"
  | "bold-block"
  | "glass-plate"
  | "neon-tag"
  | "corner-stack"
  | "ribbon-slide"
  | "poster-stamp"
  | "cinematic-credit";

export type LowerThirdPreset = "auto" | LowerThirdPresetId;

export interface LowerThirdPresetInfo {
  value: LowerThirdPreset;
  label: string;
  description: string;
  preview: string;
}

export interface LowerThirdScheduleInput {
  mode: LowerThirdMode;
  playbackSeconds: number;
  trackDurationSeconds: number;
  manualUntil: number;
  startSeconds: number;
  visibleSeconds: number;
  outroEnabled: boolean;
  outroLeadSeconds: number;
  now?: number;
}

export const LOWER_THIRD_PRESETS: LowerThirdPresetInfo[] = [
  { value: "auto", label: "Auto Rotation", description: "Rotate through the lower-third family on repeat appearances", preview: "lower-auto" },
  { value: "clean-broadcast", label: "Clean Broadcast", description: "Balanced broadcast hierarchy with restrained motion", preview: "lower-clean" },
  { value: "minimal-underline", label: "Minimal Underline", description: "Quiet typography with a single animated rule", preview: "lower-underline" },
  { value: "editorial-split", label: "Editorial Split", description: "Magazine-style artist/title split with strong alignment", preview: "lower-editorial" },
  { value: "bold-block", label: "Bold Block", description: "High-impact solid plate for loud introductions", preview: "lower-block" },
  { value: "glass-plate", label: "Glass Plate", description: "Soft translucent plate with modern depth", preview: "lower-glass" },
  { value: "neon-tag", label: "Neon Tag", description: "Compact luminous identifier for darker worlds", preview: "lower-neon" },
  { value: "corner-stack", label: "Corner Stack", description: "Tight stacked type that hugs the safe-area corner", preview: "lower-corner" },
  { value: "ribbon-slide", label: "Ribbon Slide", description: "Long horizontal ribbon with directional entrance", preview: "lower-ribbon" },
  { value: "poster-stamp", label: "Poster Stamp", description: "Graphic rotated stamp with poster energy", preview: "lower-stamp" },
  { value: "cinematic-credit", label: "Cinematic Credit", description: "Elegant film-title treatment with wide tracking", preview: "lower-credit" },
];

export function resolveLowerThirdPreset(
  requested: LowerThirdPreset,
  playbackSeconds: number,
): LowerThirdPresetId {
  if (requested !== "auto") return requested;
  const options = LOWER_THIRD_PRESETS
    .map(item => item.value)
    .filter((value): value is LowerThirdPresetId => value !== "auto");
  return options[Math.max(0, Math.floor(playbackSeconds / 45)) % options.length];
}

export function shouldShowLowerThird(input: LowerThirdScheduleInput) {
  const now = input.now ?? Date.now();
  if (input.manualUntil > now) return true;
  if (input.mode === "off") return false;
  if (input.mode === "always") return true;

  const playback = Math.max(0, input.playbackSeconds);
  const start = Math.max(0, input.startSeconds);
  const visible = Math.max(0.5, input.visibleSeconds);
  const openingWindow = playback >= start && playback < start + visible;
  if (openingWindow) return true;

  if (!input.outroEnabled || input.trackDurationSeconds <= 0) return false;
  const outroStart = Math.max(0, input.trackDurationSeconds - Math.max(0, input.outroLeadSeconds));
  return playback >= outroStart && playback < Math.min(
    input.trackDurationSeconds,
    outroStart + visible,
  );
}
