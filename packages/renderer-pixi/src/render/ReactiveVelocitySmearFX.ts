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
uniform vec4 uInputSize;
uniform float uTime;
uniform float uAmount;
uniform float uBass;
uniform float uEnergy;
uniform float uTransient;
uniform float uMode;
uniform float uQuality;

vec2 safeNormalize(vec2 value) {
    float len = max(length(value), 0.00001);
    return value / len;
}

void main(void) {
    vec2 uv = vTextureCoord;
    vec2 centered = uv - 0.5;
    float edgeDistance = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
    float edgeGuard = smoothstep(0.0, 0.065, edgeDistance);
    vec2 direction;

    if (uMode < 0.5) {
        direction = safeNormalize(vec2(1.0, -0.07));
    } else if (uMode < 1.5) {
        direction = safeNormalize(vec2(0.86, 0.33));
    } else {
        direction = safeNormalize(vec2(-centered.y, centered.x) + vec2(0.0001));
    }

    float sceneScale = uMode < 0.5 ? 1.0 : uMode < 1.5 ? 0.72 : 1.18;
    float motion = (0.35 + uBass * 1.8 + uEnergy * 1.2 + uTransient * 8.5)
        * uAmount
        * sceneScale
        * mix(0.58, 1.0, uQuality);

    if (uMode > 1.5) {
        float centerFalloff = smoothstep(0.08, 0.7, length(centered));
        motion *= mix(0.35, 1.0, centerFalloff);
    }

    vec2 stepUv = direction * uInputSize.zw * motion;

    vec4 sample0 = texture2D(uTexture, clamp(uv, vec2(0.001), vec2(0.999)));
    vec4 sample1 = texture2D(uTexture, clamp(uv - stepUv * 0.70, vec2(0.001), vec2(0.999)));
    vec4 sample2 = texture2D(uTexture, clamp(uv - stepUv * 1.45, vec2(0.001), vec2(0.999)));
    vec4 sample3 = texture2D(uTexture, clamp(uv - stepUv * 2.35, vec2(0.001), vec2(0.999)));
    vec4 sample4 = texture2D(uTexture, clamp(uv - stepUv * 3.45, vec2(0.001), vec2(0.999)));
    vec4 sample5 = texture2D(uTexture, clamp(uv + stepUv * 0.55, vec2(0.001), vec2(0.999)));
    vec4 sample6 = texture2D(uTexture, clamp(uv + stepUv * 1.10, vec2(0.001), vec2(0.999)));

    float impact = clamp(uTransient * 1.7 + uBass * 0.35, 0.0, 1.0);
    float trailMix = clamp((0.16 + impact * 0.56) * uAmount, 0.0, 0.82) * edgeGuard;

    vec4 trail =
        sample0 * 0.38 +
        sample1 * 0.20 +
        sample2 * 0.14 +
        sample3 * 0.10 +
        sample4 * 0.07 +
        sample5 * 0.07 +
        sample6 * 0.04;

    if (uMode < 0.5) {
        float gate = smoothstep(0.5, 0.9, sin((uv.y * 22.0 + uTime * 2.0) * 3.14159265) * 0.5 + 0.5);
        trailMix *= mix(0.62, 1.0, gate);
    }

    vec4 result = mix(sample0, trail, trailMix);
    gl_FragColor = vec4(result.rgb, 1.0);
}
`;

type SmearUniforms = {
  uTime: number;
  uAmount: number;
  uBass: number;
  uEnergy: number;
  uTransient: number;
  uMode: number;
  uQuality: number;
};

export class ReactiveVelocitySmearFX {
  readonly filter: Filter;

  private intensity = 1;
  private quality: QualityMode = "cinema";
  private mode: SceneMode = "neon";

  constructor() {
    this.filter = new Filter({
      glProgram: GlProgram.from({ vertex, fragment }),
      resources: {
        smearUniforms: {
          uTime: { value: 0, type: "f32" },
          uAmount: { value: 1, type: "f32" },
          uBass: { value: 0, type: "f32" },
          uEnergy: { value: 0, type: "f32" },
          uTransient: { value: 0, type: "f32" },
          uMode: { value: 1, type: "f32" },
          uQuality: { value: 1, type: "f32" },
        },
      },
    });
    this.filter.padding = 24;
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
    this.write("uQuality", quality === "cinema" ? 1 : 0);
  }

  update(time: number, audio: AudioBands) {
    this.write("uTime", time);
    this.write("uAmount", this.intensity * (this.quality === "cinema" ? 1 : 0.48));
    this.write("uBass", audio.bass);
    this.write("uEnergy", audio.energy);
    this.write("uTransient", audio.transient);
    this.write("uMode", this.mode === "poster" ? 0 : this.mode === "neon" ? 1 : 2);
  }

  private write(name: keyof SmearUniforms, value: number) {
    const uniforms = (this.filter.resources.smearUniforms as { uniforms: SmearUniforms }).uniforms;
    uniforms[name] = value;
  }
}
