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

float wrappedAngle(float value) {
    return abs(atan(sin(value), cos(value)));
}

float sdBox(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

vec3 spectral(float t) {
    vec3 a = vec3(0.50, 0.50, 0.50);
    vec3 b = vec3(0.50, 0.50, 0.50);
    vec3 c = vec3(1.00, 1.00, 1.00);
    vec3 d = vec3(0.00, 0.18, 0.42);
    return a + b * cos(6.2831853 * (c * t + d));
}

void main(void) {
    vec2 uv = vTextureCoord;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= uAspect;

    vec2 source = vec2(0.0, 0.055);
    vec2 q = p - source;
    float radius = length(q);
    float theta = atan(q.y, q.x);

    float power = max(0.0, uPower);
    float quality = mix(0.68, 1.0, uQuality);
    float beamCount = mix(7.0, 16.0, clamp(uDetail / 3.0, 0.0, 1.0));

    vec3 color = vec3(0.0035, 0.005, 0.014);
    float atmosphere = noise2(p * vec2(1.7, 2.3) + vec2(uTime * 0.018, -uTime * 0.011));
    float vignette = 1.0 - smoothstep(0.42, 1.55, length(p * vec2(0.75, 1.0)));
    color += vec3(0.010, 0.018, 0.050) * (0.35 + atmosphere * 0.65) * vignette * (0.35 + power * 0.32);

    for (int i = 0; i < 16; i++) {
        float fi = float(i);
        float active = step(fi + 0.5, beamCount);
        float seed = hash11(fi * 17.73 + 4.11);
        float t = fi / 15.0;
        float baseAngle = -3.02 + t * 6.03 + (seed - 0.5) * 0.16;
        float sweep = sin(uTime * (0.055 + seed * 0.055) + seed * 11.0)
            * (0.025 + power * 0.012);
        float angle = baseAngle + sweep;
        float width = mix(0.030, 0.105, hash11(fi * 9.17 + 1.2))
            * mix(0.82, 1.25, uBass)
            * mix(0.88, 1.08, quality);
        float angular = wrappedAngle(theta - angle);
        float volume = smoothstep(width, width * 0.12, angular);
        float hotCore = smoothstep(width * 0.31, width * 0.025, angular);

        float radialIn = smoothstep(0.035, 0.15, radius);
        float radialOut = 1.0 / (1.0 + radius * radius * 0.42);
        float streakNoise = noise2(vec2(radius * (7.0 + seed * 8.0) - uTime * (0.08 + seed * 0.08), fi * 1.71));
        float gobo = mix(0.60, 1.15, streakNoise)
            * (0.88 + 0.12 * sin(radius * (28.0 + seed * 26.0) - uTime * 0.35));
        float transientLift = 1.0 + uTransient * (0.30 + seed * 0.48);
        float density = active * radialIn * radialOut * gobo * transientLift;

        vec3 beamColor = spectral(fract(t * 0.86 + seed * 0.24 + uTime * 0.0025));
        float volumeGain = (0.08 + uEnergy * 0.12 + power * 0.07) * quality;
        color += beamColor * volume * density * volumeGain;
        color += mix(beamColor, vec3(1.0), 0.48)
            * hotCore * density
            * (0.018 + uEnergy * 0.040 + uTransient * 0.045)
            * quality;
    }

    // Stage-haze bloom around the emitter cluster. These are continuous light
    // fields, not discrete white fixture circles.
    float sourceBloom = 1.0 - smoothstep(0.0, 0.22 + uBass * 0.045, radius);
    float sourceCore = 1.0 - smoothstep(0.0, 0.038 + uTransient * 0.010, radius);
    float anamorphic = exp(-abs(q.y) * 85.0) * exp(-abs(q.x) * 2.4);
    float verticalFlare = exp(-abs(q.x) * 130.0) * exp(-abs(q.y) * 4.0);
    color += vec3(0.28, 0.43, 1.0) * sourceBloom * (0.12 + uBass * 0.12 + power * 0.05);
    color += vec3(1.0, 0.97, 0.91) * sourceCore * (0.68 + uTransient * 0.72);
    color += vec3(0.55, 0.72, 1.0) * anamorphic * (0.04 + uBass * 0.07 + uTransient * 0.08);
    color += vec3(1.0, 0.70, 0.83) * verticalFlare * (0.012 + uTransient * 0.05);

    // Dark truss / fixture silhouette with narrow luminous apertures.
    float truss = 1.0 - smoothstep(0.006, 0.018, sdBox(q + vec2(0.0, 0.055), vec2(0.19, 0.018)));
    color = mix(color, vec3(0.010, 0.012, 0.019), truss * 0.82);
    for (int j = 0; j < 7; j++) {
        float fj = float(j);
        vec2 lensP = q - vec2((fj - 3.0) * 0.052, -0.055 + sin(fj * 1.7) * 0.010);
        float aperture = 1.0 - smoothstep(0.004, 0.012, sdBox(lensP, vec2(0.012, 0.0045)));
        vec3 apertureColor = spectral(fract(fj * 0.17 + 0.12));
        color += apertureColor * aperture * (0.45 + uTreble * 0.28 + uTransient * 0.20);
    }

    float fineHaze = noise2(p * 7.5 + vec2(uTime * 0.025, -uTime * 0.018)) - 0.5;
    color += vec3(0.025, 0.030, 0.052) * fineHaze * (0.10 + uEnergy * 0.10) * quality;

    // Filmic shoulder instead of raw additive clipping.
    color *= 0.72 + power * 0.38;
    color = 1.0 - exp(-max(color, vec3(0.0)) * (1.18 + uEnergy * 0.42));
    color = pow(color, vec3(0.92));

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

export class PrismStageBeamsWorld {
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
        prismUniforms: {
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
    this.surface.clear().rect(0, 0, this.width, this.height).fill({ color: 0x02030a, alpha: 1 });
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
    const uniforms = (this.filter.resources.prismUniforms as { uniforms: Uniforms }).uniforms;
    uniforms[name] = value;
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
