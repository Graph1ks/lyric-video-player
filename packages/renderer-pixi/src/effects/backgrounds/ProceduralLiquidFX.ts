import { Filter, GlProgram } from "pixi.js";
import type { AudioBands } from "@graph1ks/emo-audio-web";
import {
  clamp,
  type QualityMode,
  type SceneMode,
  type VisualPalette,
} from "@graph1ks/emo-engine-core";

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
uniform vec4 uInputSize;
uniform float uTime;
uniform float uAspect;
uniform float uBass;
uniform float uMid;
uniform float uEnergy;
uniform float uPower;
uniform float uMode;
uniform float uDetail;
uniform float uQuality;
uniform float uBackgroundR;
uniform float uBackgroundG;
uniform float uBackgroundB;
uniform float uSurfaceR;
uniform float uSurfaceG;
uniform float uSurfaceB;
uniform float uColorAR;
uniform float uColorAG;
uniform float uColorAB;
uniform float uColorBR;
uniform float uColorBG;
uniform float uColorBB;
uniform float uGlowR;
uniform float uGlowG;
uniform float uGlowB;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float smin(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / max(k, 0.0001);
  return min(a, b) - h * h * k * 0.25;
}

mat2 rot(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}

float field(vec3 p) {
  // Geometry is authored from absolute playback time only. Smoothed audio never
  // enters the SDF, so the liquid cannot pump, reverse or retopologize per beat.
  float t = uTime * 0.19;
  float d = 20.0;
  float count = mix(7.0, 12.0, clamp(uDetail, 0.0, 1.0));
  float fusion = mix(0.24, 0.42, clamp(uDetail, 0.0, 1.0));
  fusion *= mix(0.92, 1.12, uPower);

  for (int i = 0; i < 12; i++) {
    float fi = float(i);
    float enabled = step(fi + 0.5, count);
    float seed = fi * 1.6180339 + 0.37;

    vec3 center = vec3(
      sin(t * (0.61 + mod(fi, 3.0) * 0.08) + seed) * (1.15 + 0.16 * sin(seed * 2.3))
        + cos(t * 0.23 + seed * 0.73) * 0.38,
      cos(t * (0.47 + mod(fi, 4.0) * 0.055) + seed * 1.37) * 0.88
        + sin(t * 0.31 + seed * 0.42) * 0.30,
      sin(t * (0.39 + mod(fi, 5.0) * 0.035) + seed * 0.91) * 0.62
    );

    float radius = 0.42
      + 0.18 * (0.5 + 0.5 * sin(seed * 3.1))
      + 0.05 * sin(t * 0.53 + seed);
    vec3 q = p - center;
    q.y *= 0.82 + 0.08 * sin(seed);
    q.xz = rot(0.18 * sin(t * 0.17 + seed)) * q.xz;
    float blob = length(q) - radius;
    d = mix(d, smin(d, blob, fusion), enabled);
  }

  // One broad flowing body keeps the frame reading as a continuous fluid mass
  // rather than a collection of isolated metaballs.
  vec3 ribbonP = p;
  ribbonP.y -= sin(p.x * 0.72 + t * 0.54) * 0.18;
  ribbonP.z -= cos(p.x * 0.48 - t * 0.31) * 0.14;
  float ribbon = length(vec2(ribbonP.y * 0.82, ribbonP.z * 1.08)) - mix(0.30, 0.42, uDetail);
  d = smin(d, ribbon, fusion * 0.82);

  return d;
}

vec3 normalAt(vec3 p) {
  float epsilon = mix(0.008, 0.0036, clamp(uDetail, 0.0, 1.0));
  vec2 e = vec2(epsilon, -epsilon);
  return normalize(
    e.xyy * field(p + e.xyy)
    + e.yyx * field(p + e.yyx)
    + e.yxy * field(p + e.yxy)
    + e.xxx * field(p + e.xxx)
  );
}

vec3 finish(vec3 color) {
  color = vec3(1.0) - exp(-max(color, vec3(0.0)) * (1.0 + uPower * 0.65));
  color = pow(color, vec3(0.94));
  float grain = hash21(gl_FragCoord.xy + vec2(uTime * 17.0, -uTime * 11.0)) - 0.5;
  color += grain * mix(0.003, 0.009, uDetail);
  return clamp(color, 0.0, 1.0);
}

void main(void) {
  vec2 uv = vTextureCoord;
  vec2 p = (uv - 0.5) * vec2(uAspect, 1.0);

  vec3 background = vec3(uBackgroundR, uBackgroundG, uBackgroundB);
  vec3 surface = vec3(uSurfaceR, uSurfaceG, uSurfaceB);
  vec3 colorA = vec3(uColorAR, uColorAG, uColorAB);
  vec3 colorB = vec3(uColorBR, uColorBG, uColorBB);
  vec3 glow = vec3(uGlowR, uGlowG, uGlowB);

  float stage = smoothstep(0.0, 0.10, uPower);
  float modeScale = uMode < 0.5 ? 3.20 : uMode < 1.5 ? 2.86 : 2.68;
  vec3 ro = vec3(p * modeScale, 4.45);
  ro.xy = rot((uMode - 1.0) * 0.055) * ro.xy;
  vec3 rd = normalize(vec3(p * 0.055, -1.0));

  float travel = 0.0;
  float nearest = 10.0;
  bool hit = false;
  vec3 hitPoint = vec3(0.0);

  // Fixed upper bound keeps shader compilation predictable; quality changes the
  // early-out budget while preserving the same material identity.
  float maxSteps = mix(42.0, 58.0, uQuality);
  for (int stepIndex = 0; stepIndex < 58; stepIndex++) {
    if (float(stepIndex) >= maxSteps) break;
    vec3 samplePoint = ro + rd * travel;
    float distance = field(samplePoint);
    nearest = min(nearest, distance);
    if (distance < 0.0045) {
      hit = true;
      hitPoint = samplePoint;
      break;
    }
    travel += max(distance * 0.82, 0.003);
    if (travel > 8.4) break;
  }

  float ambientWell = exp(-dot(p - vec2(0.12, -0.15), p - vec2(0.12, -0.15)) * 1.5);
  vec3 color = background;
  color += mix(surface, colorB, 0.22) * ambientWell * 0.055 * stage;

  if (hit) {
    vec3 n = normalAt(hitPoint);
    vec3 view = -rd;
    vec3 keyLight = normalize(vec3(-0.62, 0.78, 1.45));
    vec3 rimLight = normalize(vec3(0.55, -0.28, 1.05));

    // Fine material ripples alter normals only; topology remains the SDF above.
    float microA = sin(hitPoint.x * mix(7.0, 16.0, uDetail) + hitPoint.y * 3.2 + uTime * 0.07);
    float microB = sin(hitPoint.y * mix(8.0, 18.0, uDetail) - hitPoint.x * 2.7 - uTime * 0.052);
    n = normalize(n + vec3(microA, -microB, (microA + microB) * 0.30) * mix(0.008, 0.038, uDetail));

    float diffuse = max(dot(n, keyLight), 0.0);
    float facing = max(dot(n, view), 0.0);
    float fresnel = pow(1.0 - facing, mix(3.2, 1.9, uDetail));
    float back = max(dot(n, rimLight), 0.0);
    vec3 halfVector = normalize(keyLight + view);
    float specular = pow(max(dot(n, halfVector), 0.0), mix(42.0, 94.0, uDetail));
    float broadSpec = pow(max(dot(n, halfVector), 0.0), mix(7.0, 13.0, uDetail));

    float flow = 0.5 + 0.5 * sin(
      hitPoint.x * 2.1
      + hitPoint.y * 1.25
      + hitPoint.z * 3.0
      - uTime * 0.10
      + sin(hitPoint.y * 4.2 + uTime * 0.045) * 1.2
    );
    vec3 body = mix(surface, colorA, clamp(diffuse * 0.50 + flow * 0.34, 0.0, 1.0));
    body = mix(body, colorB, fresnel * 0.44);
    body *= 0.30 + diffuse * 0.86;

    // Audio is restricted to emissive/material response.
    float materialResponse = 0.86 + uEnergy * 0.13 + uMid * 0.07 + uBass * 0.05;
    body += mix(colorB, glow, 0.58) * fresnel * (0.34 + back * 0.42) * materialResponse;
    body += mix(glow, vec3(1.0), 0.32) * (specular * 0.54 + broadSpec * 0.065) * materialResponse;

    float veinSignal = 0.5 + 0.5 * sin(
      hitPoint.x * mix(4.2, 8.6, uDetail)
      + sin(hitPoint.y * 3.7 - uTime * 0.072) * 2.0
      + hitPoint.z * 4.8
    );
    float veins = smoothstep(0.77, 0.965, veinSignal);
    body += mix(colorA, glow, 0.20) * veins * mix(0.025, 0.10, uDetail) * materialResponse;

    float depthFade = clamp((travel - 4.2) * 0.055, 0.0, 0.20);
    body = mix(body, background, depthFade);
    color = mix(color, body, stage);
  } else {
    float nearGlow = exp(-max(nearest, 0.0) * 13.0);
    color += mix(colorA, glow, 0.30) * nearGlow * 0.09 * stage;
  }

  float vignette = 1.0 - smoothstep(0.30, 0.86, dot(p * vec2(0.72, 1.0), p * vec2(0.72, 1.0)));
  color *= 0.74 + vignette * 0.30;

  color = finish(color);\n  gl_FragColor = vec4(max(color, vec3(0.0)), 1.0);
}
`;

type LiquidUniforms = {
  uTime: number;
  uAspect: number;
  uBass: number;
  uMid: number;
  uEnergy: number;
  uPower: number;
  uMode: number;
  uDetail: number;
  uQuality: number;
  uBackgroundR: number; uBackgroundG: number; uBackgroundB: number;
  uSurfaceR: number; uSurfaceG: number; uSurfaceB: number;
  uColorAR: number; uColorAG: number; uColorAB: number;
  uColorBR: number; uColorBG: number; uColorBB: number;
  uGlowR: number; uGlowG: number; uGlowB: number;
};

export class ProceduralLiquidFX {
  readonly filter: Filter;

  private intensity = 1;
  private detail = 1;
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
          uPower: { value: 1 / 3, type: "f32" },
          uMode: { value: 1, type: "f32" },
          uDetail: { value: 1 / 3, type: "f32" },
          uQuality: { value: 1, type: "f32" },
          uBackgroundR: { value: 0.006, type: "f32" },
          uBackgroundG: { value: 0.020, type: "f32" },
          uBackgroundB: { value: 0.028, type: "f32" },
          uSurfaceR: { value: 0.025, type: "f32" },
          uSurfaceG: { value: 0.12, type: "f32" },
          uSurfaceB: { value: 0.14, type: "f32" },
          uColorAR: { value: 0.22, type: "f32" },
          uColorAG: { value: 0.92, type: "f32" },
          uColorAB: { value: 0.84, type: "f32" },
          uColorBR: { value: 0.48, type: "f32" },
          uColorBG: { value: 0.30, type: "f32" },
          uColorBB: { value: 0.96, type: "f32" },
          uGlowR: { value: 0.92, type: "f32" },
          uGlowG: { value: 1.0, type: "f32" },
          uGlowB: { value: 0.98, type: "f32" },
        },
      },
    });
    this.filter.padding = 0;
  }

  setMode(mode: SceneMode) {
    this.mode = mode;
    this.write("uMode", mode === "poster" ? 0 : mode === "neon" ? 1 : 2);
  }

  setPalette(palette: VisualPalette) {
    this.writeColor("uBackground", palette.background);
    this.writeColor("uSurface", palette.surface);
    this.writeColor("uColorA", palette.accentA);
    this.writeColor("uColorB", palette.accentB);
    this.writeColor("uGlow", palette.glow);
  }

  setIntensity(value: number) {
    this.intensity = clamp(value, 0, 3);
    this.write("uPower", clamp(this.intensity / 3));
  }

  setDetail(value: number) {
    this.detail = clamp(value, 0, 3);
    this.write("uDetail", clamp(this.detail / 3));
  }

  setQuality(quality: QualityMode) {
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
    this.write("uPower", clamp(this.intensity / 3));
    this.write("uMode", this.mode === "poster" ? 0 : this.mode === "neon" ? 1 : 2);
    this.write("uDetail", clamp(this.detail / 3));
  }

  private write(name: keyof LiquidUniforms, value: number) {
    const uniforms = (this.filter.resources.liquidUniforms as { uniforms: LiquidUniforms }).uniforms;
    uniforms[name] = value;
  }

  private writeColor(prefix: "uBackground" | "uSurface" | "uColorA" | "uColorB" | "uGlow", color: number) {
    const r = ((color >> 16) & 0xff) / 255;
    const g = ((color >> 8) & 0xff) / 255;
    const b = (color & 0xff) / 255;
    this.write(`${prefix}R` as keyof LiquidUniforms, r);
    this.write(`${prefix}G` as keyof LiquidUniforms, g);
    this.write(`${prefix}B` as keyof LiquidUniforms, b);
  }
}
