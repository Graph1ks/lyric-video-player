import { createReadStream } from "node:fs";
import { access, readFile, stat } from "node:fs/promises";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { basename, extname, resolve, sep } from "node:path";
import type {
  ProjectListResponse,
  RuntimeCapabilities,
  RuntimeInfo,
} from "@graph1ks/emo-app-contracts";
import {
  discoverMilkdropPresets,
  discoverMilkdropTextures,
  discoverProjects,
  findMilkdropPreset,
  findMilkdropTexture,
  findProject,
  findProjectAsset,
  resolveInsideRoot,
} from "@graph1ks/emo-platform-node";

export interface EmoServerOptions {
  projectRoot: string;
  webDist: string;
  mode?: RuntimeCapabilities["mode"];
  canChooseDirectory?: boolean;
  canWriteProjectRoot?: boolean;
  milkdropPresetRoot?: string;
  milkdropTextureRoot?: string;
}

export class EmoServer {
  private readonly server: Server;
  private projectRoot: string;
  private readonly webDist: string;
  private readonly capabilities: RuntimeCapabilities;
  private milkdropPresetRoot?: string;
  private milkdropTextureRoot?: string;
  private milkdropLibraryCache?: Awaited<ReturnType<EmoServer["buildMilkdropLibrary"]>>;

  constructor(options: EmoServerOptions) {
    this.projectRoot = resolve(options.projectRoot);
    this.webDist = resolve(options.webDist);
    this.milkdropPresetRoot = options.milkdropPresetRoot ? resolve(options.milkdropPresetRoot) : undefined;
    this.milkdropTextureRoot = options.milkdropTextureRoot ? resolve(options.milkdropTextureRoot) : undefined;
    this.capabilities = {
      mode: options.mode ?? "server",
      canChooseDirectory: options.canChooseDirectory ?? false,
      canReadProjectRoot: true,
      canWriteProjectRoot: options.canWriteProjectRoot ?? false,
    };
    this.server = createServer((req, res) => {
      void this.handle(req, res);
    });
  }

  setProjectRoot(root: string) {
    this.projectRoot = resolve(root);
  }

  getProjectRoot() {
    return this.projectRoot;
  }

  async listProjects(): Promise<ProjectListResponse> {
    return {
      rootLabel: basename(this.projectRoot),
      projects: await discoverProjects(this.projectRoot),
    };
  }

  async listen(port = 0, host = "127.0.0.1") {
    await new Promise<void>((resolvePromise, reject) => {
      const onError = (error: Error) => {
        this.server.off("listening", onListening);
        reject(error);
      };
      const onListening = () => {
        this.server.off("error", onError);
        resolvePromise();
      };
      this.server.once("error", onError);
      this.server.once("listening", onListening);
      this.server.listen(port, host);
    });

    const address = this.server.address();
    if (!address || typeof address === "string") throw new Error("Unable to resolve E-MO server address");
    return { host, port: address.port, url: `http://${host}:${address.port}` };
  }

  async close() {
    if (!this.server.listening) return;
    await new Promise<void>((resolvePromise, reject) => {
      this.server.close(error => error ? reject(error) : resolvePromise());
    });
  }

  private async handle(req: IncomingMessage, res: ServerResponse) {
    try {
      addSecurityHeaders(res);
      const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

      if (url.pathname === "/api/runtime") {
        const info: RuntimeInfo = {
          product: "E-MO-Engine",
          rootLabel: basename(this.projectRoot),
          capabilities: this.capabilities,
        };
        return json(res, 200, info);
      }

      if (url.pathname === "/api/projects") return json(res, 200, await this.listProjects());

      if (url.pathname === "/api/milkdrop/library") {
        return json(res, 200, await this.getMilkdropLibrary(url.searchParams.get("refresh") === "1"));
      }

      const milkdropPresetMatch = url.pathname.match(/^\/api\/milkdrop\/presets\/([a-f0-9]{16})\/source$/);
      if (milkdropPresetMatch) {
        if (!this.milkdropPresetRoot) return json(res, 404, { error: "milkdrop_library_not_configured" });
        const library = await this.getMilkdropLibrary();
        const preset = findMilkdropPreset(library.presets, milkdropPresetMatch[1]);
        if (!preset) return json(res, 404, { error: "milkdrop_preset_not_found" });
        const fullPath = resolveInsideRoot(
          this.milkdropPresetRoot,
          preset.relativePath.split("/").join(sep),
        );
        const source = await readFile(fullPath, "utf8");
        return json(res, 200, { id: preset.id, source, modifiedMs: preset.modifiedMs });
      }

      const milkdropTextureMatch = url.pathname.match(/^\/api\/milkdrop\/textures\/([a-f0-9]{16})$/);
      if (milkdropTextureMatch) {
        if (!this.milkdropTextureRoot) return json(res, 404, { error: "milkdrop_texture_library_not_configured" });
        const library = await this.getMilkdropLibrary();
        const texture = findMilkdropTexture(library.textures, milkdropTextureMatch[1]);
        if (!texture) return json(res, 404, { error: "milkdrop_texture_not_found" });
        const fullPath = resolveInsideRoot(
          this.milkdropTextureRoot,
          texture.relativePath.split("/").join(sep),
        );
        return streamWholeFile(res, fullPath);
      }

      const projectMatch = url.pathname.match(/^\/api\/projects\/([a-f0-9]{16})$/);
      if (projectMatch) {
        const projects = await discoverProjects(this.projectRoot);
        const project = findProject(projects, projectMatch[1]);
        return project ? json(res, 200, project) : json(res, 404, { error: "project_not_found" });
      }

      const mediaMatch = url.pathname.match(/^\/media\/([a-f0-9]{16})\/([a-f0-9]{16})$/);
      if (mediaMatch) {
        const projects = await discoverProjects(this.projectRoot);
        const project = findProject(projects, mediaMatch[1]);
        if (!project) return json(res, 404, { error: "project_not_found" });
        const asset = findProjectAsset(project, mediaMatch[2]);
        if (!asset) return json(res, 404, { error: "asset_not_found" });
        const fullPath = resolveInsideRoot(this.projectRoot, asset.relativePath);
        return streamFile(req, res, fullPath, asset.fileName);
      }

      return serveWeb(res, this.webDist, url.pathname);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("ENOENT")) return json(res, 404, { error: "not_found" });
      console.error(error);
      return json(res, 500, { error: "internal_error" });
    }
  }
}

export function createEmoServer(options: EmoServerOptions) {
  return new EmoServer(options);
}

function json(res: ServerResponse, status: number, value: unknown) {
  const body = JSON.stringify(value);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Length", Buffer.byteLength(body));
  res.end(body);
}

async function serveWeb(res: ServerResponse, webDist: string, pathname: string) {
  const relativePath = decodeURIComponent(pathname).replace(/^\/+/, "") || "index.html";
  let candidate = resolveInsideRoot(webDist, relativePath);
  try {
    const info = await stat(candidate);
    if (info.isDirectory()) candidate = resolveInsideRoot(candidate, "index.html");
    await access(candidate);
  } catch {
    candidate = resolveInsideRoot(webDist, "index.html");
  }
  return streamWholeFile(res, candidate);
}

async function streamWholeFile(res: ServerResponse, fullPath: string) {
  const info = await stat(fullPath);
  res.statusCode = 200;
  res.setHeader("Content-Type", contentType(fullPath));
  res.setHeader("Content-Length", info.size);
  createReadStream(fullPath).pipe(res);
}

async function streamFile(req: IncomingMessage, res: ServerResponse, fullPath: string, fileName: string) {
  const info = await stat(fullPath);
  const range = parseByteRange(req.headers.range, info.size);
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Content-Type", contentType(fileName));

  if (range === null) {
    res.statusCode = 416;
    res.setHeader("Content-Range", `bytes */${info.size}`);
    res.end();
    return;
  }

  if (range === undefined) {
    res.statusCode = 200;
    res.setHeader("Content-Length", info.size);
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    createReadStream(fullPath).pipe(res);
    return;
  }

  res.statusCode = 206;
  res.setHeader("Content-Range", `bytes ${range.start}-${range.end}/${info.size}`);
  res.setHeader("Content-Length", range.end - range.start + 1);
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  createReadStream(fullPath, { start: range.start, end: range.end }).pipe(res);
}

function parseByteRange(value: string | undefined, size: number) {
  if (value === undefined) return undefined;
  if (!Number.isSafeInteger(size) || size <= 0) return null;

  const match = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
  if (!match || (!match[1] && !match[2])) return null;

  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return null;
    return {
      start: Math.max(0, size - suffixLength),
      end: size - 1,
    };
  }

  const start = Number(match[1]);
  if (!Number.isSafeInteger(start) || start < 0 || start >= size) return null;

  const requestedEnd = match[2] ? Number(match[2]) : size - 1;
  if (!Number.isSafeInteger(requestedEnd) || requestedEnd < start) return null;

  return {
    start,
    end: Math.min(requestedEnd, size - 1),
  };
}

function contentType(fileName: string) {
  switch (extname(fileName).toLowerCase()) {
    case ".html": return "text/html; charset=utf-8";
    case ".js": return "text/javascript; charset=utf-8";
    case ".css": return "text/css; charset=utf-8";
    case ".json": return "application/json; charset=utf-8";
    case ".lrc": return "text/plain; charset=utf-8";
    case ".svg": return "image/svg+xml";
    case ".png": return "image/png";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".webp": return "image/webp";
    case ".mp3": return "audio/mpeg";
    case ".m4a": return "audio/mp4";
    case ".aac": return "audio/aac";
    case ".mp4": return "video/mp4";
    case ".webm": return "video/webm";
    default: return "application/octet-stream";
  }
}

function addSecurityHeaders(res: ServerResponse) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
}
