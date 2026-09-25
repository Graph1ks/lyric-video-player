export interface Clock {
  readonly time: number;
  readonly duration: number;
  readonly playing: boolean;
  play(): Promise<boolean>;
  pause(): void;
  seek(seconds: number): void;
}

export interface TickClock extends Clock {
  onTick(listener: (time: number) => void): () => void;
  start(): void;
  stop(): void;
}

export class FixedFrameClock implements Clock {
  private current = 0;
  private active = false;

  constructor(
    public readonly duration: number,
    public readonly fps = 60,
  ) {
    if (!Number.isFinite(duration) || duration < 0) throw new Error("duration must be a finite non-negative number");
    if (!Number.isFinite(fps) || fps <= 0) throw new Error("fps must be a finite positive number");
  }

  get time() {
    return this.current;
  }

  get playing() {
    return this.active;
  }

  async play() {
    this.active = true;
    return true;
  }

  pause() {
    this.active = false;
  }

  seek(seconds: number) {
    if (!Number.isFinite(seconds)) return;
    this.current = Math.max(0, Math.min(this.duration, seconds));
  }

  seekFrame(frame: number) {
    this.seek(Math.max(0, Math.floor(frame)) / this.fps);
  }
}
