import {
  Container,
  Filter,
  GlProgram,
  Sprite,
  Texture,
} from "pixi.js";
import {
  createWorldColorContext,
  type VisualPalette,
  type WorldColorContext,
  type WorldTextPolarity,
} from "@graph1ks/emo-engine-core";
import butterchurn from "butterchurn";

export type MilkdropRenderScale = 1 | 1.5 | 2;

export interface ButterchurnImageData {
  data: string;
  width: number;
  height: number;
}

export interface MilkdropRenderSettings {
  opacity: number;
  paletteInfluence: number;
  renderScale: MilkdropRenderScale;
  fxaa: boolean;
}

const vertex = `
in vec2 aPosition;
out vec2 vTextureCoord;
uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

void main(void) {
  vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
  position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
  position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
  gl_Position = vec4(position, 0.0, 1.0);
  vTextureCoord = aPosition * (uOutputFrame.zw * uInputSize.zw);
}
`;

const fragment = `
precision highp float;
in vec2 vTextureCoord;
uniform sampler2D uTexture;
uniform float uMix;
uniform float uAr;
uniform float uAg;
uniform float uAb;
uniform float uBr;
uniform float uBg;
uniform float uBb;

void main(void) {
  vec4 source = texture2D(uTexture, vTextureCoord);
  float luma = dot(source.rgb, vec3(0.2126, 0.7152, 0.0722));
  float split = smoothstep(0.22, 0.82, luma);
  vec3 target = mix(vec3(uAr, uAg, uAb), vec3(uBr, uBg, uBb), split);
  float targetLuma = max(0.001, dot(target, vec3(0.2126, 0.7152, 0.0722)));
  target *= clamp(luma / targetLuma, 0.25, 2.4);
  vec3 graded = mix(source.rgb, clamp(target, 0.0, 1.0), clamp(uMix, 0.0, 1.0));
  gl_FragColor = vec4(graded, source.a);
}
`;

type PaletteUniforms = {
  uMix: number;
  uAr: number;
  uAg: number;
  uAb: number;
  uBr: number;
  uBg: number;
  uBb: number;
};

export class ButterchurnBackground {
  readonly container = new Container();

  private readonly canvas = document.createElement("canvas");
  private readonly analysisCanvas = document.createElement("canvas");
  private readonly texture: Texture;
  private readonly sprite: Sprite;
  private readonly paletteFilter: Filter;
  private visualizer?: ReturnType<typeof butterchurn.createVisualizer>;
  private palette?: VisualPalette;
  private active = false;
  private width = 1;
  private height = 1;
  private settings: MilkdropRenderSettings = {
    opacity: 1,
    paletteInfluence: 0,
    renderScale: 1,
    fxaa: true,
  };
  private analysisFrame = 0;
  private analyzed?: {
    representativeColor: number;
    representativeHue: number;
    titleSafeLuminance: number;
    highlightRisk: number;
    chromaPressure: number;
    busyness: number;
  };

  constructor() {
    this.canvas.width = 2;
    this.canvas.height = 2;
    this.analysisCanvas.width = 48;
    this.analysisCanvas.height = 27;
    this.texture = Texture.from(this.canvas);
    this.sprite = new Sprite(this.texture);
    this.paletteFilter = new Filter({
      glProgram: GlProgram.from({ vertex, fragment }),
      resources: {
        paletteUniforms: {
          uMix: { value: 0, type: "f32" },
          uAr: { value: 1, type: "f32" },
          uAg: { value: 1, type: "f32" },
          uAb: { value: 1, type: "f32" },
          uBr: { value: 1, type: "f32" },
          uBg: { value: 1, type: "f32" },
          uBb: { value: 1, type: "f32" },
        },
      },
    });
    this.sprite.filters = [this.paletteFilter];
    this.container.addChild(this.sprite);
    this.container.visible = false;
  }

  init(audioContext: AudioContext, audioNode: AudioNode) {
    if (this.visualizer) return;
    this.visualizer = butterchurn.createVisualizer(audioContext, this.canvas, {
      width: Math.max(1, Math.round(this.width)),
      height: Math.max(1, Math.round(this.height)),
      pixelRatio: 1,
      textureRatio: this.settings.renderScale,
      outputFXAA: this.settings.fxaa,
    });
    this.visualizer.connectAudio(audioNode);
    this.visualizer.setOutputAA(this.settings.fxaa);
    this.resize(this.width, this.height);
  }

  setActive(active: boolean) {
    this.active = active;
    this.container.visible = active;
  }

  isActive() {
    return this.active;
  }

  loadPreset(preset: unknown, blendSeconds = 2.7) {
    if (!this.visualizer) throw new Error("Butterchurn audio bridge is not initialized");
    this.visualizer.loadPreset(preset, Math.max(0, Math.min(12, blendSeconds)));
    this.active = true;
    this.container.visible = true;
    this.analyzed = undefined;
  }

  loadExtraImages(images: Record<string, ButterchurnImageData>) {
    this.visualizer?.loadExtraImages(images);
  }

  setSettings(value: Partial<MilkdropRenderSettings>) {
    this.settings = {
      opacity: clamp01(value.opacity ?? this.settings.opacity),
      paletteInfluence: clamp01(value.paletteInfluence ?? this.settings.paletteInfluence),
      renderScale: normalizeScale(value.renderScale ?? this.settings.renderScale),
      fxaa: value.fxaa ?? this.settings.fxaa,
    };
    this.container.alpha = this.settings.opacity;
    this.write("uMix", this.settings.paletteInfluence);
    this.visualizer?.setOutputAA(this.settings.fxaa);
    if (this.visualizer) this.resize(this.width, this.height);
  }

  setPalette(palette: VisualPalette) {
    this.palette = palette;
    const a = hexRgb(palette.accentA);
    const b = hexRgb(palette.accentB);
    this.write("uAr", a[0]);
    this.write("uAg", a[1]);
    this.write("uAb", a[2]);
    this.write("uBr", b[0]);
    this.write("uBg", b[1]);
    this.write("uBb", b[2]);
  }

  resize(width: number, height: number) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.sprite.width = this.width;
    this.sprite.height = this.height;
    if (!this.visualizer) return;
    this.visualizer.setRendererSize(
      Math.max(1, Math.round(this.width)),
      Math.max(1, Math.round(this.height)),
      {
        pixelRatio: 1,
        textureRatio: this.settings.renderScale,
      },
    );
    this.visualizer.setOutputAA(this.settings.fxaa);
  }

  update() {
    if (!this.active || !this.visualizer) return;
    this.visualizer.render();
    this.texture.source.update();

    this.analysisFrame = (this.analysisFrame + 1) % 6;
    if (this.analysisFrame === 0) this.analyzeFrame();
  }

  getWorldColorContext(previousPolarity?: WorldTextPolarity): WorldColorContext | undefined {
    if (!this.palette) return undefined;
    const sample = this.analyzed;
    if (!sample) {
      return createWorldColorContext({
        palette: this.palette,
        previousPolarity,
        highlightRisk: 0.35,
        busyness: 0.55,
        chromaPressure: 0.45,
      });
    }
    return createWorldColorContext({
      palette: this.palette,
      ...sample,
      previousPolarity,
    });
  }

  destroy() {
    this.container.removeChildren();
    this.sprite.destroy();
    this.texture.destroy(true);
    this.visualizer = undefined;
  }

  private analyzeFrame() {
    const context = this.analysisCanvas.getContext("2d", { willReadFrequently: true });
    if (!context || this.canvas.width < 1 || this.canvas.height < 1) return;

    context.clearRect(0, 0, this.analysisCanvas.width, this.analysisCanvas.height);
    context.drawImage(
      this.canvas,
      0,
      0,
      this.canvas.width,
      this.canvas.height,
      0,
      0,
      this.analysisCanvas.width,
      this.analysisCanvas.height,
    );

    const { width, height } = this.analysisCanvas;
    const pixels = context.getImageData(0, 0, width, height).data;
    let rSum = 0;
    let gSum = 0;
    let bSum = 0;
    let chromaSum = 0;
    let centerLumaSum = 0;
    let centerCount = 0;
    let highlightCount = 0;
    let edgeSum = 0;
    let edgeCount = 0;
    const lumas = new Float32Array(width * height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        const offset = index * 4;
        const r = pixels[offset] / 255;
        const g = pixels[offset + 1] / 255;
        const b = pixels[offset + 2] / 255;
        const luma = 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
        lumas[index] = luma;
        rSum += r;
        gSum += g;
        bSum += b;
        chromaSum += Math.max(r, g, b) - Math.min(r, g, b);

        const inSafeX = x >= width * 0.16 && x <= width * 0.84;
        const inSafeY = y >= height * 0.20 && y <= height * 0.80;
        if (inSafeX && inSafeY) {
          centerLumaSum += luma;
          centerCount++;
          if (luma > 0.72) highlightCount++;
        }
      }
    }

    for (let y = 1; y < height; y++) {
      for (let x = 1; x < width; x++) {
        const index = y * width + x;
        edgeSum += Math.abs(lumas[index] - lumas[index - 1]);
        edgeSum += Math.abs(lumas[index] - lumas[index - width]);
        edgeCount += 2;
      }
    }

    const count = Math.max(1, width * height);
    const avgR = rSum / count;
    const avgG = gSum / count;
    const avgB = bSum / count;
    const titleSafeLuminance = centerLumaSum / Math.max(1, centerCount);

    this.analyzed = {
      representativeColor: (Math.round(avgR * 255) << 16)
        | (Math.round(avgG * 255) << 8)
        | Math.round(avgB * 255),
      representativeHue: rgbHue(avgR, avgG, avgB),
      titleSafeLuminance,
      highlightRisk: clamp01(highlightCount / Math.max(1, centerCount) * 2.4),
      chromaPressure: clamp01(chromaSum / count * 1.6),
      busyness: clamp01(edgeSum / Math.max(1, edgeCount) * 3.2),
    };
  }

  private write(name: keyof PaletteUniforms, value: number) {
    const uniforms = (
      this.paletteFilter.resources.paletteUniforms as { uniforms: PaletteUniforms }
    ).uniforms;
    uniforms[name] = value;
  }
}

function normalizeScale(value: number): MilkdropRenderScale {
  if (value >= 1.75) return 2;
  if (value >= 1.25) return 1.5;
  return 1;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function hexRgb(hex: number) {
  return [
    ((hex >> 16) & 255) / 255,
    ((hex >> 8) & 255) / 255,
    (hex & 255) / 255,
  ] as const;
}

function linear(value: number) {
  return value <= 0.04045
    ? value / 12.92
    : Math.pow((value + 0.055) / 1.055, 2.4);
}

function rgbHue(r: number, g: number, b: number) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta < 0.0001) return 0;
  let hue = max === r
    ? ((g - b) / delta) % 6
    : max === g
      ? (b - r) / delta + 2
      : (r - g) / delta + 4;
  hue *= 60;
  return (hue + 360) % 360;
}
