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

void main(void) {
  gl_Position = filterVertexPosition();
  vTextureCoord = aPosition * (uOutputFrame.zw * uInputSize.zw);
}
`;

const fragment = `
precision highp float;

in vec2 vTextureCoord;
uniform float uTime;
uniform float uPower;
uniform float uDetail;
uniform float uBass;
uniform float uMid;
uniform float uTreble;
uniform float uEnergy;
uniform float uTransient;
uniform float uAspect;
uniform float uQuality;
uniform vec3 uBackground;
uniform vec3 uSurface;
uniform vec3 uAccentA;
uniform vec3 uAccentB;
uniform vec3 uGlow;
uniform vec3 uMuted;

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

float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.00001), 0.0, 1.0);
  return length(pa - ba * h);
}

vec2 projectPoint(vec3 world) {
  // Camera sits low in the club and looks into positive Z.
  float z = max(0.65, world.z);
  float focal = 1.30;
  return vec2(
    world.x / z * focal,
    -world.y / z * focal + 0.085
  );
}

vec3 canopyColor(float seed) {
  float phase = fract(seed * 4.7);
  if (phase < 0.42) return uAccentA;
  if (phase < 0.82) return uAccentB;
  return mix(uGlow, uAccentA, 0.24);
}

void main(void) {
  vec2 p = vTextureCoord * 2.0 - 1.0;
  p.x *= uAspect;

  float detail = clamp(uDetail / 3.0, 0.0, 1.0);
  float quality = mix(0.72, 1.0, uQuality);
  float power = max(0.0, uPower);

  vec3 color = uBackground;

  // Deep club atmosphere: low-frequency fog gives the projected geometry air
  // without becoming the identity layer itself.
  float roomFog = noise2(
    p * vec2(2.0, 3.2)
    + vec2(uTime * 0.012, -uTime * 0.008)
  );
  float depthFog = exp(-abs(p.y + 0.02) * 2.4);
  color += mix(uSurface, uMuted, 0.36)
    * roomFog
    * depthFog
    * (0.035 + power * 0.012 + uEnergy * 0.010);

  // Perspective dance floor. This establishes real camera/depth coordinates
  // before any laser is drawn.
  for (int i = 0; i < 9; i++) {
    float fi = float(i);
    float z = 2.8 + fi * 1.55;
    vec2 a = projectPoint(vec3(-4.2, -1.55, z));
    vec2 b = projectPoint(vec3(4.2, -1.55, z));
    float d = sdSegment(p, a, b);
    float line = 1.0 - smoothstep(0.0012, 0.0032, d);
    color += uSurface * line * (0.020 + (1.0 - fi / 9.0) * 0.010);
  }

  for (int i = 0; i < 9; i++) {
    float fi = float(i);
    float x = mix(-4.0, 4.0, fi / 8.0);
    vec2 a = projectPoint(vec3(x, -1.55, 2.7));
    vec2 b = projectPoint(vec3(x, -1.55, 15.5));
    float d = sdSegment(p, a, b);
    float line = 1.0 - smoothstep(0.0009, 0.0025, d);
    color += uMuted * line * 0.018;
  }

  // Ceiling truss rails and depth slices frame the canopy in an actual room.
  for (int i = 0; i < 7; i++) {
    float fi = float(i);
    float z = 3.0 + fi * 1.85;
    vec2 a = projectPoint(vec3(-4.0, 1.72, z));
    vec2 b = projectPoint(vec3(4.0, 1.72, z));
    float d = sdSegment(p, a, b);
    float line = 1.0 - smoothstep(0.0016, 0.0037, d);
    color += uSurface * line * (0.055 + (1.0 - fi / 7.0) * 0.025);
  }

  for (int side = 0; side < 2; side++) {
    float x = side == 0 ? -3.95 : 3.95;
    vec2 a = projectPoint(vec3(x, 1.72, 2.7));
    vec2 b = projectPoint(vec3(x, 1.72, 15.5));
    float d = sdSegment(p, a, b);
    float line = 1.0 - smoothstep(0.0017, 0.0043, d);
    color += uSurface * line * 0.075;
  }

  // The hero: a true projected 3D canopy. Endpoints live at different X/Y/Z
  // coordinates across the room, so beams cross above and through one another
  // instead of sharing one 2D rig line.
  float activeBeams = mix(18.0, 32.0, detail);
  for (int i = 0; i < 32; i++) {
    float fi = float(i);
    float enabled = step(fi + 0.5, activeBeams);
    float seed = hash11(fi * 17.31 + 4.7);
    float seed2 = hash11(fi * 31.73 + 8.9);
    float family = mod(fi, 4.0);

    float zA = 3.1 + seed * 10.4;
    float zB = 3.1 + seed2 * 10.4;
    float scan = sin(uTime * (0.105 + seed * 0.055) + seed * 12.0);
    float scan2 = cos(uTime * (0.083 + seed2 * 0.049) + seed2 * 15.0);

    vec3 a3;
    vec3 b3;

    if (family < 0.5) {
      // Transverse canopy rib: wall-to-wall at one depth slice.
      float y = 1.02 + 0.34 * scan;
      a3 = vec3(-3.85, y, zA);
      b3 = vec3(3.85, 1.16 - 0.22 * scan2, zA + 0.18 * scan2);
    } else if (family < 1.5) {
      // Deep diagonal: connects opposite wall rails at different depths.
      a3 = vec3(-3.85, 1.52, zA);
      b3 = vec3(3.85, 0.70 + 0.30 * scan, zB);
    } else if (family < 2.5) {
      // Longitudinal canopy strand: runs with the room depth.
      float x = mix(-3.0, 3.0, seed);
      a3 = vec3(x, 1.58, 2.9);
      b3 = vec3(x + scan * 1.45, 0.82 + seed2 * 0.42, 15.2);
    } else {
      // Reverse diagonal for the characteristic woven canopy lattice.
      a3 = vec3(3.85, 1.48, zA);
      b3 = vec3(-3.85, 0.72 + 0.32 * scan2, zB);
    }

    vec2 a = projectPoint(a3);
    vec2 b = projectPoint(b3);
    float depth = max(2.0, (a3.z + b3.z) * 0.5);
    float d = sdSegment(p, a, b);

    float nearScale = clamp(7.5 / depth, 0.42, 1.35);
    float coreWidth = mix(0.0011, 0.0018, quality) * nearScale;
    float glowWidth = coreWidth * mix(5.2, 7.4, detail);
    float veilWidth = glowWidth * 2.8;

    float core = 1.0 - smoothstep(coreWidth, coreWidth * 2.0, d);
    float glow = 1.0 - smoothstep(glowWidth, glowWidth * 2.2, d);
    float veil = 1.0 - smoothstep(veilWidth, veilWidth * 2.5, d);

    vec3 laser = canopyColor(seed);
    float lightResponse = (0.74 + uEnergy * 0.16 + uTreble * 0.08 + uTransient * 0.10)
      * (0.58 + power * 0.26);

    // Haze breaks up the broad light volume, but does not move beam geometry.
    float breakup = 0.72 + 0.28 * noise2(
      p * vec2(7.0, 11.0) + vec2(seed * 17.0, uTime * 0.045)
    );

    color += laser * veil * breakup * enabled * lightResponse * 0.030;
    color += laser * glow * enabled * lightResponse * 0.20;
    color += mix(laser, uGlow, 0.52) * core * enabled * lightResponse * 0.88;
  }

  // Projected fixture pods live on both ceiling rails at different depths.
  for (int i = 0; i < 12; i++) {
    float fi = float(i);
    float side = mod(fi, 2.0) < 1.0 ? -1.0 : 1.0;
    float row = floor(fi * 0.5);
    vec3 fixture3 = vec3(side * 3.82, 1.68, 3.0 + row * 2.15);
    vec2 fixture = projectPoint(fixture3);
    float depth = fixture3.z;
    float radius = 0.010 * clamp(5.8 / depth, 0.45, 1.25);
    float d = length(p - fixture);
    float body = 1.0 - smoothstep(radius * 0.9, radius * 1.6, d);
    float aperture = 1.0 - smoothstep(radius * 0.16, radius * 0.52, d);
    color = mix(color, uSurface, body * 0.48);
    color += canopyColor(hash11(fi * 7.7 + 2.0)) * aperture * (0.18 + uTreble * 0.14);
  }

  // Volumetric dust gives near/far separation without turning into a particle
  // background. It is only visible where the room haze exists.
  vec2 dustCell = floor((p + vec2(3.0)) * mix(42.0, 72.0, detail));
  vec2 dustLocal = fract((p + vec2(3.0)) * mix(42.0, 72.0, detail)) - 0.5;
  float dust = step(0.991, hash21(dustCell))
    * (1.0 - smoothstep(0.0, 0.055, length(dustLocal)));
  color += uGlow * dust * depthFog * (0.018 + uTreble * 0.018) * quality;

  float vignette = 1.0 - smoothstep(
    0.46,
    1.14,
    length(p * vec2(0.64, 1.0))
  );
  color *= 0.78 + vignette * 0.24;
  color = vec3(1.0) - exp(-max(color, vec3(0.0)) * (1.05 + power * 0.36));
  color = pow(color, vec3(0.94));

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

type Uniforms = {
  uTime: number;
  uPower: number;
  uDetail: number;
  uBass: number;
  uMid: number;
  uTreble: number;
  uEnergy: number;
  uTransient: number;
  uAspect: number;
  uQuality: number;
  uBackground: Float32Array;
  uSurface: Float32Array;
  uAccentA: Float32Array;
  uAccentB: Float32Array;
  uGlow: Float32Array;
  uMuted: Float32Array;
};

export class LaserCanopyGridWorld {
  readonly container = new Container();

  private readonly surface = new Graphics();
  private readonly filter: Filter;
  private width = 1;
  private height = 1;
  private intensity = 1;
  private detail = 1;
  private quality: QualityMode = "cinema";

  constructor() {
    this.filter = new Filter({
      glProgram: GlProgram.from({ vertex, fragment }),
      resources: {
        laserUniforms: {
          uTime: { value: 0, type: "f32" },
          uPower: { value: 1, type: "f32" },
          uDetail: { value: 1, type: "f32" },
          uBass: { value: 0, type: "f32" },
          uMid: { value: 0, type: "f32" },
          uTreble: { value: 0, type: "f32" },
          uEnergy: { value: 0, type: "f32" },
          uTransient: { value: 0, type: "f32" },
          uAspect: { value: 16 / 9, type: "f32" },
          uQuality: { value: 1, type: "f32" },
          uBackground: { value: new Float32Array([0.003, 0.006, 0.010]), type: "vec3<f32>" },
          uSurface: { value: new Float32Array([0.028, 0.040, 0.060]), type: "vec3<f32>" },
          uAccentA: { value: new Float32Array([0.98, 0.12, 0.30]), type: "vec3<f32>" },
          uAccentB: { value: new Float32Array([0.12, 0.90, 1.0]), type: "vec3<f32>" },
          uGlow: { value: new Float32Array([0.94, 0.98, 1.0]), type: "vec3<f32>" },
          uMuted: { value: new Float32Array([0.16, 0.22, 0.28]), type: "vec3<f32>" },
        },
      },
    });
    this.filter.padding = 0;
    this.surface.filters = [this.filter];
    this.container.addChild(this.surface);
    this.container.visible = false;
    this.resize(1, 1);
  }

  setPalette(palette: VisualPalette) {
    this.writeColor("uBackground", palette.background);
    this.writeColor("uSurface", palette.surface);
    this.writeColor("uAccentA", palette.accentA);
    this.writeColor("uAccentB", palette.accentB);
    this.writeColor("uGlow", palette.glow);
    this.writeColor("uMuted", palette.muted);
  }

  setIntensity(value: number) {
    this.intensity = clamp(value, 0, 3);
  }

  setDetail(value: number) {
    this.detail = clamp(value, 0, 3);
  }

  setQuality(value: QualityMode) {
    this.quality = value;
  }

  resize(width: number, height: number) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.surface
      .clear()
      .rect(0, 0, this.width, this.height)
      .fill({ color: 0xffffff, alpha: 1 });
    this.write("uAspect", this.width / this.height);
  }

  update(time: number, audio: AudioBands) {
    if (!this.container.visible) return;
    this.write("uTime", time);
    this.write("uPower", this.intensity);
    this.write("uDetail", this.detail);
    this.write("uBass", audio.bass);
    this.write("uMid", audio.mid);
    this.write("uTreble", audio.treble);
    this.write("uEnergy", audio.energy);
    this.write("uTransient", audio.transient);
    this.write("uAspect", this.width / this.height);
    this.write("uQuality", this.quality === "cinema" ? 1 : 0);
    this.container.alpha = clamp(this.intensity, 0, 1);
  }

  private uniforms() {
    return (this.filter.resources.laserUniforms as { uniforms: Uniforms }).uniforms;
  }

  private write(
    name:
      | "uTime"
      | "uPower"
      | "uDetail"
      | "uBass"
      | "uMid"
      | "uTreble"
      | "uEnergy"
      | "uTransient"
      | "uAspect"
      | "uQuality",
    value: number,
  ) {
    this.uniforms()[name] = value;
  }

  private writeColor(
    name: "uBackground" | "uSurface" | "uAccentA" | "uAccentB" | "uGlow" | "uMuted",
    color: number,
  ) {
    const target = this.uniforms()[name];
    target[0] = ((color >> 16) & 0xff) / 255;
    target[1] = ((color >> 8) & 0xff) / 255;
    target[2] = (color & 0xff) / 255;
  }
}
