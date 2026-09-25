# Visual Director Workspace

**Status:** active candidate  
**Started:** 2026-09-25  
**Scope:** effect discoverability, live visual control, second-screen operation, and future cue/playlist planning.

## Problem

The original Visual Director exposed most engine capabilities, but its controls were visually homogeneous:

- effect names were small text buttons with little recognition support;
- typography, composition, motion, world and color controls competed in one long vertical panel;
- AUTO selection did not clearly distinguish requested state from the actually resolved live state;
- the player viewport and the control surface shared the same screen;
- there was no foundation for pre-planning a visual performance.

The redesign treats the Director as a creative-tool workspace rather than a settings panel.

## Interaction hierarchy

The Director is grouped into six task-oriented sections:

1. **Scene** — master visual family / AUTO direction.
2. **Type** — typography character + word composition.
3. **Motion** — composition choreography.
4. **World** — art-direction/background family.
5. **Color** — mood, canvas polarity, OKLCH harmony and rainbow drift.
6. **System** — audio telemetry, global intensity, lyric sync and render quality.

The top of the Director always exposes the resolved live stack:

```text
SCENE / TYPE / LAYOUT / MOTION / WORLD
```

This is deliberately separate from the requested controls. Example:

```text
Typography request: AUTO
Resolved live typography: ELASTIC
```

## Effect recognition

Relevant effect choices are represented as cards with:

- semantic miniature preview;
- plain-language name;
- concise description of the visual behavior;
- selected state;
- optional LIVE marker when AUTO currently resolves to that effect.

The previews are lightweight CSS diagrams, not captured screenshots. They are intended as recognition aids and remain cheap, deterministic and license-free.

The miniature grammar is category-specific:

- typography previews show type deformation/outline/depth signatures;
- layouts show word/line architecture;
- motion previews show direction/focus/portal relationships;
- worlds show graphic/environmental signatures;
- color previews show palette polarity or hue relationships.

## Main-player Director

The docked Director uses the same shared `VisualDirector` React component as the detached window.

It remains part of the HUD and preserves:

- all previous visual controls;
- keyboard cycling shortcuts;
- intensity;
- lyric sync;
- renderer quality;
- audio-band telemetry.

The dock is wider than the legacy panel because recognizability is prioritized over fitting every control into a tiny matrix. Category navigation prevents the increased card size from becoming one long scroll wall.

## Detached Director window

### Browser

The main player can open `?director=1` with `window.open()`.

### Electron

The desktop preload exposes:

```ts
openDirectorWindow(): Promise<boolean>
```

Electron owns a reusable dedicated `BrowserWindow` for the Director. Re-opening focuses/restores the existing window instead of creating duplicates.

The Director window does **not** create another renderer or audio engine.

## Cross-window state

Both windows use the same Zustand state shape but run in separate JavaScript contexts. A same-origin `BroadcastChannel` synchronizes Director-relevant state.

Shared state includes:

- requested visual controls;
- resolved live visual state;
- active palette;
- track/playback telemetry;
- audio-band telemetry;
- Director cue drafts.

HUD visibility and project-drawer state are intentionally not part of the Director synchronization contract.

The synchronization loop suppresses rebroadcast of remotely applied state to avoid message echo.

## LIVE workspace

LIVE is the full second-screen control surface.

Changes made in either window propagate to the other and the main renderer reacts through its existing Zustand-driven bindings.

The detached Director is therefore a real controller, not a visual copy of the main panel.

## PLAN workspace — foundation

The first PLAN slice is intentionally a **session draft**, not a new persistence format.

A cue stores:

- timestamp;
- label;
- current track label;
- complete current Director control snapshot.

The user can:

- capture a look at the current or manually entered time;
- see cues on a track rail;
- sort them chronologically;
- APPLY a cue live for auditioning;
- delete cues;
- clear the current draft with explicit two-step confirmation.

### Current non-goals

This slice does **not** yet:

- execute planned cues automatically during playback;
- persist cue plans into `emo.project/v1`;
- attach plans to a playlist;
- introduce a parallel scene-file schema.

Those features should land with the planned scene/project serialization work. A future playlist can then map each song to its own serialized visual plan without migration from a competing temporary format.

## Future planning model

The intended direction is:

```text
PLAYLIST
├── SONG A
│   └── DIRECTOR PLAN
│       ├── section / cue directives
│       ├── visual stacks
│       └── transitions
├── SONG B
│   └── DIRECTOR PLAN
└── SONG C
    └── DIRECTOR PLAN
```

The same detached Director should become the authoring surface for both live override and pre-programmed song direction.

## UX rules

- recognition beats button density;
- effect names must never be the only explanation;
- requested AUTO and resolved LIVE state must be distinguishable;
- manual controls stay directly available; do not bury engine capability in nested menus;
- second-screen operation must not require duplicating renderer/audio ownership;
- popout state and main-window state must remain coherent;
- planning UI must not imply persistence until persistence exists;
- future playlist planning must reuse project/scene contracts rather than create a separate proprietary cue format.
