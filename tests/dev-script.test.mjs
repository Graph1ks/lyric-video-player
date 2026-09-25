import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

test("dev orchestrator is valid Node syntax", () => {
  const result = execFileSync(process.execPath, ["--check", "scripts/dev.mjs"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(result.trim(), "");
});
