import type {
  MilkdropLibraryResponse,
  MilkdropPresetDescriptor,
  MilkdropTextureDescriptor,
} from "@graph1ks/emo-app-contracts";
import { milkdropTextureUrl } from "@graph1ks/emo-platform-web";
import { convertPreset } from "milkdrop-preset-converter";

export type BackgroundEngine = "emo" | "milkdrop";
export type MilkdropCompatibility =
  | "unconverted"
  | "converting"
  | "ready"
  | "missing-textures"
  | "conversion-error"
  | "runtime-error";

export interface MilkdropPresetStatus {
  compatibility: MilkdropCompatibility;
  message?: string;
  missingTextures?: string[];
}

export type MilkdropRenderScale = 1 | 1.5 | 2;

const convertedCache = new Map<string, unknown>();

const BUILTIN_SAMPLERS = new Set([
  "main",
  "blur1",
  "blur2",
  "blur3",
  "noise_lq",
  "noise_hq",
  "noisevol_lq",
  "noisevol_hq",
  "clouds2",
]);

export async function convertMilkdropPreset(
  preset: MilkdropPresetDescriptor,
  source: string,
) {
  const cacheKey = `${preset.id}:${Math.round(preset.modifiedMs)}:${preset.size}`;
  const cached = convertedCache.get(cacheKey);
  if (cached) return cached;
  const converted = await convertPreset(source);
  convertedCache.set(cacheKey, converted);
  return converted;
}

export function extractMilkdropTextureReferences(source: string) {
  const refs = new Set<string>();
  const regex = /sampler_((?:(?:pw|pc|fw|fc)_)?[A-Za-z0-9_]+)/g;
  for (const match of source.matchAll(regex)) {
    const raw = match[1];
    const normalized = raw.replace(/^(?:pw|pc|fw|fc)_/, "");
    if (!BUILTIN_SAMPLERS.has(normalized.toLowerCase())) refs.add(normalized);
  }
  return [...refs].sort((a, b) => a.localeCompare(b));
}

export function resolveMilkdropTextures(
  references: readonly string[],
  textures: readonly MilkdropTextureDescriptor[],
) {
  const byName = new Map<string, MilkdropTextureDescriptor>();
  for (const texture of textures) {
    byName.set(texture.name.toLowerCase(), texture);
    byName.set(texture.fileName.toLowerCase(), texture);
  }

  const resolved: Array<{ sampler: string; texture: MilkdropTextureDescriptor }> = [];
  const missing: string[] = [];
  for (const sampler of references) {
    const direct = byName.get(sampler.toLowerCase());
    const withKnownExtension = direct ?? [".png", ".jpg", ".jpeg", ".webp"]
      .map(extension => byName.get(`${sampler.toLowerCase()}${extension}`))
      .find((value): value is MilkdropTextureDescriptor => Boolean(value));
    if (withKnownExtension) resolved.push({ sampler, texture: withKnownExtension });
    else missing.push(sampler);
  }

  return { resolved, missing };
}

export async function loadMilkdropTextureImages(
  library: MilkdropLibraryResponse,
  source: string,
) {
  const references = extractMilkdropTextureReferences(source);
  const { resolved, missing } = resolveMilkdropTextures(references, library.textures);
  const images: Record<string, { data: string; width: number; height: number }> = {};

  await Promise.all(resolved.map(async ({ sampler, texture }) => {
    const url = milkdropTextureUrl(texture.id);
    const dimensions = await imageDimensions(url);
    images[sampler] = {
      data: url,
      width: dimensions.width,
      height: dimensions.height,
    };
  }));

  return { images, missing };
}

function imageDimensions(url: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({
      width: Math.max(1, image.naturalWidth),
      height: Math.max(1, image.naturalHeight),
    });
    image.onerror = () => reject(new Error(`Unable to load MilkDrop texture: ${url}`));
    image.src = url;
  });
}
