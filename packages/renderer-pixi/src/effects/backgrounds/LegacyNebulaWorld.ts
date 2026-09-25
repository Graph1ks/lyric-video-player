import { Container, Filter, GlProgram, Graphics } from "pixi.js";
import type { AudioBands } from "@graph1ks/emo-audio-web";
import {
  clamp,
  type QualityMode,
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
uniform float uPower;
uniform float uDetail;
uniform float uQuality;
uniform float uEnergy;
uniform float uTreble;
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

mat2 rot(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
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
  float amp = 0.52;
  for (int i = 0; i < 5; i++) {
    value += amp * noise2(p);
    p = rot(0.57) * p * 2.03 + vec2(3.7, 1.9);
    amp *= 0.49;
  }
  return value;
}

float ridged(vec2 p) {
  float value = 0.0;
  float amp = 0.55;
  for (int i = 0; i < 4; i++) {
    float n = 1.0 - abs(noise2(p) * 2.0 - 1.0);
    value += n * n * amp;
    p = rot(-0.47) * p * 2.11 + vec2(-2.1, 4.3);
    amp *= 0.48;
  }
  return value;
}

float cloudField(vec2 p, float t) {
  vec2 q = vec2(
    fbm(p * 0.78 + vec2(t * 0.045, -t * 0.021)),
    fbm(rot(0.73) * p * 0.82 + vec2(-t * 0.028, t * 0.038) + 8.4)
  );
  float warped = fbm(
    rot(-0.19) * p * 1.19
      + (q - 0.5) * 1.82
      + vec2(t * 0.016, -t * 0.011)
  );
  return warped * 0.76 + (q.x + q.y) * 0.12;
}

vec3 finish(vec3 color, vec2 uv) {
  vec2 centered = uv - 0.5;
  float vignette = 1.0 - smoothstep(0.32, 0.78, dot(centered, centered));
  color *= 0.72 + vignette * 0.34;
  color = vec3(1.0) - exp(-max(color, vec3(0.0)) * (1.12 + uPower * 0.42));
  float grain = hash21(gl_FragCoord.xy + vec2(uTime * 17.3, -uTime * 11.7)) - 0.5;
  color += grain * mix(0.006, 0.014, uDetail);
  return clamp(pow(max(color, vec3(0.0)), vec3(0.94)), 0.0, 1.0);
}

void main(void) {
  float aspect = uInputSize.x / max(1.0, uInputSize.y);
  vec2 p = (vTextureCoord - 0.5) * vec2(aspect, 1.0);
  float t = uTime * 0.16;
  float detail = clamp(uDetail, 0.0, 1.0);

  vec3 background = vec3(uBackgroundR, uBackgroundG, uBackgroundB);
  vec3 surface = vec3(uSurfaceR, uSurfaceG, uSurfaceB);
  vec3 colorA = vec3(uColorAR, uColorAG, uColorAB);
  vec3 colorB = vec3(uColorBR, uColorBG, uColorBB);
  vec3 glow = vec3(uGlowR, uGlowG, uGlowB);

  // Three independently warped depth slabs form one continuous gas volume.
  // Nothing here is made from geometric circles or alpha blobs.
  float d0 = cloudField(p * 1.12 + vec2(-0.18, 0.06), t);
  float d1 = cloudField(rot(-0.19) * p * 1.55 + vec2(0.72, -0.31), t * 0.73 + 9.0);
  float d2 = cloudField(rot(0.27) * p * 2.08 + vec2(-1.13, 0.84), t * 0.51 + 18.0);

  float body = smoothstep(0.39, 0.72, d0 * 0.68 + d1 * 0.22 + d2 * 0.10);
  float inner = smoothstep(0.53, 0.82, d0 * 0.55 + d1 * 0.31 + d2 * 0.14);
  float cavities = smoothstep(0.54, 0.77, fbm(rot(0.81) * p * 0.92 - vec2(t * 0.025, t * 0.018)));

  float ridgeA = ridged(p * mix(2.1, 3.4, detail) + vec2(t * 0.055, -t * 0.026));
  float ridgeB = ridged(rot(0.64) * p * mix(3.2, 5.0, detail) + vec2(-t * 0.036, 7.2));
  float filaments = smoothstep(0.57, 0.91, ridgeA * 0.63 + ridgeB * 0.37);
  filaments *= smoothstep(0.22, 0.64, body + inner);

  // Cheap density-gradient lighting gives the gas actual folded volume.
  vec2 e = vec2(0.010 + (1.0 - detail) * 0.008, 0.0);
  float dx = cloudField((p + e.xy) * 1.12 + vec2(-0.18, 0.06), t)
           - cloudField((p - e.xy) * 1.12 + vec2(-0.18, 0.06), t);
  float dy = cloudField((p + e.yx) * 1.12 + vec2(-0.18, 0.06), t)
           - cloudField((p - e.yx) * 1.12 + vec2(-0.18, 0.06), t);
  vec3 normal = normalize(vec3(-dx * 16.0, -dy * 16.0, 1.0));
  vec3 lightDir = normalize(vec3(-0.48, 0.62, 0.86));
  float diffuse = 0.48 + 0.52 * max(0.0, dot(normal, lightDir));
  float backlight = pow(max(0.0, dot(normal, normalize(vec3(0.61, -0.34, 0.92)))), 3.0);

  float colorFlow = fbm(p * 0.74 + vec2(-t * 0.018, t * 0.014));
  vec3 gas = mix(colorA, colorB, smoothstep(0.28, 0.79, colorFlow + d1 * 0.19));
  gas = mix(gas, surface, cavities * 0.24);

  vec3 color = background;
  color += surface * body * (0.20 + diffuse * 0.18);
  color += gas * body * (0.19 + diffuse * 0.43);
  color += mix(colorB, glow, 0.32) * inner * backlight * 0.36;

  // Audio is light/material response only; cloud topology and flow stay time-owned.
  float emission = 0.72 + uEnergy * 0.24 + uTreble * 0.10;
  color += mix(colorA, glow, 0.62) * filaments * (0.11 + 0.22 * detail) * emission;

  // Sparse stars are secondary scale cues behind thin gas, never the identity layer.
  vec2 starCell = floor((p + vec2(3.0)) * mix(58.0, 92.0, detail));
  float starSeed = hash21(starCell);
  float star = step(0.992 - detail * 0.003, starSeed);
  vec2 local = fract((p + vec2(3.0)) * mix(58.0, 92.0, detail)) - 0.5;
  star *= 1.0 - smoothstep(0.0, 0.055, length(local));
  star *= 1.0 - smoothstep(0.22, 0.78, body);
  color += glow * star * (0.22 + uTreble * 0.16);

  // Cinema keeps one extra wispy micro-layer; performance keeps the same composition.
  if (uQuality > 0.5) {
    float wisps = smoothstep(0.72, 0.94, ridged(rot(-0.27) * p * 6.2 + vec2(t * 0.08, 2.8)));
    color += mix(colorB, glow, 0.48) * wisps * body * 0.055;
  }

  gl_FragColor = vec4(finish(color, vTextureCoord), 1.0);
}
`;

type NebulaUniforms = {
  uTime: number;
  uPower: number;
  uDetail: number;
  uQuality: number;
  uEnergy: number;
  uTreble: number;
  uBackgroundR: number; uBackgroundG: number; uBackgroundB: number;
  uSurfaceR: number; uSurfaceG: number; uSurfaceB: number;
  uColorAR: number; uColorAG: number; uColorAB: number;
  uColorBR: number; uColorBG: number; uColorBB: number;
  uGlowR: number; uGlowG: number; uGlowB: number;
};

export class LegacyNebulaWorld {
  readonly container = new Container();

  private readonly surface = new Graphics();
  private readonly filter: Filter;
  private intensity = 1;
  private detail = 1;
  private quality: QualityMode = "cinema";

  constructor() {
    this.filter = new Filter({
      glProgram: GlProgram.from({ vertex, fragment }),
      resources: {
        nebulaUniforms: {
          uTime: { value: 0, type: "f32" },
          uPower: { value: 1 / 3, type: "f32" },
          uDetail: { value: 1 / 3, type: "f32" },
          uQuality: { value: 1, type: "f32" },
          uEnergy: { value: 0, type: "f32" },
          uTreble: { value: 0, type: "f32" },
          uBackgroundR: { value: 0.008, type: "f32" },
          uBackgroundG: { value: 0.025, type: "f32" },
          uBackgroundB: { value: 0.045, type: "f32" },
          uSurfaceR: { value: 0.03, type: "f32" },
          uSurfaceG: { value: 0.10, type: "f32" },
          uSurfaceB: { value: 0.14, type: "f32" },
          uColorAR: { value: 0.42, type: "f32" },
          uColorAG: { value: 1.0, type: "f32" },
          uColorAB: { value: 0.92, type: "f32" },
          uColorBR: { value: 0.50, type: "f32" },
          uColorBG: { value: 0.32, type: "f32" },
          uColorBB: { value: 1.0, type: "f32" },
          uGlowR: { value: 0.91, type: "f32" },
          uGlowG: { value: 1.0, type: "f32" },
          uGlowB: { value: 0.98, type: "f32" },
        },
      },
    });
    this.filter.padding = 0;
    this.surface.filters = [this.filter];
    this.container.addChild(this.surface);
    this.container.visible = false;
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

  setQuality(value: QualityMode) {
    this.quality = value;
    this.write("uQuality", value === "cinema" ? 1 : 0);
  }

  resize(w: number, h: number) {
    this.surface
      .clear()
      .rect(0, 0, Math.max(1, w), Math.max(1, h))
      .fill({ color: 0xffffff, alpha: 1 });
  }

  update(time: number, audio: AudioBands) {
    if (!this.container.visible) return;
    this.write("uTime", time);
    this.write("uEnergy", audio.energy);
    this.write("uTreble", audio.treble);
    this.container.alpha = clamp(this.intensity, 0, 1);
  }

  private write(name: keyof NebulaUniforms, value: number) {
    const uniforms = (this.filter.resources.nebulaUniforms as { uniforms: NebulaUniforms }).uniforms;
    uniforms[name] = value;
  }

  private writeColor(prefix: "uBackground" | "uSurface" | "uColorA" | "uColorB" | "uGlow", color: number) {
    const r = ((color >> 16) & 0xff) / 255;
    const g = ((color >> 8) & 0xff) / 255;
    const b = (color & 0xff) / 255;
    this.write(`${prefix}R` as keyof NebulaUniforms, r);
    this.write(`${prefix}G` as keyof NebulaUniforms, g);
    this.write(`${prefix}B` as keyof NebulaUniforms, b);
  }
}
