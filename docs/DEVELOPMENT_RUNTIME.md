# Development Runtime

**Status:** v0.8 baseline  
**Last updated:** 2026-09-25

## Why this exists

The React/Vite app calls `/api/runtime`, `/api/projects` and `/media/*`. In development, Vite proxies those routes to the E-MO Node runtime on `127.0.0.1:3040`.

Starting only Vite therefore produces messages such as:

```text
[vite] http proxy error: /api/runtime
Error: connect ECONNREFUSED 127.0.0.1:3040
```

That error means the web dev server is alive but the runtime behind the proxy is not.

## Normal development command

From the repository root:

```bash
npm run dev
```

The root command now:

1. builds the shared packages/server;
2. checks whether a valid E-MO runtime is already listening on the configured runtime address;
3. starts the Node runtime when needed;
4. waits for `/api/runtime` to answer successfully;
5. only then starts Vite.

This prevents the normal startup race that caused transient `ECONNREFUSED` proxy errors.

The default runtime address is:

```text
http://127.0.0.1:3040
```

The default browser dev address remains:

```text
http://127.0.0.1:5173
```

## Project root

When no explicit project root is configured, server mode uses:

```text
<repo>/projects
```

The default directory is created automatically if it does not exist.

To use another root:

```powershell
$env:EMO_PROJECT_ROOT = "D:\Music\E-MO"
npm run dev
```

or set `EMO_PROJECT_ROOT` in the shell/environment before launching.

## Advanced split-process commands

Web only:

```bash
npm run dev:web
```

This intentionally expects an E-MO runtime to already exist on port 3040. If it does not, Vite proxy errors are expected.

Runtime only, after package build:

```bash
npm run dev:server
```

## Runtime address overrides

Supported environment variables:

- `EMO_HOST` — default `127.0.0.1`;
- `EMO_PORT` — default `3040`;
- `EMO_PROJECT_ROOT` — project directory;
- `EMO_WEB_DIST` — built web distribution used by hosted runtime.

If `EMO_PORT` or `EMO_HOST` is changed for development, Vite proxy configuration must target the same address. The standard local workflow intentionally keeps both at the default loopback address.

## Shutdown behavior

The development orchestrator owns the runtime process it starts and stops it when the Vite process exits. If an already-running valid E-MO runtime is detected, it is reused and not owned/terminated by the orchestrator.
