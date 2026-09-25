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

float sdSegment(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.00001), 0.0, 1.0);
    return length(pa - ba * h);
}

float sdBox(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

vec3 laserColor(float index) {
    float phase = mod(index, 7.0);
    if (phase < 3.0) return vec3(1.0, 0.11, 0.22);
    if (phase < 5.0) return vec3(0.18, 0.94, 1.0);
    if (phase < 6.0) return vec3(0.16, 1.0, 0.60);
    return vec3(0.92, 0.98, 1.0);
}

void main(void) {
    vec2 uv = vTextureCoord;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= uAspect;

    float power = max(0.0, uPower);
    float quality = mix(0.68, 1.0, uQuality);
    float emitterCount = mix(7.0, 18.0, clamp(uDetail / 3.0, 0.0, 1.0));
    float rayCount = mix(12.0, 32.0, clamp(uDetail / 3.0, 0.0, 1.0));

    vec3 color = vec3(0.0025, 0.0045, 0.007);
    float roomFog = noise2(p * vec2(2.1, 3.4) + vec2(uTime * 0.014, -uTime * 0.009));
    color += vec3(0.008, 0.016, 0.022) * roomFog * (0.25 + uEnergy * 0.25 + power * 0.08);

    float rigY = -0.78;
    float rigMask = 1.0 - smoothstep(0.006, 0.018, sdBox(p - vec2(0.0, rigY), vec2(uAspect * 0.37, 0.012)));
    color = mix(color, vec3(0.028, 0.034, 0.045), rigMask * 0.92);

    // Perspective floor is intentionally subtle: it provides physical depth,
    // but the laser architecture remains the hero.
    float floorStart = 0.43;
    if (p.y > floorStart) {
        float depth = clamp((p.y - floorStart) / (1.0 - floorStart), 0.0, 1.0);
        float perspective = depth * depth;
        float horizontal = abs(fract((perspective * 16.0 - uTime * 0.12)) - 0.5);
        float hLine = 1.0 - smoothstep(0.485, 0.5, horizontal);
        float convergeX = p.x / max(0.10, depth + 0.10);
        float vertical = abs(fract(convergeX * 0.22 + 0.5) - 0.5);
        float vLine = 1.0 - smoothstep(0.492, 0.5, vertical);
        color += vec3(0.04, 0.15, 0.18) * (hLine + vLine * 0.5)
            * (0.006 + power * 0.004 + uMid * 0.006) * quality;
    }

    for (int i = 0; i < 32; i++) {
        float fi = float(i);
        float active = step(fi + 0.5, rayCount);
        float seed = hash11(fi * 19.31 + 2.7);

        float emitterIndex = mod(fi, max(1.0, emitterCount));
        float emitterT = (emitterIndex + 0.5) / max(1.0, emitterCount);
        float ex = mix(-uAspect * 0.34, uAspect * 0.34, emitterT);
        float ey = rigY + 0.035 + (hash11(emitterIndex * 7.2 + 1.3) - 0.5) * 0.045;
        vec2 a = vec2(ex, ey);

        float fan = (hash11(fi * 3.71 + 8.2) - 0.5) * 2.0;
        float sweep = sin(uTime * (0.17 + seed * 0.13) + seed * 10.0)
            * (0.10 + uBass * 0.07 + power * 0.018);
        float tx = clamp(
            ex * 0.28 + fan * (0.55 + uBass * 0.18) + sweep,
            -uAspect * 0.88,
            uAspect * 0.88
        );
        float ty = 0.78 - abs(fan) * 0.10 - seed * 0.045;
        vec2 b = vec2(tx, ty);

        float d = sdSegment(p, a, b);
        float coreWidth = mix(0.0014, 0.0022, quality);
        float glowWidth = coreWidth * (4.0 + power * 0.7);
        float core = 1.0 - smoothstep(coreWidth, coreWidth * 2.2, d);
        float glow = 1.0 - smoothstep(glowWidth, glowWidth * 2.4, d);

        vec3 lc = laserColor(fi);
        float flicker = 0.90 + 0.10 * sin(uTime * (7.0 + seed * 8.0) + seed * 41.0);
        float gain = active * flicker * (0.46 + uEnergy * 0.34 + uTransient * 0.20) * (0.56 + power * 0.26);
        color += lc * glow * gain * 0.22;
        color += mix(lc, vec3(1.0), 0.40) * core * gain * 0.90;

        float sourceDist = length(p - a);
        float sourceGlint = 1.0 - smoothstep(0.0, 0.016 + uTransient * 0.004, sourceDist);
        color += lc * sourceGlint * active * (0.13 + uTreble * 0.16 + uTransient * 0.12);

        float targetDist = length(p - b);
        float floorHalo = 1.0 - smoothstep(0.0, 0.030 + uBass * 0.016, targetDist);
        float floorHot = 1.0 - smoothstep(0.0, 0.006 + uTransient * 0.003, targetDist);
        color += lc * floorHalo * active * (0.022 + uBass * 0.06 + uTransient * 0.04);
        color += mix(lc, vec3(1.0), 0.55) * floorHot * active * (0.20 + uTransient * 0.30);
    }

    // Fixture apertures: thin luminous slots, not cartoon dots.
    for (int j = 0; j < 18; j++) {
        float fj = float(j);
        float active = step(fj + 0.5, emitterCount);
        float t = (fj + 0.5) / max(1.0, emitterCount);
        vec2 fixtureP = p - vec2(mix(-uAspect * 0.34, uAspect * 0.34, t), rigY + 0.035);
        float body = 1.0 - smoothstep(0.004, 0.010, sdBox(fixtureP, vec2(0.021, 0.012)));
        float aperture = 1.0 - smoothstep(0.002, 0.006, sdBox(fixtureP - vec2(0.0, 0.004), vec2(0.010, 0.0025)));
        color = mix(color, vec3(0.010, 0.012, 0.016), body * active * 0.74);
        color += laserColor(fj) * aperture * active * (0.20 + uTreble * 0.18);
    }

    // Microscopic suspended haze specks sell volume while keeping line edges crisp.
    float speck = smoothstep(0.985, 1.0, noise2(p * 65.0 + vec2(uTime * 0.45, -uTime * 0.18)));
    color += vec3(0.45, 0.75, 0.80) * speck * (0.008 + uTreble * 0.018) * quality;

    color *= 0.80 + power * 0.30;
    color = 1.0 - exp(-max(color, vec3(0.0)) * (1.12 + uEnergy * 0.30));
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
    this.surface.clear().rect(0, 0, this.width, this.height).fill({ color: 0x020305, alpha: 1 });
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
    const uniforms = (this.filter.resources.laserUniforms as { uniforms: Uniforms }).uniforms;
    uniforms[name] = value;
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
