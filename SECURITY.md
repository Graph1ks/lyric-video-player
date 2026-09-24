# Security Policy

## Scope and posture

Graph1ks Lyric Video Player / E-MOE-CHAIN is currently a local-first browser application. The core runtime does not require accounts, telemetry, cloud uploads, hosted processing, or application secrets.

Local audio and LRC files are still untrusted input. File content must be parsed as data and must never be executed.

## Supported version

The current `main` branch and the latest published alpha are the supported development line. Older unreleased snapshots are not maintained as separate security branches.

## Reporting a vulnerability

Do not publish exploitable vulnerability details in a public Issue.

Use GitHub's private vulnerability-reporting/security-advisory interface for this repository when it is available. If the interface is not available, contact Graph1ks through a contact channel publicly listed on the Graph1ks GitHub profile and initially provide only enough information to establish a private reporting path.

Non-sensitive bugs that do not expose users, files, credentials, or execution boundaries may be reported through normal Issues.

## Project security rules

Never commit or intentionally log:

- API keys, access tokens, passwords, cookies, private keys, or credentials;
- user-loaded audio, lyric files, or other private media;
- private local paths or unnecessary personal identifiers;
- raw private conversations or unrelated sensitive content.

The project should:

- keep imported media local unless the owner explicitly changes the architecture;
- avoid hidden network requests, tracking, telemetry, or uploads;
- validate file types and parser boundaries;
- keep dependencies minimal and reviewed for maintenance, cost, and licensing;
- avoid executing user-supplied lyric/metadata content as HTML or code;
- sanitize future exported filenames/paths where filesystem APIs are introduced.

If a secret is ever committed, assume exposure and revoke/rotate it; deleting only the latest copy is insufficient.
