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
uniform float uBurst;
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

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
mat2 rot(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}
float noise2(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.52;
  for (int i = 0; i < 4; i++) {
    v += a * noise2(p);
    p = rot(0.54) * p * 2.04 + vec2(4.2, -2.7);
    a *= 0.49;
  }
  return v;
}
float angleDelta(float a, float b) {
  return atan(sin(a - b), cos(a - b));
}
vec3 finish(vec3 color, vec2 uv) {
  vec2 c = uv - 0.5;
  float vignette = 1.0 - smoothstep(0.22, 0.74, dot(c, c));
  color *= 0.76 + vignette * 0.30;
  color = vec3(1.0) - exp(-max(color, vec3(0.0)) * (1.08 + uPower * 0.52));
  float grain = hash21(gl_FragCoord.xy + uTime * 13.0) - 0.5;
  color += grain * 0.006;
  return clamp(pow(max(color, vec3(0.0)), vec3(0.94)), 0.0, 1.0);
}

void main(void) {
  float aspect = uInputSize.x / max(1.0, uInputSize.y);
  vec2 p = (vTextureCoord - 0.5) * vec2(aspect, 1.0);
  p.y += 0.08;
  float t = uTime * 0.12;
  float detail = clamp(uDetail, 0.0, 1.0);

  vec3 background = vec3(uBackgroundR, uBackgroundG, uBackgroundB);
  vec3 surface = vec3(uSurfaceR, uSurfaceG, uSurfaceB);
  vec3 colorA = vec3(uColorAR, uColorAG, uColorAB);
  vec3 colorB = vec3(uColorBR, uColorBG, uColorBB);
  vec3 glow = vec3(uGlowR, uGlowG, uGlowB);

  // Participating-media haze: the shafts live inside atmosphere, not on top of it.
  float hazeA = fbm(p * 1.55 + vec2(t * 0.045, -t * 0.022));
  float hazeB = fbm(rot(0.73) * p * 3.4 + vec2(-t * 0.034, 5.2));
  float atmosphere = smoothstep(0.18, 0.86, hazeA * 0.72 + hazeB * 0.28);
  vec3 color = background + surface * atmosphere * 0.16;

  float totalShaft = 0.0;
  vec3 shaftColor = vec3(0.0);

  // Seven broad cones with soft shoulders. Geometry is absolute-time authored;
  // audio never changes source position, cone angle or width.
  for (int i = 0; i < 7; i++) {
    float k = float(i);
    float seed = hash11(k * 17.71 + 3.4);
    float sourceBand = mod(k, 3.0);
    vec2 source;
    if (sourceBand < 0.5) {
      source = vec2(-0.70 + seed * 0.36, -0.60);
    } else if (sourceBand < 1.5) {
      source = vec2(-0.13 + seed * 0.29, -0.64);
    } else {
      source = vec2(0.42 + seed * 0.36, -0.59);
    }
    source.x += sin(t * (0.31 + seed * 0.09) + k * 1.7) * 0.018;

    vec2 ray = p - source;
    float distanceFromSource = length(ray);
    float angle = atan(ray.x, ray.y);
    float aim = (-0.24 + k * 0.078)
      + sin(t * (0.22 + seed * 0.07) + k * 0.91) * (0.028 + seed * 0.018);
    float width = mix(0.052, 0.105, seed) * mix(0.88, 1.18, detail);
    float delta = angleDelta(angle, aim);

    float core = exp(-pow(delta / width, 2.0));
    float shoulder = exp(-pow(delta / (width * 2.85), 2.0)) * 0.32;
    float cone = (core + shoulder)
      * smoothstep(0.035, 0.18, distanceFromSource)
      * exp(-distanceFromSource * (0.42 + seed * 0.22));

    // Low-frequency occlusion and fine suspended matter break up the cone in depth.
    vec2 local = ray * vec2(2.1, 4.4);
    float occlusion = fbm(local + vec2(seed * 8.0, t * (0.08 + seed * 0.025)));
    float dust = fbm(rot(0.41) * local * 2.25 + vec2(-t * 0.12, k * 4.0));
    float medium = mix(0.30, 1.0, smoothstep(0.24, 0.82, occlusion));
    medium *= 0.74 + dust * 0.34;
    cone *= medium;

    float intensity = cone * (0.56 + seed * 0.44);
    vec3 beamTint = mix(colorA, colorB, step(0.52, seed));
    shaftColor += mix(beamTint, glow, core * 0.26) * intensity;
    totalShaft += intensity;
  }

  // Dense broad light volumes plus a softer multiple-scattering veil.
  float lightResponse = 0.80 + uEnergy * 0.24 + uBurst * 0.22;
  color += shaftColor * (0.30 + uPower * 0.22) * lightResponse;
  color += mix(colorA, colorB, 0.48)
    * smoothstep(0.04, 1.55, totalShaft)
    * atmosphere
    * (0.035 + detail * 0.055);

  // Three source blooms anchor the shafts to actual luminaires instead of line origins.
  for (int j = 0; j < 3; j++) {
    float k = float(j);
    float seed = hash11(k * 23.11 + 1.7);
    vec2 source = vec2(-0.62 + k * 0.62 + seed * 0.08, -0.60 - seed * 0.035);
    source.x += sin(t * (0.29 + seed * 0.08) + k * 2.1) * 0.016;
    float d = length((p - source) * vec2(1.0, 1.7));
    float bloom = exp(-d * 18.0) + exp(-d * 5.5) * 0.18;
    color += glow * bloom * (0.26 + uTreble * 0.10 + uBurst * 0.09);
  }

  // Floating particulate catches the shafts without becoming a starfield.
  vec2 dustGrid = floor((p + vec2(2.0)) * mix(54.0, 92.0, detail));
  float dustSeed = hash21(dustGrid);
  vec2 dustLocal = fract((p + vec2(2.0)) * mix(54.0, 92.0, detail)) - 0.5;
  float mote = step(0.986, dustSeed) * (1.0 - smoothstep(0.0, 0.075, length(dustLocal)));
  mote *= 0.18 + min(1.0, totalShaft) * 0.82;
  color += glow * mote * (0.12 + uTreble * 0.18);

  if (uQuality > 0.5) {
    float fineHaze = fbm(rot(-0.34) * p * 7.2 + vec2(t * 0.09, -t * 0.04));
    color += mix(surface, colorA, 0.42) * fineHaze * totalShaft * 0.018;
  }

  gl_FragColor = vec4(finish(color, vTextureCoord), 1.0);
}
`;

type RaysUniforms = {
  uTime: number; uPower: number; uDetail: number; uQuality: number;
  uEnergy: number; uTreble: number; uBurst: number;
  uBackgroundR: number; uBackgroundG: number; uBackgroundB: number;
  uSurfaceR: number; uSurfaceG: number; uSurfaceB: number;
  uColorAR: number; uColorAG: number; uColorAB: number;
  uColorBR: number; uColorBG: number; uColorBB: number;
  uGlowR: number; uGlowG: number; uGlowB: number;
};

export class LegacyRaysWorld {
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
        raysUniforms: {
          uTime: { value: 0, type: "f32" },
          uPower: { value: 1 / 3, type: "f32" },
          uDetail: { value: 1 / 3, type: "f32" },
          uQuality: { value: 1, type: "f32" },
          uEnergy: { value: 0, type: "f32" },
          uTreble: { value: 0, type: "f32" },
          uBurst: { value: 0, type: "f32" },
          uBackgroundR: { value: 0.008, type: "f32" },
          uBackgroundG: { value: 0.024, type: "f32" },
          uBackgroundB: { value: 0.032, type: "f32" },
          uSurfaceR: { value: 0.03, type: "f32" },
          uSurfaceG: { value: 0.08, type: "f32" },
          uSurfaceB: { value: 0.11, type: "f32" },
          uColorAR: { value: 0.43, type: "f32" },
          uColorAG: { value: 1.0, type: "f32" },
          uColorAB: { value: 0.92, type: "f32" },
          uColorBR: { value: 0.48, type: "f32" },
          uColorBG: { value: 0.34, type: "f32" },
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

  update(time: number, audio: AudioBands, burst = 0) {
    if (!this.container.visible) return;
    this.write("uTime", time);
    this.write("uEnergy", audio.energy);
    this.write("uTreble", audio.treble);
    this.write("uBurst", burst);
    this.container.alpha = clamp(this.intensity, 0, 1);
  }

  private write(name: keyof RaysUniforms, value: number) {
    const uniforms = (this.filter.resources.raysUniforms as { uniforms: RaysUniforms }).uniforms;
    uniforms[name] = value;
  }

  private writeColor(prefix: "uBackground" | "uSurface" | "uColorA" | "uColorB" | "uGlow", color: number) {
    const r = ((color >> 16) & 0xff) / 255;
    const g = ((color >> 8) & 0xff) / 255;
    const b = (color & 0xff) / 255;
    this.write(`${prefix}R` as keyof RaysUniforms, r);
    this.write(`${prefix}G` as keyof RaysUniforms, g);
    this.write(`${prefix}B` as keyof RaysUniforms, b);
  }
}
