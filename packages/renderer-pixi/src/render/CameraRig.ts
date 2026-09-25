import type { Container } from "pixi.js";
import type { AudioBands } from "@graph1ks/emo-audio-web";
import type { SceneMode } from "@graph1ks/emo-engine-core";
import { lerp } from "@graph1ks/emo-engine-core";

export class CameraRig {
  private mode: SceneMode = "neon";
  private intensity = 1;
  private xImpulse = 0;
  private yImpulse = 0;
  private zoomImpulse = 0;
  private rotationImpulse = 0;
  private previousTime = 0;
  private centerX = 0;
  private centerY = 0;

  constructor(private readonly target: Container) {}

  setMode(mode: SceneMode) {
    this.mode = mode;
  }

  setIntensity(value: number) {
    this.intensity = Math.max(0.2, Math.min(1.8, value));
  }

  setViewport(width: number, height: number) {
    this.centerX = width * 0.5;
    this.centerY = height * 0.5;
    this.target.pivot.set(this.centerX, this.centerY);
    this.target.position.set(this.centerX, this.centerY);
  }

  lineHit(index: number) {
    const sign = index % 2 ? 1 : -1;
    const strength = this.intensity;
    this.xImpulse += sign * (this.mode === "poster" ? 18 : this.mode === "vortex" ? 9 : 6) * strength;
    this.yImpulse += (this.mode === "vortex" ? -sign * 12 : -4) * strength;
    this.zoomImpulse += (this.mode === "vortex" ? 0.085 : this.mode === "poster" ? 0.055 : 0.035) * strength;
    this.rotationImpulse += sign * (this.mode === "vortex" ? 0.032 : 0.012) * strength;
  }

  wordHit(index: number, audio: AudioBands) {
    const sign = index % 2 ? 1 : -1;
    const accent = (0.45 + audio.transient * 1.6 + audio.bass * 0.55) * this.intensity;
    this.xImpulse += sign * (this.mode === "poster" ? 4.5 : 2.4) * accent;
    this.zoomImpulse += (this.mode === "vortex" ? 0.018 : 0.009) * accent;
    this.rotationImpulse += sign * (this.mode === "vortex" ? 0.007 : 0.0025) * accent;
  }

  update(time: number, audio: AudioBands) {
    const rawDt = this.previousTime ? time - this.previousTime : 1 / 60;
    const dt = Math.min(0.05, Math.max(1 / 240, Math.abs(rawDt)));
    this.previousTime = time;
    const decay = Math.pow(0.0007, dt);
    this.xImpulse *= decay;
    this.yImpulse *= decay;
    this.zoomImpulse *= decay;
    this.rotationImpulse *= decay;

    const driftX = Math.sin(time * 0.19) * (this.mode === "vortex" ? 4 : 1.4) * this.intensity;
    const driftY = Math.cos(time * 0.15) * (this.mode === "neon" ? 2.1 : 1.1) * this.intensity;
    const baseRotation = this.mode === "vortex"
      ? Math.sin(time * 0.18) * 0.012
      : this.mode === "poster"
        ? Math.sin(time * 0.27) * 0.0032
        : Math.sin(time * 0.12) * 0.0021;

    this.target.position.set(
      this.centerX + driftX + this.xImpulse,
      this.centerY + driftY + this.yImpulse,
    );
    this.target.rotation = baseRotation + this.rotationImpulse + (audio.transient - 0.08) * 0.0045 * this.intensity;

    const bassZoom = audio.bass * (this.mode === "vortex" ? 0.024 : 0.011) * this.intensity;
    const desiredScale = 1 + bassZoom + this.zoomImpulse;
    this.target.scale.x = lerp(this.target.scale.x || 1, desiredScale, 0.12);
    this.target.scale.y = lerp(this.target.scale.y || 1, desiredScale, 0.12);
  }
}
