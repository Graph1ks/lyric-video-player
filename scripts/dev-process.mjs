export function resolveNpmInvocation(
  args,
  {
    env = process.env,
    execPath = process.execPath,
    platform = process.platform,
  } = {},
) {
  const npmExecPath = env.npm_execpath?.trim();

  if (npmExecPath) {
    return {
      command: execPath,
      args: [npmExecPath, ...args],
      strategy: "npm-cli",
    };
  }

  if (platform === "win32") {
    return {
      command: env.ComSpec?.trim() || "cmd.exe",
      args: ["/d", "/s", "/c", "npm", ...args],
      strategy: "cmd",
    };
  }

  return {
    command: "npm",
    args,
    strategy: "path",
  };
}
