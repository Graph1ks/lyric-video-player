# E-MO Project Format

E-MO-Engine supports two project-discovery modes below the configured server/Desktop project root:

1. **Convention mode** — a directory with a supported audio file plus an `.lrc` file.
2. **Manifest mode** — a directory containing `emo.project.json`.

Manifest mode is the stable path for projects that use nested media, multiple auxiliary assets, presets, or reproducible player defaults.

## Schema v1

```json
{
  "schema": "emo.project/v1",
  "name": "Midnight Motion",
  "audio": "media/master.m4a",
  "lyrics": "lyrics/master.enhanced.lrc",
  "assets": [
    "assets/cover.webp",
    "assets/background.mp4"
  ],
  "presets": [
    "presets/chorus.json"
  ],
  "defaults": {
    "visualMode": "auto",
    "typographyPreset": "auto",
    "backgroundPreset": "auto",
    "intensity": 1.15,
    "quality": "cinema",
    "syncMs": 40
  }
}
```

### Required fields

- `schema`: exactly `"emo.project/v1"`.
- `audio`: project-relative MP3, M4A or AAC path.
- `lyrics`: project-relative LRC path.

### Optional fields

- `name`: display name shown in the project browser.
- `assets`: additional project-relative files that should become addressable media assets.
- `presets`: project-relative JSON preset files.
- `defaults.visualMode`: `auto`, `poster`, `neon` or `vortex`.
- `defaults.typographyPreset`: `auto`, `impact`, `cascade`, `wave`, `scatter`, `elastic`, `outline`, `tunnel` or `glitch`.
- `defaults.backgroundPreset`: `auto`, `cinematic`, `nebula`, `grid`, `starfield`, `rays`, `vortex`, `liquid`, `spectrum` or `minimal`.
- `defaults.intensity`: number from `0.2` to `1.8`.
- `defaults.quality`: `performance` or `cinema`.
- `defaults.syncMs`: integer-like millisecond trim from `-1500` to `1500`.

When a manifest-backed project is loaded in the React application, these defaults are applied before playback continues.

## Security rules

Manifest paths are data, not raw filesystem authority. E-MO rejects:

- absolute paths;
- Windows drive-prefixed paths;
- `.` and `..` path segments;
- null-byte paths;
- references that resolve outside the selected project directory.

The server still resolves every referenced file through the configured root-confinement layer before serving it.

## Directory example

```text
projects/
  midnight-motion/
    emo.project.json
    media/
      master.m4a
    lyrics/
      master.enhanced.lrc
    assets/
      cover.webp
      background.mp4
    presets/
      chorus.json
```

The manifest is optional for simple one-audio/one-LRC folders, but recommended once a project needs explicit reproducibility.
