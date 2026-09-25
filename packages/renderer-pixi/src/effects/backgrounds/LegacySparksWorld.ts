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
uniform float uQuality;
uniform float uEnergy;
uniform float uMid;
uniform float uTreble;
uniform float uBurst;
uniform float uAspect;
uniform vec3 uBackground;
uniform vec3 uSurface;
uniform vec3 uAccentA;
uniform vec3 uAccentB;
uniform vec3 uGlow;
uniform vec3 uMuted;

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

mat2 rot(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}

float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.00001), 0.0, 1.0);
  return length(pa - ba * h);
}

vec3 streakField(
  vec2 p,
  float angle,
  vec2 frequency,
  float speed,
  float seed,
  float occupancy,
  float width
) {
  // Distributed flow coordinates create a room-wide spark storm. There are no
  // fixed emitters or ballistic fountain arcs; every stream owns its motion.
  vec2 q = rot(angle) * p;
  q.x += uTime * speed;

  vec2 grid = q * frequency;
  vec2 cell = floor(grid);
  vec2 local = fract(grid) - 0.5;

  float h0 = hash21(cell + vec2(seed, seed * 1.71));
  float h1 = hash21(cell + vec2(seed * 2.37 + 3.1, seed * 4.17 + 1.7));
  float h2 = hash21(cell + vec2(seed * 5.13 + 7.7, seed * 3.41 + 5.9));
  float active = step(1.0 - occupancy, h0);

  float yJitter = (h1 - 0.5) * 0.64;
  float headX = mix(-0.08, 0.34, h2);
  float length = mix(0.18, 0.48, h1);
  float bend = sin((local.x + h0) * 4.2 + h2 * 6.28318) * 0.030;

  vec2 shaped = local;
  shaped.y -= yJitter * 0.28 + bend;

  vec2 tail = vec2(headX - length, 0.0);
  vec2 head = vec2(headX, 0.0);
  float d = sdSegment(shaped, tail, head);

  float along = clamp((shaped.x - tail.x) / max(length, 0.001), 0.0, 1.0);
  float gate = step(tail.x, shaped.x) * step(shaped.x, head.x);
  float taper = pow(along, 1.6);

  float core = (1.0 - smoothstep(width, width * 2.15, d))
    * gate
    * taper
    * active;
  float glow = (1.0 - smoothstep(width * 3.0, width * 7.5, d))
    * gate
    * pow(taper, 0.75)
    * active;
  float hotHead = (1.0 - smoothstep(
    width * 1.4,
    width * 4.5,
    length(shaped - head)
  )) * active;

  return vec3(core, glow, hotHead);
}

void main(void) {
  vec2 p = vTextureCoord * 2.0 - 1.0;
  p.x *= uAspect;

  float detail = clamp(uDetail / 3.0, 0.0, 1.0);
  float quality = mix(0.72, 1.0, uQuality);
  float power = max(0.0, uPower);

  vec3 color = uBackground;

  // Low heat/smoke substrate. It grounds the world but does not define motion.
  float smoke = noise2(
    p * vec2(1.8, 3.0)
    + vec2(uTime * 0.010, -uTime * 0.015)
  );
  float heatBand = exp(-abs(p.y - 0.22) * 3.1);
  color += mix(uSurface, uMuted, 0.42)
    * smoke
    * heatBand
    * (0.030 + uEnergy * 0.012 + power * 0.010);

  float occupancy = mix(0.20, 0.34, detail);
  float width = mix(0.012, 0.0075, detail);

  vec3 layer0 = streakField(
    p,
    0.22,
    vec2(mix(4.8, 7.2, detail), mix(8.0, 12.0, detail)),
    0.54,
    1.7,
    occupancy,
    width
  );
  vec3 layer1 = streakField(
    p,
    -0.31,
    vec2(mix(4.0, 6.4, detail), mix(7.0, 11.0, detail)),
    -0.43,
    7.9,
    occupancy * 0.88,
    width * 0.92
  );
  vec3 layer2 = streakField(
    p,
    0.66,
    vec2(mix(3.7, 5.7, detail), mix(6.0, 9.5, detail)),
    0.31,
    13.4,
    occupancy * 0.76,
    width * 0.82
  );
  vec3 layer3 = streakField(
    p,
    -0.82,
    vec2(mix(3.2, 5.2, detail), mix(5.8, 8.7, detail)),
    -0.27,
    21.3,
    occupancy * 0.68,
    width * 0.76
  );

  // Cinema adds two quieter depth strata instead of simply increasing opacity.
  vec3 layer4 = streakField(
    p * 0.92,
    0.10,
    vec2(8.6, 14.5),
    0.68,
    31.8,
    occupancy * 0.52 * uQuality,
    width * 0.62
  );
  vec3 layer5 = streakField(
    p * 1.08,
    -0.48,
    vec2(7.5, 13.2),
    -0.58,
    44.1,
    occupancy * 0.46 * uQuality,
    width * 0.58
  );

  float coreA = layer0.x + layer2.x + layer4.x;
  float coreB = layer1.x + layer3.x + layer5.x;
  float glowA = layer0.y + layer2.y + layer4.y;
  float glowB = layer1.y + layer3.y + layer5.y;
  float heads = layer0.z + layer1.z + layer2.z + layer3.z + layer4.z + layer5.z;

  // Audio changes emissive/material energy only. The flow field, direction,
  // coordinates and speed above remain entirely playback-time owned.
  float lightResponse = 0.80 + uEnergy * 0.12 + uTreble * 0.09 + uMid * 0.04;
  float burstLight = 1.0 + uBurst * 0.72;

  color += uAccentA * glowA * 0.060 * lightResponse;
  color += uAccentB * glowB * 0.055 * lightResponse;
  color += mix(uAccentA, uGlow, 0.52) * coreA * 0.50 * lightResponse;
  color += mix(uAccentB, uGlow, 0.48) * coreB * 0.46 * lightResponse;
  color += uGlow * heads * 0.22 * lightResponse * burstLight;

  // Fine embers rise slowly across the whole scene. They are a secondary depth
  // cue, not four visible sources.
  vec2 emberQ = p;
  emberQ.y += uTime * 0.055;
  vec2 emberGrid = emberQ * vec2(
    mix(11.0, 18.0, detail),
    mix(8.0, 13.0, detail)
  );
  vec2 emberCell = floor(emberGrid);
  vec2 emberLocal = fract(emberGrid) - 0.5;
  float emberHash = hash21(emberCell + vec2(5.3, 19.7));
  emberLocal.x += (hash21(emberCell + vec2(11.1, 2.7)) - 0.5) * 0.62;
  float ember = step(0.965 - detail * 0.018, emberHash)
    * (1.0 - smoothstep(0.0, 0.075, length(emberLocal)));
  color += mix(uMuted, uGlow, 0.54)
    * ember
    * (0.045 + uTreble * 0.025)
    * quality;

  // A few glancing hot seams suggest sparks passing close to the lens.
  float nearSeamA = exp(-abs(
    p.y - (0.48 + sin(p.x * 2.7 + uTime * 0.13) * 0.018)
  ) * 110.0);
  float nearSeamB = exp(-abs(
    p.y - (-0.36 + cos(p.x * 3.1 - uTime * 0.11) * 0.014)
  ) * 135.0);
  color += uAccentA * nearSeamA * 0.020 * (0.8 + uEnergy * 0.2);
  color += uAccentB * nearSeamB * 0.016 * (0.8 + uTreble * 0.2);

  float vignette = 1.0 - smoothstep(
    0.46,
    1.12,
    length(p * vec2(0.66, 1.0))
  );
  color *= 0.80 + vignette * 0.22;

  color = vec3(1.0) - exp(
    -max(color, vec3(0.0)) * (1.0 + power * 0.44)
  );
  color = pow(color, vec3(0.95));

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

type Uniforms = {
  uTime: number;
  uPower: number;
  uDetail: number;
  uQuality: number;
  uEnergy: number;
  uMid: number;
  uTreble: number;
  uBurst: number;
  uAspect: number;
  uBackground: Float32Array;
  uSurface: Float32Array;
  uAccentA: Float32Array;
  uAccentB: Float32Array;
  uGlow: Float32Array;
  uMuted: Float32Array;
};

export class LegacySparksWorld {
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
        sparksUniforms: {
          uTime: { value: 0, type: "f32" },
          uPower: { value: 1 / 3, type: "f32" },
          uDetail: { value: 1 / 3, type: "f32" },
          uQuality: { value: 1, type: "f32" },
          uEnergy: { value: 0, type: "f32" },
          uMid: { value: 0, type: "f32" },
          uTreble: { value: 0, type: "f32" },
          uBurst: { value: 0, type: "f32" },
          uAspect: { value: 16 / 9, type: "f32" },
          uBackground: { value: new Float32Array([0.003, 0.006, 0.008]), type: "vec3<f32>" },
          uSurface: { value: new Float32Array([0.040, 0.050, 0.055]), type: "vec3<f32>" },
          uAccentA: { value: new Float32Array([1.0, 0.42, 0.12]), type: "vec3<f32>" },
          uAccentB: { value: new Float32Array([0.98, 0.14, 0.24]), type: "vec3<f32>" },
          uGlow: { value: new Float32Array([1.0, 0.92, 0.72]), type: "vec3<f32>" },
          uMuted: { value: new Float32Array([0.30, 0.24, 0.20]), type: "vec3<f32>" },
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

  resize(width: number, height: number) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.surface
      .clear()
      .rect(0, 0, this.width, this.height)
      .fill({ color: 0xffffff, alpha: 1 });
    this.write("uAspect", this.width / this.height);
  }

  update(time: number, audio: AudioBands, transientEnvelope: number) {
    if (!this.container.visible) return;
    this.write("uTime", time);
    this.write("uPower", clamp(this.intensity / 3));
    this.write("uDetail", clamp(this.detail / 3));
    this.write("uQuality", this.quality === "cinema" ? 1 : 0);
    this.write("uEnergy", audio.energy);
    this.write("uMid", audio.mid);
    this.write("uTreble", audio.treble);
    this.write("uBurst", clamp(transientEnvelope, 0, 1));
    this.write("uAspect", this.width / this.height);
    this.container.alpha = clamp(this.intensity, 0, 1);
  }

  private uniforms() {
    return (this.filter.resources.sparksUniforms as { uniforms: Uniforms }).uniforms;
  }

  private write(
    name:
      | "uTime"
      | "uPower"
      | "uDetail"
      | "uQuality"
      | "uEnergy"
      | "uMid"
      | "uTreble"
      | "uBurst"
      | "uAspect",
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
