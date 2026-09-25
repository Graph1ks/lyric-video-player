import { clamp } from "@graph1ks/emo-engine-core";
import type { AudioBands } from "@graph1ks/emo-engine-core";

export interface WorldAudioFrame {
  readonly bands: AudioBands;
  dt: number;
  discontinuity: boolean;
  transientRise: boolean;
  transientEnvelope: number;
  longEnergy: number;
}

function smoothAttackRelease(
  current: number,
  target: number,
  dt: number,
  attackSeconds: number,
  releaseSeconds: number,
) {
  if (dt <= 0) return current;
  const tau = target > current ? attackSeconds : releaseSeconds;
  const amount = 1 - Math.exp(-dt / Math.max(0.001, tau));
  return current + (target - current) * amount;
}

function safeBand(value: number) {
  return clamp(Number.isFinite(value) ? value : 0);
}

export class WorldAudioReactivity {
  private initialized = false;
  private previousTime = 0;
  private previousTransient = 0;
  private transientArmed = true;
  private transientEnvelopeValue = 0;
  private longEnergyValue = 0;

  private readonly bands: AudioBands = {
    bass: 0,
    mid: 0,
    treble: 0,
    energy: 0,
    transient: 0,
  };

  private readonly frame: WorldAudioFrame = {
    bands: this.bands,
    dt: 0,
    discontinuity: true,
    transientRise: false,
    transientEnvelope: 0,
    longEnergy: 0,
  };

  update(time: number, audio: AudioBands): WorldAudioFrame {
    const rawBass = safeBand(audio.bass);
    const rawMid = safeBand(audio.mid);
    const rawTreble = safeBand(audio.treble);
    const rawEnergy = safeBand(audio.energy);
    const rawTransient = safeBand(audio.transient);
    const finiteTime = Number.isFinite(time);
    const delta = finiteTime && this.initialized ? time - this.previousTime : Number.NaN;
    const discontinuity = !this.initialized
      || !finiteTime
      || delta < -0.0001
      || delta > 0.25;

    if (discontinuity) {
      this.bands.bass = rawBass;
      this.bands.mid = rawMid;
      this.bands.treble = rawTreble;
      this.bands.energy = rawEnergy;
      this.bands.transient = rawTransient;
      this.longEnergyValue = rawEnergy;
      this.transientEnvelopeValue = 0;
      this.previousTransient = rawTransient;
      this.transientArmed = rawTransient < 0.18;
      this.previousTime = finiteTime ? time : 0;
      this.initialized = true;

      this.frame.dt = 0;
      this.frame.discontinuity = true;
      this.frame.transientRise = false;
      this.frame.transientEnvelope = 0;
      this.frame.longEnergy = this.longEnergyValue;
      return this.frame;
    }

    const dt = delta > 0 ? Math.min(0.08, delta) : 0;

    this.bands.bass = smoothAttackRelease(this.bands.bass, rawBass, dt, 0.055, 0.18);
    this.bands.mid = smoothAttackRelease(this.bands.mid, rawMid, dt, 0.07, 0.22);
    this.bands.treble = smoothAttackRelease(this.bands.treble, rawTreble, dt, 0.045, 0.14);
    this.bands.energy = smoothAttackRelease(this.bands.energy, rawEnergy, dt, 0.06, 0.24);
    this.bands.transient = smoothAttackRelease(this.bands.transient, rawTransient, dt, 0.025, 0.12);
    this.longEnergyValue = smoothAttackRelease(this.longEnergyValue, rawEnergy, dt, 0.45, 0.9);

    if (!this.transientArmed && rawTransient <= 0.12) this.transientArmed = true;
    const transientRise = this.transientArmed
      && rawTransient >= 0.28
      && rawTransient - this.previousTransient >= 0.05;
    if (transientRise) this.transientArmed = false;

    if (dt > 0) this.transientEnvelopeValue *= Math.exp(-dt / 0.18);
    if (transientRise) {
      this.transientEnvelopeValue = Math.max(this.transientEnvelopeValue, rawTransient);
    }

    this.previousTransient = rawTransient;
    this.previousTime = time;

    this.frame.dt = dt;
    this.frame.discontinuity = false;
    this.frame.transientRise = transientRise;
    this.frame.transientEnvelope = clamp(this.transientEnvelopeValue);
    this.frame.longEnergy = clamp(this.longEnergyValue);
    return this.frame;
  }

  reset() {
    this.initialized = false;
    this.previousTime = 0;
    this.previousTransient = 0;
    this.transientArmed = true;
    this.transientEnvelopeValue = 0;
    this.longEnergyValue = 0;
    this.bands.bass = 0;
    this.bands.mid = 0;
    this.bands.treble = 0;
    this.bands.energy = 0;
    this.bands.transient = 0;
    this.frame.dt = 0;
    this.frame.discontinuity = true;
    this.frame.transientRise = false;
    this.frame.transientEnvelope = 0;
    this.frame.longEnergy = 0;
  }
}
