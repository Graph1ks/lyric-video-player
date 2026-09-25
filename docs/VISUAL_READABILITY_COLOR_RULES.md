# Visual Readability + Color Direction Rules

**Status:** merged baseline for v0.8  
**Last updated:** 2026-09-25

This document converts external research and motion-design practice into explicit E-MO engine rules. Source-derived observations and E-MO product decisions are separated below.

## Research-derived observations

### Lyric-video typography must remain immediately readable

Adobe's lyric-video guidance emphasizes large readable type because words may only remain visible briefly, recommends keeping the amount of text on screen limited rather than presenting a whole page, and treats words/phrases as independent layers whose size, location, angle and transitions can vary.

Source:
- Adobe, "How to make a lyric video": https://www.adobe.com/creativecloud/video/discover/how-to-make-a-lyric-video.html

### Readable titles should stay away from frame edges

Adobe After Effects documents a conventional title-safe area of 80% of frame width and height and recommends keeping readable text inside that area.

Source:
- Adobe After Effects, safe zones: https://helpx.adobe.com/after-effects/desktop/view-and-preview/preview-video-and-audio/modifying-using-views.html

### Viewer gaze has a robust center bias

Eye-tracking literature repeatedly reports a central fixation tendency when people inspect visual scenes. This does **not** define a magical universal "golden center", but it supports placing the default lyric attention field near the central region of the image rather than treating every coordinate as equally likely to be read.

Sources:
- PubMed, "The central fixation bias in scene viewing": https://pubmed.ncbi.nlm.nih.gov/18217799/
- PubMed, "Scene and screen center bias early eye movements in scene viewing": https://pubmed.ncbi.nlm.nih.gov/20732344/
- PubMed, "Stimulus Center Bias Persists Irrespective of Its Position on the Display": https://pubmed.ncbi.nlm.nih.gov/41440777/

### Reading direction matters

For left-to-right text, established scanning behavior favors horizontal left-to-right traversal and top-to-bottom progression. Right-to-left languages mirror important parts of that behavior. W3C writing-mode guidance likewise treats writing direction as a fundamental layout property, not a decorative choice.

Sources:
- NN/g, "F-Shaped Pattern of Reading": https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/
- W3C, Unicode Bidirectional Algorithm basics: https://www.w3.org/International/articles/inline-bidi-markup/uba-basics
- W3C, CSS Writing Modes: https://www.w3.org/TR/css-writing-modes-4/

### Color can support emotion, but mappings are not universal truth

Color is useful for communicating tone and emotional direction, but E-MO's mood names are art-direction presets rather than claims that a hue has one universal psychological meaning.

Source:
- Adobe, "Evoking emotion through color": https://www.adobe.com/learn/express/web/use-color-to-evoke-emotion

## E-MO product rules

### 1. Central attention field

Normal readable lyric composition targets a field centered at:

- horizontal center: 50% of frame;
- vertical center: approximately 46.5% of frame;
- width: 76% of frame;
- height: 62% of frame.

This intentionally sits inside the conventional title-safe area and keeps routine lyric reading near the center-biased viewing region.

This is a **default readable field**, not a hard artistic prison. Explicit full-frame moments such as Takeover and Portal may exceed it.

### 2. Collision avoidance is mandatory

Base composition must not knowingly place readable words on top of each other.

The composition planner therefore:

- estimates each word's transformed bounds;
- clamps readable words to the central attention field;
- resolves collisions deterministically;
- preserves emphasized/anchor words where possible;
- scales lower-emphasis words down as a last resort.

Collision handling belongs to the composition layer, not to React or frame-history-dependent animation code.

### 3. Latin/LTR baseline reading path

The current production baseline is Latin/LTR lyric layout.

Allowed default reading patterns:

- left to right within a row;
- top row to lower row;
- top-to-bottom or bottom-to-top **single vertical accent words** at a logical edge;
- centered hero/takeover words.

Avoid in AUTO:

- alternating left/right word order for consecutive cues;
- diagonal cue traversal;
- middle-of-sentence 90° words that force the eye to reverse direction;
- multiple simultaneous vertical words;
- arbitrary mirrored layouts merely for variation.

Entry animation may originate from different edges; **entry direction is not the same thing as reading order**.

Full RTL/bidi typography is not claimed by this baseline. It requires explicit script-aware glyph/layout work later.

### 4. Emotion-named color direction

The Color Director exposes lyric-oriented creative presets:

- Tender
- Heartbreak
- Longing
- Euphoria
- Rage
- Dream
- Tension
- Calm

These presets select a base OKLCH region and tonal/chroma profile. Harmony remains a separate control, so "Heartbreak + Analogous" and "Heartbreak + Complement" are distinct valid palettes.

### 5. No muddy dark backgrounds

Hue should live primarily in accents, glow and surfaces.

The darkest background role is intentionally near-neutral and very low chroma. This prevents dark orange/red palettes from collapsing into persistent muddy brown.

Primary lyric text must retain the existing contrast floor.

### 6. Rainbow means slow spectrum drift, not rainbow soup

Rainbow Drift:

- rotates the palette hue slowly over time;
- preserves the selected harmony relationship;
- keeps the dark background low-chroma;
- leaves primary readable text near-neutral;
- makes accents/glow carry most visible hue movement;
- is timestamp-derived, so seeking remains deterministic.

Current baseline rate: **2.4 degrees/second** (about 150 seconds for a full hue rotation).

### 7. AUTO remains deterministic

Mood, harmony, composition and motion AUTO routing must be reproducible from scene/cue/time state. No history-dependent random layout or color decisions are permitted.
