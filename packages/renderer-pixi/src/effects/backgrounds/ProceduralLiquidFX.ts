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
uniform float uAspect;
uniform float uBass;
uniform float uMid;
uniform float uEnergy;
uniform float uTransient;
uniform float uIntensity;
uniform float uMode;
uniform float uQuality;

float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float noise2(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
    float value = 0.0;
    value += noise2(p) * 0.54;
    p = p * 2.03 + vec2(11.7, 7.3);
    value += noise2(p) * 0.27;
    p = p * 2.01 + vec2(5.1, 13.9);
    value += noise2(p) * 0.135;
    p = p * 2.07 + vec2(17.2, 3.4);
    value += noise2(p) * 0.0675;
    return value;
}

void main(void) {
    vec4 source = texture2D(uTexture, vTextureCoord);
    vec2 uv = vTextureCoord;
    vec2 p = (uv - 0.5) * vec2(uAspect, 1.0);
    float speed = mix(0.12, 0.2, uQuality) * (0.8 + uEnergy * 0.7);
    float t = uTime * speed;

    float warpA = fbm(p * 2.1 + vec2(t, -t * 0.72));
    float warpB = fbm(p * 2.7 + vec2(-t * 0.57, t * 0.91) + warpA * 1.35);
    vec2 warped = p + vec2(warpA - 0.5, warpB - 0.5)
        * (0.2 + uMid * 0.18 + uTransient * 0.08)
        * uIntensity;

    float field = fbm(warped * (2.2 + uBass * 0.5) + vec2(t * 0.42, -t * 0.31));
    float vein = sin((warped.x * 4.2 + warped.y * 2.6 + field * 5.4) - uTime * 0.34);
    float highlight = smoothstep(0.28, 0.94, field + vein * 0.16 + uTransient * 0.16);

    vec3 darkColor;
    vec3 midColor;
    vec3 hotColor;

    if (uMode < 0.5) {
        darkColor = vec3(0.018, 0.012, 0.014);
        midColor = vec3(0.25, 0.018, 0.035);
        hotColor = vec3(1.0, 0.43, 0.48);
    } else if (uMode < 1.5) {
        darkColor = vec3(0.005, 0.025, 0.038);
        midColor = vec3(0.02, 0.31, 0.34);
        hotColor = vec3(0.36, 1.0, 0.92);
    } else {
        darkColor = vec3(0.025, 0.004, 0.018);
        midColor = vec3(0.38, 0.018, 0.07);
        hotColor = vec3(1.0, 0.33, 0.24);
    }

    float body = smoothstep(0.12, 0.9, field);
    vec3 color = mix(darkColor, midColor, body);
    color = mix(color, hotColor, highlight * (0.16 + uEnergy * 0.24));
    color += hotColor * pow(max(0.0, highlight), 2.0) * uBass * 0.1;

    float vignette = 1.0 - smoothstep(0.28, 0.82, length(p));
    color *= 0.68 + vignette * 0.38;
    color *= 0.8 + uIntensity * 0.2;

    gl_FragColor = vec4(max(color, vec3(0.0)), source.a);
}
`;

type LiquidUniforms = {
  uTime: number;
  uAspect: number;
  uBass: number;
  uMid: number;
  uEnergy: number;
  uTransient: number;
  uIntensity: number;
  uMode: number;
  uQuality: number;
};

export class ProceduralLiquidFX {
  readonly filter: Filter;

  private intensity = 1;
  private quality: QualityMode = "cinema";
  private mode: SceneMode = "neon";

  constructor() {
    this.filter = new Filter({
      glProgram: GlProgram.from({ vertex, fragment }),
      resources: {
        liquidUniforms: {
          uTime: { value: 0, type: "f32" },
          uAspect: { value: 1, type: "f32" },
          uBass: { value: 0, type: "f32" },
          uMid: { value: 0, type: "f32" },
          uEnergy: { value: 0, type: "f32" },
          uTransient: { value: 0, type: "f32" },
          uIntensity: { value: 1, type: "f32" },
          uMode: { value: 1, type: "f32" },
          uQuality: { value: 1, type: "f32" },
        },
      },
    });
    this.filter.padding = 0;
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

  resize(width: number, height: number) {
    this.write("uAspect", Math.max(0.25, width / Math.max(1, height)));
  }

  update(time: number, audio: AudioBands) {
    this.write("uTime", time);
    this.write("uBass", audio.bass);
    this.write("uMid", audio.mid);
    this.write("uEnergy", audio.energy);
    this.write("uTransient", audio.transient);
    this.write("uIntensity", this.intensity * (this.quality === "cinema" ? 1 : 0.72));
    this.write("uMode", this.mode === "poster" ? 0 : this.mode === "neon" ? 1 : 2);
  }

  private write(name: keyof LiquidUniforms, value: number) {
    const uniforms = (this.filter.resources.liquidUniforms as { uniforms: LiquidUniforms }).uniforms;
    uniforms[name] = value;
  }
}
