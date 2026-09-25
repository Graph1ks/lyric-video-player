import { Container, Filter, GlProgram, Graphics } from "pixi.js";
import type { AudioBands } from "@graph1ks/emo-audio-web";
import {
  clamp,
  type QualityMode,
  type VisualPalette,
} from "@graph1ks/emo-engine-core";

const vertex = \`
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
\`;

const fragment = \`
precision highp float;
in vec2 vTextureCoord;
uniform vec4 uInputSize;
uniform float uTime;
uniform float uPower;
uniform float uDetail;
uniform float uQuality;
uniform float uEnergy;
uniform float uMid;
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
    p = rot(0.55) * p * 2.03 + vec2(3.9, 1.7);
    amp *= 0.49;
  }
  return value;
}

float gaussian(vec2 p, vec2 center, vec2 scale) {
  vec2 q = (p - center) / scale;
  return exp(-dot(q, q));
}

vec3 finish(vec3 color, vec2 uv) {
  vec2 centered = uv - 0.5;
  float edge = smoothstep(0.18, 0.78, dot(centered * vec2(0.86, 1.0), centered * vec2(0.86, 1.0)));
  color *= 1.0 - edge * 0.34;
  float gate = smoothstep(0.0, 0.11, uv.y) * smoothstep(0.0, 0.11, 1.0 - uv.y);
  color *= mix(0.82, 1.0, gate);
  color = vec3(1.0) - exp(-max(color, vec3(0.0)) * (1.04 + uPower * 0.48));
  float grain = hash21(gl_FragCoord.xy + vec2(uTime * 19.0, -uTime * 13.0)) - 0.5;
  color += grain * mix(0.004, 0.011, uDetail);
  return clamp(pow(max(color, vec3(0.0)), vec3(0.95)), 0.0, 1.0);
}

void main(void) {
  float aspect = uInputSize.x / max(1.0, uInputSize.y);
  vec2 p = (vTextureCoord - 0.5) * vec2(aspect, 1.0);
  float detail = clamp(uDetail, 0.0, 1.0);
  float t = uTime * 0.12;

  vec3 background = vec3(uBackgroundR, uBackgroundG, uBackgroundB);
  vec3 surface = vec3(uSurfaceR, uSurfaceG, uSurfaceB);
  vec3 colorA = vec3(uColorAR, uColorAG, uColorAB);
  vec3 colorB = vec3(uColorBR, uColorBG, uColorBB);
  vec3 glow = vec3(uGlowR, uGlowG, uGlowB);

  // Filmic depth field: multiple independently drifting haze planes give the
  // frame actual atmospheric layering instead of generic translucent blobs.
  vec2 warp = vec2(
    fbm(p * 0.92 + vec2(t * 0.07, 2.4)),
    fbm(rot(-0.48) * p * 1.08 + vec2(-1.7, -t * 0.055))
  ) - 0.5;
  vec2 q = p + warp * mix(0.035, 0.085, detail);
  float hazeFar = fbm(q * 1.35 + vec2(t * 0.05, -t * 0.025));
  float hazeMid = fbm(rot(0.31) * q * 2.25 + vec2(-t * 0.082, 5.8));
  float hazeNear = fbm(rot(-0.17) * q * 4.1 + vec2(t * 0.13, -3.2));
  float fogBody = smoothstep(0.28, 0.82, hazeFar * 0.58 + hazeMid * 0.30 + hazeNear * 0.12);

  // A low, oblique depth plane gives the scene a composed stage horizon without
  // becoming a grid or a ray preset.
  float horizonY = 0.16 - q.x * 0.055 + sin(t * 0.37) * 0.012;
  float horizon = exp(-abs(q.y - horizonY) * mix(7.0, 11.0, detail));
  float floorMist = smoothstep(0.55, -0.42, q.y) * smoothstep(-0.72, 0.08, q.y);

  // Anamorphic lens-light structure is the paused-frame identity layer.
  vec2 flareCenter = vec2(0.24 + sin(t * 0.29) * 0.055, -0.08 + cos(t * 0.21) * 0.018);
  float anamorphic = exp(-abs(q.y - flareCenter.y) * mix(24.0, 38.0, detail))
    * exp(-abs(q.x - flareCenter.x) * 1.55);
  float flareCore = exp(-abs(q.y - flareCenter.y) * mix(80.0, 128.0, detail))
    * exp(-abs(q.x - flareCenter.x) * 3.7);
  float sourceBloom = gaussian(q, flareCenter, vec2(0.16, 0.105));

  // Lens ghosts are subordinate optical artifacts, not shape primitives.
  float ghostA = gaussian(q, -flareCenter * 0.48 + vec2(-0.05, 0.015), vec2(0.095, 0.115));
  float ghostB = gaussian(q, -flareCenter * 0.92 + vec2(0.08, -0.02), vec2(0.045, 0.075));
  float ghostRing = abs(ghostA - gaussian(q, -flareCenter * 0.48 + vec2(-0.05, 0.015), vec2(0.075, 0.09)));

  // Foreground shadow masses create controlled parallax and deep-focus framing.
  float foregroundNoise = fbm(q * vec2(0.72, 1.45) + vec2(t * 0.035, -4.7));
  float leftMask = smoothstep(-0.78, -0.18, -q.x + (foregroundNoise - 0.5) * 0.18);
  float rightMask = smoothstep(-0.78, -0.20, q.x + (foregroundNoise - 0.5) * 0.14);
  float foreground = clamp((leftMask + rightMask) * smoothstep(0.48, -0.62, q.y), 0.0, 1.0);

  float lightResponse = 0.82 + uEnergy * 0.16 + uMid * 0.08 + uTreble * 0.06;

  vec3 color = background;
  color += surface * fogBody * (0.12 + 0.18 * detail);
  color += mix(surface, colorA, 0.36) * horizon * (0.06 + 0.08 * fogBody);
  color += mix(surface, colorB, 0.22) * floorMist * fogBody * 0.08;

  color += mix(colorA, glow, 0.56) * anamorphic * 0.11 * lightResponse;
  color += mix(colorB, glow, 0.72) * flareCore * 0.34 * lightResponse;
  color += glow * sourceBloom * 0.19 * lightResponse;
  color += colorB * ghostRing * 0.09 * (0.7 + uTreble * 0.3);
  color += mix(colorA, colorB, 0.5) * ghostB * 0.045;

  // Fine dust is a depth cue only and does not own the visual identity.
  vec2 dustCell = floor((q + vec2(3.0)) * mix(62.0, 105.0, detail));
  float dustSeed = hash21(dustCell);
  float dust = step(0.9925 - detail * 0.0035, dustSeed);
  vec2 dustLocal = fract((q + vec2(3.0)) * mix(62.0, 105.0, detail)) - 0.5;
  dust *= 1.0 - smoothstep(0.0, 0.05, length(dustLocal));
  color += glow * dust * (0.09 + uTreble * 0.06);

  if (uQuality > 0.5) {
    float fineHaze = smoothstep(0.60, 0.84, fbm(rot(0.74) * q * 6.4 + vec2(-t * 0.11, t * 0.07)));
    color += mix(surface, glow, 0.24) * fineHaze * fogBody * 0.025;
  }

  color *= 1.0 - foreground * (0.28 + detail * 0.10);
  color += surface * foreground * 0.018;

  gl_FragColor = vec4(finish(color, vTextureCoord), 1.0);
}
\`;

type CinematicUniforms = {
  uTime: number;
  uPower: number;
  uDetail: number;
  uQuality: number;
  uEnergy: number;
  uMid: number;
  uTreble: number;
  uBackgroundR: number; uBackgroundG: number; uBackgroundB: number;
  uSurfaceR: number; uSurfaceG: number; uSurfaceB: number;
  uColorAR: number; uColorAG: number; uColorAB: number;
  uColorBR: number; uColorBG: number; uColorBB: number;
  uGlowR: number; uGlowG: number; uGlowB: number;
};

export class LegacyCinematicWorld {
  readonly container = new Container();

  private readonly surface = new Graphics();
  private readonly filter: Filter;
  private intensity = 1;
  private detail = 1;

  constructor() {
    this.filter = new Filter({
      glProgram: GlProgram.from({ vertex, fragment }),
      resources: {
        cinematicUniforms: {
          uTime: { value: 0, type: "f32" },
          uPower: { value: 1 / 3, type: "f32" },
          uDetail: { value: 1 / 3, type: "f32" },
          uQuality: { value: 1, type: "f32" },
          uEnergy: { value: 0, type: "f32" },
          uMid: { value: 0, type: "f32" },
          uTreble: { value: 0, type: "f32" },
          uBackgroundR: { value: 0.006, type: "f32" },
          uBackgroundG: { value: 0.012, type: "f32" },
          uBackgroundB: { value: 0.020, type: "f32" },
          uSurfaceR: { value: 0.035, type: "f32" },
          uSurfaceG: { value: 0.055, type: "f32" },
          uSurfaceB: { value: 0.078, type: "f32" },
          uColorAR: { value: 0.20, type: "f32" },
          uColorAG: { value: 0.72, type: "f32" },
          uColorAB: { value: 0.84, type: "f32" },
          uColorBR: { value: 0.84, type: "f32" },
          uColorBG: { value: 0.35, type: "f32" },
          uColorBB: { value: 0.22, type: "f32" },
          uGlowR: { value: 0.95, type: "f32" },
          uGlowG: { value: 0.96, type: "f32" },
          uGlowB: { value: 1.0, type: "f32" },
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
    this.write("uMid", audio.mid);
    this.write("uTreble", audio.treble);
    this.container.alpha = clamp(this.intensity, 0, 1);
  }

  private write(name: keyof CinematicUniforms, value: number) {
    const uniforms = (this.filter.resources.cinematicUniforms as { uniforms: CinematicUniforms }).uniforms;
    uniforms[name] = value;
  }

  private writeColor(prefix: "uBackground" | "uSurface" | "uColorA" | "uColorB" | "uGlow", color: number) {
    const r = ((color >> 16) & 0xff) / 255;
    const g = ((color >> 8) & 0xff) / 255;
    const b = (color & 0xff) / 255;
    this.write(\`\${prefix}R\` as keyof CinematicUniforms, r);
    this.write(\`\${prefix}G\` as keyof CinematicUniforms, g);
    this.write(\`\${prefix}B\` as keyof CinematicUniforms, b);
  }
}
