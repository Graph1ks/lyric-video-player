import type {
  CompositionMotionId,
  LineCue,
  SceneMode,
  TypographyLayoutId,
  TypographyPresetId,
  VisualMode,
} from "./types.js";

export type CinematicShotRole = "establish" | "develop" | "accent" | "release";

export interface CinematicTypographyDirection {
  family: string;
  typographyPreset: TypographyPresetId;
  layout: TypographyLayoutId;
  motion: CompositionMotionId;
}

export interface DirectedScene {
  mode: SceneMode;
  reason: "hook" | "short-hit" | "dense" | "chapter";
  phraseIndex: number;
  shotRole: CinematicShotRole;
  typography: CinematicTypographyDirection;
}

const TYPOGRAPHY_BUNDLES: Record<SceneMode, CinematicTypographyDirection[]> = {
  poster: [
    { family: "impact-editorial", typographyPreset: "impact", layout: "editorial", motion: "takeover" },
    { family: "cascade-build", typographyPreset: "cascade", layout: "split-stage", motion: "anchor-build" },
    { family: "outline-panel", typographyPreset: "outline", layout: "center-stack", motion: "panel" },
  ],
  neon: [
    { family: "elastic-handoff", typographyPreset: "elastic", layout: "directional-stage", motion: "handoff" },
    { family: "wave-conveyor", typographyPreset: "wave", layout: "split-stage", motion: "conveyor" },
    { family: "outline-camera", typographyPreset: "outline", layout: "editorial", motion: "camera-handoff" },
  ],
  vortex: [
    { family: "tunnel-depth", typographyPreset: "tunnel", layout: "center-stack", motion: "portal" },
    { family: "scatter-camera", typographyPreset: "scatter", layout: "crossword", motion: "camera-handoff" },
    { family: "wave-collapse", typographyPreset: "wave", layout: "vertical-accent", motion: "collapse" },
  ],
};

interface PhraseSpan {
  phraseIndex: number;
  start: number;
  end: number;
}

export class SceneDirector {
  private requested: VisualMode = "auto";
  private plan: DirectedScene[] = [];

  setMode(mode: VisualMode) {
    this.requested = mode;
  }

  getMode() {
    return this.requested;
  }

  load(lines: LineCue[]) {
    const frequency = new Map<string, number>();
    for (const line of lines) {
      const key = normalize(line.text);
      if (key) frequency.set(key, (frequency.get(key) ?? 0) + 1);
    }

    const phrases = segmentPhrases(lines, frequency);
    this.plan = Array.from({ length: lines.length });

    for (const phrase of phrases) {
      const phraseLines = lines.slice(phrase.start, phrase.end + 1);
      const repeated = phraseLines.some(line => (frequency.get(normalize(line.text)) ?? 0) > 1);
      const duration = Math.max(
        0.25,
        (phraseLines.at(-1)?.end ?? 0) - (phraseLines[0]?.start ?? 0),
      );
      const words = phraseLines.reduce((sum, line) => sum + Math.max(1, line.words.length), 0);
      const density = words / duration;
      const compactCount = phraseLines.filter(line => line.words.length <= 4 || line.text.length <= 24).length;
      const compactRatio = compactCount / Math.max(1, phraseLines.length);

      const { mode, reason } = resolvePhraseScene(phrase.phraseIndex, repeated, density, compactRatio);
      const typography = typographyFor(mode, phrase.phraseIndex);

      for (let index = phrase.start; index <= phrase.end; index++) {
        const position = index - phrase.start;
        const length = phrase.end - phrase.start + 1;
        this.plan[index] = {
          mode,
          reason,
          phraseIndex: phrase.phraseIndex,
          shotRole: shotRoleFor(position, length),
          typography,
        };
      }
    }
  }

  sceneFor(lineIndex: number): DirectedScene {
    const planned = this.plan[lineIndex] ?? fallbackDirection(lineIndex);
    if (this.requested === "auto") return planned;

    return {
      ...planned,
      mode: this.requested,
      reason: "chapter",
      typography: typographyFor(this.requested, planned.phraseIndex),
    };
  }
}

function segmentPhrases(
  lines: LineCue[],
  frequency: Map<string, number>,
): PhraseSpan[] {
  if (!lines.length) return [];

  const phrases: PhraseSpan[] = [];
  const seen = new Set<string>([normalize(lines[0].text)]);
  let start = 0;
  let phraseIndex = 0;

  for (let index = 1; index < lines.length; index++) {
    const previous = lines[index - 1];
    const current = lines[index];
    const currentKey = normalize(current.text);
    const gap = Math.max(0, current.start - previous.end);
    const phraseLength = index - start;
    const punctuationBreak = /[.!?…]["')\]]?$/.test(previous.text.trim());
    const recurringMotif = Boolean(
      currentKey
      && (frequency.get(currentKey) ?? 0) > 1
      && seen.has(currentKey),
    );
    const shouldBreak = recurringMotif
      || gap >= 0.7
      || phraseLength >= 4
      || (punctuationBreak && phraseLength >= 2);

    if (shouldBreak) {
      phrases.push({ phraseIndex, start, end: index - 1 });
      phraseIndex += 1;
      start = index;
    }
    if (currentKey) seen.add(currentKey);
  }

  phrases.push({ phraseIndex, start, end: lines.length - 1 });
  return phrases;
}

function resolvePhraseScene(
  phraseIndex: number,
  repeated: boolean,
  density: number,
  compactRatio: number,
): Pick<DirectedScene, "mode" | "reason"> {
  if (repeated && phraseIndex > 0) return { mode: "vortex", reason: "hook" };
  if (density >= 3.45) return { mode: "poster", reason: "dense" };
  if (compactRatio >= 0.66) return { mode: "poster", reason: "short-hit" };

  const chapter = phraseIndex % 5;
  return chapter === 0 || chapter === 3
    ? { mode: "neon", reason: "chapter" }
    : chapter === 1
      ? { mode: "poster", reason: "chapter" }
      : { mode: "vortex", reason: "chapter" };
}

function typographyFor(mode: SceneMode, phraseIndex: number) {
  const options = TYPOGRAPHY_BUNDLES[mode];
  return options[Math.max(0, phraseIndex) % options.length];
}

function shotRoleFor(position: number, length: number): CinematicShotRole {
  if (length <= 1) return "accent";
  if (position === 0) return "establish";
  if (position === length - 1) return "release";
  if (length >= 4 && position === Math.floor(length / 2)) return "accent";
  return "develop";
}

function fallbackDirection(lineIndex: number): DirectedScene {
  const phraseIndex = Math.max(0, Math.floor(lineIndex / 3));
  return {
    mode: "neon",
    reason: "chapter",
    phraseIndex,
    shotRole: "accent",
    typography: typographyFor("neon", phraseIndex),
  };
}

function normalize(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
