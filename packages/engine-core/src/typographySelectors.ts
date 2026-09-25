import { clamp, hash01, lerp, smoothstep } from "./math.js";
import type { AudioBands } from "./types.js";

export type SelectorOrder = "forward" | "reverse" | "center" | "edges" | "random";
export type SelectorBlendMode = "multiply" | "add" | "max" | "min";

export interface GlyphSelectorContext {
  index: number;
  count: number;
  wordIndex: number;
  wordCount: number;
  lineIndex: number;
  time: number;
  lineProgress: number;
  wordProgress: number;
  seed: number;
  audio: AudioBands;
}

export interface RangeSelectorConfig {
  start?: number;
  end?: number;
  feather?: number;
  invert?: boolean;
}

export interface StaggerSelectorConfig {
  progress: number;
  spread?: number;
  order?: SelectorOrder;
  seed?: number;
}

export interface WaveSelectorConfig {
  cycles?: number;
  speed?: number;
  phase?: number;
  bias?: number;
  amplitude?: number;
}

export interface WiggleSelectorConfig {
  frequency?: number;
  seed?: number;
  smooth?: boolean;
}

export interface AudioSelectorConfig {
  bass?: number;
  mid?: number;
  treble?: number;
  energy?: number;
  transient?: number;
  gain?: number;
}

function normalizedGlyph(index: number, count: number) {
  if (count <= 1) return 0.5;
  return clamp(index / Math.max(1, count - 1));
}

function selectorRank(index: number, count: number, order: SelectorOrder, seed: number) {
  const t = normalizedGlyph(index, count);
  if (order === "reverse") return 1 - t;
  if (order === "center") return count <= 1 ? 0 : Math.abs(t - 0.5) * 2;
  if (order === "edges") return count <= 1 ? 0 : 1 - Math.abs(t - 0.5) * 2;
  if (order === "random") return hash01(seed * 97.13 + index * 41.77 + count * 0.19);
  return t;
}

export function rangeSelector(context: GlyphSelectorContext, config: RangeSelectorConfig = {}) {
  const start = clamp(config.start ?? 0);
  const end = clamp(config.end ?? 1);
  const feather = Math.max(0, Math.min(0.5, config.feather ?? 0.08));
  const lo = Math.min(start, end);
  const hi = Math.max(start, end);
  const t = normalizedGlyph(context.index, context.count);

  let weight = 1;
  if (t < lo) {
    weight = feather <= 0 ? 0 : smoothstep(lo - feather, lo, t);
  } else if (t > hi) {
    weight = feather <= 0 ? 0 : 1 - smoothstep(hi, hi + feather, t);
  }

  return config.invert ? 1 - clamp(weight) : clamp(weight);
}

export function staggerSelector(context: GlyphSelectorContext, config: StaggerSelectorConfig) {
  const progress = clamp(config.progress);
  const spread = clamp(config.spread ?? 0.72, 0, 0.98);
  const order = config.order ?? "forward";
  const rank = selectorRank(context.index, context.count, order, config.seed ?? context.seed);
  const delay = rank * spread;
  const localDuration = Math.max(0.02, 1 - spread);
  return smoothstep(0, 1, (progress - delay) / localDuration);
}

export function waveSelector(context: GlyphSelectorContext, config: WaveSelectorConfig = {}) {
  const cycles = config.cycles ?? 1.2;
  const speed = config.speed ?? 2.4;
  const phase = config.phase ?? 0;
  const bias = clamp(config.bias ?? 0.5);
  const amplitude = Math.max(0, config.amplitude ?? 0.5);
  const t = normalizedGlyph(context.index, context.count);
  const raw = Math.sin(t * Math.PI * 2 * cycles + context.time * speed + phase);
  return clamp(bias + raw * amplitude);
}

export function wiggleSelector(context: GlyphSelectorContext, config: WiggleSelectorConfig = {}) {
  const frequency = Math.max(0.01, config.frequency ?? 5);
  const seed = config.seed ?? context.seed;
  const scaled = context.time * frequency;
  const bucket = Math.floor(scaled);
  const fraction = scaled - bucket;
  const a = hash01(seed * 113.91 + bucket * 17.17 + context.index * 31.73);
  const b = hash01(seed * 113.91 + (bucket + 1) * 17.17 + context.index * 31.73);
  const t = config.smooth === false ? fraction : smoothstep(0, 1, fraction);
  return lerp(a, b, t);
}

export function randomSelector(context: GlyphSelectorContext, seedOffset = 0) {
  return hash01(context.seed * 71.17 + context.index * 19.43 + seedOffset * 37.91);
}

export function audioSelector(context: GlyphSelectorContext, config: AudioSelectorConfig = {}) {
  const weights = {
    bass: config.bass ?? 0,
    mid: config.mid ?? 0,
    treble: config.treble ?? 0,
    energy: config.energy ?? 1,
    transient: config.transient ?? 0,
  };
  const total = Math.abs(weights.bass)
    + Math.abs(weights.mid)
    + Math.abs(weights.treble)
    + Math.abs(weights.energy)
    + Math.abs(weights.transient);
  if (total <= 0.000001) return 0;

  const value = (
    context.audio.bass * weights.bass
    + context.audio.mid * weights.mid
    + context.audio.treble * weights.treble
    + context.audio.energy * weights.energy
    + context.audio.transient * weights.transient
  ) / total;

  return clamp(value * (config.gain ?? 1));
}

export function combineSelectorWeights(
  values: number[],
  mode: SelectorBlendMode = "multiply",
) {
  if (!values.length) return mode === "multiply" || mode === "min" ? 1 : 0;
  const normalized = values.map(value => clamp(value));
  if (mode === "add") return clamp(normalized.reduce((sum, value) => sum + value, 0));
  if (mode === "max") return Math.max(...normalized);
  if (mode === "min") return Math.min(...normalized);
  return normalized.reduce((product, value) => product * value, 1);
}
