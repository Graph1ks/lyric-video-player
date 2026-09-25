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

vec2 rotate2(vec2 p, float a) {
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c) * p;
}

vec3 rotateY(vec3 p, float a) {
    float s = sin(a);
    float c = cos(a);
    return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
}

vec3 rotateX(vec3 p, float a) {
    float s = sin(a);
    float c = cos(a);
    return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z);
}

float squareGlow(vec2 local, float core, float glow) {
    float box = max(abs(local.x), abs(local.y));
    float hot = 1.0 - smoothstep(core, core + 0.035, box);
    float halo = 1.0 - smoothstep(glow, glow + 0.11, box);
    return hot + halo * 0.28;
}

vec3 reflectionColor(float h) {
    vec3 magenta = vec3(1.00, 0.12, 0.68);
    vec3 cyan = vec3(0.12, 0.88, 1.00);
    vec3 gold = vec3(1.00, 0.67, 0.16);
    vec3 violet = vec3(0.49, 0.24, 1.00);
    if (h < 0.25) return mix(magenta, violet, h * 4.0);
    if (h < 0.50) return mix(violet, cyan, (h - 0.25) * 4.0);
    if (h < 0.75) return mix(cyan, gold, (h - 0.50) * 4.0);
    return mix(gold, magenta, (h - 0.75) * 4.0);
}

float roomReflectionLayer(vec2 p, float scale, float phase, float zoneBias, out vec3 tint) {
    vec2 q = p;
    float floorDepth = smoothstep(0.18, 0.96, p.y);
    float ceilingDepth = smoothstep(-0.18, -0.96, p.y);
    float wallDepth = smoothstep(0.42 * uAspect, 0.98 * uAspect, abs(p.x));

    // Perspective compression toward the horizon on floor/ceiling.
    float perspective = 1.0 + (floorDepth + ceilingDepth) * 2.4;
    q.x *= perspective;
    q.y += floorDepth * 0.55 - ceilingDepth * 0.55;

    vec2 grid = vec2(scale * (0.95 + zoneBias * 0.12), scale * 0.72);
    vec2 shifted = q * grid + vec2(
        uTime * (0.22 + phase * 0.05),
        sin(uTime * 0.19 + phase * 5.0) * 0.42
    );
    vec2 cell = floor(shifted);
    vec2 local = fract(shifted) - 0.5;
    float seed = hash21(cell + vec2(phase * 37.0, phase * 91.0));

    float density = mix(0.84, 0.58, clamp(uDetail / 3.0, 0.0, 1.0));
    float active = smoothstep(density, min(0.995, density + 0.12), seed);

    float zone = max(max(floorDepth, ceilingDepth), wallDepth);
    zone = max(zone, 0.18 + zoneBias * 0.08);
    float twinkle = 0.48 + 0.52 * sin(
        uTime * (0.75 + seed * 2.8)
        + seed * 41.0
        + uTreble * 2.0
    );
    float transientSpark = 1.0 + uTransient * smoothstep(0.72, 1.0, seed) * 1.8;

    float rotation = (seed - 0.5) * 0.55 + sin(uTime * 0.14 + seed * 7.0) * 0.08;
    local = rotate2(local, rotation);

    float size = mix(0.075, 0.17, seed) * mix(0.86, 1.18, uBass);
    float glowSize = size * (1.55 + uEnergy * 0.35);
    float spot = squareGlow(local, size, glowSize) * active * zone * twinkle * transientSpark;

    tint = reflectionColor(fract(seed + phase * 0.17 + uTime * 0.008));
    return spot;
}

void main(void) {
    vec2 uv = vTextureCoord;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= uAspect;

    float power = max(0.0, uPower);
    float quality = mix(0.70, 1.0, uQuality);

    // Enclosed room: deep neutral walls with subtle ceiling/floor perspective.
    float horizon = 0.18;
    float floorDepth = smoothstep(horizon, 1.0, p.y);
    float ceilingDepth = smoothstep(-horizon, -1.0, p.y);
    float sideDepth = smoothstep(0.38 * uAspect, 1.0 * uAspect, abs(p.x));
    vec3 room = vec3(0.005, 0.006, 0.011);
    room += vec3(0.015, 0.011, 0.022) * ceilingDepth;
    room += vec3(0.008, 0.014, 0.020) * floorDepth;
    room += vec3(0.018, 0.009, 0.022) * sideDepth;

    float centerFalloff = 1.0 - smoothstep(0.25, 1.65, length(p * vec2(0.72, 0.92)));
    room += vec3(0.018, 0.010, 0.030) * centerFalloff * (0.4 + uEnergy * 0.8);
    vec3 color = room;

    // Dense projected mirror squares. Multiple differently scaled layers avoid
    // the obvious single-grid look and create the hundreds-of-reflections field.
    vec3 tintA;
    vec3 tintB;
    vec3 tintC;
    float reflections = 0.0;
    float spotA = roomReflectionLayer(p, mix(12.0, 20.0, clamp(uDetail / 3.0, 0.0, 1.0)), 0.13, 0.10, tintA);
    float spotB = roomReflectionLayer(p + vec2(0.11, -0.07), mix(17.0, 27.0, clamp(uDetail / 3.0, 0.0, 1.0)), 0.47, 0.24, tintB);
    float spotC = roomReflectionLayer(p + vec2(-0.08, 0.04), mix(23.0, 36.0, clamp(uDetail / 3.0, 0.0, 1.0)), 0.79, 0.38, tintC);
    reflections = spotA + spotB * 0.76 + spotC * 0.52;
    color += tintA * spotA * (0.10 + uEnergy * 0.16 + power * 0.045) * quality;
    color += tintB * spotB * (0.075 + uEnergy * 0.13 + power * 0.035) * quality;
    color += tintC * spotC * (0.055 + uEnergy * 0.10 + power * 0.028) * quality;

    // Room edge lines are intentionally almost invisible; they only establish
    // that the reflections live inside a volume rather than on a flat canvas.
    float floorEdge = 1.0 - smoothstep(0.002, 0.010, abs(p.y - horizon));
    float sideEdge = 1.0 - smoothstep(0.002, 0.011, abs(abs(p.x) - uAspect * 0.76));
    color += vec3(0.12, 0.15, 0.20) * floorEdge * 0.035;
    color += vec3(0.10, 0.08, 0.15) * sideEdge * 0.025;

    // Mirrorball: analytic sphere with quantized spherical facets.
    vec2 ballCenter = vec2(0.0, -0.12);
    float ballRadius = 0.305 * (1.0 + uBass * 0.025);
    vec2 bp = (p - ballCenter) / ballRadius;
    float r2 = dot(bp, bp);
    float sphereMask = 1.0 - smoothstep(0.985, 1.005, r2);

    if (r2 < 1.02) {
        float z = sqrt(max(0.0, 1.0 - min(r2, 1.0)));
        vec3 normal = normalize(vec3(bp.x, bp.y, z));
        normal = rotateY(normal, uTime * (0.20 + uEnergy * 0.055));
        normal = rotateX(normal, -0.18 + sin(uTime * 0.09) * 0.04);

        float lon = atan(normal.z, normal.x) / TAU + 0.5;
        float lat = asin(clamp(normal.y, -1.0, 1.0)) / PI + 0.5;
        vec2 facets = vec2(
            lon * mix(30.0, 54.0, clamp(uDetail / 3.0, 0.0, 1.0)),
            lat * mix(20.0, 36.0, clamp(uDetail / 3.0, 0.0, 1.0))
        );
        vec2 facetCell = floor(facets);
        vec2 facetLocal = fract(facets);
        float groutX = smoothstep(0.035, 0.075, min(facetLocal.x, 1.0 - facetLocal.x));
        float groutY = smoothstep(0.035, 0.075, min(facetLocal.y, 1.0 - facetLocal.y));
        float tileInterior = groutX * groutY;
        float facetSeed = hash21(facetCell + vec2(7.1, 19.3));

        vec3 viewDir = vec3(0.0, 0.0, 1.0);
        vec3 reflected = reflect(-viewDir, normal);

        vec3 l1 = normalize(vec3(-0.64, -0.24, 0.73));
        vec3 l2 = normalize(vec3(0.58, -0.10, 0.81));
        vec3 l3 = normalize(vec3(0.18, 0.72, 0.67));
        vec3 l4 = normalize(vec3(-0.28, 0.54, 0.79));

        float s1 = pow(max(dot(reflected, l1), 0.0), 56.0);
        float s2 = pow(max(dot(reflected, l2), 0.0), 72.0);
        float s3 = pow(max(dot(reflected, l3), 0.0), 88.0);
        float s4 = pow(max(dot(reflected, l4), 0.0), 64.0);

        vec3 facetTint = mix(vec3(0.42, 0.45, 0.50), reflectionColor(facetSeed), 0.34);
        float diffuse = 0.18 + 0.62 * max(normal.z, 0.0);
        float sparkle = smoothstep(0.72, 1.0, facetSeed)
            * (0.22 + uTreble * 0.32)
            * (0.65 + 0.35 * sin(uTime * 2.1 + facetSeed * 35.0));

        vec3 sphereColor = facetTint * (diffuse * (0.48 + facetSeed * 0.55) + sparkle);
        sphereColor += vec3(1.00, 0.16, 0.64) * s1 * (1.8 + uTransient * 1.8);
        sphereColor += vec3(0.14, 0.88, 1.00) * s2 * (1.7 + uTransient * 1.4);
        sphereColor += vec3(1.00, 0.70, 0.18) * s3 * (1.5 + uTransient * 1.5);
        sphereColor += vec3(0.62, 0.34, 1.00) * s4 * (1.45 + uTransient * 1.2);

        float fresnel = pow(1.0 - max(normal.z, 0.0), 2.4);
        sphereColor += vec3(0.34, 0.40, 0.55) * fresnel * (0.34 + uEnergy * 0.22);
        sphereColor *= tileInterior;
        sphereColor += vec3(0.015, 0.017, 0.022) * (1.0 - tileInterior);

        color = mix(color, sphereColor, sphereMask);
    }

    // Optical halo + hanging cable.
    float ballDist = length(p - ballCenter);
    float halo = 1.0 - smoothstep(ballRadius * 0.95, ballRadius * 1.85, ballDist);
    float hotHalo = 1.0 - smoothstep(ballRadius * 1.01, ballRadius * 1.18, ballDist);
    color += vec3(0.36, 0.16, 0.56) * halo * (0.028 + uEnergy * 0.040 + power * 0.016);
    color += vec3(0.74, 0.85, 1.00) * hotHalo * (0.018 + uTransient * 0.050);

    float cable = 1.0 - smoothstep(
        0.0015,
        0.004,
        abs(p.x) + step(ballCenter.y - ballRadius, p.y) * 10.0
    );
    cable *= step(p.y, ballCenter.y - ballRadius);
    color += vec3(0.18, 0.20, 0.24) * cable * 0.34;

    // Dust catches the moving room light; kept fine enough not to become stars.
    vec2 dustCell = floor((p + vec2(uTime * 0.004, -uTime * 0.006)) * 74.0);
    float dustSeed = hash21(dustCell);
    float dust = smoothstep(0.988, 1.0, dustSeed)
        * (0.4 + 0.6 * sin(uTime * (0.8 + dustSeed * 1.6) + dustSeed * 70.0));
    color += vec3(0.64, 0.74, 0.90) * dust * (0.012 + uTreble * 0.022) * quality;

    // Bass breath and transient exposure lift make the whole room feel driven by
    // the music without scaling the ball like a cartoon object.
    color *= 0.84 + power * 0.28 + uBass * 0.035;
    color = 1.0 - exp(-max(color, vec3(0.0)) * (1.22 + uEnergy * 0.28 + uTransient * 0.10));
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

export class DiscoMirrorballRoomWorld {
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
        mirrorballUniforms: {
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
    this.surface.clear().rect(0, 0, this.width, this.height).fill({ color: 0x010207, alpha: 1 });
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
    const uniforms = (this.filter.resources.mirrorballUniforms as { uniforms: Uniforms }).uniforms;
    uniforms[name] = value;
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
