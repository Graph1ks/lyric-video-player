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
float lineCell(float value, float width) {
  float f = fract(value);
  float d = min(f, 1.0 - f);
  return 1.0 - smoothstep(width, width * 2.35, d);
}
float boxEdge(vec2 p, vec2 center, vec2 halfSize, float width) {
  vec2 d = abs(p - center) - halfSize;
  float outer = max(d.x, d.y);
  vec2 innerD = abs(p - center) - max(halfSize - vec2(width), vec2(0.001));
  float inner = max(innerD.x, innerD.y);
  return (1.0 - smoothstep(0.0, width, abs(outer))) * step(0.0, inner + width * 1.6);
}
float softBox(vec2 p, vec2 center, vec2 halfSize) {
  vec2 d = abs(p - center) - halfSize;
  return 1.0 - smoothstep(0.0, 0.012, max(d.x, d.y));
}
vec3 finish(vec3 color, vec2 uv) {
  vec2 c = uv - 0.5;
  float vignette = 1.0 - smoothstep(0.26, 0.78, dot(c, c));
  color *= 0.72 + vignette * 0.34;
  color = vec3(1.0) - exp(-max(color, vec3(0.0)) * (1.10 + uPower * 0.46));
  float grain = hash21(gl_FragCoord.xy + vec2(uTime * 7.1, -uTime * 5.3)) - 0.5;
  color += grain * 0.005;
  return clamp(pow(max(color, vec3(0.0)), vec3(0.95)), 0.0, 1.0);
}

void main(void) {
  float aspect = uInputSize.x / max(1.0, uInputSize.y);
  vec2 p = (vTextureCoord - 0.5) * vec2(aspect, 1.0);
  float t = uTime;
  float detail = clamp(uDetail, 0.0, 1.0);
  float horizon = -0.075;

  vec3 background = vec3(uBackgroundR, uBackgroundG, uBackgroundB);
  vec3 surface = vec3(uSurfaceR, uSurfaceG, uSurfaceB);
  vec3 colorA = vec3(uColorAR, uColorAG, uColorAB);
  vec3 colorB = vec3(uColorBR, uColorBG, uColorBB);
  vec3 glow = vec3(uGlowR, uGlowG, uGlowB);

  vec3 color = background;
  float materialLight = 0.82 + uEnergy * 0.18 + uTreble * 0.08;

  // Horizon atmosphere turns the world into a deep environment, not a strip of lines.
  float horizonFog = exp(-abs(p.y - horizon) * 10.5);
  float horizonCore = exp(-abs(p.y - horizon) * 42.0);
  color += surface * horizonFog * 0.16;
  color += mix(colorA, colorB, 0.45) * horizonCore * (0.075 + uPower * 0.035);

  // Infinite perspective floor. The z coordinate advances monotonically with time.
  if (p.y > horizon + 0.003) {
    float inv = 0.23 / max(0.018, p.y - horizon);
    float worldZ = inv + t * (0.74 + detail * 0.16);
    float worldX = p.x * inv * 1.42;

    float distanceFade = 1.0 - smoothstep(4.0, 13.5, inv);
    float minorWidth = mix(0.018, 0.011, detail) + inv * 0.00065;
    float majorWidth = minorWidth * 1.75;
    float minor = max(
      lineCell(worldX * 2.1, minorWidth),
      lineCell(worldZ * 2.1, minorWidth)
    );
    float major = max(
      lineCell(worldX * 0.525, majorWidth),
      lineCell(worldZ * 0.525, majorWidth)
    );

    float floorMask = smoothstep(horizon + 0.003, horizon + 0.065, p.y);
    float floorGlow = (minor * 0.25 + major * 0.82) * distanceFade * floorMask;
    vec3 gridTint = mix(colorA, colorB, clamp(abs(worldX) * 0.10, 0.0, 0.7));
    color += gridTint * floorGlow * (0.42 + uPower * 0.18) * materialLight;

    // Wide translucent floor planes make the grid read as a lit surface.
    float tilePulse = 0.5 + 0.5 * sin(worldZ * 0.72 + floor(worldX * 0.52) * 1.7);
    color += surface * tilePulse * distanceFade * floorMask * 0.035;

    // Deterministic energy traffic runs toward the camera on fixed lanes.
    for (int laneIndex = 0; laneIndex < 5; laneIndex++) {
      float laneSeed = float(laneIndex) - 2.0;
      float laneX = laneSeed * 0.82 + sin(laneSeed * 2.3) * 0.12;
      float lane = exp(-abs(worldX - laneX) * mix(16.0, 28.0, detail));
      float packetPhase = fract(worldZ * 0.115 - t * (0.46 + float(laneIndex) * 0.035) + laneSeed * 0.17);
      float packet = 1.0 - smoothstep(0.0, 0.17, abs(packetPhase - 0.5));
      float tail = (1.0 - smoothstep(0.0, 0.38, abs(fract(packetPhase + 0.14) - 0.5))) * 0.22;
      color += mix(colorA, glow, 0.58) * lane * (packet + tail) * distanceFade
        * (0.16 + uTreble * 0.12);
    }
  }

  // A faint ceiling grid closes the volume and keeps the composition full-screen.
  if (p.y < horizon - 0.12) {
    float invTop = 0.16 / max(0.025, horizon - p.y);
    float topZ = invTop + t * 0.44;
    float topX = p.x * invTop * 1.5;
    float topGrid = max(
      lineCell(topX * 1.6, 0.017 + invTop * 0.0007),
      lineCell(topZ * 1.6, 0.017 + invTop * 0.0007)
    );
    float topFade = (1.0 - smoothstep(3.2, 10.0, invTop))
      * (1.0 - smoothstep(horizon - 0.30, horizon - 0.12, p.y));
    color += mix(surface, colorB, 0.46) * topGrid * topFade * 0.13;
  }

  // Procedural side architecture advances from the horizon to the camera.
  // Each tower is reconstructed from absolute time, so seeking is deterministic.
  for (int i = 0; i < 11; i++) {
    float k = float(i);
    float seed = hash11(k * 19.37 + 2.6);
    float depthPhase = fract(k / 11.0 + t * (0.055 + seed * 0.012));
    float depth = depthPhase * depthPhase;
    float yBase = mix(horizon + 0.012, 0.59, depth);
    float sideOffset = mix(0.13, aspect * 0.69, depth);
    float towerHeight = mix(0.055, 0.43, depth) * (0.66 + seed * 0.65);
    float towerWidth = mix(0.018, 0.105, depth) * (0.72 + seed * 0.48);
    float fade = smoothstep(0.02, 0.14, depthPhase) * (1.0 - smoothstep(0.84, 1.0, depthPhase));

    for (int sideIndex = 0; sideIndex < 2; sideIndex++) {
      float side = sideIndex == 0 ? -1.0 : 1.0;
      vec2 center = vec2(side * sideOffset, yBase - towerHeight * 0.5);
      vec2 halfSize = vec2(towerWidth, towerHeight * 0.5);
      float body = softBox(p, center, halfSize);
      float edge = boxEdge(p, center, halfSize, mix(0.0035, 0.009, depth));
      float windowsX = lineCell((p.x - center.x) / max(0.01, towerWidth) * 1.8, 0.055);
      float windowsY = lineCell((p.y - center.y) / max(0.02, towerHeight) * 7.0, 0.075);
      float windows = body * windowsX * windowsY * step(0.48, hash11(k * 7.3 + float(sideIndex)));

      vec3 buildingTint = mix(colorA, colorB, hash11(k * 31.7 + float(sideIndex) * 8.0));
      color += surface * body * fade * (0.035 + depth * 0.055);
      color += buildingTint * edge * fade * (0.22 + depth * 0.35) * materialLight;
      color += mix(buildingTint, glow, 0.55) * windows * fade * (0.045 + uTreble * 0.05);

      // Vertical energy pylons extend architecture into the upper frame.
      float pylonGate = step(0.74, hash11(k * 11.1 + float(sideIndex) * 3.7));
      float pylonX = exp(-abs(p.x - center.x) * mix(80.0, 155.0, detail));
      float pylonY = (1.0 - step(yBase, p.y))
        * smoothstep(yBase - towerHeight * 1.75, yBase - towerHeight * 0.10, p.y)
        * smoothstep(-0.58, -0.16, p.y);
      color += buildingTint * pylonX * pylonY * pylonGate * fade * (0.025 + uEnergy * 0.025);
    }
  }

  // Corridor edge rails visually stitch floor, city and horizon into one world.
  float normalizedY = clamp((p.y - horizon) / max(0.01, 0.5 - horizon), 0.0, 1.0);
  float corridor = mix(0.10, aspect * 0.46, normalizedY);
  float rail = exp(-abs(abs(p.x) - corridor) * mix(42.0, 76.0, detail));
  rail *= smoothstep(horizon, horizon + 0.08, p.y);
  color += mix(colorB, glow, 0.28) * rail * (0.085 + uPower * 0.055) * materialLight;

  if (uQuality > 0.5) {
    // Fine floating glyph-like sparks create scale without moving the camera.
    vec2 cell = floor((p + vec2(2.0)) * vec2(72.0, 88.0));
    float seed = hash21(cell);
    vec2 local = fract((p + vec2(2.0)) * vec2(72.0, 88.0)) - 0.5;
    float spark = step(0.994, seed) * (1.0 - smoothstep(0.0, 0.06, length(local)));
    spark *= 0.35 + horizonFog * 0.65;
    color += glow * spark * (0.10 + uTreble * 0.08);
  }

  gl_FragColor = vec4(finish(color, vTextureCoord), 1.0);
}
`;

type GridUniforms = {
  uTime: number; uPower: number; uDetail: number; uQuality: number;
  uEnergy: number; uTreble: number;
  uBackgroundR: number; uBackgroundG: number; uBackgroundB: number;
  uSurfaceR: number; uSurfaceG: number; uSurfaceB: number;
  uColorAR: number; uColorAG: number; uColorAB: number;
  uColorBR: number; uColorBG: number; uColorBB: number;
  uGlowR: number; uGlowG: number; uGlowB: number;
};

export class LegacyGridWorld {
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
        gridUniforms: {
          uTime: { value: 0, type: "f32" },
          uPower: { value: 1 / 3, type: "f32" },
          uDetail: { value: 1 / 3, type: "f32" },
          uQuality: { value: 1, type: "f32" },
          uEnergy: { value: 0, type: "f32" },
          uTreble: { value: 0, type: "f32" },
          uBackgroundR: { value: 0.008, type: "f32" },
          uBackgroundG: { value: 0.025, type: "f32" },
          uBackgroundB: { value: 0.035, type: "f32" },
          uSurfaceR: { value: 0.028, type: "f32" },
          uSurfaceG: { value: 0.075, type: "f32" },
          uSurfaceB: { value: 0.10, type: "f32" },
          uColorAR: { value: 0.42, type: "f32" },
          uColorAG: { value: 1.0, type: "f32" },
          uColorAB: { value: 0.93, type: "f32" },
          uColorBR: { value: 0.47, type: "f32" },
          uColorBG: { value: 0.35, type: "f32" },
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

  update(time: number, audio: AudioBands) {
    if (!this.container.visible) return;
    this.write("uTime", time);
    this.write("uEnergy", audio.energy);
    this.write("uTreble", audio.treble);
    this.container.alpha = clamp(this.intensity, 0, 1);
  }

  private write(name: keyof GridUniforms, value: number) {
    const uniforms = (this.filter.resources.gridUniforms as { uniforms: GridUniforms }).uniforms;
    uniforms[name] = value;
  }

  private writeColor(prefix: "uBackground" | "uSurface" | "uColorA" | "uColorB" | "uGlow", color: number) {
    const r = ((color >> 16) & 0xff) / 255;
    const g = ((color >> 8) & 0xff) / 255;
    const b = (color & 0xff) / 255;
    this.write(`${prefix}R` as keyof GridUniforms, r);
    this.write(`${prefix}G` as keyof GridUniforms, g);
    this.write(`${prefix}B` as keyof GridUniforms, b);
  }
}
