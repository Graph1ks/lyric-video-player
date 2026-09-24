# Contributing to Graph1ks Lyric Video Player / E-MOE-CHAIN

This is a public **owner-controlled / solo-dev** project. Public source visibility is not an invitation for unsolicited code contributions or community governance.

## Feedback and outside contributions

Issues may be used for reproducible bug reports, suggestions, compatibility reports, documentation defects, and other product feedback when enabled.

Outside users should not open unsolicited pull requests. Code or documentation contributions are accepted only when the project owner explicitly invites or authorizes that contribution.

Issues and community feedback are input channels, not roadmap authority and not an automatic AI-agent work queue.

## Contributor License Agreement

Any explicitly authorized external code or documentation contribution requires acceptance of `CLA.md` before merge. The contributor must post this exact statement in the pull request discussion:

    I have read and agree to CLA.md for this contribution.

This preserves Graph1ks' ability to maintain the public source-available licensing model and offer separate commercial licenses for Graph1ks Material.

## License boundary

E-MOE-CHAIN is source-available, not OSI Open Source. Graph1ks Material is governed by `LICENSE`, `COMMERCIAL_LICENSE.md`, and `COPYRIGHT`. Third-party material keeps its own license and attribution requirements.

## Third-party material

Do not add copied code, fonts, media, lyrics, recordings, datasets, shaders, model outputs, or other third-party material without documenting source, canonical URL, version/snapshot, applicable license/terms, attribution, and redistribution/modification rights in `THIRD_PARTY_NOTICES.md` or the appropriate project documentation.

## Privacy and secrets

Never commit credentials, tokens, private keys, user media, raw private conversations, machine-specific personal paths, generated private data, or unneeded personal identifiers.

## Engineering rules

- Keep the audio clock authoritative for synced visuals.
- Preserve local-first file handling unless the owner explicitly changes the architecture.
- Preserve `Ctrl + Shift + H` as the full-HUD hide/show shortcut.
- Keep frame-critical rendering independent from any future editor UI framework.
- Do not introduce required paid software, APIs, subscriptions, telemetry, or hosted services.
- Review cost and licensing before adding dependencies or assets.
- Add tests/verification appropriate to the changed behavior.

## Validation

Before an authorized merge, run at minimum:

    npm run typecheck
    npm run build
    python scripts/repo_audit.py
