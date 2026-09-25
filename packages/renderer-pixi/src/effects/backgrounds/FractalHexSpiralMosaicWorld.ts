import { Container, Filter, GlProgram, Graphics } from "pixi.js";
import type { AudioBands } from "@graph1ks/emo-audio-web";
import type { QualityMode } from "@graph1ks/emo-engine-core";

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
uniform float uPower;
uniform float uDetail;
uniform float uBass;
uniform float uMid;
uniform float uTreble;
uniform float uEnergy;
uniform float uTransient;
uniform float uAspect;
uniform float uQuality;

const float TAU = 6.283185307179586;

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

vec2 rotate2(vec2 p, float a) {
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c) * p;
}

float hexMetric(vec2 p) {
    p = abs(p);
    return max(dot(p, vec2(0.8660254, 0.5)), p.y);
}

void hexGrid(vec2 p, out vec2 local, out vec2 id) {
    const vec2 cell = vec2(1.0, 1.7320508);
    const vec2 halfCell = cell * 0.5;
    vec2 a = mod(p, cell) - halfCell;
    vec2 b = mod(p - halfCell, cell) - halfCell;
    if (dot(a, a) < dot(b, b)) {
        local = a;
        id = p - a;
    } else {
        local = b;
        id = p - b;
    }
}

vec3 rainbowGraphic(float t) {
    t = fract(t);
    vec3 a = vec3(0.16, 0.78, 1.00);
    vec3 b = vec3(0.20, 1.00, 0.66);
    vec3 c = vec3(0.96, 0.95, 0.22);
    vec3 d = vec3(1.00, 0.36, 0.68);
    vec3 e = vec3(0.70, 0.24, 1.00);
    if (t < 0.20) return mix(a, b, t * 5.0);
    if (t < 0.40) return mix(b, c, (t - 0.20) * 5.0);
    if (t < 0.60) return mix(c, d, (t - 0.40) * 5.0);
    if (t < 0.80) return mix(d, e, (t - 0.60) * 5.0);
    return mix(e, a, (t - 0.80) * 5.0);
}

vec2 vortexWarp(vec2 p, vec2 center, float phase, out float sink) {
    vec2 q = p - center;
    float r = length(q);
    float influence = exp(-r * 1.85);
    float angle = (2.1 + phase * 0.6) * influence
        - log(r + 0.12) * (0.72 + phase * 0.16)
        + sin(uTime * 0.055 + phase * 7.0) * 0.055;
    vec2 rotated = rotate2(q, angle);
    sink = influence / (0.32 + r);
    return p + (rotated - q) * influence * 0.92;
}

void main(void) {
    vec2 uv = vTextureCoord;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= uAspect;

    float power = max(0.0, uPower);
    float detail = clamp(uDetail / 3.0, 0.0, 1.0);
    float quality = mix(0.72, 1.0, uQuality);

    // Three independent sinks create the recursive multi-spiral composition.
    // Geometry motion is intentionally slow/time-driven; audio only changes
    // light/color response so the cell field never jitters with the beat.
    vec2 c1 = vec2(-0.48 * uAspect, -0.18) + vec2(sin(uTime * 0.031), cos(uTime * 0.027)) * 0.018;
    vec2 c2 = vec2(0.12 * uAspect, 0.24) + vec2(cos(uTime * 0.026), sin(uTime * 0.029)) * 0.015;
    vec2 c3 = vec2(0.50 * uAspect, -0.02) + vec2(sin(uTime * 0.022), -cos(uTime * 0.025)) * 0.014;

    float s1;
    float s2;
    float s3;
    vec2 warped = vortexWarp(p, c1, 0.18, s1);
    warped = vortexWarp(warped, c2, 0.53, s2);
    warped = vortexWarp(warped, c3, 0.86, s3);

    float sinkField = min(4.0, s1 + s2 + s3);
    float densityBoost = 1.0 + sinkField * mix(0.62, 1.16, detail);
    float baseFrequency = mix(4.1, 7.4, detail) * quality;
    vec2 gridP = warped * baseFrequency * densityBoost;

    vec2 local;
    vec2 id;
    hexGrid(gridP, local, id);
    float d = hexMetric(local);

    float cellMask = 1.0 - smoothstep(0.445, 0.505, d);
    float innerMask = 1.0 - smoothstep(0.355, 0.425, d);
    float edgeBand = max(0.0, cellMask - innerMask);

    float seed = hash21(id * 0.071 + vec2(11.3, 7.7));
    float hue = fract(
        seed * 0.30
        + warped.x * 0.055
        - warped.y * 0.045
        + sinkField * 0.075
        + uTime * 0.0035
    );

    vec3 base = rainbowGraphic(hue);
    float localLight = clamp(0.72 + local.x * -0.20 + local.y * -0.14, 0.45, 1.10);
    base *= localLight;
    base = mix(base, vec3(1.0), 0.04 + uEnergy * 0.035);

    vec3 color = vec3(0.004, 0.004, 0.007);

    // Extruded/shadowed graphic edge. The black outline is a design feature,
    // not anti-aliasing; keep it visible even at high World Power.
    float shadow = (1.0 - smoothstep(0.44, 0.53, hexMetric(local + vec2(-0.035, 0.045)))) * cellMask;
    color += vec3(0.008, 0.006, 0.012) * shadow;
    color = mix(color, base * (0.72 + power * 0.18), innerMask);
    color = mix(color, vec3(0.010, 0.008, 0.015), edgeBand * 0.96);

    // Small inset hex detail visible in the reference cells.
    float miniOuter = 1.0 - smoothstep(0.125, 0.155, d);
    float miniInner = 1.0 - smoothstep(0.072, 0.100, d);
    color = mix(color, vec3(0.020, 0.016, 0.028), miniOuter * 0.96);
    color = mix(color, base * (0.48 + seed * 0.22), miniInner);

    // Bevel highlight and lower-right shadow give the flat shader a screen-print
    // / extruded-poster quality without turning it photoreal.
    float highlight = edgeBand * clamp((-local.x - local.y) * 1.9 + 0.38, 0.0, 1.0);
    float lowerShadow = edgeBand * clamp((local.x + local.y) * 1.8 + 0.24, 0.0, 1.0);
    color += vec3(0.72, 0.88, 1.00) * highlight * (0.11 + uTreble * 0.055);
    color *= 1.0 - lowerShadow * 0.18;

    // Music accents COLOR/LIGHT only. The geometry remains continuous.
    float accent = (0.05 + uMid * 0.055 + uTransient * 0.085)
        * smoothstep(1.05, 2.85, sinkField);
    color += rainbowGraphic(hue + 0.11) * accent * innerMask;

    float vignette = 1.0 - smoothstep(0.66, 1.72, length(p * vec2(0.70, 1.0)));
    color *= 0.76 + vignette * 0.34;
    color *= 0.78 + power * 0.34;
    color = 1.0 - exp(-max(color, vec3(0.0)) * (1.12 + uEnergy * 0.16));
    color = pow(color, vec3(0.94));

    gl_FragColor = vec4(color, 1.0);
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
};

export class FractalHexSpiralMosaicWorld {
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
        fractalHexUniforms: {
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
        },
      },
    });
    this.filter.padding = 0;
    this.surface.filters = [this.filter];
    this.container.addChild(this.surface);
    this.container.visible = false;
    this.resize(1, 1);
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
    this.surface.clear().rect(0, 0, this.width, this.height).fill({ color: 0x030307, alpha: 1 });
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

  private write(name: keyof Uniforms, value: number) {
    const uniforms = (this.filter.resources.fractalHexUniforms as { uniforms: Uniforms }).uniforms;
    uniforms[name] = value;
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
