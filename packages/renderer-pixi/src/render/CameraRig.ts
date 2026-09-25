import type { Container } from "pixi.js";
import type { AudioBands } from "@graph1ks/emo-audio-web";
import type {
  CinematicCameraPlan,
  SceneMode,
} from "@graph1ks/emo-engine-core";
import { lerp } from "@graph1ks/emo-engine-core";

export class CameraRig {
  private mode: SceneMode = "neon";
  private intensity = 1;
  private cameraMotion = 1;
  private impactPulse = 1;
  private xImpulse = 0;
  private yImpulse = 0;
  private zoomImpulse = 0;
  private rotationImpulse = 0;
  private previousTime = 0;
  private centerX = 0;
  private centerY = 0;
  private width = 1;
  private height = 1;
  private cinematicPlan?: CinematicCameraPlan;

  constructor(private readonly target: Container) {}

  setMode(mode: SceneMode) {
    this.mode = mode;
  }

  setIntensity(value: number) {
    this.intensity = Math.max(0.2, Math.min(1.8, value));
  }

  setEffectLevels(cameraMotion: number, impactPulse: number) {
    this.cameraMotion = Math.max(0, Math.min(3, cameraMotion));
    this.impactPulse = Math.max(0, Math.min(3, impactPulse));
    if (this.impactPulse <= 0.001) {
      this.xImpulse = 0;
      this.yImpulse = 0;
      this.zoomImpulse = 0;
      this.rotationImpulse = 0;
    }
  }

  setCinematicPlan(plan?: CinematicCameraPlan) {
    this.cinematicPlan = plan;
  }

  setViewport(width: number, height: number) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.centerX = width * 0.5;
    this.centerY = height * 0.5;
    this.target.pivot.set(this.centerX, this.centerY);
    this.target.position.set(this.centerX, this.centerY);
  }

  lineHit(index: number) {
    const sign = index % 2 ? 1 : -1;
    const strength = this.intensity * this.impactPulse * (this.cinematicPlan?.impulseScale ?? 1);
    this.xImpulse += sign * (this.mode === "poster" ? 18 : this.mode === "vortex" ? 9 : 6) * strength;
    this.yImpulse += (this.mode === "vortex" ? -sign * 12 : -4) * strength;
    this.zoomImpulse += (this.mode === "vortex" ? 0.085 : this.mode === "poster" ? 0.055 : 0.035) * strength;
    this.rotationImpulse += sign * (this.mode === "vortex" ? 0.032 : 0.012) * strength;
  }

  wordHit(index: number, audio: AudioBands) {
    const sign = index % 2 ? 1 : -1;
    const accent = (0.45 + audio.transient * 1.6 + audio.bass * 0.55)
      * this.intensity
      * this.impactPulse
      * (this.cinematicPlan?.impulseScale ?? 1);
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

    const microMotionScale = (this.cinematicPlan?.microMotionScale ?? 1) * this.cameraMotion;
    const driftX = Math.sin(time * 0.19)
      * (this.mode === "vortex" ? 4 : 1.4)
      * this.intensity
      * microMotionScale;
    const driftY = Math.cos(time * 0.15)
      * (this.mode === "neon" ? 2.1 : 1.1)
      * this.intensity
      * microMotionScale;
    const legacyRotation = this.mode === "vortex"
      ? Math.sin(time * 0.18) * 0.012
      : this.mode === "poster"
        ? Math.sin(time * 0.27) * 0.0032
        : Math.sin(time * 0.12) * 0.0021;
    const directedX = (this.cinematicPlan?.offsetX ?? 0) * this.width * 0.5 * this.cameraMotion;
    const directedY = (this.cinematicPlan?.offsetY ?? 0) * this.height * 0.5 * this.cameraMotion;
    const directedRotation = (this.cinematicPlan?.rotation ?? 0) * this.cameraMotion;
    const directedSkewX = (this.cinematicPlan?.skewX ?? 0) * this.cameraMotion;
    const directedSkewY = (this.cinematicPlan?.skewY ?? 0) * this.cameraMotion;

    this.target.position.set(
      this.centerX + directedX + driftX + this.xImpulse,
      this.centerY + directedY + driftY + this.yImpulse,
    );
    this.target.rotation = directedRotation
      + legacyRotation * microMotionScale
      + this.rotationImpulse
      + (audio.transient - 0.08) * 0.0045 * this.intensity * microMotionScale;
    this.target.skew.x = lerp(this.target.skew.x || 0, directedSkewX, 0.09);
    this.target.skew.y = lerp(this.target.skew.y || 0, directedSkewY, 0.09);

    const bassZoom = audio.bass
      * (this.mode === "vortex" ? 0.024 : 0.011)
      * this.intensity
      * microMotionScale;
    const directedScale = 1 + ((this.cinematicPlan?.scale ?? 1) - 1) * this.cameraMotion;
    const desiredScale = directedScale + bassZoom + this.zoomImpulse;
    this.target.scale.x = lerp(this.target.scale.x || 1, desiredScale, 0.12);
    this.target.scale.y = lerp(this.target.scale.y || 1, desiredScale, 0.12);
  }
}
