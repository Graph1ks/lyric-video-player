import type { LineCue } from "../lyrics/ELRCParser";
import type { SceneMode, VisualMode } from "./VisualTypes";

export interface DirectedScene {
  mode: SceneMode;
  reason: "hook" | "short-hit" | "dense" | "chapter";
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

    this.plan = lines.map((line, index) => {
      const key = normalize(line.text);
      const repeated = (frequency.get(key) ?? 0) > 1;
      const duration = Math.max(0.25, line.end - line.start);
      const words = Math.max(1, line.words.length);
      const density = words / duration;
      const compact = words <= 4 || line.text.length <= 24;

      if (repeated && index > 0) return { mode: "vortex", reason: "hook" };
      if (compact) return { mode: "poster", reason: "short-hit" };
      if (density >= 3.45) return { mode: "poster", reason: "dense" };

      const chapter = Math.floor(index / 3) % 5;
      return chapter === 0 || chapter === 3
        ? { mode: "neon", reason: "chapter" }
        : chapter === 1
          ? { mode: "poster", reason: "chapter" }
          : { mode: "vortex", reason: "chapter" };
    });
  }

  sceneFor(lineIndex: number): DirectedScene {
    if (this.requested !== "auto") return { mode: this.requested, reason: "chapter" };
    return this.plan[lineIndex] ?? { mode: "neon", reason: "chapter" };
  }
}

function normalize(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
