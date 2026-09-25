import { once } from "node:events";
import { spawn } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const host = process.env.EMO_HOST || "127.0.0.1";
const port = parsePort(process.env.EMO_PORT || "3040");
const backendUrl = process.env.EMO_DEV_SERVER_URL || `http://${host}:${port}`;
const healthUrl = new URL("/api/runtime", backendUrl).href;
const children = new Set();
let shuttingDown = false;

let server;
if (await runtimeReady(healthUrl)) {
  console.log(`[dev] Reusing E-MO runtime at ${backendUrl}`);
} else {
  await run(npmCommand, ["run", "build:packages"]);
  server = spawn(process.execPath, ["apps/server/dist/index.js"], {
    stdio: "inherit",
    env: { ...process.env, EMO_HOST: host, EMO_PORT: String(port) },
  });
  children.add(server);
  await waitForRuntime(server, healthUrl, 15_000);
  console.log(`[dev] E-MO runtime ready at ${backendUrl}`);
}

const web = spawn(npmCommand, ["--workspace", "@graph1ks/emo-web", "run", "dev"], {
  stdio: "inherit",
  env: { ...process.env, EMO_PORT: String(port), EMO_DEV_SERVER_URL: backendUrl },
});
children.add(web);

for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => void shutdown(signal));

const exits = [once(web, "exit").then(([code, signal]) => ({ source: "web", code, signal }))];
if (server) exits.push(once(server, "exit").then(([code, signal]) => ({ source: "server", code, signal })));
const result = await Promise.race(exits);
if (!shuttingDown) {
  console.error(`[dev] ${result.source} exited${result.signal ? ` from ${result.signal}` : ` with code ${result.code ?? 0}`}`);
  await shutdown();
  process.exitCode = typeof result.code === "number" ? result.code : result.signal ? 1 : 0;
}

async function run(command, args) {
  const child = spawn(command, args, { stdio: "inherit", env: process.env });
  const [code, signal] = await once(child, "exit");
  if (code !== 0) throw new Error(`${command} ${args.join(" ")} failed${signal ? ` from ${signal}` : ` with code ${code}`}`);
}
async function waitForRuntime(child, url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`E-MO runtime exited before becoming ready (code ${child.exitCode})`);
    if (await runtimeReady(url)) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for E-MO runtime readiness at ${url}`);
}
async function runtimeReady(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(500) });
    return response.ok;
  } catch {
    return false;
  }
}
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) if (child.exitCode === null && !child.killed) child.kill(signal || "SIGTERM");
  await Promise.allSettled([...children].map(child => child.exitCode === null ? once(child, "exit") : Promise.resolve()));
}
function parsePort(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) throw new Error(`Invalid EMO_PORT: ${value}`);
  return parsed;
}
