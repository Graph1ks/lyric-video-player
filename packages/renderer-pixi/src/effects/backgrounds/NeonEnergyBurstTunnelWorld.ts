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
    float amplitude = 0.5;
    mat2 rot = mat2(0.82, -0.57, 0.57, 0.82);
    for (int i = 0; i < 4; i++) {
        value += noise2(p) * amplitude;
        p = rot * p * 2.03 + 11.7;
        amplitude *= 0.5;
    }
    return value;
}

float wrappedAngle(float value) {
    return abs(atan(sin(value), cos(value)));
}

vec3 burstColor(float t) {
    vec3 magenta = vec3(1.00, 0.05, 0.64);
    vec3 blue = vec3(0.08, 0.42, 1.00);
    vec3 cyan = vec3(0.12, 0.92, 1.00);
    vec3 gold = vec3(1.00, 0.62, 0.09);
    t = fract(t);
    if (t < 0.25) return mix(magenta, blue, t * 4.0);
    if (t < 0.50) return mix(blue, cyan, (t - 0.25) * 4.0);
    if (t < 0.75) return mix(cyan, gold, (t - 0.50) * 4.0);
    return mix(gold, magenta, (t - 0.75) * 4.0);
}

void main(void) {
    vec2 uv = vTextureCoord;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= uAspect;

    float power = max(0.0, uPower);
    float quality = mix(0.68, 1.0, uQuality);

    // The portal center is intentionally a little above screen-center so the
    // lower half can carry more trail length without crowding lyrics.
    vec2 center = vec2(0.0, -0.055);
    vec2 q = p - center;
    float radius = length(q);
    float angle = atan(q.y, q.x);

    float tunnelNoise = fbm(vec2(
        angle * 1.35 + uTime * 0.035,
        log(radius + 0.055) * 2.3 - uTime * (0.24 + uBass * 0.18)
    ));
    float angularNoise = noise2(vec2(angle * 11.0, floor(uTime * 0.18) * 0.2));

    vec3 color = vec3(0.0025, 0.0018, 0.010);
    float edgeVignette = 1.0 - smoothstep(0.55, 1.75, length(p * vec2(0.72, 0.96)));
    color += vec3(0.028, 0.005, 0.055) * edgeVignette * (0.30 + uEnergy * 0.38);

    // Perspective tunnel ribs: logarithmic radius makes rings compress toward
    // the center, creating a much stronger sense of depth than flat circles.
    float depth = -log(radius + 0.035);
    float ribPhase = depth * (6.5 + uDetail * 1.7)
        - uTime * (2.4 + uBass * 1.8 + power * 0.28)
        + tunnelNoise * 1.5;
    float ribWave = abs(fract(ribPhase) - 0.5);
    float ribs = 1.0 - smoothstep(0.045, 0.13, ribWave);
    float ribGate = smoothstep(0.10, 0.34, radius) * (1.0 - smoothstep(1.1, 1.75, radius));
    vec3 ribColor = burstColor(angle / TAU + tunnelNoise * 0.22 + uTime * 0.012);
    color += ribColor * ribs * ribGate * (0.035 + uEnergy * 0.075 + power * 0.024) * quality;

    // Dense radial speed streak field. Polar cell IDs remain stable while their
    // radial coordinate races outward, producing long photographic light trails.
    float spokeDensity = mix(54.0, 142.0, clamp(uDetail / 3.0, 0.0, 1.0));
    float spokeCoord = angle / TAU * spokeDensity;
    float spokeId = floor(spokeCoord);
    float spokeLocal = abs(fract(spokeCoord) - 0.5);
    float spokeSeed = hash11(spokeId * 1.371 + 2.9);
    float spokeMask = 1.0 - smoothstep(0.02 + spokeSeed * 0.10, 0.48, spokeLocal);

    float travel = fract(
        radius * (1.7 + spokeSeed * 2.1)
        - uTime * (0.72 + spokeSeed * 1.15 + uBass * 0.42)
        + spokeSeed * 7.0
    );
    float streakHead = smoothstep(0.92, 1.0, travel);
    float streakTail = smoothstep(0.18, 0.96, travel) * (1.0 - smoothstep(0.965, 1.0, travel));
    float radialFade = smoothstep(0.09, 0.28, radius) * (1.0 - smoothstep(1.00, 1.62, radius));
    float randomGate = smoothstep(
        mix(0.70, 0.46, clamp(uDetail / 3.0, 0.0, 1.0)),
        0.96,
        spokeSeed
    );
    float streak = spokeMask * radialFade * randomGate
        * (streakHead * (1.5 + uTransient * 2.4) + streakTail * 0.48);

    vec3 streakColor = burstColor(spokeSeed + angle / TAU * 0.16);
    color += streakColor * streak * (0.16 + uEnergy * 0.28 + power * 0.075) * quality;

    // Fine streak layer adds photographic density without making every line
    // equally bright.
    float fineCoord = angle / TAU * spokeDensity * 1.73 + tunnelNoise * 2.5;
    float fineId = floor(fineCoord);
    float fineLocal = abs(fract(fineCoord) - 0.5);
    float fineSeed = hash11(fineId * 4.13 + 9.2);
    float fine = (1.0 - smoothstep(0.18, 0.49, fineLocal))
        * smoothstep(0.88, 0.985, fineSeed)
        * radialFade
        * (0.4 + 0.6 * noise2(vec2(radius * 12.0 - uTime * 2.2, fineSeed * 20.0)));
    color += burstColor(fineSeed + 0.2) * fine * (0.035 + uTreble * 0.07 + power * 0.014);

    // Electric scribbles: angular SDF filaments whose target angle meanders as
    // radius grows. They read as hand-drawn neon electricity cutting through
    // the cleaner speed-line field.
    float filamentCount = mix(5.0, 11.0, clamp(uDetail / 3.0, 0.0, 1.0));
    for (int i = 0; i < 11; i++) {
        float fi = float(i);
        float active = step(fi + 0.5, filamentCount);
        float seed = hash11(fi * 15.71 + 3.4);
        float baseAngle = (seed - 0.5) * TAU;
        float wiggle = sin(radius * (13.0 + seed * 17.0) - uTime * (1.1 + seed * 1.4) + seed * 22.0)
            * (0.10 + uTreble * 0.055);
        wiggle += sin(radius * (31.0 + seed * 25.0) + uTime * (0.52 + seed * 0.9))
            * (0.035 + uTreble * 0.025);
        wiggle += (noise2(vec2(radius * (8.0 + seed * 5.0) - uTime * 0.4, seed * 19.0)) - 0.5)
            * (0.16 + uTreble * 0.08);

        float angularDistance = wrappedAngle(angle - baseAngle - wiggle);
        float coreWidth = 0.0035 + (1.0 - quality) * 0.0012;
        float glowWidth = 0.024 + uEnergy * 0.010;
        float core = 1.0 - smoothstep(coreWidth, coreWidth * 2.4, angularDistance);
        float glow = 1.0 - smoothstep(glowWidth, glowWidth * 1.75, angularDistance);
        float radialGate = smoothstep(0.15 + seed * 0.08, 0.31 + seed * 0.08, radius)
            * (1.0 - smoothstep(0.86 + seed * 0.34, 1.25 + seed * 0.30, radius));
        float pulse = 0.72 + 0.28 * sin(uTime * (2.2 + seed * 2.5) + radius * 18.0 + seed * 40.0);

        vec3 filamentColor = burstColor(seed * 1.2 + fi * 0.09);
        color += filamentColor * glow * radialGate * active
            * (0.042 + uEnergy * 0.095 + uTransient * 0.055)
            * pulse;
        color += mix(filamentColor, vec3(1.0), 0.56) * core * radialGate * active
            * (0.20 + uTreble * 0.18 + uTransient * 0.28)
            * pulse;
    }

    // Broken arc sparks fill the gaps between long filaments.
    float arcCoord = angle / TAU * mix(24.0, 52.0, clamp(uDetail / 3.0, 0.0, 1.0))
        + tunnelNoise * 1.8;
    float arcId = floor(arcCoord);
    float arcSeed = hash11(arcId * 8.37 + floor(radius * 9.0) * 3.1);
    float arcLocal = abs(fract(arcCoord) - 0.5);
    float arc = (1.0 - smoothstep(0.20, 0.47, arcLocal))
        * smoothstep(0.78, 0.98, arcSeed)
        * smoothstep(0.20, 0.42, radius)
        * (1.0 - smoothstep(0.72, 1.18, radius));
    color += burstColor(arcSeed + 0.48) * arc
        * (0.025 + uTreble * 0.060 + uTransient * 0.075);

    // Central energy aperture and hot white core.
    float centerHalo = 1.0 - smoothstep(0.035, 0.34 + uBass * 0.04, radius);
    float centerCore = 1.0 - smoothstep(0.012, 0.075 + uTransient * 0.025, radius);
    float lensHorizontal = exp(-abs(q.y) * 76.0) * exp(-abs(q.x) * 2.9);
    float lensVertical = exp(-abs(q.x) * 108.0) * exp(-abs(q.y) * 4.3);

    color += vec3(0.18, 0.16, 1.00) * centerHalo * (0.16 + uBass * 0.14 + uEnergy * 0.10);
    color += vec3(1.00, 0.16, 0.72) * centerHalo * centerHalo * (0.10 + uEnergy * 0.10);
    color += vec3(1.00, 0.93, 0.80) * centerCore * (1.0 + uTransient * 1.8);
    color += vec3(0.38, 0.62, 1.00) * lensHorizontal * (0.035 + uTransient * 0.14);
    color += vec3(1.00, 0.22, 0.70) * lensVertical * (0.020 + uTransient * 0.09);

    // Tiny ejecta particles around the burst center.
    vec2 ejectGrid = floor((q * 42.0) + vec2(uTime * 1.7, -uTime * 0.9));
    float ejectSeed = hash21(ejectGrid);
    float eject = smoothstep(0.990, 1.0, ejectSeed)
        * smoothstep(0.11, 0.28, radius)
        * (1.0 - smoothstep(0.80, 1.18, radius));
    color += burstColor(ejectSeed) * eject * (0.08 + uTransient * 0.20 + uTreble * 0.08);

    // Power drives the whole show from authored 100% into deliberate excess.
    color *= 0.72 + power * 0.42;
    color = 1.0 - exp(-max(color, vec3(0.0)) * (1.20 + uEnergy * 0.36 + uTransient * 0.16));
    color = pow(color, vec3(0.90));

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

export class NeonEnergyBurstTunnelWorld {
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
        energyTunnelUniforms: {
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
    this.surface.clear().rect(0, 0, this.width, this.height).fill({ color: 0x020108, alpha: 1 });
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
    const uniforms = (this.filter.resources.energyTunnelUniforms as { uniforms: Uniforms }).uniforms;
    uniforms[name] = value;
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
