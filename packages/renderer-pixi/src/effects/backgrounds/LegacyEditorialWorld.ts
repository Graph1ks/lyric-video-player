import { Container, Filter, GlProgram, Graphics } from "pixi.js";
import type { AudioBands } from "@graph1ks/emo-audio-web";
import { clamp, type QualityMode, type VisualPalette } from "@graph1ks/emo-engine-core";

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
uniform vec4 uInputSize;
uniform float uTime;
uniform float uPower;
uniform float uDetail;
uniform float uQuality;
uniform float uEnergy;
uniform float uMid;
uniform float uTreble;
uniform float uLineIndex;
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

float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

float rectMask(vec2 p, vec2 center, vec2 halfSize, float feather) {
  return 1.0 - smoothstep(0.0, feather, sdBox(p - center, halfSize));
}

float lineMask(vec2 p, vec2 a, vec2 b, float width) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.0001), 0.0, 1.0);
  return 1.0 - smoothstep(width, width * 1.8, length(pa - ba * h));
}

void main(void) {
  float aspect = uInputSize.x / max(1.0, uInputSize.y);
  vec2 p = (vTextureCoord - 0.5) * vec2(aspect, 1.0);
  float detail = clamp(uDetail, 0.0, 1.0);
  float t = uTime * 0.10;
  float variant = mod(floor(max(0.0, uLineIndex)), 4.0);

  // Editorial identity: deliberately composed plates, rules and registration
  // structure with a protected center. Geometry is time/line-index owned only.
  float drift = sin(t * 0.43 + variant * 1.7) * 0.018;
  vec2 paperShift = vec2(drift, cos(t * 0.31 + variant) * 0.010);

  float leftPlate = rectMask(p, vec2(-aspect * 0.45 + paperShift.x, 0.06), vec2(aspect * 0.10, 0.47), 0.004);
  float rightPlate = rectMask(p, vec2(aspect * 0.43 - paperShift.x * 0.6, -0.03), vec2(aspect * 0.075, 0.39), 0.004);
  float topPlate = rectMask(p, vec2(0.02, -0.43 + paperShift.y), vec2(aspect * 0.32, 0.045), 0.003);
  float bottomPlate = rectMask(p, vec2(-0.07, 0.42 - paperShift.y * 0.5), vec2(aspect * 0.27, 0.032), 0.003);

  float alt = step(1.5, variant);
  float plateA = mix(leftPlate + bottomPlate * 0.6, topPlate + rightPlate * 0.72, alt);
  float plateB = mix(rightPlate + topPlate * 0.52, leftPlate * 0.58 + bottomPlate, alt);

  float centerGuard = rectMask(p, vec2(0.0, -0.02), vec2(aspect * 0.26, 0.22), 0.05);
  plateA *= 1.0 - centerGuard * 0.92;
  plateB *= 1.0 - centerGuard * 0.96;

  vec3 color = uBackground;
  color = mix(color, uSurface, clamp(plateA * 0.56, 0.0, 0.74));
  color = mix(color, uAccentA, clamp(plateB * 0.16, 0.0, 0.28));

  // Fine modular rules build the graphic-design hierarchy.
  float rules = 0.0;
  float minorRules = 0.0;
  for (int i = 0; i < 12; i++) {
    float fi = float(i);
    float enabled = step(fi + 0.5, mix(5.0, 12.0, detail));
    float y = -0.38 + fi * 0.067 + sin(fi * 2.1 + variant) * 0.006;
    float xStart = mix(-aspect * 0.47, aspect * 0.28, step(6.0, fi));
    float xEnd = mix(-aspect * 0.29, aspect * 0.47, step(6.0, fi));
    float line = lineMask(p, vec2(xStart, y), vec2(xEnd, y + drift * 0.2), 0.0012);
    rules += line * enabled;
    minorRules += line * enabled * mix(0.65, 1.0, hash21(vec2(fi, variant + 1.0)));
  }

  float verticalRule = lineMask(
    p,
    vec2(-aspect * 0.30 + drift * 0.3, -0.46),
    vec2(-aspect * 0.30 + drift * 0.3, 0.46),
    0.0014
  );
  float secondaryRule = lineMask(
    p,
    vec2(aspect * 0.31 - drift * 0.2, -0.33),
    vec2(aspect * 0.31 - drift * 0.2, 0.37),
    0.0010
  );

  // Crop/registration corners create the paused-frame signature.
  vec2 corner = vec2(aspect * 0.43, 0.42);
  float crops = 0.0;
  crops += lineMask(p, -corner, -corner + vec2(0.065, 0.0), 0.0013);
  crops += lineMask(p, -corner, -corner + vec2(0.0, 0.065), 0.0013);
  crops += lineMask(p, corner, corner - vec2(0.065, 0.0), 0.0013);
  crops += lineMask(p, corner, corner - vec2(0.0, 0.065), 0.0013);

  float registration = 0.0;
  vec2 regP = p - vec2(aspect * 0.385, -0.35);
  registration += lineMask(regP, vec2(-0.024, 0.0), vec2(0.024, 0.0), 0.0010);
  registration += lineMask(regP, vec2(0.0, -0.024), vec2(0.0, 0.024), 0.0010);
  registration += 1.0 - smoothstep(0.015, 0.017, abs(length(regP) - 0.016));

  float inkResponse = 0.82 + uEnergy * 0.12 + uMid * 0.06;
  color += uAccentB * rules * 0.055 * inkResponse;
  color += uMuted * minorRules * 0.020;
  color += uGlow * verticalRule * 0.035 * inkResponse;
  color += uAccentA * secondaryRule * 0.040 * inkResponse;
  color += mix(uAccentA, uGlow, 0.45) * crops * 0.095;
  color += uAccentB * registration * 0.075;

  // Cinema adds subtle substrate/fibre texture without changing the layout.
  if (uQuality > 0.5) {
    float fibre = hash21(vec2(floor(gl_FragCoord.x * 0.18), floor(gl_FragCoord.y * 0.09)));
    color += uSurface * (fibre - 0.5) * 0.010 * detail;
  }

  float vignette = 1.0 - smoothstep(0.44, 1.08, length(p * vec2(0.72, 1.0)));
  color *= 0.84 + vignette * 0.18;
  color = vec3(1.0) - exp(-max(color, vec3(0.0)) * (1.0 + uPower * 0.34));
  gl_FragColor = vec4(clamp(pow(max(color, vec3(0.0)), vec3(0.96)), 0.0, 1.0), 1.0);
}
`;

type Uniforms = {
  uTime:number;uPower:number;uDetail:number;uQuality:number;uEnergy:number;uMid:number;uTreble:number;uLineIndex:number;
  uBackground:Float32Array;uSurface:Float32Array;uAccentA:Float32Array;uAccentB:Float32Array;uGlow:Float32Array;uMuted:Float32Array;
};

export class LegacyEditorialWorld {
  readonly container = new Container();
  private readonly surface = new Graphics();
  private readonly filter: Filter;
  private intensity = 1;

  constructor() {
    this.filter = new Filter({
      glProgram: GlProgram.from({ vertex, fragment }),
      resources: {
        editorialUniforms: {
          uTime:{value:0,type:"f32"},uPower:{value:1/3,type:"f32"},uDetail:{value:1/3,type:"f32"},uQuality:{value:1,type:"f32"},
          uEnergy:{value:0,type:"f32"},uMid:{value:0,type:"f32"},uTreble:{value:0,type:"f32"},uLineIndex:{value:0,type:"f32"},
          uBackground:{value:new Float32Array([.006,.008,.012]),type:"vec3<f32>"},
          uSurface:{value:new Float32Array([.035,.045,.060]),type:"vec3<f32>"},
          uAccentA:{value:new Float32Array([.92,.28,.22]),type:"vec3<f32>"},
          uAccentB:{value:new Float32Array([.30,.72,.95]),type:"vec3<f32>"},
          uGlow:{value:new Float32Array([.95,.96,1]),type:"vec3<f32>"},
          uMuted:{value:new Float32Array([.22,.26,.30]),type:"vec3<f32>"}
        }
      }
    });
    this.filter.padding = 0;
    this.surface.filters = [this.filter];
    this.container.addChild(this.surface);
    this.container.visible = false;
  }

  setPalette(p: VisualPalette) { this.color("uBackground",p.background); this.color("uSurface",p.surface); this.color("uAccentA",p.accentA); this.color("uAccentB",p.accentB); this.color("uGlow",p.glow); this.color("uMuted",p.muted); }
  setIntensity(v:number){ this.intensity=clamp(v,0,3); this.num("uPower",clamp(this.intensity/3)); }
  setDetail(v:number){ this.num("uDetail",clamp(v/3)); }
  setQuality(v:QualityMode){ this.num("uQuality",v==="cinema"?1:0); }
  setLineIndex(v:number){ this.num("uLineIndex",Math.max(0,v)); }
  resize(w:number,h:number){ this.surface.clear().rect(0,0,Math.max(1,w),Math.max(1,h)).fill({color:0xffffff,alpha:1}); }
  update(time:number,a:AudioBands){ if(!this.container.visible)return; this.num("uTime",time); this.num("uEnergy",a.energy); this.num("uMid",a.mid); this.num("uTreble",a.treble); this.container.alpha=clamp(this.intensity,0,1); }
  private u(){ return (this.filter.resources.editorialUniforms as {uniforms:Uniforms}).uniforms; }
  private num(n:"uTime"|"uPower"|"uDetail"|"uQuality"|"uEnergy"|"uMid"|"uTreble"|"uLineIndex",v:number){ this.u()[n]=v; }
  private color(n:"uBackground"|"uSurface"|"uAccentA"|"uAccentB"|"uGlow"|"uMuted",c:number){ const a=this.u()[n]; a[0]=((c>>16)&255)/255; a[1]=((c>>8)&255)/255; a[2]=(c&255)/255; }
}
