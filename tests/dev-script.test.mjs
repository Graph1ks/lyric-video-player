import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import test from "node:test";

import { resolveNpmInvocation } from "../scripts/dev-process.mjs";

test("dev orchestrator is valid Node syntax", () => {
  const result = execFileSync(process.execPath, ["--check", "scripts/dev.mjs"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(result.trim(), "");
});

test("Windows npm invocation never spawns npm.cmd directly", () => {
  const invocation = resolveNpmInvocation(
    ["--version"],
    {
      platform: "win32",
      execPath: "C:\\Program Files\\nodejs\\node.exe",
      env: {
        npm_execpath: "C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js",
        ComSpec: "C:\\Windows\\System32\\cmd.exe",
      },
    },
  );

  assert.equal(invocation.command, "C:\\Program Files\\nodejs\\node.exe");
  assert.deepEqual(invocation.args, [
    "C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js",
    "--version",
  ]);
  assert.equal(invocation.strategy, "npm-cli");
});

test("Windows fallback invokes npm through cmd.exe", () => {
  const invocation = resolveNpmInvocation(
    ["--version"],
    {
      platform: "win32",
      execPath: "C:\\Program Files\\nodejs\\node.exe",
      env: { ComSpec: "C:\\Windows\\System32\\cmd.exe" },
    },
  );

  assert.equal(invocation.command, "C:\\Windows\\System32\\cmd.exe");
  assert.deepEqual(invocation.args, ["/d", "/s", "/c", "npm", "--version"]);
  assert.equal(invocation.strategy, "cmd");
});

test("resolved npm invocation can launch the installed npm CLI", () => {
  const invocation = resolveNpmInvocation(["--version"]);
  const result = spawnSync(invocation.command, invocation.args, {
    cwd: process.cwd(),
    encoding: "utf8",
    env: process.env,
    shell: false,
  });

  assert.equal(
    result.status,
    0,
    [
      result.error?.stack,
      result.stderr,
      `strategy=${invocation.strategy}`,
      `command=${invocation.command}`,
    ].filter(Boolean).join("\n"),
  );
  assert.match(result.stdout.trim(), /^\d+\.\d+\.\d+/);
});
