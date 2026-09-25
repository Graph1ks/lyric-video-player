import {
  clamp,
  easeOutBack,
  easeOutCubic,
  easeOutExpo,
  lerp,
  smoothstep,
} from "./math.js";
import type {
  CompositionMotionId,
  CompositionMotionPreset,
  SceneMode,
} from "./types.js";

export interface CompositionMotionWordInput {
  start: number;
  end: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  emphasis?: number;
}

export interface CompositionMotionInput {
  preset: CompositionMotionPreset;
  scene: SceneMode;
  lineIndex: number;
  time: number;
  lineStart: number;
  lineEnd: number;
  width: number;
  height: number;
  anchorIndex: number;
  words: CompositionMotionWordInput[];
  intensity?: number;
}

export interface CompositionWordMotion {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  alpha: number;
}

export interface CompositionStageMotion {
  x: number;
  y: number;
  rotation: number;
  scale: number;
  alpha: number;
}

export interface CompositionMotionFrame {
  motion: CompositionMotionId;
  activeWord: number;
  stage: CompositionStageMotion;
  words: CompositionWordMotion[];
}

const AUTO_MOTIONS: Record<SceneMode, CompositionMotionId[]> = {
  poster: ["handoff", "panel", "anchor-build", "takeover", "collapse", "flip"],
  neon: ["handoff", "conveyor", "anchor-build", "camera-handoff", "takeover", "portal"],
  vortex: ["portal", "camera-handoff", "collapse", "flip", "conveyor", "takeover"],
};

const IDENTITY_WORD: CompositionWordMotion = Object.freeze({
  x: 0,
  y: 0,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  alpha: 1,
});

const IDENTITY_STAGE: CompositionStageMotion = Object.freeze({
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
  alpha: 1,
});

function wordProgress(time: number, start: number, end: number) {
  return clamp((time - start) / Math.max(0.04, end - start));
}

function activeWordAt(time: number, words: CompositionMotionWordInput[]) {
  for (let index = 0; index < words.length; index++) {
    const word = words[index];
    if (time >= word.start && time < word.end) return index;
  }

  let latest = -1;
  for (let index = 0; index < words.length; index++) {
    if (time >= words[index].start) latest = index;
  }
  return latest;
}

function cloneIdentityWords(count: number) {
  return Array.from({ length: count }, () => ({ ...IDENTITY_WORD }));
}

export function resolveCompositionMotion(
  preset: CompositionMotionPreset,
  scene: SceneMode,
  lineIndex: number,
  wordCount: number,
): CompositionMotionId {
  if (preset !== "auto") return preset;
  if (wordCount <= 1) return scene === "vortex" ? "portal" : "takeover";
  const options = AUTO_MOTIONS[scene];
  const safeLine = Math.max(0, lineIndex);
  return options[safeLine % options.length];
}

export function evaluateCompositionMotion(input: CompositionMotionInput): CompositionMotionFrame {
  const count = input.words.length;
  const motion = resolveCompositionMotion(input.preset, input.scene, input.lineIndex, count);
  const words = cloneIdentityWords(count);
  const stage = { ...IDENTITY_STAGE };
  if (!count) return { motion, activeWord: -1, stage, words };

  const width = Math.max(1, input.width);
  const height = Math.max(1, input.height);
  const intensity = clamp(input.intensity ?? 1, 0.2, 1.8);
  const lineDuration = Math.max(0.08, input.lineEnd - input.lineStart);
  const lineProgress = clamp((input.time - input.lineStart) / lineDuration);
  const activeWord = activeWordAt(input.time, input.words);
  const focusIndex = activeWord >= 0
    ? activeWord
    : Math.max(0, Math.min(count - 1, input.anchorIndex));
  const focusWord = input.words[focusIndex];
  const focusProgress = wordProgress(input.time, focusWord.start, focusWord.end);
  const focusPulse = Math.sin(focusProgress * Math.PI);
  const mirror = input.lineIndex % 2 === 0 ? 1 : -1;

  if (motion === "handoff") {
    words.forEach((wordMotion, index) => {
      const cue = input.words[index];
      const progress = wordProgress(input.time, cue.start, cue.end);
      const enter = easeOutCubic(clamp((input.time - cue.start + 0.14) / 0.34));
      const exited = smoothstep(cue.end, cue.end + 0.32, input.time);
      const side = index % 2 === 0 ? -1 : 1;
      wordMotion.x = side * (1 - enter) * width * 0.075 * intensity
        + side * exited * width * 0.032 * intensity;
      wordMotion.y = (1 - enter) * height * 0.035 * (index % 3 - 1)
        - exited * height * 0.018;
      wordMotion.rotation = side * (1 - enter) * 0.1 * intensity;
      wordMotion.scaleX = 0.86 + enter * 0.14 + (index === focusIndex ? focusPulse * 0.1 : 0);
      wordMotion.scaleY = 0.9 + enter * 0.1 + (index === focusIndex ? focusPulse * 0.06 : 0);
      wordMotion.alpha = clamp(0.3 + enter * 0.7 - exited * 0.42);
      if (index === focusIndex) {
        wordMotion.y -= 8 * focusPulse * intensity;
        wordMotion.alpha = 1;
      }
      if (progress >= 1 && index < focusIndex) wordMotion.alpha = Math.max(0.46, wordMotion.alpha);
    });
  } else if (motion === "conveyor") {
    const vertical = input.scene === "vortex" || input.lineIndex % 3 === 1;
    words.forEach((wordMotion, index) => {
      const relative = index - focusIndex;
      const lane = clamp(relative, -3, 3);
      const push = (0.5 - focusProgress) * (index === focusIndex ? 1 : 0.28);
      const distance = (lane * 0.026 + push * 0.055) * intensity;
      if (vertical) wordMotion.y = height * distance;
      else wordMotion.x = width * distance * mirror;
      wordMotion.scaleX = index === focusIndex ? 1.08 + focusPulse * 0.08 : 0.96;
      wordMotion.scaleY = index === focusIndex ? 1.04 + focusPulse * 0.04 : 0.96;
      wordMotion.alpha = index === focusIndex ? 1 : 0.62 + Math.max(0, 0.16 - Math.abs(relative) * 0.04);
    });
  } else if (motion === "anchor-build") {
    const anchorIndex = Math.max(0, Math.min(count - 1, input.anchorIndex));
    const anchor = input.words[anchorIndex];
    words.forEach((wordMotion, index) => {
      const cue = input.words[index];
      const enter = easeOutBack(clamp((input.time - cue.start + 0.16) / 0.42), 1.28);
      if (index === anchorIndex) {
        const age = clamp((input.time - input.lineStart) / Math.min(0.65, lineDuration));
        wordMotion.scaleX = lerp(0.72, 1.12, easeOutExpo(age));
        wordMotion.scaleY = lerp(0.72, 1.06, easeOutExpo(age));
        wordMotion.alpha = clamp(0.28 + age * 0.72);
        return;
      }
      const dx = anchor.x - cue.x;
      const dy = anchor.y - cue.y;
      const offset = 1 - clamp(enter);
      wordMotion.x = dx * 0.34 * offset;
      wordMotion.y = dy * 0.34 * offset;
      wordMotion.rotation = (anchor.rotation - cue.rotation) * 0.18 * offset;
      wordMotion.scaleX = 0.72 + clamp(enter) * 0.28;
      wordMotion.scaleY = 0.72 + clamp(enter) * 0.28;
      wordMotion.alpha = clamp(0.18 + clamp(enter) * 0.82);
    });
  } else if (motion === "collapse") {
    const collapse = smoothstep(0.48, 0.93, lineProgress);
    const fade = smoothstep(0.9, 1, lineProgress);
    words.forEach((wordMotion, index) => {
      const cue = input.words[index];
      const emphasis = clamp(cue.emphasis ?? 0.5);
      wordMotion.x = -cue.x * collapse * (0.74 + emphasis * 0.16);
      wordMotion.y = -cue.y * collapse * (0.74 + emphasis * 0.16);
      wordMotion.rotation = -cue.rotation * collapse * 0.82;
      const shrink = 1 - collapse * (0.24 - emphasis * 0.08);
      wordMotion.scaleX = shrink;
      wordMotion.scaleY = shrink;
      wordMotion.alpha = clamp(1 - fade * (index === focusIndex ? 0.16 : 0.52));
    });
    stage.scale = 1 + collapse * 0.08 * intensity;
  } else if (motion === "takeover") {
    const focus = Math.pow(Math.max(0, focusPulse), 0.72);
    words.forEach((wordMotion, index) => {
      const cue = input.words[index];
      if (index === focusIndex) {
        wordMotion.x = -cue.x * 0.72 * focus;
        wordMotion.y = -cue.y * 0.72 * focus;
        const boost = (0.82 + clamp(cue.emphasis ?? 0.5) * 0.58) * focus * intensity;
        wordMotion.scaleX = 1 + boost;
        wordMotion.scaleY = 1 + boost * 0.86;
        wordMotion.rotation = -cue.rotation * 0.58 * focus;
        wordMotion.alpha = 1;
      } else {
        const relative = index - focusIndex || 1;
        wordMotion.x = Math.sign(relative) * width * 0.026 * focus * intensity;
        wordMotion.y = Math.sign(cue.y || relative) * height * 0.018 * focus * intensity;
        wordMotion.scaleX = 1 - 0.18 * focus;
        wordMotion.scaleY = 1 - 0.18 * focus;
        wordMotion.alpha = clamp(1 - 0.62 * focus);
      }
    });
  } else if (motion === "flip") {
    words.forEach((wordMotion, index) => {
      const cue = input.words[index];
      const enter = easeOutCubic(clamp((input.time - cue.start + 0.08) / 0.34));
      const sign = (index + input.lineIndex) % 2 === 0 ? -1 : 1;
      wordMotion.rotation = sign * (1 - enter) * Math.PI * 0.5;
      const face = Math.max(0.08, Math.abs(Math.cos((1 - enter) * Math.PI * 0.5)));
      wordMotion.scaleX = face;
      wordMotion.scaleY = 0.82 + enter * 0.18;
      wordMotion.x = sign * (1 - enter) * width * 0.055 * intensity;
      wordMotion.alpha = clamp(0.12 + enter * 0.88);
      if (index === focusIndex) wordMotion.scaleY += focusPulse * 0.08;
    });
  } else if (motion === "camera-handoff") {
    const focus = smoothstep(0.02, 0.24, focusProgress)
      * (1 - smoothstep(0.82, 1, focusProgress) * 0.32);
    stage.x = -focusWord.x * 0.34 * focus;
    stage.y = -focusWord.y * 0.28 * focus;
    stage.rotation = -focusWord.rotation * 0.18 * focus;
    stage.scale = 1 + 0.11 * focus * intensity;
    words.forEach((wordMotion, index) => {
      const distance = Math.abs(index - focusIndex);
      wordMotion.alpha = index === focusIndex ? 1 : clamp(0.82 - distance * 0.08);
      wordMotion.scaleX = index === focusIndex ? 1 + focusPulse * 0.12 : 1;
      wordMotion.scaleY = index === focusIndex ? 1 + focusPulse * 0.08 : 1;
    });
  } else if (motion === "portal") {
    const zoom = smoothstep(0.34, 1, focusProgress);
    const fade = smoothstep(0.82, 1, focusProgress);
    words.forEach((wordMotion, index) => {
      const cue = input.words[index];
      if (index === focusIndex) {
        wordMotion.x = -cue.x * 0.46 * zoom;
        wordMotion.y = -cue.y * 0.46 * zoom;
        const scale = 1 + zoom * zoom * 2.6 * intensity;
        wordMotion.scaleX = scale;
        wordMotion.scaleY = scale;
        wordMotion.rotation = -cue.rotation * 0.42 * zoom;
        wordMotion.alpha = clamp(1 - fade * 0.88);
      } else {
        wordMotion.x = cue.x * zoom * 0.13;
        wordMotion.y = cue.y * zoom * 0.13;
        wordMotion.scaleX = 1 - zoom * 0.12;
        wordMotion.scaleY = 1 - zoom * 0.12;
        wordMotion.alpha = clamp(1 - zoom * 0.48);
      }
    });
    stage.scale = 1 + zoom * 0.045;
  } else {
    // panel
    const enter = easeOutCubic(clamp((input.time - input.lineStart) / Math.min(0.46, lineDuration * 0.28)));
    const exit = smoothstep(Math.max(input.lineStart, input.lineEnd - 0.3), input.lineEnd, input.time);
    stage.x = lerp(width * 0.82 * mirror, 0, enter) - width * 0.68 * mirror * exit;
    stage.rotation = lerp(0.055 * mirror, 0, enter) - 0.035 * mirror * exit;
    stage.alpha = clamp(enter * (1 - exit * 0.85));
    stage.scale = 0.96 + enter * 0.04 + exit * 0.03;
    words.forEach((wordMotion, index) => {
      const cascade = easeOutCubic(clamp((input.time - input.lineStart - index * 0.035) / 0.36));
      wordMotion.x = (1 - cascade) * width * 0.035 * mirror;
      wordMotion.alpha = clamp(0.26 + cascade * 0.74);
    });
  }

  return { motion, activeWord, stage, words };
}
