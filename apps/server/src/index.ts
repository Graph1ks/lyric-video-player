import { createReadStream } from "node:fs";
import { access, stat } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { basename, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ProjectDescriptor, RuntimeCapabilities } from "@graph1ks/emo-app-contracts";
import { discoverProjects, findProject, findProjectAsset, resolveInsideRoot } from "@graph1ks/emo-platform-node";

const host = process.env.EMO_HOST || "127.0.0.1";
const port = Number.parseInt(process.env.EMO_PORT || "3040", 10);
const projectRoot = resolve(readArg("--root") || process.env.EMO_PROJECT_ROOT || resolve(process.cwd(), "projects"));
const webDist = resolve(process.env.EMO_WEB_DIST || resolve(process.cwd(), "dist"));

const capabilities: RuntimeCapabilities = {
  mode: "server",
  canChooseDirectory: false,
  canReadProjectRoot: true,
  canWriteProjectRoot: false,
};

const server = createServer(async (req, res) => {
  try {
    addSecurityHeaders(res);
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    if (url.pathname === "/api/runtime") {
      return json(res, 200, {
        product: "E-MO-Engine",
        rootLabel: basename(projectRoot),
        capabilities,
      });
    }

    if (url.pathname === "/api/projects") {
      const projects = await discoverProjects(projectRoot);
      return json(res, 200, { rootLabel: basename(projectRoot), projects });
    }

    const projectMatch = url.pathname.match(/^\/api\/projects\/([a-f0-9]{16})$/);
    if (projectMatch) {
      const projects = await discoverProjects(projectRoot);
      const project = findProject(projects, projectMatch[1]);
      return project ? json(res, 200, project) : json(res, 404, { error: "project_not_found" });
    }

    const mediaMatch = url.pathname.match(/^\/media\/([a-f0-9]{16})\/([a-f0-9]{16})$/);
    if (mediaMatch) {
      const projects = await discoverProjects(projectRoot);
      const project = findProject(projects, mediaMatch[1]);
      if (!project) return json(res, 404, { error: "project_not_found" });
      const asset = findProjectAsset(project, mediaMatch[2]);
      if (!asset) return json(res, 404, { error: "asset_not_found" });
      const fullPath = resolveInsideRoot(projectRoot, asset.relativePath);
      return streamFile(req, res, fullPath, asset.fileName);
    }

    return serveWeb(res, url.pathname);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("ENOENT")) return json(res, 404, { error: "not_found" });
    console.error(error);
    return json(res, 500, { error: "internal_error" });
  }
});

server.listen(port, host, () => {
  console.log(`E-MO-Engine server: http://${host}:${port}`);
  console.log(`Project root: ${projectRoot}`);
});

function readArg(name: string) {
  const direct = process.argv.find(arg => arg.startsWith(`${name}=`));
  if (direct) return direct.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function json(res: ServerResponse, status: number, value: unknown) {
  const body = JSON.stringify(value);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Length", Buffer.byteLength(body));
  res.end(body);
}

async function serveWeb(res: ServerResponse, pathname: string) {
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

  const requestedStart = match[1] ? Number(match[1]) : 0;
  const requestedEnd = match[2] ? Number(match[2]) : info.size - 1;
  const start = Math.max(0, Math.min(requestedStart, info.size - 1));
  const end = Math.max(start, Math.min(requestedEnd, info.size - 1));

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
