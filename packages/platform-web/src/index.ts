import type {
  ProjectDescriptor,
  ProjectListResponse,
  RuntimeInfo,
} from "@graph1ks/emo-app-contracts";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`E-MO request failed: ${response.status} ${response.statusText}`);
  return response.json() as Promise<T>;
}

export function fetchRuntimeInfo() {
  return fetchJson<RuntimeInfo>("/api/runtime");
}

export function fetchProjects() {
  return fetchJson<ProjectListResponse>("/api/projects");
}

export function projectAssetUrl(projectId: string, assetId: string) {
  return `/media/${encodeURIComponent(projectId)}/${encodeURIComponent(assetId)}`;
}

export async function fetchProjectLyrics(project: ProjectDescriptor) {
  if (!project.lyrics) throw new Error("Project has no Enhanced LRC asset");
  const response = await fetch(projectAssetUrl(project.id, project.lyrics.id));
  if (!response.ok) throw new Error(`Unable to load lyrics: ${response.status}`);
  return response.text();
}

export function classifyDroppedFiles(files: Iterable<File>) {
  let audio: File | undefined;
  let lyrics: File | undefined;
  for (const file of files) {
    if (!audio && (file.type.startsWith("audio/") || /\.(mp3|m4a|aac)$/i.test(file.name))) audio = file;
    if (!lyrics && /\.lrc$/i.test(file.name)) lyrics = file;
  }
  return { audio, lyrics };
}
