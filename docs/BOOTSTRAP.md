# Repository Bootstrap Record

This repository was created from the Graph1ks repository template and has now been initialized for Graph1ks Lyric Video Player / E-MOE-CHAIN.

## Project decisions

- Repository visibility: public.
- Collaboration model: owner-controlled.
- External pull-request creation: collaborators only.
- Issues: enabled for bug reports/suggestions.
- Projects: disabled.
- Discussions: disabled.
- Wiki: disabled.
- GitHub Pages: disabled.
- Forking: allowed by the public-repository host setting.
- Required production cost: zero.
- Source model: source-available, not OSI Open Source.
- Public Graph1ks Material terms: PolyForm Noncommercial 1.0.0 plus the Graph1ks monetization restriction defined in `LICENSE`.
- Commercial/monetized rights: separate written commercial license.
- Authorized outside contributions: CLA required.

## Authenticated settings verification

Verified on 2026-09-25 through authenticated GitHub repository metadata:

- public visibility matches `PROJECT.md`;
- pull-request creation policy is collaborators-only;
- Issues are enabled;
- Projects, Discussions, Wiki, and Pages are disabled;
- repository admin/push access is available to Graph1ks;
- `main` repository rules require changes through a pull request and require a status check named `validate`.

The public repository exposes normal GitHub forking. No paid repository feature is required by the project.

## Security-reporting gate

The repository security documentation now instructs reporters to use GitHub private vulnerability reporting/security advisories when available and otherwise establish a private channel through the public Graph1ks profile contact path. Before a production release, verify the host-side private-vulnerability-reporting setting explicitly.

## Engineering bootstrap

The initial application stack is TypeScript + Vite + PixiJS. Web Audio and browser media APIs are used directly. The render engine is local-first and does not require a paid hosted service.

The repository is considered initialized for alpha development. Release readiness remains governed by `PROJECT.md`, `STATUS.md`, `docs/HANDOVER.md`, the `validate` CI job, and the release checklist.
