import { spawn } from "node:child_process";
import { resolveNpmInvocation } from "./dev-process.mjs";

const host = process.env.EMO_HOST || "127.0.0.1";
const port = Number.parseInt(process.env.EMO_PORT || "3040", 10);
const runtimeUrl = `http://${host}:${port}/api/runtime`;
const children = new Set();

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runtimeReady() {
  try {
    const response = await fetch(runtimeUrl, {
      signal: AbortSignal.timeout(450),
      cache: "no-store",
    });
    if (!response.ok) return false;
    const payload = await response.json();
    return payload?.product === "E-MO-Engine";
  } catch {
    return false;
  }
}

function run(command, args, label) {
  const child = spawn(command, args, {
    stdio: "inherit",
    env: process.env,
    shell: false,
  });
  children.add(child);
  child.once("exit", () => children.delete(child));
  child.once("error", error => {
    console.error(`[dev:${label}] failed to start`, error);
  });
  return child;
}

async function waitForRuntime(server, timeoutMs = 10000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await runtimeReady()) return;

    if (server && server.exitCode !== null) {
      throw new Error(`E-MO runtime exited before becoming ready (exit ${server.exitCode}).`);
    }
    await delay(120);
  }
  throw new Error(`Timed out waiting for E-MO runtime at ${runtimeUrl}`);
}

function stopAll(exitCode = 0) {
  for (const child of children) {
    if (child.exitCode === null && !child.killed) child.kill();
  }
  process.exitCode = exitCode;
}

process.once("SIGINT", () => stopAll(0));
process.once("SIGTERM", () => stopAll(0));

let server = null;
if (await runtimeReady()) {
  console.log(`[dev] Reusing running E-MO runtime at ${runtimeUrl}`);
} else {
  console.log(`[dev] Starting E-MO runtime at ${runtimeUrl}`);
  server = run(process.execPath, ["apps/server/dist/index.js"], "server");
  await waitForRuntime(server);
  console.log("[dev] Runtime ready; starting Vite.");
}

const npm = resolveNpmInvocation([
  "--workspace",
  "@graph1ks/emo-web",
  "run",
  "dev",
]);
const web = run(npm.command, npm.args, "web");

web.once("exit", code => {
  if (server && server.exitCode === null) server.kill();
  process.exitCode = code ?? 0;
});

if (server) {
  server.once("exit", code => {
    if (web.exitCode === null && code !== 0) {
      console.error(`[dev] Runtime exited unexpectedly (exit ${code}). Stopping Vite.`);
      web.kill();
      process.exitCode = code ?? 1;
    }
  });
}
