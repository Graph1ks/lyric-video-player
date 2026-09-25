# Cinematic Typography Direction

**Status:** active design/implementation contract  
**Started:** 2026-09-25  
**Scope:** sequence direction, typography continuity, spatial lyric grammars, camera intent, and high-density readability.

## Problem statement

E-MO already has useful typography presets, word layouts, composition motion, background worlds, camera response and palette direction. The remaining weakness is not a shortage of effects. It is a shortage of **temporal direction across effects**.

A line-by-line renderer can produce good individual moments while still feeling like disconnected demonstrations because:

- each lyric line is treated too much like a fresh scene;
- AUTO typography/layout/motion choices can vary independently;
- previous words disappear instead of becoming spatial history;
- camera impulses are local reactions rather than parts of a longer visual trajectory;
- motion complexity does not yet adapt enough to the amount of reading time available.

The target is therefore a **cinematic sequence system** above individual typography effects.

## Research basis

### Kinetic typography is temporal storytelling, not moving subtitles

Lee, Forlizzi and Hudson describe kinetic typography as a way to bring properties of film into text: tone, character, affect and directed viewer attention. Their engine work also treats expressive text as a time-based medium rather than a collection of unrelated transitions.

Source:

- Lee, J. C., Forlizzi, J., Hudson, S. E. — *The Kinetic Typography Engine: An Extensible System for Animating Expressive Text*, UIST 2002:  
  https://www.cs.cmu.edu/~johnny/academic/KT_Engine_UIST2002.pdf

**E-MO consequence:** lyric motion must be planned over a phrase/section, not selected independently for every line.

The same CMU paper is also architecturally relevant: it organizes text objects into nested sequence trees with hierarchical **spatial and temporal** coordinate systems. E-MO should preserve its seek-safe functional model, but the persistent multi-cue lyric graph follows the same useful abstraction: words belong to sequences, and sequences can move as coherent units rather than being recreated as unrelated screens.

The paper additionally notes that naive geometric scaling and typographic scaling are not equivalent; geometric scaling can produce poor letter spacing. That is a direct constraint for Elastic Tether and future stretch/squeeze work: geometric anisotropic scaling is acceptable as an initial bounded effect, but large deformation should eventually be typography-aware or mesh-based rather than relying on extreme container scaling.

### Motion semantics depend on the relationship between text and movement

Research on emotive kinetic typography finds that motion patterns and word groups interact: a motion pattern does not communicate one universal emotion independently of the text it carries.

Source:

- Minakuchi et al. — *Preliminary Study on Influence of Motion Patterns by Kinetic Typography on Expressed Emotion*, Human Interface Society, 2012:  
  https://doi.org/10.11184/his.14.1_9

**E-MO consequence:** do not maximize variety by random effect rotation. Curated compatible motion/layout/type families are preferable to arbitrary combinations.

### Dynamic reading has a real temporal budget

Research on dynamically presented text found a preferred presentation-rate region and degraded reading experience outside it. The exact measured optimum in that study is specific to its experimental setup and must **not** be treated as a universal lyric-video threshold.

Source:

- Yamabe & Watanabe — *Reading Traits for Dynamically Presented Texts*, Frontiers in Psychology, 2017:  
  https://pubmed.ncbi.nlm.nih.gov/28861021/

Professional timed-text guidance supplies a second, practical reference point. Netflix currently specifies 17 characters/second for adult German subtitles and allows up to 20 characters/second in the German SDH section. These are subtitle-delivery rules, not artistic lyric-video laws.

Sources:

- https://partnerhelp.netflixstudios.com/hc/en-us/articles/217351587-German-Timed-Text-Style-Guide
- https://partnerhelp.netflixstudios.com/hc/en-us/articles/219375728-Timed-Text-Style-Guide-Subtitle-Templates

**E-MO consequence:** cue density is a pressure signal. As available reading time falls, the engine reduces travel, rotation, overshoot, visual clutter and large scale excursions while preserving local motion and emphasis.

### Cinematic continuity is gaze continuity and motion continuity

Continuity editing uses techniques such as match-on-action and eye trace to preserve perceptual flow between shots. Eye trace explicitly asks where the viewer was looking before a cut and where the next shot wants that gaze to land.

Sources:

- Adobe — *What is continuity editing in film*:  
  https://www.adobe.com/creativecloud/video/hub/ideas/what-is-continuity-editing-in-film.html
- Langkjær et al. — *Matching on action: Effects of action speed and viewpoint on perceived continuity across match-action film edits*:  
  https://researchprofiles.ku.dk/en/publications/matching-on-action-effects-of-action-speed-and-viewpoint-on-perce/

**E-MO consequence:** every directed transition should be able to carry a focus anchor, movement vector, screen direction and graphic relationship into the next lyric moment.

### Editing rhythm is phrasing, tension and release

Karen Pearlman's work on editing rhythm treats the editor as a choreographer of time, energy and movement. The current edition explicitly organizes the subject around timing, pacing, trajectory phrasing, tension/release and synchronization.

Source:

- Pearlman, K. — *Cutting Rhythms: Creative Film Editing*, 3rd ed., Routledge, 2025:  
  https://www.routledge.com/Cutting-Rhythms-Creative-Film-Editing/Pearlman/p/book/9781041024088

**E-MO consequence:** do not equate music synchronization with cutting on every beat. A phrase needs holds, builds, accents and releases.

### Letterform deformation can be a motion channel

Variable fonts expose continuous design axes and can be animated over time. This is useful evidence for future weight/width/morph animation, but it does not require E-MO to adopt a new font stack immediately.

Sources:

- Google Design — *Variable Fonts Are Here to Stay*:  
  https://design.google/library/variable-fonts-are-here-to-stay
- IBM Design Language — *Classic principles*:  
  https://www.ibm.com/design/language/animation/classic-principles/

**E-MO consequence:** true stretch/squeeze and variable-axis animation belong in the typography primitive layer after the sequence contracts are stable. Elastic motion should use anticipation, directional stretch, overshoot and follow-through while staging keeps competing motion subordinate.

## Cinematic model

The sequence director sits above the existing render layers:

```text
SONG / SECTION
└── CINEMATIC SEQUENCE DIRECTOR
    ├── phrase segmentation
    ├── visual family / world
    ├── shot role + shot scale
    ├── focus / eye-trace target
    ├── movement vector / trajectory
    ├── spatial typography grammar
    ├── typography-layout-motion bundle
    ├── camera intent
    ├── readability pressure / motion budget
    └── transition continuity
         │
         ├── typography composition
         ├── composition motion
         ├── glyph motion/deformation
         ├── visual world
         ├── palette
         ├── camera
         └── post-FX
```

A sequence is not required to change visual family at every phrase. A deliberate hold can be stronger than a change.

## Phrase and shot grammar

Initial phrase roles:

- **Establish** — reveal the spatial rule and primary visual hierarchy.
- **Develop** — preserve that rule while advancing words through it.
- **Accent** — allow a controlled close-up, takeover, graphic break or strong rhythmic hit.
- **Release** — resolve or hand the established trajectory into the next phrase.

Future shot-scale vocabulary:

- **Field / Wide** — lyric architecture or multiple historical words visible.
- **Group / Medium** — current phrase dominates while history remains contextual.
- **Hero / Close** — one word takes most of the frame.
- **Portal / Extreme** — text becomes the transition surface/camera tunnel.

AUTO should create shot-size contrast over time rather than repeatedly selecting the same distance.

## Coherent AUTO bundles — first implementation

Typography preset, layout and composition motion no longer need to behave like three independent random axes in AUTO. The active candidate introduces curated phrase-stable bundles.

Examples:

- Impact + Editorial + Takeover
- Elastic + Directional Stage + Handoff
- Wave + Split Stage + Conveyor
- Outline + Editorial + Camera Handoff
- Tunnel + Center Stack + Portal

Manual controls remain independent. The bundle constraint applies to AUTO direction, not to authored experimentation.

## Readability pressure and motion budget — first implementation

The active candidate derives a pure profile from:

- line duration;
- words per second;
- characters per second;
- minimum individual word duration.

The result is one of:

| Tier | Intent | Motion behavior |
|---|---|---|
| Expressive | generous dwell time | full travel, rotation, deformation and background echoes |
| Balanced | normal lyric flow | modest reduction of competing motion |
| Rapid | high reading demand | shorter travel, lower rotation/overshoot, smaller scale excursions, cleaner history |
| Burst | very fast rap/staccato | strong local movement and emphasis, minimal long-distance motion, high visibility floor |

**Hard product rule:** Burst mode must never become a static subtitle fallback. It should trade large movement for fast local movement: pulse, short directional snap, weight/fill change, limited stretch, small camera follow or tightly bounded smear.

The current numerical thresholds are engineering heuristics and require real-track calibration. They are not presented as human-reading constants.

## Persistent multi-cue typography — next architecture slice

The current renderer rebuilds the lyric word scene on line changes. That makes true cross-line spatial choreography impossible.

The next foundation is a seek-safe **multi-cue typography scene graph**:

1. engine-core derives a visible lyric window from absolute lyric time;
2. every visible cue/word gets a stable logical ID;
3. each word receives a role: active, recent, history or retiring;
4. a pure spatial grammar maps those words into a scene;
5. Pixi caches/diffs display objects for performance, but cache state is never authoritative;
6. seek reconstructs the same scene directly from time + project data.

History must be bounded by time, visibility and quality mode. An apparent whole-song spiral does not require every word of a four-minute song to remain as a live Pixi Text node.

## Spatial sequence grammars

These are **multi-cue scene grammars**, not one-line layout presets.

### Spiral Depth

Reference archetype: successive lyrics form a continuous spiral/tunnel. The newest word is large and near the viewer; older words move deeper along the same path, shrink and eventually retire.

Variants:

- smooth spiral;
- rounded-rectangle spiral;
- concentric tunnel;
- alternating inward/outward spiral.

Continuity rule: new words inherit the previous tangent/direction rather than teleporting to unrelated entry vectors.

### Shape Build / Calligram

**Implementation status:** Frame/Square + Ring/Circle active candidate.

Words progressively construct an explicit silhouette or perimeter. The current implementation assigns a stable ordinal to every word inside the directed phrase so already-built parts of the calligram do not reflow when new words arrive.

Implemented primitives:

- rectangle / frame;
- circle / ring.

Planned extensions:

- arc;
- cross;
- stepped block.

The shape is a path/occupancy constraint. Collision/readability handling must preserve the silhouette rather than collapsing the complete geometry toward center.

### Hero / Echo Field

One current word or short phrase dominates foreground scale while earlier/repeated words form a lower-contrast structure behind it.

Possible history treatments:

- outline wall;
- stacked repetition;
- offset print echoes;
- architectural rows;
- perspective depth stack.

The background words remain composition, not noise.

### Ribbon / Path

**Implementation status:** continuous S-curve active candidate.

Words enter onto a continuous curve and remain attached to it while focus advances. The first implementation uses active-word progress to move the complete recent/history trail continuously; at a word boundary the previous hero reaches its next rank on the same curve instead of jumping.

Current primitive:

- S-curve ribbon.

Planned extensions:

- snake;
- wave families;
- diagonal / corner-to-corner trajectories.

### Elastic Tether

**Implementation status:** bounded anisotropic word-level tether active candidate.

A word enters from a source direction and appears to be pulled into its target.

Current implementation:

1. word-level travel follows the composition entry/source vector;
2. anisotropic stretch/squash is projected onto X/Y from that travel direction;
3. target arrival uses bounded overshoot + damped settle;
4. existing glyph elastic becomes secondary follow-through;
5. readability pressure reduces distance/deformation for Rapid/Burst cues without eliminating motion.

Future stages:

- optional RenderTexture/mesh deformation for genuine non-rigid “gum” bending after visual acceptance;
- later variable-font width/weight axes where a compatible font pipeline exists.

Do not fake every elastic case with extreme scale alone; severe anisotropic scaling damages letterform readability.

## Continuity contract

Each sequence transition should eventually expose:

```text
focusFrom / focusTo
travelVector
screenDirection
shotScaleFrom / shotScaleTo
graphicAnchor
cameraIntent
historyPolicy
transitionEnergy
```

Continuity strategies:

- **eye-trace handoff** — next important word appears near the previous focal region;
- **match-on-action** — outgoing movement continues into incoming movement;
- **graphic match** — a frame, circle, bar or word edge becomes the next composition;
- **camera handoff** — the camera moves to a new target while the scene persists;
- **intentional discontinuity** — a hard break is allowed, but it must be an authored accent rather than accidental AUTO randomness.

## Camera rule

**Implementation status:** phrase/shot/focus base-plan active candidate.

Camera motion should increasingly come from the sequence plan. The active candidate derives normalized pan, shot scale, rotation and impulse/micro-motion budgets from phrase progress, shot role, active typography focus, persistent grammar and readability pressure.

Audio transients may add bounded micro-response, but they should not constantly override:

- focal target;
- screen direction;
- shot scale;
- planned trajectory.

The goal is a camera that feels operated, not shaken by every event.

## Rhythm rule

Do not use “beat = cut” as the default.

Prefer:

- holds across several beats;
- acceleration into dense phrases;
- delayed or off-beat transitions when they create tension;
- strong visual accents on selected musical/lyric events;
- release into negative space or a calmer shot after dense sequences.

Audio analysis remains a supporting signal. Enhanced LRC timing and explicit song structure remain sufficient for the deterministic baseline.

## Implementation order

1. **Phrase direction + readability pressure** — active candidate.
2. **Persistent multi-cue typography scene graph** — next.
3. **Spiral Depth + Hero/Echo Field** — merged persistent grammars exercising history, scale hierarchy and camera continuity.
4. **Shape Build + Ribbon/Path** — active candidate.
5. **Elastic Tether** with readable anisotropic deformation — active candidate; mesh deformation only after baseline acceptance.
6. **Continuity-aware camera plan** and constrained audio impulses — active candidate.
7. **Section-level tension/release and shot-size sequencing**.
8. **Serializable sequence directives** in the project format.
9. **Real-track cinematic acceptance matrix** before editor work.

## Acceptance criteria

A sequence baseline is not accepted only because it compiles.

It must pass real-track review for:

- **continuity:** adjacent lyrics look intentionally related;
- **gaze:** the next important word is findable without searching the frame;
- **hierarchy:** active/recent/history words have unambiguous roles;
- **speed:** fast passages stay readable and visibly kinetic;
- **variation:** shot scale and spatial grammar create contrast without arbitrary effect churn;
- **persistence:** Spiral/Hero/Shape scenes genuinely use earlier lyrics;
- **seek safety:** jumping to any timestamp reconstructs the same visual state;
- **performance:** bounded history works in Performance and Cinema quality;
- **viewport safety:** desktop, laptop, portrait and mobile remain viable;
- **authorship:** manual controls can override AUTO without fighting hidden random choices.

## Non-goals

- no language-model dependency for baseline direction;
- no automatic semantic claim based solely on word meaning;
- no mandatory beat detector before sequence direction can work;
- no paid motion-design dependency;
- no unbounded display-object history;
- no stateful tween timeline that breaks deterministic seek.
