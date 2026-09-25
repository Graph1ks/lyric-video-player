import type {
  BackgroundPreset,
  ColorCanvasMode,
  ColorHarmonyMode,
  ColorMoodMode,
  CompositionMotionPreset,
  TypographyLayoutPreset,
  TypographyPreset,
  TypographySequenceMode,
  VisualMode,
} from "@graph1ks/emo-engine-core";

export interface DirectorCatalogItem<T extends string> {
  value: T;
  label: string;
  description: string;
  preview: string;
}

export const VISUAL_MODES: DirectorCatalogItem<VisualMode>[] = [
  { value: "auto", label: "Auto Director", description: "Phrase-aware scene direction", preview: "scene-auto" },
  { value: "poster", label: "Poster", description: "Graphic, bold, editorial", preview: "scene-poster" },
  { value: "neon", label: "Neon", description: "Elastic, luminous, kinetic", preview: "scene-neon" },
  { value: "vortex", label: "Vortex", description: "Depth, tunnels, spatial pull", preview: "scene-vortex" },
];

export const TYPOGRAPHY_CATALOG: DirectorCatalogItem<TypographyPreset>[] = [
  { value: "auto", label: "Auto", description: "Director picks a coherent type behavior", preview: "type-auto" },
  { value: "impact", label: "Impact", description: "Hard punch and hero emphasis", preview: "type-impact" },
  { value: "cascade", label: "Cascade", description: "Sequential build through the word", preview: "type-cascade" },
  { value: "wave", label: "Wave", description: "Continuous flowing glyph rhythm", preview: "type-wave" },
  { value: "scatter", label: "Scatter", description: "Exploded arrival into formation", preview: "type-scatter" },
  { value: "elastic", label: "Elastic", description: "Tethered stretch, overshoot, settle", preview: "type-elastic" },
  { value: "outline", label: "Outline", description: "Graphic linework and echo hierarchy", preview: "type-outline" },
  { value: "tunnel", label: "Tunnel", description: "Recursive depth and perspective", preview: "type-tunnel" },
  { value: "glitch", label: "Glitch", description: "Fractured digital displacement", preview: "type-glitch" },
];

export const TYPOGRAPHY_PRESETS = TYPOGRAPHY_CATALOG.map(item => item.value);

export const SEQUENCE_CATALOG: DirectorCatalogItem<TypographySequenceMode>[] = [
  { value: "auto", label: "Auto Sequence", description: "Director activates persistent multi-cue scenes when the phrase calls for them", preview: "sequence-auto" },
  { value: "off", label: "Classic Line", description: "Disable persistent sequence scenes and use the current-line composition", preview: "sequence-off" },
  { value: "spiral-depth", label: "Spiral Depth", description: "Newest lyric stays large while older words recede through a continuous spiral", preview: "sequence-spiral" },
  { value: "hero-echo", label: "Hero / Echo", description: "One dominant word leads while lyric history becomes a graphic background structure", preview: "sequence-hero" },
  { value: "shape-build", label: "Shape Build", description: "Words accumulate into frame and ring calligrams without reflowing old slots", preview: "sequence-shape" },
  { value: "ribbon-path", label: "Ribbon Path", description: "Active and previous words travel together along one continuous S-curve", preview: "sequence-ribbon" },
];

export const TYPOGRAPHY_SEQUENCES = SEQUENCE_CATALOG.map(item => item.value);

export const LAYOUT_CATALOG: DirectorCatalogItem<TypographyLayoutPreset>[] = [
  { value: "auto", label: "Auto", description: "Director chooses composition", preview: "layout-auto" },
  { value: "center-stack", label: "Center Stack", description: "Centered hierarchy and scale", preview: "layout-center-stack" },
  { value: "directional-stage", label: "Directional", description: "Words enter from staged vectors", preview: "layout-directional-stage" },
  { value: "editorial", label: "Editorial", description: "Asymmetric magazine composition", preview: "layout-editorial" },
  { value: "vertical-accent", label: "Vertical Accent", description: "Horizontal read with edge accent", preview: "layout-vertical-accent" },
  { value: "split-stage", label: "Split Stage", description: "Structured two-zone layout", preview: "layout-split-stage" },
  { value: "crossword", label: "Crossword", description: "Interlocking typographic structure", preview: "layout-crossword" },
];

export const TYPOGRAPHY_LAYOUTS = LAYOUT_CATALOG.map(item => item.value);

export const MOTION_CATALOG: DirectorCatalogItem<CompositionMotionPreset>[] = [
  { value: "auto", label: "Auto", description: "Phrase-compatible motion grammar", preview: "motion-auto" },
  { value: "handoff", label: "Handoff", description: "Pass focus word-to-word", preview: "motion-handoff" },
  { value: "conveyor", label: "Conveyor", description: "Continuous directional travel", preview: "motion-conveyor" },
  { value: "anchor-build", label: "Anchor Build", description: "Assemble around a fixed anchor", preview: "motion-anchor-build" },
  { value: "collapse", label: "Collapse", description: "Pull composition inward", preview: "motion-collapse" },
  { value: "takeover", label: "Takeover", description: "One word dominates the frame", preview: "motion-takeover" },
  { value: "flip", label: "Flip", description: "Plane-like rotational handoff", preview: "motion-flip" },
  { value: "camera-handoff", label: "Camera Handoff", description: "Stage travel with focus continuity", preview: "motion-camera-handoff" },
  { value: "portal", label: "Portal", description: "Depth push through typography", preview: "motion-portal" },
  { value: "panel", label: "Panel", description: "Graphic panel reveal and shift", preview: "motion-panel" },
];

export const COMPOSITION_MOTIONS = MOTION_CATALOG.map(item => item.value);

export const BACKGROUND_CATALOG: DirectorCatalogItem<BackgroundPreset>[] = [
  { value: "auto", label: "Auto", description: "Director selects the visual world", preview: "world-auto" },
  { value: "cinematic", label: "Cinematic", description: "Soft depth, glow and atmosphere", preview: "world-cinematic" },
  { value: "nebula", label: "Nebula", description: "Clouded luminous depth", preview: "world-nebula" },
  { value: "grid", label: "Grid", description: "Perspective graphic structure", preview: "world-grid" },
  { value: "starfield", label: "Starfield", description: "Deep spatial particle field", preview: "world-starfield" },
  { value: "rays", label: "Rays", description: "Directional light architecture", preview: "world-rays" },
  { value: "vortex", label: "Vortex", description: "Rotational depth and pull", preview: "world-vortex" },
  { value: "liquid", label: "Liquid", description: "Procedural fluid movement", preview: "world-liquid" },
  { value: "spectrum", label: "Spectrum", description: "Audio-shaped bands and ribbons", preview: "world-spectrum" },
  { value: "sparks", label: "Sparks", description: "Reactive trails and particles", preview: "world-sparks" },
  { value: "lyrics", label: "Recursive Lyrics", description: "Typography becomes environment", preview: "world-lyrics" },
  { value: "minimal", label: "Minimal", description: "Quiet field with strong focus", preview: "world-minimal" },
  { value: "editorial", label: "Editorial", description: "Plates, bars and framing marks", preview: "world-editorial" },
  { value: "print", label: "Print", description: "Halftone, bands and registration", preview: "world-print" },
  { value: "architecture", label: "Architecture", description: "Frames, pillars and perspective", preview: "world-architecture" },
  { value: "aurora", label: "Aurora", description: "Layered ribbons and horizon glow", preview: "world-aurora" },
];

export const BACKGROUND_PRESETS = BACKGROUND_CATALOG.map(item => item.value);

export const COLOR_MOOD_CATALOG: DirectorCatalogItem<ColorMoodMode>[] = [
  { value: "auto", label: "Auto", description: "Director chooses emotional color", preview: "mood-auto" },
  { value: "tender", label: "Tender", description: "Soft warmth and low aggression", preview: "mood-tender" },
  { value: "heartbreak", label: "Heartbreak", description: "Cold-dark tension with bruised accents", preview: "mood-heartbreak" },
  { value: "longing", label: "Longing", description: "Muted distance and suspended color", preview: "mood-longing" },
  { value: "euphoria", label: "Euphoria", description: "High-energy luminous contrast", preview: "mood-euphoria" },
  { value: "rage", label: "Rage", description: "Hot pressure and hard contrast", preview: "mood-rage" },
  { value: "dream", label: "Dream", description: "Soft chromatic atmosphere", preview: "mood-dream" },
  { value: "tension", label: "Tension", description: "Compressed contrast and unease", preview: "mood-tension" },
  { value: "calm", label: "Calm", description: "Quiet low-pressure color", preview: "mood-calm" },
];

export const COLOR_MOODS = COLOR_MOOD_CATALOG.map(item => item.value);

export const COLOR_CANVAS_CATALOG: DirectorCatalogItem<ColorCanvasMode>[] = [
  { value: "auto", label: "Auto", description: "Stable chapter-level canvas choice", preview: "canvas-auto" },
  { value: "night", label: "Night", description: "Near-neutral dark field", preview: "canvas-night" },
  { value: "paper", label: "Paper", description: "Light tinted field, dark type", preview: "canvas-paper" },
  { value: "color-field", label: "Color Field", description: "Deep chromatic background", preview: "canvas-color-field" },
  { value: "poster", label: "Poster", description: "Bright graphic field, dark type", preview: "canvas-poster" },
];

export const COLOR_CANVASES = COLOR_CANVAS_CATALOG.map(item => item.value);

export const COLOR_HARMONY_CATALOG: DirectorCatalogItem<ColorHarmonyMode>[] = [
  { value: "auto", label: "Auto", description: "Scene-aware OKLCH harmony", preview: "harmony-auto" },
  { value: "split-complement", label: "Split Complement", description: "Contrast with two neighboring opposites", preview: "harmony-split" },
  { value: "analogous", label: "Analogous", description: "Close hues, cohesive atmosphere", preview: "harmony-analogous" },
  { value: "complement", label: "Complement", description: "Direct opposing hue contrast", preview: "harmony-complement" },
  { value: "triad", label: "Triad", description: "Three balanced hue anchors", preview: "harmony-triad" },
  { value: "tetrad", label: "Tetrad", description: "Four-point graphic palette", preview: "harmony-tetrad" },
  { value: "monochrome", label: "Monochrome", description: "One hue with tonal hierarchy", preview: "harmony-monochrome" },
];

export const COLOR_HARMONIES = COLOR_HARMONY_CATALOG.map(item => item.value);
