import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import { basename, isAbsolute, relative, resolve, sep } from "node:path";
import type {
  EmoProjectDefaults,
  EmoProjectManifestV1,
  ProjectAssetDescriptor,
  ProjectAssetKind,
  ProjectDescriptor,
  MilkdropPresetDescriptor,
  MilkdropTextureDescriptor,
  ProjectBackgroundPreset,
  ProjectColorCanvas,
  ProjectColorFlow,
  ProjectColorHarmony,
  ProjectColorMood,
  ProjectCompositionMotion,
  ProjectQualityMode,
  ProjectTypographyLayout,
  ProjectTypographyPreset,
  ProjectVisualMode,
} from "@graph1ks/emo-app-contracts";

const AUDIO_EXTENSIONS = new Set([".mp3", ".m4a", ".aac"]);
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif"]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".mov"]);
const VISUAL_MODES = new Set<ProjectVisualMode>(["auto", "poster", "neon", "vortex"]);
const QUALITY_MODES = new Set<ProjectQualityMode>(["performance", "cinema"]);
const TYPOGRAPHY_PRESETS = new Set<ProjectTypographyPreset>([
  "auto",
  "impact",
  "cascade",
  "wave",
  "scatter",
  "elastic",
  "outline",
  "tunnel",
  "glitch",
]);
const TYPOGRAPHY_LAYOUTS = new Set<ProjectTypographyLayout>([
  "auto",
  "center-stack",
  "directional-stage",
  "editorial",
  "vertical-accent",
  "split-stage",
  "crossword",
]);
const COMPOSITION_MOTIONS = new Set<ProjectCompositionMotion>([
  "auto",
  "handoff",
  "conveyor",
  "anchor-build",
  "collapse",
  "takeover",
  "flip",
  "camera-handoff",
  "portal",
  "panel",
]);
const COLOR_MOODS = new Set<ProjectColorMood>([
  "auto",
  "tender",
  "heartbreak",
  "longing",
  "euphoria",
  "rage",
  "dream",
  "tension",
  "calm",
]);
const COLOR_CANVASES = new Set<ProjectColorCanvas>([
  "auto",
  "night",
  "paper",
  "color-field",
  "poster",
]);
const COLOR_FLOWS = new Set<ProjectColorFlow>(["static", "rainbow"]);
const COLOR_HARMONIES = new Set<ProjectColorHarmony>([
  "auto",
  "split-complement",
  "analogous",
  "complement",
  "triad",
  "tetrad",
  "monochrome",
]);
const BACKGROUND_PRESETS = new Set<ProjectBackgroundPreset>([
  "auto",
  "cinematic",
  "nebula",
  "grid",
  "starfield",
  "rays",
  "vortex",
  "liquid",
  "spectrum",
  "sparks",
  "lyrics",
  "minimal",
  "editorial",
  "print",
  "architecture",
  "aurora",
  "prism-stage-beams",
  "laser-canopy-grid",
  "disco-mirrorball-room",
  "neon-energy-burst-tunnel",
  "fractal-hex-spiral-mosaic",
  "soft-hex-cell-field",
  "particle-spiral-vortex",
  "minimal-rainbow-waveform",
]);

function extension(fileName: string) {
  const dot = fileName.lastIndexOf(".");
  return dot >= 0 ? fileName.slice(dot).toLowerCase() : "";
}

function projectId(relativeDirectory: string) {
  return createHash("sha256").update(relativeDirectory || ".").digest("hex").slice(0, 16);
}

function assetKind(fileName: string): ProjectAssetKind {
  const ext = extension(fileName);
  if (AUDIO_EXTENSIONS.has(ext)) return "audio";
  if (ext === ".lrc") return "lyrics";
  if (fileName === "emo.project.json") return "manifest";
  if (IMAGE_EXTENSIONS.has(ext)) return "image";
  if (VIDEO_EXTENSIONS.has(ext)) return "video";
  if (ext === ".json") return "preset";
  return "other";
}

export function resolveInsideRoot(root: string, relativePath: string) {
  const absoluteRoot = resolve(root);
  const absoluteTarget = resolve(absoluteRoot, relativePath);
  const diff = relative(absoluteRoot, absoluteTarget);
  if (diff === "" || (!diff.startsWith("..") && !isAbsolute(diff))) return absoluteTarget;
  throw new Error("Path escapes configured E-MO project root");
}

function normalizedManifestPath(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`E-MO manifest field "${field}" must be a non-empty relative path`);
  const normalized = value.trim().replace(/\\/g, "/");
  if (
    normalized.startsWith("/") ||
    /^[A-Za-z]:/.test(normalized) ||
    normalized.includes("\0") ||
    normalized.split("/").some(segment => segment === ".." || segment === ".")
  ) {
    throw new Error(`E-MO manifest field "${field}" must stay inside the project directory`);
  }
  return normalized;
}

function optionalStringArray(value: unknown, field: string) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw new Error(`E-MO manifest field "${field}" must be an array`);
  return value.map((entry, index) => normalizedManifestPath(entry, `${field}[${index}]`));
}

function parseDefaults(value: unknown): EmoProjectDefaults | undefined {
  if (value === undefined) return undefined;
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("E-MO manifest defaults must be an object");
  const input = value as Record<string, unknown>;
  const defaults: EmoProjectDefaults = {};

  if (input.visualMode !== undefined) {
    if (typeof input.visualMode !== "string" || !VISUAL_MODES.has(input.visualMode as ProjectVisualMode)) {
      throw new Error("E-MO manifest defaults.visualMode is invalid");
    }
    defaults.visualMode = input.visualMode as ProjectVisualMode;
  }

  if (input.quality !== undefined) {
    if (typeof input.quality !== "string" || !QUALITY_MODES.has(input.quality as ProjectQualityMode)) {
      throw new Error("E-MO manifest defaults.quality is invalid");
    }
    defaults.quality = input.quality as ProjectQualityMode;
  }

  if (input.typographyPreset !== undefined) {
    if (
      typeof input.typographyPreset !== "string"
      || !TYPOGRAPHY_PRESETS.has(input.typographyPreset as ProjectTypographyPreset)
    ) {
      throw new Error("E-MO manifest defaults.typographyPreset is invalid");
    }
    defaults.typographyPreset = input.typographyPreset as ProjectTypographyPreset;
  }

  if (input.typographyLayout !== undefined) {
    if (
      typeof input.typographyLayout !== "string"
      || !TYPOGRAPHY_LAYOUTS.has(input.typographyLayout as ProjectTypographyLayout)
    ) {
      throw new Error("E-MO manifest defaults.typographyLayout is invalid");
    }
    defaults.typographyLayout = input.typographyLayout as ProjectTypographyLayout;
  }

  if (input.compositionMotion !== undefined) {
    if (
      typeof input.compositionMotion !== "string"
      || !COMPOSITION_MOTIONS.has(input.compositionMotion as ProjectCompositionMotion)
    ) {
      throw new Error("E-MO manifest defaults.compositionMotion is invalid");
    }
    defaults.compositionMotion = input.compositionMotion as ProjectCompositionMotion;
  }

  if (input.backgroundPreset !== undefined) {
    if (
      typeof input.backgroundPreset !== "string"
      || !BACKGROUND_PRESETS.has(input.backgroundPreset as ProjectBackgroundPreset)
    ) {
      throw new Error("E-MO manifest defaults.backgroundPreset is invalid");
    }
    defaults.backgroundPreset = input.backgroundPreset as ProjectBackgroundPreset;
  }

  if (input.colorHarmony !== undefined) {
    if (
      typeof input.colorHarmony !== "string"
      || !COLOR_HARMONIES.has(input.colorHarmony as ProjectColorHarmony)
    ) {
      throw new Error("E-MO manifest defaults.colorHarmony is invalid");
    }
    defaults.colorHarmony = input.colorHarmony as ProjectColorHarmony;
  }

  if (input.colorMood !== undefined) {
    if (
      typeof input.colorMood !== "string"
      || !COLOR_MOODS.has(input.colorMood as ProjectColorMood)
    ) {
      throw new Error("E-MO manifest defaults.colorMood is invalid");
    }
    defaults.colorMood = input.colorMood as ProjectColorMood;
  }

  if (input.colorCanvas !== undefined) {
    if (
      typeof input.colorCanvas !== "string"
      || !COLOR_CANVASES.has(input.colorCanvas as ProjectColorCanvas)
    ) {
      throw new Error("E-MO manifest defaults.colorCanvas is invalid");
    }
    defaults.colorCanvas = input.colorCanvas as ProjectColorCanvas;
  }

  if (input.colorFlow !== undefined) {
    if (
      typeof input.colorFlow !== "string"
      || !COLOR_FLOWS.has(input.colorFlow as ProjectColorFlow)
    ) {
      throw new Error("E-MO manifest defaults.colorFlow is invalid");
    }
    defaults.colorFlow = input.colorFlow as ProjectColorFlow;
  }

  if (input.intensity !== undefined) {
    if (typeof input.intensity !== "number" || !Number.isFinite(input.intensity) || input.intensity < 0.2 || input.intensity > 1.8) {
      throw new Error("E-MO manifest defaults.intensity must be between 0.2 and 1.8");
    }
    defaults.intensity = input.intensity;
  }

  if (input.syncMs !== undefined) {
    if (typeof input.syncMs !== "number" || !Number.isFinite(input.syncMs) || input.syncMs < -1500 || input.syncMs > 1500) {
      throw new Error("E-MO manifest defaults.syncMs must be between -1500 and 1500");
    }
    defaults.syncMs = Math.round(input.syncMs);
  }

  return defaults;
}

export function parseProjectManifest(source: string): EmoProjectManifestV1 {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch {
    throw new Error("E-MO project manifest is not valid JSON");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("E-MO project manifest must be an object");
  const input = parsed as Record<string, unknown>;
  if (input.schema !== "emo.project/v1") throw new Error('E-MO project manifest schema must be "emo.project/v1"');

  const name = input.name === undefined
    ? undefined
    : typeof input.name === "string" && input.name.trim()
      ? input.name.trim()
      : (() => { throw new Error("E-MO manifest name must be a non-empty string"); })();

  return {
    schema: "emo.project/v1",
    name,
    audio: normalizedManifestPath(input.audio, "audio"),
    lyrics: normalizedManifestPath(input.lyrics, "lyrics"),
    assets: optionalStringArray(input.assets, "assets"),
    presets: optionalStringArray(input.presets, "presets"),
    defaults: parseDefaults(input.defaults),
  };
}

async function fileDescriptor(root: string, projectDirectory: string, relativeFile: string): Promise<ProjectAssetDescriptor> {
  const projectRoot = resolveInsideRoot(root, projectDirectory);
  const full = resolveInsideRoot(projectRoot, relativeFile.split("/").join(sep));
  const info = await stat(full);
  if (!info.isFile()) throw new Error(`E-MO project asset is not a file: ${relativeFile}`);
  const relativePath = relative(resolve(root), full).split(sep).join("/");
  return {
    id: createHash("sha256").update(relativePath).digest("hex").slice(0, 16),
    kind: assetKind(basename(full)),
    fileName: basename(full),
    relativePath,
    size: info.size,
  };
}

function uniqueAssets(assets: ProjectAssetDescriptor[]) {
  const seen = new Set<string>();
  return assets.filter(asset => {
    if (seen.has(asset.relativePath)) return false;
    seen.add(asset.relativePath);
    return true;
  });
}

async function inspectManifestProject(
  root: string,
  relativeDirectory: string,
  manifestDescriptor: ProjectAssetDescriptor,
): Promise<ProjectDescriptor> {
  const projectRoot = resolveInsideRoot(root, relativeDirectory);
  const manifestText = await readFile(resolveInsideRoot(projectRoot, "emo.project.json"), "utf8");
  const manifest = parseProjectManifest(manifestText);
  const audio = await fileDescriptor(root, relativeDirectory, manifest.audio);
  const lyrics = await fileDescriptor(root, relativeDirectory, manifest.lyrics);

  if (audio.kind !== "audio") throw new Error("E-MO manifest audio must reference MP3, M4A or AAC");
  if (lyrics.kind !== "lyrics") throw new Error("E-MO manifest lyrics must reference an LRC file");

  const referenced = [
    ...(manifest.assets ?? []),
    ...(manifest.presets ?? []),
  ];
  const extraAssets = await Promise.all(referenced.map(file => fileDescriptor(root, relativeDirectory, file)));

  return {
    id: projectId(relativeDirectory),
    name: manifest.name ?? (relativeDirectory ? basename(projectRoot) : basename(resolve(root))),
    relativeDirectory: relativeDirectory.split(sep).join("/"),
    manifestFile: manifestDescriptor.relativePath,
    manifest,
    audio,
    lyrics,
    assets: uniqueAssets([manifestDescriptor, audio, lyrics, ...extraAssets]),
  };
}

async function inspectDirectory(root: string, relativeDirectory: string): Promise<ProjectDescriptor | null> {
  const fullDirectory = resolveInsideRoot(root, relativeDirectory);
  const entries = await readdir(fullDirectory, { withFileTypes: true });
  const files = entries.filter(entry => entry.isFile()).map(entry => entry.name).sort((a, b) => a.localeCompare(b));
  const directAssets = await Promise.all(files.map(file => fileDescriptor(root, relativeDirectory, file)));
  const manifestDescriptor = directAssets.find(asset => asset.kind === "manifest");

  if (manifestDescriptor) return inspectManifestProject(root, relativeDirectory, manifestDescriptor);

  const audio = directAssets.find(asset => asset.kind === "audio");
  const lyrics = directAssets.find(asset => asset.kind === "lyrics");
  if (!(audio && lyrics)) return null;

  return {
    id: projectId(relativeDirectory),
    name: relativeDirectory ? basename(fullDirectory) : basename(resolve(root)),
    relativeDirectory: relativeDirectory.split(sep).join("/"),
    audio,
    lyrics,
    assets: directAssets,
  };
}

export async function discoverProjects(root: string): Promise<ProjectDescriptor[]> {
  const absoluteRoot = resolve(root);
  const rootInfo = await stat(absoluteRoot);
  if (!rootInfo.isDirectory()) throw new Error("Configured E-MO project root is not a directory");

  const rootProject = await inspectDirectory(absoluteRoot, "");
  if (rootProject) return [rootProject];

  const entries = await readdir(absoluteRoot, { withFileTypes: true });
  const projectDirectories = entries
    .filter(entry => entry.isDirectory() && !entry.name.startsWith("."))
    .map(entry => entry.name)
    .sort((a, b) => a.localeCompare(b));

  const projects = await Promise.all(projectDirectories.map(directory => inspectDirectory(absoluteRoot, directory)));
  return projects.filter((project): project is ProjectDescriptor => Boolean(project));
}

export function findProject(projects: ProjectDescriptor[], id: string) {
  return projects.find(project => project.id === id);
}

export function findProjectAsset(project: ProjectDescriptor, assetId: string) {
  return project.assets.find(asset => asset.id === assetId);
}


const MILKDROP_TEXTURE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

function milkdropId(kind: "preset" | "texture", relativePath: string) {
  return createHash("sha256")
    .update(`${kind}:${relativePath.toLowerCase()}`)
    .digest("hex")
    .slice(0, 16);
}

async function discoverLibraryFiles(root: string, accept: (name: string) => boolean) {
  const absoluteRoot = resolve(root);
  const rootInfo = await stat(absoluteRoot);
  if (!rootInfo.isDirectory()) throw new Error("Configured MilkDrop root is not a directory");

  const files: Array<{ relativePath: string; size: number; modifiedMs: number }> = [];
  const queue = [""];

  while (queue.length) {
    const relativeDirectory = queue.shift()!;
    const fullDirectory = resolveInsideRoot(absoluteRoot, relativeDirectory);
    const entries = await readdir(fullDirectory, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const relativePath = [relativeDirectory, entry.name].filter(Boolean).join("/");
      if (entry.isDirectory()) {
        queue.push(relativePath);
        continue;
      }
      if (!entry.isFile() || !accept(entry.name)) continue;
      const info = await stat(resolveInsideRoot(absoluteRoot, relativePath.split("/").join(sep)));
      files.push({
        relativePath,
        size: info.size,
        modifiedMs: info.mtimeMs,
      });
    }
  }

  return files;
}

export async function discoverMilkdropPresets(root: string): Promise<MilkdropPresetDescriptor[]> {
  const files = await discoverLibraryFiles(root, name => extension(name) === ".milk");
  return files.map(file => {
    const normalized = file.relativePath.replace(/\\/g, "/");
    const parts = normalized.split("/");
    const fileName = parts.pop()!;
    return {
      id: milkdropId("preset", normalized),
      name: fileName.replace(/\.milk$/i, ""),
      relativePath: normalized,
      folders: parts,
      size: file.size,
      modifiedMs: file.modifiedMs,
    };
  });
}

export async function discoverMilkdropTextures(root: string): Promise<MilkdropTextureDescriptor[]> {
  const files = await discoverLibraryFiles(root, name => MILKDROP_TEXTURE_EXTENSIONS.has(extension(name)));
  return files.map(file => {
    const normalized = file.relativePath.replace(/\\/g, "/");
    const fileName = normalized.split("/").pop()!;
    return {
      id: milkdropId("texture", normalized),
      name: fileName.replace(/\.(png|jpe?g|webp)$/i, ""),
      fileName,
      relativePath: normalized,
      size: file.size,
      modifiedMs: file.modifiedMs,
    };
  });
}

export function findMilkdropPreset(presets: MilkdropPresetDescriptor[], id: string) {
  return presets.find(preset => preset.id === id);
}

export function findMilkdropTexture(textures: MilkdropTextureDescriptor[], id: string) {
  return textures.find(texture => texture.id === id);
}
