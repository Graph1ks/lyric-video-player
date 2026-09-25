import { createReadStream } from "node:fs";
import { access, stat } from "node:fs/promises";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { basename, extname, resolve } from "node:path";
import type {
  ProjectListResponse,
  RuntimeCapabilities,
  RuntimeInfo,
} from "@graph1ks/emo-app-contracts";
import {
  discoverProjects,
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
}

export class EmoServer {
  private readonly server: Server;
  private projectRoot: string;
  private readonly webDist: string;
  private readonly capabilities: RuntimeCapabilities;

  constructor(options: EmoServerOptions) {
    this.projectRoot = resolve(options.projectRoot);
    this.webDist = resolve(options.webDist);
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
  const range = req.headers.range;
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Content-Type", contentType(fileName));

  if (!range) {
    res.statusCode = 200;
    res.setHeader("Content-Length", info.size);
    createReadStream(fullPath).pipe(res);
    return;
  }

  const match = range.match(/^bytes=(\d*)-(\d*)$/);
  if (!match) {
    res.statusCode = 416;
    res.setHeader("Content-Range", `bytes */${info.size}`);
    res.end();
    return;
  }

  let start: number;
  let end: number;
  if (!match[1] && match[2]) {
    const suffix = Math.max(1, Number(match[2]));
    start = Math.max(0, info.size - suffix);
    end = info.size - 1;
  } else {
    start = Math.max(0, Math.min(Number(match[1] || 0), info.size - 1));
    end = Math.max(start, Math.min(Number(match[2] || info.size - 1), info.size - 1));
  }

  res.statusCode = 206;
  res.setHeader("Content-Range", `bytes ${start}-${end}/${info.size}`);
  res.setHeader("Content-Length", end - start + 1);
  createReadStream(fullPath, { start, end }).pipe(res);
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
