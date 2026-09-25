import { clamp, EMPTY_AUDIO_BANDS } from "@graph1ks/emo-engine-core";
import type { AudioBands, TickClock } from "@graph1ks/emo-engine-core";

export type { AudioBands } from "@graph1ks/emo-engine-core";

export class AudioEngine {
  readonly element = new Audio();
  private ctx?: AudioContext;
  private analyser?: AnalyserNode;
  private sourceNode?: MediaElementAudioSourceNode;
  private bins = new Uint8Array(1024);
  private objectUrl?: string;
  private prevEnergy = 0;
  private transientEnvelope = 0;

  constructor() {
    this.element.preload = "metadata";
    this.element.crossOrigin = "anonymous";
    this.element.volume = 0.9;
  }

  get hasSource() { return Boolean(this.element.src); }
  get volume() { return this.element.volume; }
  get muted() { return this.element.muted; }

  async load(file: File) {
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = URL.createObjectURL(file);
    this.element.src = this.objectUrl;
    this.element.load();

    await new Promise<void>((resolve, reject) => {
      const onReady = () => { cleanup(); resolve(); };
      const onError = () => { cleanup(); reject(new Error("Audio file could not be loaded.")); };
      const cleanup = () => {
        this.element.removeEventListener("loadedmetadata", onReady);
        this.element.removeEventListener("error", onError);
      };
      this.element.addEventListener("loadedmetadata", onReady, { once: true });
      this.element.addEventListener("error", onError, { once: true });
    });
  }

  async ensureGraph() {
    if (this.ctx) {
      if (this.ctx.state !== "running") await this.ctx.resume();
      return;
    }

    this.ctx = new AudioContext();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.76;
    this.bins = new Uint8Array(this.analyser.frequencyBinCount);

    this.sourceNode = this.ctx.createMediaElementSource(this.element);
    this.sourceNode.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
  }

  async toggle() {
    if (!this.hasSource) return false;
    await this.ensureGraph();
    if (this.element.paused) await this.element.play();
    else this.element.pause();
    return !this.element.paused;
  }

  async play() {
    if (!this.hasSource) return false;
    await this.ensureGraph();
    await this.element.play();
    return true;
  }

  pause() { this.element.pause(); }

  setVolume(value: number) {
    this.element.volume = clamp(value);
    if (value > 0.001) this.element.muted = false;
  }

  toggleMute() {
    this.element.muted = !this.element.muted;
    return this.element.muted;
  }

  bands(): AudioBands {
    if (!this.analyser || !this.ctx) return { ...EMPTY_AUDIO_BANDS };

    this.analyser.getByteFrequencyData(this.bins);
    const nyquist = this.ctx.sampleRate / 2;
    const binFor = (hz: number) => Math.max(0, Math.min(this.bins.length - 1, Math.round((hz / nyquist) * this.bins.length)));
    const avgHz = (fromHz: number, toHz: number) => {
      const from = binFor(fromHz);
      const to = Math.max(from + 1, binFor(toHz));
      let sum = 0;
      for (let i = from; i < to; i++) sum += this.bins[i];
      return sum / Math.max(1, to - from) / 255;
    };

    const bass = avgHz(35, 180);
    const mid = avgHz(180, 2400);
    const treble = avgHz(2400, 10000);
    const energy = clamp(bass * 0.48 + mid * 0.34 + treble * 0.18);
    const delta = Math.max(0, energy - this.prevEnergy);
    this.transientEnvelope = Math.max(delta * 4.8, this.transientEnvelope * 0.84);
    this.prevEnergy += (energy - this.prevEnergy) * 0.38;

    return {
      bass: clamp(bass),
      mid: clamp(mid),
      treble: clamp(treble),
      energy,
      transient: clamp(this.transientEnvelope),
    };
  }
}

export class HtmlAudioClock implements TickClock {
  private listeners = new Set<(time: number) => void>();
  private raf = 0;

  constructor(private readonly source: HTMLAudioElement) {}

  get time() { return this.source.currentTime || 0; }
  get duration() { return Number.isFinite(this.source.duration) ? this.source.duration : 0; }
  get playing() { return !this.source.paused; }

  async play() {
    await this.source.play();
    return true;
  }

  pause() { this.source.pause(); }

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
