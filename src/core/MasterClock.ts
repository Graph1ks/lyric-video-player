export class MasterClock {
  private source: HTMLAudioElement;
  private listeners = new Set<(time: number) => void>();
  private raf = 0;

  constructor(source: HTMLAudioElement) {
    this.source = source;
  }

  get time() { return this.source.currentTime || 0; }
  get duration() { return Number.isFinite(this.source.duration) ? this.source.duration : 0; }
  get playing() { return !this.source.paused; }

  onTick(listener: (time: number) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  start() {
    const tick = () => {
      for (const listener of this.listeners) listener(this.time);
      this.raf = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(this.raf);
    tick();
  }

  stop() { cancelAnimationFrame(this.raf); }

  seek(seconds: number) {
    if (!Number.isFinite(seconds)) return;
    this.source.currentTime = Math.max(0, Math.min(this.duration || seconds, seconds));
  }
}
