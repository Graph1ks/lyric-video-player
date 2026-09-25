import type { LineCue, LyricMeta, ParsedLyrics, WordCue } from "./types.js";

const LINE_TS = /\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g;
const WORD_TS = /<(?:(\d{1,3}):)?(\d{1,2})(?:[.:](\d{1,3}))?>/g;

function fractionToMs(raw = "0") {
  if (raw.length === 1) return Number(raw) * 100;
  if (raw.length === 2) return Number(raw) * 10;
  return Number(raw.slice(0, 3));
}

function toSeconds(min: string, sec: string, frac = "0") {
  return Number(min) * 60 + Number(sec) + fractionToMs(frac) / 1000;
}

function wordTimestampToSeconds(min: string | undefined, sec: string, frac = "0") {
  return Number(min ?? 0) * 60 + Number(sec) + fractionToMs(frac) / 1000;
}

export class ELRCParser {
  parse(source: string): ParsedLyrics {
    const offsetMatch = source.match(/\[offset:([+-]?\d+)\]/i);
    const offsetMs = offsetMatch ? Number(offsetMatch[1]) : 0;
    const meta: LyricMeta = {
      title: source.match(/\[ti:(.*?)\]/i)?.[1]?.trim(),
      artist: source.match(/\[ar:(.*?)\]/i)?.[1]?.trim(),
      album: source.match(/\[al:(.*?)\]/i)?.[1]?.trim(),
      author: source.match(/\[by:(.*?)\]/i)?.[1]?.trim(),
    };
    const rawLines: LineCue[] = [];

    for (const raw of source.split(/\r?\n/)) {
      const timestamps = [...raw.matchAll(LINE_TS)];
      if (!timestamps.length) continue;

      const lyricBody = raw.replace(LINE_TS, "").trim();
      if (!lyricBody) continue;

      for (const stamp of timestamps) {
        const lineStart = toSeconds(stamp[1], stamp[2], stamp[3]) + offsetMs / 1000;
        const words = this.parseWords(lyricBody, lineStart);
        const plainText = lyricBody.replace(WORD_TS, "").replace(/\s+/g, " ").trim();
        rawLines.push({ start: Math.max(0, lineStart), end: Infinity, text: plainText, words });
      }
    }

    rawLines.sort((a, b) => a.start - b.start);
    rawLines.forEach((line, i) => {
      line.end = rawLines[i + 1]?.start ?? line.start + 5.5;
      if (line.words.length) {
        line.words.forEach((word, wi) => {
          word.end = line.words[wi + 1]?.start ?? line.end;
        });
      } else {
        line.words = this.distributeWords(line.text, line.start, line.end);
      }
    });

    return { offsetMs, lines: rawLines, meta };
  }

  private parseWords(body: string, lineStart: number): WordCue[] {
    const matches = [...body.matchAll(WORD_TS)];
    if (!matches.length) return [];

    const words: WordCue[] = [];
    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      const next = matches[i + 1];
      const textStart = (m.index ?? 0) + m[0].length;
      const textEnd = next?.index ?? body.length;
      const text = body.slice(textStart, textEnd).trim();
      if (!text) continue;
      words.push({
        start: wordTimestampToSeconds(m[1], m[2], m[3]),
        end: Infinity,
        text,
      });
    }

    if (words.length && words[0].start + 0.25 < lineStart) {
      for (const word of words) word.start += lineStart;
    }

    return words;
  }

  private distributeWords(text: string, start: number, end: number): WordCue[] {
    const tokens = text.split(/\s+/).filter(Boolean);
    const weights = tokens.map(token => Math.max(1, token.replace(/[^\p{L}\p{N}]/gu, "").length));
    const totalWeight = weights.reduce((a, b) => a + b, 0) || 1;
    const duration = Math.max(0.25, end - start);
    let cursor = start;

    return tokens.map((token, i) => {
      const share = duration * (weights[i] / totalWeight);
      const cue = { text: token, start: cursor, end: cursor + share };
      cursor += share;
      return cue;
    });
  }
}
