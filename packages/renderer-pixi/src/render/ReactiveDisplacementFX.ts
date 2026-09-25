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
uniform float uTime;
uniform float uAmount;
uniform float uBass;
uniform float uMid;
uniform float uTransient;
uniform float uMode;
uniform float uQuality;

float hash11(float p) {
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
}

void main(void) {
    vec2 uv = vTextureCoord;
    vec2 centered = uv - 0.5;
    vec2 warp = vec2(0.0);
    float quality = mix(0.62, 1.0, uQuality);
    float edgeDistance = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
    float edgeGuard = smoothstep(0.0, 0.055, edgeDistance);

    if (uMode < 0.5) {
        float band = floor(uv.y * 28.0 + uTime * 2.0);
        float gate = step(0.76, hash11(band + floor(uTime * 9.0)));
        float shove = (hash11(band * 3.17 + 4.2) - 0.5) * 2.0;
        warp.x += shove * gate * (0.0018 + 0.0005 * sin(uTime * 0.73)) * uAmount * quality;
        warp.y += sin(uv.x * 18.0 + uTime * 3.0) * 0.00075 * uAmount;
    } else if (uMode < 1.5) {
        float liquidX = sin(uv.y * 15.0 + uTime * 1.45) + sin(uv.y * 31.0 - uTime * 0.72) * 0.35;
        float liquidY = cos(uv.x * 12.0 - uTime * 1.15) + cos(uv.x * 27.0 + uTime * 0.58) * 0.28;
        warp += vec2(liquidX, liquidY)
            * (0.00115 + 0.00022 * sin(uTime * 0.47))
            * uAmount * quality;
    } else {
        float radius = length(centered);
        vec2 tangent = normalize(vec2(-centered.y, centered.x) + vec2(0.00001));
        float falloff = 1.0 - smoothstep(0.12, 0.74, radius);
        float swirl = (0.0028 + 0.0005 * sin(uTime * 0.39)) * falloff;
        float ripple = sin(radius * 52.0 - uTime * 4.2) * 0.00078;
        warp += tangent * swirl * uAmount * quality;
        warp += normalize(centered + vec2(0.00001)) * ripple * uAmount;
    }

    warp *= edgeGuard;
    vec2 sampleUv = clamp(uv + warp, vec2(0.001), vec2(0.999));
    vec4 source = texture2D(uTexture, sampleUv);
    gl_FragColor = vec4(source.rgb, 1.0);
}
`;

type DisplacementUniforms = {
  uTime: number;
  uAmount: number;
  uBass: number;
  uMid: number;
  uTransient: number;
  uMode: number;
  uQuality: number;
};

export class ReactiveDisplacementFX {
  readonly filter: Filter;

  private intensity = 1;
  private mix = 1;
  private quality: QualityMode = "cinema";
  private mode: SceneMode = "neon";

  constructor() {
    this.filter = new Filter({
      glProgram: GlProgram.from({ vertex, fragment }),
      resources: {
        displacementUniforms: {
          uTime: { value: 0, type: "f32" },
          uAmount: { value: 1, type: "f32" },
          uBass: { value: 0, type: "f32" },
          uMid: { value: 0, type: "f32" },
          uTransient: { value: 0, type: "f32" },
          uMode: { value: 1, type: "f32" },
          uQuality: { value: 1, type: "f32" },
        },
      },
    });
    // This is a full-frame filter. Pixi padding creates transparent texels
    // outside the source sprite; spatial taps can then pull that gutter back
    // into view as a black edge. Sampling is already clamped/edge-guarded, so
    // the correct full-screen contract is zero filter padding.
    this.filter.padding = 0;
  }

  setMode(mode: SceneMode) {
    this.mode = mode;
    this.write("uMode", mode === "poster" ? 0 : mode === "neon" ? 1 : 2);
  }

  setIntensity(value: number) {
    this.intensity = Math.max(0.2, Math.min(1.8, value));
  }

  setMix(value: number) {
    this.mix = Math.max(0, Math.min(3, value));
  }

  setQuality(quality: QualityMode) {
    this.quality = quality;
    this.write("uQuality", quality === "cinema" ? 1 : 0);
  }

  update(time: number, audio: AudioBands) {
    this.write("uTime", time);
    this.write("uAmount", this.intensity * this.mix * (this.quality === "cinema" ? 1 : 0.62));
    this.write("uBass", audio.bass);
    this.write("uMid", audio.mid);
    this.write("uTransient", audio.transient);
    this.write("uMode", this.mode === "poster" ? 0 : this.mode === "neon" ? 1 : 2);
  }

  private write(name: keyof DisplacementUniforms, value: number) {
    const uniforms = (this.filter.resources.displacementUniforms as { uniforms: DisplacementUniforms }).uniforms;
    uniforms[name] = value;
  }
}
