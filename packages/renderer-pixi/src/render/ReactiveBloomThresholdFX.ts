import { Filter, GlProgram } from "pixi.js";
import type { AudioBands } from "@graph1ks/emo-audio-web";
import type { QualityMode, SceneMode } from "@graph1ks/emo-engine-core";

const vertex = `
in vec2 aPosition;
out vec2 vTextureCoord;
uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

vec4 filterVertexPosition(void) {
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
    return vec4(position, 0.0, 1.0);
}

vec2 filterTextureCoord(void) {
    return aPosition * (uOutputFrame.zw * uInputSize.zw);
}

void main(void) {
    gl_Position = filterVertexPosition();
    vTextureCoord = filterTextureCoord();
}
`;

const fragment = `
precision highp float;
in vec2 vTextureCoord;
uniform sampler2D uTexture;
uniform float uThreshold;
uniform float uKnee;
uniform float uGain;
uniform float uMode;

float luma(vec3 color) {
    return dot(color, vec3(0.2126, 0.7152, 0.0722));
}

void main(void) {
    vec4 source = texture2D(uTexture, vTextureCoord);
    float brightness = luma(source.rgb);
    float knee = max(0.001, uKnee);

    float softMask = smoothstep(uThreshold - knee, uThreshold + knee, brightness);
    float hardMask = clamp((brightness - uThreshold) / max(0.001, 1.0 - uThreshold), 0.0, 1.0);
    float mask = clamp(max(hardMask, softMask * 0.58), 0.0, 1.0);

    vec3 tint = vec3(1.0);
    if (uMode < 0.5) {
        tint = vec3(1.05, 0.94, 0.96);
    } else if (uMode < 1.5) {
        tint = vec3(0.93, 1.05, 1.08);
    } else {
        tint = vec3(1.08, 0.94, 0.94);
    }

    vec3 bloom = source.rgb * tint * mask * uGain;
    gl_FragColor = vec4(bloom, source.a * mask);
}
`;

type BloomUniforms = {
  uThreshold: number;
  uKnee: number;
  uGain: number;
  uMode: number;
};

export class ReactiveBloomThresholdFX {
  readonly filter: Filter;

  private intensity = 1;
  private quality: QualityMode = "cinema";
  private mode: SceneMode = "neon";

  constructor() {
    this.filter = new Filter({
      glProgram: GlProgram.from({ vertex, fragment }),
      resources: {
        bloomUniforms: {
          uThreshold: { value: 0.52, type: "f32" },
          uKnee: { value: 0.12, type: "f32" },
          uGain: { value: 1, type: "f32" },
          uMode: { value: 1, type: "f32" },
        },
      },
    });
    this.filter.padding = 20;
  }

  setMode(mode: SceneMode) {
    this.mode = mode;
    this.write("uMode", mode === "poster" ? 0 : mode === "neon" ? 1 : 2);
  }

  setIntensity(value: number) {
    this.intensity = Math.max(0.2, Math.min(1.8, value));
  }

  setQuality(quality: QualityMode) {
    this.quality = quality;
  }

  update(_time: number, audio: AudioBands) {
    const sceneThreshold = this.mode === "poster" ? 0.58 : this.mode === "vortex" ? 0.48 : 0.5;
    const qualityLift = this.quality === "cinema" ? 0 : 0.1;
    const intensityDrop = Math.max(-0.035, Math.min(0.065, (this.intensity - 1) * 0.055));
    const audioDrop = audio.energy * 0.045 + audio.transient * 0.09;
    const threshold = Math.max(0.32, Math.min(0.76, sceneThreshold + qualityLift - intensityDrop - audioDrop));

    const knee = this.quality === "cinema" ? 0.135 : 0.085;
    const gainBase = this.quality === "cinema" ? 1.05 : 0.72;
    const gain = gainBase * (0.8 + this.intensity * 0.2) * (1 + audio.energy * 0.25 + audio.transient * 0.52);

    this.write("uThreshold", threshold);
    this.write("uKnee", knee);
    this.write("uGain", Math.min(1.75, gain));
    this.write("uMode", this.mode === "poster" ? 0 : this.mode === "neon" ? 1 : 2);
  }

  private write(name: keyof BloomUniforms, value: number) {
    const uniforms = (this.filter.resources.bloomUniforms as { uniforms: BloomUniforms }).uniforms;
    uniforms[name] = value;
  }
}
