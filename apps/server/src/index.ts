import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { createEmoServer } from "./server.js";

const host = process.env.EMO_HOST || "127.0.0.1";
const port = Number.parseInt(process.env.EMO_PORT || "3040", 10);
const configuredRoot = readArg("--root") || process.env.EMO_PROJECT_ROOT;
const projectRoot = resolve(configuredRoot || resolve(process.cwd(), "projects"));
const webDist = resolve(process.env.EMO_WEB_DIST || resolve(process.cwd(), "apps/web/dist"));
const milkdropPresetRoot = process.env.EMO_MILKDROP_PRESET_ROOT
  ? resolve(process.env.EMO_MILKDROP_PRESET_ROOT)
  : undefined;
const milkdropTextureRoot = process.env.EMO_MILKDROP_TEXTURE_ROOT
  ? resolve(process.env.EMO_MILKDROP_TEXTURE_ROOT)
  : undefined;

if (!configuredRoot) await mkdir(projectRoot, { recursive: true });

const server = createEmoServer({
  projectRoot,
  webDist,
  mode: "server",
  milkdropPresetRoot,
  milkdropTextureRoot,
});
const listening = await server.listen(port, host);
console.log(`E-MO-Engine server: ${listening.url}`);
console.log(`Project root: ${projectRoot}`);

function readArg(name: string) {
  const direct = process.argv.find(arg => arg.startsWith(`${name}=`));
  if (direct) return direct.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}
