# Security Policy

## Scope and posture

E-MO-Engine is designed for local files, self-hosted project roots and a standalone Electron application. The core product does not require accounts, telemetry, third-party uploads or application secrets.

Audio, LRC, manifests and project assets are untrusted input and must always be treated as data.

## Server boundary

The hosted/runtime server may read only below the explicitly configured E-MO project root.

Security requirements:

- reject path traversal and absolute-path escape;
- address normal media through discovered project/asset IDs rather than raw client-supplied filesystem paths;
- bind to loopback by default;
- do not silently expose write APIs;
- keep security headers enabled;
- do not introduce remote uploads or public network binding without a separate threat-model decision.

## Electron boundary

The desktop renderer is unprivileged:

- `contextIsolation: true`;
- `nodeIntegration: false`;
- renderer sandbox enabled;
- filesystem/native operations are not directly available to page code;
- privileged actions use a narrow typed preload/IPC surface;
- the normal media/project path is the shared loopback E-MO server.

Do not broaden the preload bridge with arbitrary filesystem or shell execution APIs.

## Reporting a vulnerability

Do not publish exploitable vulnerability details in a public Issue.

Use GitHub private vulnerability reporting/security advisories when available. If that interface is unavailable, establish a private reporting channel through contact information publicly provided on the Graph1ks GitHub profile before sharing exploit details.

## Repository hygiene

Never commit:

- API keys, access tokens, passwords, cookies, credentials or private keys;
- user-loaded audio/LRC/private assets;
- private local filesystem paths or unnecessary personal identifiers;
- raw private conversations;
- packaged binaries unless an explicit release workflow calls for them.

If a secret is ever committed, assume exposure and rotate/revoke it; removing only the newest copy is insufficient.

## Dependency and packaging policy

Every new dependency, binary and asset requires cost/license/security review. Electron/Chromium and installer dependencies must be updated deliberately rather than opportunistically. FFmpeg and codec/export binaries require a dedicated redistribution/license review before adoption.
