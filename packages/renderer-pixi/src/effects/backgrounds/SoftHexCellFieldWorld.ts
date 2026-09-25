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

vec3 pastelField(float t) {
    t = fract(t);
    vec3 mint = vec3(0.58, 1.00, 0.78);
    vec3 lemon = vec3(1.00, 0.98, 0.36);
    vec3 peach = vec3(1.00, 0.62, 0.45);
    vec3 pink = vec3(1.00, 0.38, 0.72);
    vec3 lilac = vec3(0.68, 0.48, 1.00);
    vec3 sky = vec3(0.32, 0.77, 1.00);
    if (t < 0.20) return mix(mint, lemon, t * 5.0);
    if (t < 0.40) return mix(lemon, peach, (t - 0.20) * 5.0);
    if (t < 0.60) return mix(peach, pink, (t - 0.40) * 5.0);
    if (t < 0.80) return mix(pink, lilac, (t - 0.60) * 5.0);
    return mix(lilac, sky, (t - 0.80) * 5.0);
}

vec3 renderHexLayer(
    vec2 p,
    float frequency,
    vec2 offset,
    float minSize,
    float maxSize,
    float alphaScale,
    float layerDepth
) {
    vec2 local;
    vec2 id;
    hexGrid(p * frequency + offset, local, id);
    float seed = hash21(id * 0.083 + vec2(13.7 + layerDepth * 17.0, 5.1));
    float size = mix(minSize, maxSize, pow(seed, 0.72));
    float d = hexMetric(local);

    float shadow = 1.0 - smoothstep(
        size + 0.015,
        size + 0.090,
        hexMetric(local + vec2(-0.055, 0.072))
    );
    float body = 1.0 - smoothstep(size - 0.018, size + 0.018, d);
    float inner = 1.0 - smoothstep(size - 0.100, size - 0.035, d);
    float edge = max(0.0, body - inner);

    float hue = fract(
        0.15
        + p.x * 0.10
        + p.y * 0.14
        + seed * 0.34
        + layerDepth * 0.09
        + uTime * 0.0015
    );
    vec3 base = pastelField(hue);

    // Slightly dark/neutral cells are important to the reference's depth and
    // prevent the field becoming a wall of uniformly loud candy colors.
    float muted = smoothstep(0.02, 0.18, seed) * (1.0 - smoothstep(0.18, 0.32, seed));
    base = mix(base, vec3(0.22, 0.23, 0.22), muted * 0.62);

    float nx = clamp(local.x / max(0.001, size), -1.0, 1.0);
    float ny = clamp(local.y / max(0.001, size), -1.0, 1.0);
    float topLeftLight = clamp(0.72 - nx * 0.18 - ny * 0.24, 0.44, 1.12);
    float depthShade = mix(0.56, 1.0, layerDepth);
    vec3 fill = base * topLeftLight * depthShade;

    vec3 color = vec3(0.0);
    color += vec3(0.002, 0.002, 0.003) * shadow * alphaScale;
    color += fill * inner * alphaScale;
    color += mix(fill * 0.72, vec3(0.98, 0.96, 0.90), 0.16)
        * edge
        * alphaScale;

    // Selective white facet glints reproduce the soft bevel/highlight patches
    // in the reference without making every cell glossy.
    vec2 facetCenter = vec2(-0.17, -0.16) * size / 0.46;
    float facet = 1.0 - smoothstep(
        size * 0.12,
        size * 0.24,
        hexMetric(local - facetCenter)
    );
    float facetGate = smoothstep(0.72, 0.94, hash11(seed * 71.0 + layerDepth * 9.0));
    color += vec3(1.0, 0.98, 0.92)
        * facet
        * facetGate
        * body
        * (0.16 + uTreble * 0.10 + uTransient * 0.08)
        * alphaScale;

    // Dark lower-right bevel.
    float bevelShadow = edge * clamp((nx + ny) * 0.85 + 0.22, 0.0, 1.0);
    color *= 1.0 - bevelShadow * 0.18;

    return color;
}

void main(void) {
    vec2 uv = vTextureCoord;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= uAspect;

    float power = max(0.0, uPower);
    float detail = clamp(uDetail / 3.0, 0.0, 1.0);
    float quality = mix(0.72, 1.0, uQuality);

    // Slow parallax only. Geometry never scales/pulses with raw music input.
    vec2 driftNear = vec2(
        sin(uTime * 0.031) * 0.050,
        cos(uTime * 0.026) * 0.038
    );
    vec2 driftFar = vec2(
        cos(uTime * 0.018) * 0.032,
        sin(uTime * 0.021) * 0.026
    );

    float warp = noise2(p * 0.85 + vec2(uTime * 0.006, -uTime * 0.004)) - 0.5;
    vec2 warped = p + vec2(warp, -warp * 0.55) * 0.075;

    vec3 color = vec3(0.0015, 0.0015, 0.0025);

    // Far layer puts smaller, darker cells into the gaps and gives parallax
    // depth. Near layer carries the large soft cells from the reference.
    float farFreq = mix(5.6, 8.6, detail) * quality;
    float nearFreq = mix(2.8, 4.4, detail) * quality;

    color += renderHexLayer(
        warped + driftFar,
        farFreq,
        vec2(0.31, 0.52),
        0.20,
        0.35,
        0.32 + power * 0.08,
        0.45
    );

    color += renderHexLayer(
        warped + driftNear,
        nearFreq,
        vec2(0.0),
        0.27,
        0.49,
        0.78 + power * 0.10,
        1.0
    );

    // Room-like falloff leaves real black gaps instead of filling every pixel
    // with haze. Audio changes light, not cell geometry.
    float vignette = 1.0 - smoothstep(0.72, 1.72, length(p * vec2(0.72, 1.0)));
    float musicalLight = 1.0 + uEnergy * 0.045 + uBass * 0.025;
    color *= musicalLight * (0.84 + vignette * 0.22);
    color *= 0.78 + power * 0.30;
    color = 1.0 - exp(-max(color, vec3(0.0)) * 1.16);
    color = pow(color, vec3(0.95));

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

export class SoftHexCellFieldWorld {
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
        softHexUniforms: {
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
    this.surface.clear().rect(0, 0, this.width, this.height).fill({ color: 0x010102, alpha: 1 });
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
    const uniforms = (this.filter.resources.softHexUniforms as { uniforms: Uniforms }).uniforms;
    uniforms[name] = value;
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
