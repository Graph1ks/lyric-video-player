import { clamp } from "./math.js";
import type { LineCue, WordCue } from "./types.js";

export type SequenceWordRole = "active" | "recent" | "history" | "incoming";

export interface SequenceScopeWordRef {
  id: string;
  lineIndex: number;
  wordIndex: number;
  text: string;
  start: number;
  end: number;
  scopeOrdinal: number;
}

export interface SequenceWordRef extends SequenceScopeWordRef {
  role: SequenceWordRole;
  age: number;
}

export interface TypographySequenceWindow {
  time: number;
  activeLineIndex: number;
  activeWordId?: string;
  scopeStartLineIndex: number;
  scopeEndLineIndex: number;
  scopeWordCount: number;
  scopeWords: SequenceScopeWordRef[];
  words: SequenceWordRef[];
  omittedWordCount: number;
}

export interface TypographySequenceWindowOptions {
  historySeconds?: number;
  recentSeconds?: number;
  leadSeconds?: number;
  maxWords?: number;
  lineStartIndex?: number;
  lineEndIndex?: number;
}

const DEFAULT_HISTORY_SECONDS = 6;
const DEFAULT_RECENT_SECONDS = 1.35;
const DEFAULT_LEAD_SECONDS = 0.16;
const DEFAULT_MAX_WORDS = 36;

export function typographyWordId(lineIndex: number, wordIndex: number) {
  return `line:${Math.max(0, lineIndex)}/word:${Math.max(0, wordIndex)}`;
}

export function deriveTypographySequenceWindow(
  lines: LineCue[],
  time: number,
  options: TypographySequenceWindowOptions = {},
): TypographySequenceWindow {
  const historySeconds = Math.max(0, options.historySeconds ?? DEFAULT_HISTORY_SECONDS);
  const recentSeconds = Math.min(
    historySeconds,
    Math.max(0, options.recentSeconds ?? DEFAULT_RECENT_SECONDS),
  );
  const leadSeconds = Math.max(0, options.leadSeconds ?? DEFAULT_LEAD_SECONDS);
  const maxWords = Math.max(1, Math.floor(options.maxWords ?? DEFAULT_MAX_WORDS));
  const safeTime = Number.isFinite(time) ? time : 0;
  const lineStartIndex = Math.max(0, Math.floor(options.lineStartIndex ?? 0));
  const lineEndIndex = Math.min(
    Math.max(-1, lines.length - 1),
    Math.floor(options.lineEndIndex ?? Math.max(-1, lines.length - 1)),
  );

  let activeLineIndex = -1;
  const candidates: SequenceWordRef[] = [];
  const scopeWords: SequenceScopeWordRef[] = [];
  let scopeWordCount = 0;
  for (let lineIndex = lineStartIndex; lineIndex <= lineEndIndex; lineIndex++) {
    scopeWordCount += lines[lineIndex]?.words.length ?? 0;
  }
  let scopeOrdinal = 0;

  for (let lineIndex = lineStartIndex; lineIndex <= lineEndIndex; lineIndex++) {
    const line = lines[lineIndex];
    if (!line) continue;
    if (safeTime >= line.start && safeTime < line.end) activeLineIndex = lineIndex;

    for (let wordIndex = 0; wordIndex < line.words.length; wordIndex++) {
      const word = line.words[wordIndex];
      const wordScopeOrdinal = scopeOrdinal;
      scopeOrdinal += 1;
      const scopeWord = {
        id: typographyWordId(lineIndex, wordIndex),
        lineIndex,
        wordIndex,
        text: word.text,
        start: word.start,
        end: word.end,
        scopeOrdinal: wordScopeOrdinal,
      } satisfies SequenceScopeWordRef;
      scopeWords.push(scopeWord);

      const role = roleAtTime(word, safeTime, historySeconds, recentSeconds, leadSeconds);
      if (!role) continue;

      candidates.push({
        ...scopeWord,
        role,
        age: role === "incoming"
          ? word.start - safeTime
          : Math.max(0, safeTime - word.end),
      });
    }
  }

  const kept = candidates.length <= maxWords
    ? candidates
    : selectMostRelevantWords(candidates, maxWords);

  kept.sort(compareChronological);

  return {
    time: safeTime,
    activeLineIndex,
    activeWordId: kept.find(word => word.role === "active")?.id,
    scopeStartLineIndex: lineStartIndex,
    scopeEndLineIndex: lineEndIndex,
    scopeWordCount,
    scopeWords,
    words: kept,
    omittedWordCount: Math.max(0, candidates.length - kept.length),
  };
}

function roleAtTime(
  word: WordCue,
  time: number,
  historySeconds: number,
  recentSeconds: number,
  leadSeconds: number,
): SequenceWordRole | undefined {
  if (time >= word.start && time < word.end) return "active";

  if (time < word.start) {
    return word.start - time <= leadSeconds ? "incoming" : undefined;
  }

  const age = time - word.end;
  if (age <= recentSeconds) return "recent";
  if (age <= historySeconds) return "history";
  return undefined;
}

function selectMostRelevantWords(words: SequenceWordRef[], maxWords: number) {
  return [...words]
    .sort((a, b) => relevanceScore(b) - relevanceScore(a) || compareNewest(a, b))
    .slice(0, maxWords);
}

function relevanceScore(word: SequenceWordRef) {
  if (word.role === "active") return 4_000 - word.age;
  if (word.role === "incoming") return 3_000 - word.age;
  if (word.role === "recent") return 2_000 - word.age;
  return 1_000 - clamp(word.age, 0, 999);
}

function compareNewest(a: SequenceWordRef, b: SequenceWordRef) {
  return b.start - a.start || b.lineIndex - a.lineIndex || b.wordIndex - a.wordIndex;
}

function compareChronological(a: SequenceWordRef, b: SequenceWordRef) {
  return a.start - b.start || a.lineIndex - b.lineIndex || a.wordIndex - b.wordIndex;
}


export function resolveManifestoPageScope(
  lineIndex: number,
  totalLineCount: number,
  linesPerPage = 12,
) {
  const total = Math.max(0, Math.floor(totalLineCount));
  if (!total) return { startLine: 0, endLine: -1 };

  const pageSize = Math.max(4, Math.floor(linesPerPage));
  const safeLine = Math.max(0, Math.min(total - 1, Math.floor(lineIndex)));
  const startLine = Math.floor(safeLine / pageSize) * pageSize;
  return {
    startLine,
    endLine: Math.min(total - 1, startLine + pageSize - 1),
  };
}
