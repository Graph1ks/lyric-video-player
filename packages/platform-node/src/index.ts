import { createHash } from "node:crypto";
import { readdir, stat } from "node:fs/promises";
import { basename, isAbsolute, relative, resolve, sep } from "node:path";
import type { ProjectAssetDescriptor, ProjectAssetKind, ProjectDescriptor } from "@graph1ks/emo-app-contracts";

const AUDIO_EXTENSIONS = new Set([".mp3", ".m4a", ".aac"]);
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif"]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".mov"]);

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

async function fileDescriptor(root: string, directory: string, fileName: string): Promise<ProjectAssetDescriptor> {
  const full = resolveInsideRoot(root, [directory, fileName].filter(Boolean).join(sep));
  const info = await stat(full);
  const relativePath = relative(resolve(root), full).split(sep).join("/");
  return {
    id: createHash("sha256").update(relativePath).digest("hex").slice(0, 16),
    kind: assetKind(fileName),
    fileName,
    relativePath,
    size: info.size,
  };
}

async function inspectDirectory(root: string, relativeDirectory: string): Promise<ProjectDescriptor | null> {
  const fullDirectory = resolveInsideRoot(root, relativeDirectory);
  const entries = await readdir(fullDirectory, { withFileTypes: true });
  const files = entries.filter(entry => entry.isFile()).map(entry => entry.name).sort((a, b) => a.localeCompare(b));
  const directAssets = await Promise.all(files.map(file => fileDescriptor(root, relativeDirectory, file)));
  const manifest = directAssets.find(asset => asset.kind === "manifest");
  const audio = directAssets.find(asset => asset.kind === "audio");
  const lyrics = directAssets.find(asset => asset.kind === "lyrics");

  if (!manifest && !(audio && lyrics)) return null;

  return {
    id: projectId(relativeDirectory),
    name: relativeDirectory ? basename(fullDirectory) : basename(resolve(root)),
    relativeDirectory: relativeDirectory.split(sep).join("/"),
    manifestFile: manifest?.relativePath,
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
