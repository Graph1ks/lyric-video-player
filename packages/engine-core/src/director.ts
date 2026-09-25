import type {
  CompositionMotionId,
  LineCue,
  SceneMode,
  TypographyLayoutId,
  TypographyPresetId,
  VisualMode,
} from "./types.js";
import type { TypographySequenceGrammarId } from "./typographySequenceComposition.js";
import { isAllowed, pickAllowed, type VisualAutoProfile } from "./visualAutoProfile.js";

export type CinematicShotRole = "establish" | "develop" | "accent" | "release";

export interface CinematicTypographyDirection {
  family: string;
  typographyPreset: TypographyPresetId;
  layout: TypographyLayoutId;
  motion: CompositionMotionId;
  sequenceGrammar?: TypographySequenceGrammarId;
}

export interface DirectedScene {
  mode: SceneMode;
  reason: "hook" | "short-hit" | "dense" | "chapter";
  phraseIndex: number;
  phraseStartLine: number;
  phraseEndLine: number;
  shotRole: CinematicShotRole;
  typography: CinematicTypographyDirection;
}

const TYPOGRAPHY_BUNDLES: Record<SceneMode, CinematicTypographyDirection[]> = {
  poster: [
    { family: "impact-editorial", typographyPreset: "impact", layout: "editorial", motion: "takeover", sequenceGrammar: "hero-echo" },
    { family: "manifesto-page", typographyPreset: "impact", layout: "editorial", motion: "panel", sequenceGrammar: "manifesto-wall" },
    { family: "calligram-fill", typographyPreset: "cascade", layout: "split-stage", motion: "anchor-build", sequenceGrammar: "shape-fill" },
    { family: "outline-panel", typographyPreset: "outline", layout: "center-stack", motion: "panel" },
  ],
  neon: [
    { family: "elastic-handoff", typographyPreset: "elastic", layout: "directional-stage", motion: "handoff", sequenceGrammar: "ribbon-path" },
    { family: "wave-conveyor", typographyPreset: "wave", layout: "split-stage", motion: "conveyor" },
    { family: "outline-camera", typographyPreset: "outline", layout: "editorial", motion: "camera-handoff", sequenceGrammar: "hero-echo" },
  ],
  vortex: [
    { family: "tunnel-depth", typographyPreset: "tunnel", layout: "center-stack", motion: "portal", sequenceGrammar: "spiral-depth" },
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
  private lines: LineCue[] = [];
  private autoProfile?: VisualAutoProfile;

  setMode(mode: VisualMode) {
    this.requested = mode;
  }

  getMode() {
    return this.requested;
  }

  setAutoProfile(profile?: VisualAutoProfile) {
    this.autoProfile = profile;
    if (this.lines.length) this.load(this.lines);
  }

  getAutoProfile() {
    return this.autoProfile;
  }

  load(lines: LineCue[]) {
    this.lines = lines;
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

      const resolved = resolvePhraseScene(phrase.phraseIndex, repeated, density, compactRatio);
      const mode = constrainScene(resolved.mode, phrase.phraseIndex, this.autoProfile);
      const typography = typographyFor(mode, phrase.phraseIndex, this.autoProfile);

      for (let index = phrase.start; index <= phrase.end; index++) {
        const position = index - phrase.start;
        const length = phrase.end - phrase.start + 1;
        this.plan[index] = {
          mode,
          reason: resolved.reason,
          phraseIndex: phrase.phraseIndex,
          phraseStartLine: phrase.start,
          phraseEndLine: phrase.end,
          shotRole: shotRoleFor(position, length),
          typography,
        };
      }
    }
  }

  sceneFor(lineIndex: number): DirectedScene {
    const planned = this.plan[lineIndex] ?? fallbackDirection(lineIndex, this.autoProfile);
    if (this.requested === "auto") return planned;

    return {
      ...planned,
      mode: this.requested,
      reason: "chapter",
      typography: typographyFor(this.requested, planned.phraseIndex, this.autoProfile),
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

function constrainScene(
  preferred: SceneMode,
  phraseIndex: number,
  profile?: VisualAutoProfile,
): SceneMode {
  if (isAllowed(preferred, profile?.scenes)) return preferred;
  return pickAllowed(["neon", "poster", "vortex"], profile?.scenes, phraseIndex);
}

function typographyFor(
  mode: SceneMode,
  phraseIndex: number,
  profile?: VisualAutoProfile,
): CinematicTypographyDirection {
  const options = TYPOGRAPHY_BUNDLES[mode];
  const compatible = options.filter(bundle =>
    isAllowed(bundle.typographyPreset, profile?.typographyPresets)
    && isAllowed(bundle.layout, profile?.layouts)
    && isAllowed(bundle.motion, profile?.motions)
    && (!bundle.sequenceGrammar || isAllowed(bundle.sequenceGrammar, sequencePoolWithoutOff(profile))),
  );

  if (compatible.length) {
    const bundle = compatible[Math.max(0, phraseIndex) % compatible.length];
    return {
      ...bundle,
      sequenceGrammar: resolveSequence(bundle.sequenceGrammar, phraseIndex, profile),
    };
  }

  const fallback = options[Math.max(0, phraseIndex) % options.length];
  return {
    family: `profile-${mode}-${phraseIndex % 4}`,
    typographyPreset: pickAllowed(
      options.map(bundle => bundle.typographyPreset),
      profile?.typographyPresets,
      phraseIndex,
    ),
    layout: pickAllowed(
      options.map(bundle => bundle.layout),
      profile?.layouts,
      phraseIndex + 1,
    ),
    motion: pickAllowed(
      options.map(bundle => bundle.motion),
      profile?.motions,
      phraseIndex + 2,
    ),
    sequenceGrammar: resolveSequence(fallback.sequenceGrammar, phraseIndex, profile),
  };
}

function resolveSequence(
  preferred: TypographySequenceGrammarId | undefined,
  phraseIndex: number,
  profile?: VisualAutoProfile,
): TypographySequenceGrammarId | undefined {
  const allowed = profile?.sequences;
  if (!allowed?.length) return preferred;
  if (preferred && allowed.includes(preferred)) return preferred;
  if (allowed.includes("off") && (phraseIndex % 2 === 0 || allowed.length === 1)) return undefined;

  const grammars = allowed.filter(
    (value): value is TypographySequenceGrammarId => value !== "off",
  );
  if (!grammars.length) return undefined;
  return grammars[Math.max(0, phraseIndex) % grammars.length];
}

function sequencePoolWithoutOff(profile?: VisualAutoProfile) {
  return profile?.sequences?.filter(
    (value): value is TypographySequenceGrammarId => value !== "off",
  );
}

function shotRoleFor(position: number, length: number): CinematicShotRole {
  if (length <= 1) return "accent";
  if (position === 0) return "establish";
  if (position === length - 1) return "release";
  if (length >= 4 && position === Math.floor(length / 2)) return "accent";
  return "develop";
}

function fallbackDirection(lineIndex: number, profile?: VisualAutoProfile): DirectedScene {
  const phraseIndex = Math.max(0, Math.floor(lineIndex / 3));
  const mode = constrainScene("neon", phraseIndex, profile);
  return {
    mode,
    reason: "chapter",
    phraseIndex,
    phraseStartLine: Math.max(0, lineIndex),
    phraseEndLine: Math.max(0, lineIndex),
    shotRole: "accent",
    typography: typographyFor(mode, phraseIndex, profile),
  };
}

function normalize(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
