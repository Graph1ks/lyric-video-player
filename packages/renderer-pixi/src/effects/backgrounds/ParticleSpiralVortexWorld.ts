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

const float PI = 3.141592653589793;
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

float wrappedAngle(float value) {
    return abs(atan(sin(value), cos(value)));
}

vec3 spectral(float t) {
    t = fract(t);
    vec3 violet = vec3(0.55, 0.18, 1.00);
    vec3 cyan = vec3(0.08, 0.88, 1.00);
    vec3 green = vec3(0.25, 1.00, 0.38);
    vec3 gold = vec3(1.00, 0.86, 0.16);
    vec3 pink = vec3(1.00, 0.20, 0.58);
    if (t < 0.20) return mix(violet, cyan, t * 5.0);
    if (t < 0.40) return mix(cyan, green, (t - 0.20) * 5.0);
    if (t < 0.60) return mix(green, gold, (t - 0.40) * 5.0);
    if (t < 0.80) return mix(gold, pink, (t - 0.60) * 5.0);
    return mix(pink, violet, (t - 0.80) * 5.0);
}

void main(void) {
    vec2 uv = vTextureCoord;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= uAspect;

    float power = max(0.0, uPower);
    float detail = clamp(uDetail / 3.0, 0.0, 1.0);
    float quality = mix(0.72, 1.0, uQuality);

    vec2 center = vec2(0.0, -0.02);
    vec2 q = p - center;
    float radius = length(q);
    float angle = atan(q.y, q.x);

    vec3 color = vec3(0.0015, 0.0010, 0.0020);

    // Four-to-six logarithmic arms. Motion is constant/time-driven; audio only
    // changes bead size, light and sparkle through smoothed envelopes.
    float armCount = mix(4.0, 6.0, detail);
    float curl = mix(2.70, 3.35, detail);
    float baseSpin = uTime * 0.105;
    float outerGate = smoothstep(0.055, 0.13, radius)
        * (1.0 - smoothstep(1.12, 1.58, radius));

    vec3 armAccum = vec3(0.0);
    float armPresence = 0.0;

    for (int i = 0; i < 6; i++) {
        float fi = float(i);
        float active = step(fi + 0.5, armCount);
        float armSeed = hash11(fi * 19.71 + 2.9);
        float armBase = fi / armCount * TAU + baseSpin + armSeed * 0.11;
        float targetAngle = armBase - log(radius + 0.085) * curl;
        float angular = wrappedAngle(angle - targetAngle);

        float tangentDistance = angular * max(0.075, radius);
        float beadDensity = mix(12.0, 24.0, detail) * mix(0.90, 1.16, armSeed);
        // Increasing time moves bead centers inward monotonically along the arm.
        float radialPhase = radius * beadDensity + uTime * (0.13 + armSeed * 0.05) + armSeed * 4.0;
        float radialDistance = abs(fract(radialPhase) - 0.5) / beadDensity;
        float beadDistance = length(vec2(tangentDistance, radialDistance));

        float radialSize = mix(0.010, 0.043, smoothstep(0.10, 1.20, radius));
        float size = radialSize
            * mix(0.82, 1.18, armSeed)
            * (1.0 + uBass * 0.12);

        float core = 1.0 - smoothstep(size * 0.56, size, beadDistance);
        float halo = exp(-beadDistance * beadDistance / max(0.000001, size * size * 4.8));
        float armGlow = exp(-tangentDistance * tangentDistance / max(0.000001, size * size * 11.0))
            * 0.08;

        float innerRainbow = 1.0 - smoothstep(0.18, 0.58, radius);
        vec3 warm = mix(vec3(1.00, 0.43, 0.11), vec3(1.00, 0.82, 0.22), armSeed);
        vec3 beadColor = mix(
            warm,
            spectral(angle / TAU + armSeed * 0.17 + uTime * 0.006),
            innerRainbow * 0.96
        );

        float shimmer = 0.90 + uTreble * 0.12
            + uTransient * smoothstep(0.72, 1.0, armSeed) * 0.22;
        armAccum += beadColor
            * (core * (0.56 + power * 0.30) + halo * (0.10 + power * 0.08) + armGlow)
            * outerGate
            * shimmer
            * active;
        armPresence += (core + halo * 0.22) * outerGate * active;
    }

    color += armAccum * quality;

    // Fine secondary particles occupy the gaps and strongly cluster toward the
    // vortex core. This is analytic polar cell sampling, not display objects.
    float dustAngularCount = mix(90.0, 190.0, detail) * quality;
    float dustRadialCount = mix(42.0, 84.0, detail) * quality;
    float aCoord = angle / TAU * dustAngularCount;
    float rCoord = radius * dustRadialCount + uTime * 0.055;
    vec2 dustCell = floor(vec2(aCoord, rCoord));
    vec2 dustLocal = fract(vec2(aCoord, rCoord)) - 0.5;
    float dustSeed = hash21(dustCell + vec2(17.3, 8.9));

    float angularWorld = dustLocal.x / dustAngularCount * TAU * max(radius, 0.05);
    float radialWorld = dustLocal.y / dustRadialCount;
    float dustDistance = length(vec2(angularWorld, radialWorld));
    float dustSize = mix(0.0028, 0.0085, dustSeed)
        * mix(0.72, 1.10, smoothstep(0.08, 1.10, radius));
    float dustGate = smoothstep(
        mix(0.93, 0.79, detail),
        0.995,
        dustSeed
    );
    float centerDensity = mix(1.9, 0.55, smoothstep(0.06, 1.25, radius));
    float dustCore = (1.0 - smoothstep(dustSize * 0.55, dustSize, dustDistance))
        * dustGate
        * centerDensity
        * outerGate;
    float dustHalo = exp(-dustDistance * dustDistance / max(0.0000005, dustSize * dustSize * 6.0))
        * dustGate
        * centerDensity
        * outerGate;

    vec3 dustColor = mix(
        vec3(1.00, 0.62, 0.18),
        spectral(dustSeed + angle / TAU),
        1.0 - smoothstep(0.18, 0.72, radius)
    );
    color += dustColor
        * (dustCore * (0.18 + uTreble * 0.16 + uTransient * 0.16)
            + dustHalo * 0.055)
        * quality;

    // Dense multicolor core: the reference resolves into a bright chromatic
    // whirlpool rather than a black hole.
    float coreHalo = 1.0 - smoothstep(0.025, 0.24, radius);
    float coreHot = 1.0 - smoothstep(0.008, 0.070, radius);
    float spiralBands = 0.55 + 0.45 * sin(angle * 7.0 - log(radius + 0.02) * 9.0 + uTime * 0.42);
    vec3 coreColor = spectral(angle / TAU + log(radius + 0.04) * 0.16 - uTime * 0.012);
    color += coreColor * coreHalo * spiralBands * (0.16 + uEnergy * 0.16 + power * 0.05);
    color += vec3(1.0, 0.90, 0.64) * coreHot * (0.30 + uTransient * 0.34 + power * 0.05);

    // Restrained haze gives the arm glows room to bloom while keeping black
    // negative space dominant.
    float haze = exp(-radius * 1.85) * (0.012 + uEnergy * 0.018);
    color += vec3(0.20, 0.06, 0.24) * haze;

    color *= 0.76 + power * 0.38;
    color = 1.0 - exp(-max(color, vec3(0.0)) * (1.20 + uEnergy * 0.24));
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

export class ParticleSpiralVortexWorld {
  readonly container = new Container();

  private readonly surface = new Graphics();
  private readonly filter: Filter;
  private width = 1;
  private height = 1;
  private intensity = 1;
  private detail = 1;
  private quality: QualityMode = "cinema";
  private lastTime = Number.NaN;
  private smoothedBass = 0;
  private smoothedTreble = 0;
  private smoothedEnergy = 0;
  private smoothedTransient = 0;

  constructor() {
    this.filter = new Filter({
      glProgram: GlProgram.from({ vertex, fragment }),
      resources: {
        particleVortexUniforms: {
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
    this.surface.clear().rect(0, 0, this.width, this.height).fill({ color: 0x010001, alpha: 1 });
    this.write("uAspect", this.width / this.height);
  }

  update(time: number, audio: AudioBands) {
    if (!this.container.visible) {
      this.lastTime = Number.NaN;
      return;
    }

    const discontinuity = !Number.isFinite(this.lastTime) || time < this.lastTime || time - this.lastTime > 0.5;
    const dt = discontinuity ? 1 / 60 : Math.max(0, Math.min(0.1, time - this.lastTime));
    this.lastTime = time;

    if (discontinuity) {
      this.smoothedBass = audio.bass;
      this.smoothedTreble = audio.treble;
      this.smoothedEnergy = audio.energy;
      this.smoothedTransient = audio.transient;
    } else {
      this.smoothedBass = smoothEnvelope(this.smoothedBass, audio.bass, dt, 0.08, 0.28);
      this.smoothedTreble = smoothEnvelope(this.smoothedTreble, audio.treble, dt, 0.05, 0.18);
      this.smoothedEnergy = smoothEnvelope(this.smoothedEnergy, audio.energy, dt, 0.10, 0.30);
      this.smoothedTransient = smoothEnvelope(this.smoothedTransient, audio.transient, dt, 0.02, 0.12);
    }

    this.write("uTime", time);
    this.write("uPower", this.intensity);
    this.write("uDetail", this.detail);
    this.write("uBass", this.smoothedBass);
    this.write("uMid", audio.mid);
    this.write("uTreble", this.smoothedTreble);
    this.write("uEnergy", this.smoothedEnergy);
    this.write("uTransient", this.smoothedTransient);
    this.write("uAspect", this.width / this.height);
    this.write("uQuality", this.quality === "cinema" ? 1 : 0);
    this.container.alpha = clamp(this.intensity, 0, 1);
  }

  private write(name: keyof Uniforms, value: number) {
    const uniforms = (this.filter.resources.particleVortexUniforms as { uniforms: Uniforms }).uniforms;
    uniforms[name] = value;
  }
}

function smoothEnvelope(
  current: number,
  target: number,
  dt: number,
  attackSeconds: number,
  releaseSeconds: number,
) {
  const tau = target > current ? attackSeconds : releaseSeconds;
  const amount = 1 - Math.exp(-dt / Math.max(0.001, tau));
  return current + (target - current) * amount;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
