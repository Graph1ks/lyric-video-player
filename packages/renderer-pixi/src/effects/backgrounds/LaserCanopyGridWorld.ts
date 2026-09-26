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

float lineDistance(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.00001), 0.0, 1.0);
  return length(pa - ba * h);
}

vec2 projectPoint(vec3 world) {
  // Low audience camera looking into positive Z. The vertical offset keeps the
  // dance floor visible while ceiling fixtures remain in the upper third.
  float z = max(0.72, world.z);
  float focal = 1.34;
  return vec2(
    world.x / z * focal,
    -world.y / z * focal + 0.055
  );
}

vec3 fixtureWorld(float fixtureIndex) {
  float row = floor(fixtureIndex / 4.0);
  float col = mod(fixtureIndex, 4.0);
  float x = mix(-3.65, 3.65, col / 3.0) + (row - 0.5) * 0.18;
  float z = 3.0 + row * 2.45;
  float y = 2.02 + row * 0.24;
  return vec3(x, y, z);
}

vec3 movingTarget(float fixtureIndex, float beamIndex, float time) {
  // Continuous moving-head choreography. The target glides between a wide fan,
  // crossing diagonals and a rotating floor orbit without phase discontinuities.
  float fSeed = fixtureIndex * 1.731 + 0.37;
  float b = beamIndex;
  float fanSlot = mix(-1.0, 1.0, b / 3.0);
  float fixtureSide = mix(-1.0, 1.0, mod(fixtureIndex, 4.0) / 3.0);

  float slowSweep = sin(time * (0.24 + hash11(fSeed) * 0.055) + fSeed);
  float counterSweep = cos(time * (0.19 + hash11(fSeed + 7.0) * 0.045) + fSeed * 1.71);
  float orbit = time * (0.13 + hash11(fSeed + 13.0) * 0.035) + fSeed * 2.3;

  vec2 fanTarget = vec2(
    fanSlot * 3.45 + slowSweep * 0.72 + fixtureSide * 0.34,
    6.2 + beamIndex * 1.55 + counterSweep * 1.25
  );

  vec2 crossTarget = vec2(
    -fixtureSide * 2.7 + fanSlot * 1.15 + counterSweep * 0.95,
    8.6 + slowSweep * 3.15 - beamIndex * 0.42
  );

  vec2 orbitTarget = vec2(
    cos(orbit + b * 0.72) * (2.2 + b * 0.34),
    8.4 + sin(orbit * 0.82 + b * 0.91) * (2.3 + b * 0.22)
  );

  float choreographyA = 0.5 + 0.5 * sin(time * 0.082 + fixtureIndex * 0.41);
  float choreographyB = 0.5 + 0.5 * sin(time * 0.061 + fixtureIndex * 0.67 + 1.4);
  choreographyA = choreographyA * choreographyA * (3.0 - 2.0 * choreographyA);
  choreographyB = choreographyB * choreographyB * (3.0 - 2.0 * choreographyB);

  vec2 target = mix(fanTarget, crossTarget, choreographyA);
  target = mix(target, orbitTarget, choreographyB * 0.72);

  // Every second ceiling row sweeps in the opposite spatial rhythm, preventing
  // the whole rig from reading as one synchronized screen-space fan.
  float row = floor(fixtureIndex / 4.0);
  target.x += (row * 2.0 - 1.0) * sin(time * 0.31 + beamIndex * 0.8) * 0.42;
  target.y = clamp(target.y, 3.7, 13.8);

  return vec3(target.x, -1.58, target.y);
}

vec3 beamColor(float fixtureIndex, float beamIndex) {
  float selector = fract(hash11(fixtureIndex * 9.1 + beamIndex * 17.7) * 3.0);
  if (selector < 0.38) return uAccentA;
  if (selector < 0.76) return uAccentB;
  return mix(uGlow, mix(uAccentA, uAccentB, 0.5), 0.20);
}

vec3 beamVolume(
  vec2 p,
  vec2 source,
  vec2 target,
  float sourceDepth,
  float targetDepth,
  float seed
) {
  vec2 axis = target - source;
  float axisLength2 = max(dot(axis, axis), 0.00001);
  float h = clamp(dot(p - source, axis) / axisLength2, 0.0, 1.0);
  vec2 closest = source + axis * h;
  float distanceToAxis = length(p - closest);

  // Real club beams have a bright optical core plus a much wider haze body.
  // The body expands away from the fixture and broadens again near the floor.
  float perspective = clamp(6.8 / mix(sourceDepth, targetDepth, h), 0.52, 1.42);
  float width = mix(0.010, 0.032, h) * perspective;
  float floorBloom = smoothstep(0.76, 1.0, h);
  width *= 1.0 + floorBloom * 0.34;

  float core = exp(-pow(distanceToAxis / max(width * 0.16, 0.0001), 2.0) * 2.8);
  float body = exp(-pow(distanceToAxis / max(width, 0.0001), 1.55) * 2.05);
  float halo = exp(-distanceToAxis / max(width * 2.8, 0.0001));

  float sourceGate = smoothstep(0.005, 0.055, h);
  float targetGate = 1.0 - smoothstep(0.965, 1.0, h);
  float axialGate = sourceGate * targetGate;

  // Haze breakup moves slowly through the shaft; the beam aim itself is entirely
  // mechanical/time-owned and never audio-driven.
  float haze = 0.66 + 0.34 * noise2(vec2(
    h * 8.0 + seed * 9.0,
    p.y * 8.5 - uTime * 0.028 + seed * 3.1
  ));

  return vec3(
    core * axialGate,
    body * haze * axialGate,
    halo * haze * axialGate
  );
}

float ellipseSpot(vec2 p, vec2 center, vec2 radii) {
  vec2 q = (p - center) / max(radii, vec2(0.0001));
  return exp(-dot(q, q) * 2.6);
}

float ellipseRing(vec2 p, vec2 center, vec2 radii, float radius) {
  vec2 q = (p - center) / max(radii, vec2(0.0001));
  float d = abs(length(q) - radius);
  return 1.0 - smoothstep(0.035, 0.11, d);
}

void main(void) {
  vec2 p = vTextureCoord * 2.0 - 1.0;
  p.x *= uAspect;

  float detail = clamp(uDetail / 3.0, 0.0, 1.0);
  float quality = mix(0.72, 1.0, uQuality);
  float power = max(0.0, uPower);
  vec3 color = uBackground;

  // Dense club haze: broad enough to reveal shafts, subtle enough to keep type
  // readable. It is a medium, not the hero identity.
  float hazeA = noise2(p * vec2(1.7, 2.6) + vec2(uTime * 0.010, -uTime * 0.007));
  float hazeB = noise2(p * vec2(4.4, 6.2) + vec2(-uTime * 0.017, uTime * 0.011));
  float roomHaze = mix(hazeA, hazeB, 0.28);
  float lowerRoom = 1.0 - smoothstep(-0.18, 0.78, p.y);
  color += mix(uSurface, uMuted, 0.30)
    * roomHaze
    * (0.040 + lowerRoom * 0.030 + power * 0.010);

  // Dark dance floor and a soft horizon create room depth without turning into
  // another grid preset.
  float horizon = exp(-abs(p.y - 0.055) * 9.5);
  float floorField = smoothstep(0.02, 0.82, p.y);
  color += uSurface * floorField * 0.022;
  color += mix(uSurface, uGlow, 0.08) * horizon * 0.026;

  // Ceiling truss rails carry the fixtures. They stay subordinate to the moving
  // shafts, but make every source feel physically mounted in the room.
  for (int rowIndex = 0; rowIndex < 2; rowIndex++) {
    float row = float(rowIndex);
    vec3 left3 = fixtureWorld(row * 4.0);
    vec3 right3 = fixtureWorld(row * 4.0 + 3.0);
    left3.x -= 0.32;
    right3.x += 0.32;
    vec2 left = projectPoint(left3);
    vec2 right = projectPoint(right3);
    float trussDistance = lineDistance(p, left, right);
    float truss = 1.0 - smoothstep(0.0030, 0.0105, trussDistance);
    color += uSurface * truss * (0.16 + row * 0.035);
  }

  float lightResponse = (0.72 + uEnergy * 0.17 + uTreble * 0.08 + uTransient * 0.10)
    * (0.60 + power * 0.27);
  float activeBeamCount = mix(18.0, 32.0, detail);

  // Eight moving heads × four independently aimed shafts. The source and target
  // are real projected room coordinates; animation happens by moving floor targets,
  // not by scaling/rotating a static screen-space line bundle.
  for (int beamLoop = 0; beamLoop < 32; beamLoop++) {
    float beamId = float(beamLoop);
    float enabled = step(beamId + 0.5, activeBeamCount);
    float fixtureIndex = floor(beamId / 4.0);
    float beamIndex = mod(beamId, 4.0);

    vec3 source3 = fixtureWorld(fixtureIndex);
    vec3 target3 = movingTarget(fixtureIndex, beamIndex, uTime);
    vec2 source = projectPoint(source3);
    vec2 target = projectPoint(target3);

    float seed = hash11(beamId * 13.7 + fixtureIndex * 5.9);
    vec3 volume = beamVolume(
      p,
      source,
      target,
      source3.z,
      target3.z,
      seed
    );

    vec3 laser = beamColor(fixtureIndex, beamIndex);

    // A wide volumetric body plus a hot center gives the beam physical thickness.
    // This deliberately avoids the old thin-ray / line-art look.
    color += laser * volume.z * enabled * lightResponse * 0.050;
    color += laser * volume.y * enabled * lightResponse * 0.31;
    color += mix(laser, uGlow, 0.42) * volume.x * enabled * lightResponse * 0.82;

    // Every beam lands visibly on the floor. Hits bloom and selected channels draw
    // elliptical scan rings like real laser projection patterns.
    float depthScale = clamp(6.4 / target3.z, 0.42, 1.25);
    vec2 hitRadii = vec2(0.040, 0.013) * depthScale;
    float hit = ellipseSpot(p, target, hitRadii);
    color += mix(laser, uGlow, 0.35)
      * hit
      * enabled
      * lightResponse
      * (0.28 + uTransient * 0.18);

    float ringEnable = 1.0 - step(0.5, abs(beamIndex - 1.5));
    float ringPhase = 0.72 + 0.12 * sin(uTime * 0.24 + fixtureIndex * 0.8);
    float ring = ellipseRing(
      p,
      target,
      vec2(0.105, 0.030) * depthScale,
      ringPhase
    );
    color += laser * ring * ringEnable * enabled * lightResponse * 0.085;
  }

  // Moving-head housings and lenses are intentionally visible. Each fixture has
  // a dark body, a metallic shoulder and a hot aperture, matching real club rigs.
  for (int fixtureLoop = 0; fixtureLoop < 8; fixtureLoop++) {
    float fixtureIndex = float(fixtureLoop);
    vec3 fixture3 = fixtureWorld(fixtureIndex);
    vec2 fixture = projectPoint(fixture3);
    float depthScale = clamp(5.4 / fixture3.z, 0.52, 1.32);

    vec2 local = p - fixture;
    float bodyRadius = 0.030 * depthScale;
    float body = 1.0 - smoothstep(bodyRadius, bodyRadius * 1.45, length(local));
    float shoulder = 1.0 - smoothstep(
      bodyRadius * 0.58,
      bodyRadius * 0.95,
      length(local - vec2(0.0, bodyRadius * 0.42))
    );
    float aperture = 1.0 - smoothstep(
      bodyRadius * 0.12,
      bodyRadius * 0.36,
      length(local - vec2(0.0, bodyRadius * 0.14))
    );
    float lensBloom = exp(
      -length(local - vec2(0.0, bodyRadius * 0.14))
      / max(bodyRadius * 1.9, 0.0001)
    );

    vec3 lens = beamColor(fixtureIndex, 1.0);
    color = mix(color, uSurface * 0.42, body * 0.76);
    color += uMuted * shoulder * 0.12;
    color += lens * lensBloom * lightResponse * 0.10;
    color += mix(lens, uGlow, 0.55) * aperture * lightResponse * 0.72;
  }

  // Near-camera haze catches a few shafts as soft colored wash. This is what gives
  // real disco lighting its saturated atmosphere instead of empty black between rays.
  float washA = exp(-pow((p.x + 0.52 + sin(uTime * 0.13) * 0.18) / 0.42, 2.0))
    * smoothstep(-0.72, 0.34, p.y)
    * (1.0 - smoothstep(0.34, 0.86, p.y));
  float washB = exp(-pow((p.x - 0.44 + cos(uTime * 0.11) * 0.16) / 0.48, 2.0))
    * smoothstep(-0.66, 0.38, p.y)
    * (1.0 - smoothstep(0.38, 0.90, p.y));
  color += uAccentA * washA * roomHaze * lightResponse * 0.018;
  color += uAccentB * washB * roomHaze * lightResponse * 0.016;

  // Fine suspended particles light up only inside the hazy room.
  vec2 dustCell = floor((p + vec2(3.0)) * mix(46.0, 82.0, detail));
  vec2 dustLocal = fract((p + vec2(3.0)) * mix(46.0, 82.0, detail)) - 0.5;
  float dust = step(0.993 - detail * 0.002, hash21(dustCell))
    * (1.0 - smoothstep(0.0, 0.050, length(dustLocal)));
  color += uGlow * dust * roomHaze * quality * (0.015 + uTreble * 0.020);

  float vignette = 1.0 - smoothstep(
    0.46,
    1.16,
    length(p * vec2(0.66, 1.0))
  );
  color *= 0.78 + vignette * 0.24;

  // Filmic shoulder: preserve saturated laser color instead of clipping all beam
  // intersections to flat white.
  color = vec3(1.0) - exp(-max(color, vec3(0.0)) * (1.02 + power * 0.32));
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
          uAccentA: { value: new Float32Array([0.10, 0.96, 0.42]), type: "vec3<f32>" },
          uAccentB: { value: new Float32Array([0.98, 0.10, 0.52]), type: "vec3<f32>" },
          uGlow: { value: new Float32Array([0.90, 0.98, 1.0]), type: "vec3<f32>" },
          uMuted: { value: new Float32Array([0.15, 0.20, 0.25]), type: "vec3<f32>" },
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
