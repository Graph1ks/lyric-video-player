import { Filter, GlProgram } from "pixi.js";
import type { AudioBands } from "@graph1ks/emo-audio-web";
import type { QualityMode, SceneMode } from "@graph1ks/emo-engine-core";

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
uniform vec4 uInputSize;
uniform float uTime;
uniform float uAmount;
uniform float uBass;
uniform float uEnergy;
uniform float uTransient;
uniform float uMode;
uniform float uQuality;

float luma(vec3 color) {
    return dot(color, vec3(0.2126, 0.7152, 0.0722));
}

float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

void main(void) {
    vec2 texel = uInputSize.zw;
    vec2 centered = vTextureCoord - 0.5;
    float radius2 = dot(centered, centered);
    float edgeDistance = min(
        min(vTextureCoord.x, 1.0 - vTextureCoord.x),
        min(vTextureCoord.y, 1.0 - vTextureCoord.y)
    );
    float edgeGuard = smoothstep(0.0, 0.075, edgeDistance);

    float barrel = (0.004 + uBass * 0.009 + uTransient * 0.012) * uAmount * edgeGuard;
    vec2 uv = clamp(vTextureCoord + centered * radius2 * barrel, vec2(0.001), vec2(0.999));

    vec2 smearDir;
    if (uMode < 0.5) {
        smearDir = vec2(1.0, -0.08);
    } else if (uMode < 1.5) {
        smearDir = normalize(vec2(0.82, 0.32));
    } else {
        smearDir = normalize(vec2(-centered.y, centered.x) + vec2(0.0001));
    }

    float smearPx = (0.65 + uBass * 2.4 + uTransient * 10.0)
        * uAmount
        * mix(0.72, 1.0, uQuality)
        * mix(0.12, 1.0, edgeGuard);
    vec2 smearStep = smearDir * texel * smearPx;

    vec4 c0 = texture2D(uTexture, uv);
    vec4 c1 = texture2D(uTexture, clamp(uv - smearStep, vec2(0.001), vec2(0.999)));
    vec4 c2 = texture2D(uTexture, clamp(uv - smearStep * 2.0, vec2(0.001), vec2(0.999)));
    vec4 c3 = texture2D(uTexture, clamp(uv + smearStep * 0.65, vec2(0.001), vec2(0.999)));
    vec4 smeared = c0 * 0.66 + c1 * 0.17 + c2 * 0.08 + c3 * 0.09;

    float chromaPx = (0.8 + uEnergy * 2.4 + uTransient * 8.0) * uAmount * edgeGuard;
    vec2 chroma = smearDir * texel * chromaPx;
    float red = texture2D(uTexture, clamp(uv + chroma, vec2(0.001), vec2(0.999))).r;
    float blue = texture2D(uTexture, clamp(uv - chroma, vec2(0.001), vec2(0.999))).b;
    vec3 color = vec3(red, smeared.g, blue);
    color = mix(smeared.rgb, color, clamp(0.22 + uTransient * 0.62, 0.0, 0.88) * uAmount);

    vec2 glowOffset = texel * mix(2.4, 4.4, uQuality) * (1.0 + uBass * 1.2);
    vec3 glow = vec3(0.0);
    glow += texture2D(uTexture, clamp(uv + vec2(glowOffset.x, 0.0), vec2(0.001), vec2(0.999))).rgb;
    glow += texture2D(uTexture, clamp(uv - vec2(glowOffset.x, 0.0), vec2(0.001), vec2(0.999))).rgb;
    glow += texture2D(uTexture, clamp(uv + vec2(0.0, glowOffset.y), vec2(0.001), vec2(0.999))).rgb;
    glow += texture2D(uTexture, clamp(uv - vec2(0.0, glowOffset.y), vec2(0.001), vec2(0.999))).rgb;
    glow *= 0.25;
    float bright = smoothstep(0.38, 1.0, luma(glow));
    color += glow * bright
        * (0.12 + uEnergy * 0.24 + uTransient * 0.18)
        * uAmount
        * mix(0.35, 1.0, edgeGuard);

    if (uMode < 0.5) {
        color.r *= 1.03;
        color.g *= 0.97;
        color.b *= 0.98;
    } else if (uMode < 1.5) {
        color.g *= 1.035;
        color.b *= 1.045;
    } else {
        color.r *= 1.06;
        color.b *= 0.965;
    }

    float scan = sin((uv.y * uInputSize.y + uTime * 16.0) * 3.14159265);
    color *= 1.0 - (0.007 + uEnergy * 0.006) * scan * uAmount * edgeGuard;

    float grain = hash21(uv * uInputSize.xy + vec2(uTime * 91.7, -uTime * 63.1)) - 0.5;
    color += grain * (0.012 + uEnergy * 0.014) * uAmount * mix(0.3, 1.0, edgeGuard);

    float vignette = smoothstep(0.84, 0.18, radius2);
    color *= mix(0.78, 1.0, vignette);

    // FX Rack contract: 0% must be a true bypass. Some aesthetic operations
    // above (mode grade/vignette) are intentionally authored at full strength,
    // so blend the complete processed result back to the untouched source at
    // the end. Values above 100% still increase the spatial/chroma/glow terms
    // because those terms already consume uAmount directly.
    vec3 processed = mix(source.rgb, color, clamp(uAmount, 0.0, 1.0));

    // The scene has an opaque world base. Keep the final presentation opaque as
    // well so filter padding or feedback history can never reveal the HTML shell.
    gl_FragColor = vec4(max(processed, vec3(0.0)), 1.0);
}
`;

type FxUniforms = {
  uTime: number;
  uAmount: number;
  uBass: number;
  uEnergy: number;
  uTransient: number;
  uMode: number;
  uQuality: number;
};

export class CinematicPostFX {
  readonly filter: Filter;
  private intensity = 1;
  private mix = 1;
  private quality: QualityMode = "cinema";
  private mode: SceneMode = "neon";

  constructor() {
    this.filter = new Filter({
      glProgram: GlProgram.from({ vertex, fragment }),
      resources: {
        fxUniforms: {
          uTime: { value: 0, type: "f32" },
          uAmount: { value: 1, type: "f32" },
          uBass: { value: 0, type: "f32" },
          uEnergy: { value: 0, type: "f32" },
          uTransient: { value: 0, type: "f32" },
          uMode: { value: 1, type: "f32" },
          uQuality: { value: 1, type: "f32" },
        },
      },
    });
    // This is a full-frame filter. Pixi padding creates transparent texels
    // outside the source sprite; spatial taps can then pull that gutter back
    // into view as a black edge. Sampling is already clamped/edge-guarded, so
    // the correct full-screen contract is zero filter padding.
    this.filter.padding = 0;
  }

  setMode(mode: SceneMode) {
    this.mode = mode;
    this.write("uMode", mode === "poster" ? 0 : mode === "neon" ? 1 : 2);
  }

  setIntensity(value: number) {
    this.intensity = Math.max(0.2, Math.min(1.8, value));
  }

  setMix(value: number) {
    this.mix = Math.max(0, Math.min(3, value));
  }

  setQuality(quality: QualityMode) {
    this.quality = quality;
    this.write("uQuality", quality === "cinema" ? 1 : 0);
  }

  update(time: number, audio: AudioBands) {
    this.write("uTime", time);
    this.write("uAmount", this.intensity * this.mix * (this.quality === "cinema" ? 1 : 0.72));
    this.write("uBass", audio.bass);
    this.write("uEnergy", audio.energy);
    this.write("uTransient", audio.transient);
    this.write("uMode", this.mode === "poster" ? 0 : this.mode === "neon" ? 1 : 2);
  }

  private write(name: keyof FxUniforms, value: number) {
    const uniforms = (this.filter.resources.fxUniforms as { uniforms: FxUniforms }).uniforms;
    uniforms[name] = value;
  }
}
