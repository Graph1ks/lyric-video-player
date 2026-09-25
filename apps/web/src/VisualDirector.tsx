import { AnimatePresence, motion } from "motion/react";
import { useState, type ReactNode } from "react";
import {
  SCENE_LABELS,
  hexColorToCss,
  type QualityMode,
} from "@graph1ks/emo-engine-core";
import {
  BACKGROUND_CATALOG,
  COLOR_CANVAS_CATALOG,
  COLOR_HARMONY_CATALOG,
  COLOR_MOOD_CATALOG,
  LAYOUT_CATALOG,
  MOTION_CATALOG,
  SEQUENCE_CATALOG,
  TYPOGRAPHY_CATALOG,
  VISUAL_MODES,
  type DirectorCatalogItem,
} from "./directorCatalog";
import { useUiStore } from "./store";

type DirectorSection = "scene" | "type" | "motion" | "world" | "color" | "system";

const SECTIONS: { id: DirectorSection; label: string; hint: string }[] = [
  { id: "scene", label: "Scene", hint: "Direction" },
  { id: "type", label: "Type", hint: "Words" },
  { id: "motion", label: "Motion", hint: "Movement" },
  { id: "world", label: "World", hint: "Background" },
  { id: "color", label: "Color", hint: "Palette" },
  { id: "system", label: "System", hint: "Output" },
];

export function VisualDirector({
  variant = "dock",
  onPopout,
}: {
  variant?: "dock" | "window";
  onPopout?: () => void;
}) {
  const [section, setSection] = useState<DirectorSection>("scene");
  const state = useUiStore();

  const resolvedStack = [
    { label: "Scene", value: SCENE_LABELS[state.activeScene] },
    { label: "Type", value: state.activeTypography.replaceAll("-", " ") },
    { label: "Sequence", value: state.activeSequence.replaceAll("-", " ") },
    { label: "Layout", value: state.activeLayout.replaceAll("-", " ") },
    { label: "Motion", value: state.activeMotion.replaceAll("-", " ") },
    { label: "World", value: state.activeBackground.replaceAll("-", " ") },
  ];

  return (
    <section className={`visual-director visual-director--${variant}`}>
      <header className="director-header">
        <div>
          <span className="director-eyebrow">E-MO / VISUAL DIRECTOR</span>
          <div className="director-title-row">
            <strong>LIVE LOOK</strong>
            <span className="director-live"><i /> {state.directorPlaying ? "PLAYING" : "READY"}</span>
          </div>
        </div>
        {onPopout && (
          <button
            className="director-popout"
            onClick={onPopout}
            title="Open Visual Director in its own window"
          >
            <span>POPOUT</span><b>↗</b>
          </button>
        )}
      </header>

      <div className="director-stack" aria-label="Resolved visual stack">
        {resolvedStack.map(item => (
          <span key={item.label}>
            <small>{item.label}</small>
            <b>{item.value}</b>
          </span>
        ))}
      </div>

      <nav className="director-nav" aria-label="Director sections">
        {SECTIONS.map(item => (
          <button
            key={item.id}
            className={section === item.id ? "is-active" : ""}
            onClick={() => setSection(item.id)}
          >
            <span>{item.label}</span>
            <small>{item.hint}</small>
          </button>
        ))}
      </nav>

      <div className="director-body">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={section}
            className="director-section"
            initial={{ opacity: 0, y: 7, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -5, filter: "blur(3px)" }}
            transition={{ duration: 0.16, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {section === "scene" && (
              <>
                <SectionHeading
                  eyebrow="DIRECTION"
                  title="Scene family"
                  description="Choose the master visual language. AUTO keeps phrase-aware direction."
                  resolved={SCENE_LABELS[state.activeScene]}
                />
                <CardGrid>
                  {VISUAL_MODES.map(item => (
                    <EffectCard
                      key={item.value}
                      item={item}
                      selected={state.mode === item.value}
                      resolved={state.mode === "auto" && state.activeScene === item.value}
                      onClick={() => state.setMode(item.value)}
                    />
                  ))}
                </CardGrid>
                <DirectorNote>
                  AUTO is the recommended performance mode: scene, typography, composition and motion stay phrase-coherent instead of rotating independently.
                </DirectorNote>
              </>
            )}

            {section === "type" && (
              <>
                <SectionHeading
                  eyebrow="TYPOGRAPHY"
                  title="Character"
                  description="How the letters behave. The preview communicates the motion/type signature before you click."
                  resolved={state.activeTypography.toUpperCase()}
                />
                <CardGrid>
                  {TYPOGRAPHY_CATALOG.map(item => (
                    <EffectCard
                      key={item.value}
                      item={item}
                      selected={state.typographyPreset === item.value}
                      resolved={state.typographyPreset === "auto" && state.activeTypography === item.value}
                      onClick={() => state.setTypographyPreset(item.value)}
                    />
                  ))}
                </CardGrid>

                <SectionHeading
                  eyebrow="CINEMATIC SEQUENCE"
                  title="Multi-cue scenes"
                  description="Persistent lyric history across several cues: spiral, hero/echo, calligram or ribbon."
                  resolved={state.activeSequence.replaceAll("-", " ").toUpperCase()}
                  compact
                />
                <CardGrid>
                  {SEQUENCE_CATALOG.map(item => (
                    <EffectCard
                      key={item.value}
                      item={item}
                      selected={state.typographySequence === item.value}
                      resolved={state.typographySequence === "auto" && state.activeSequence === item.value}
                      onClick={() => state.setTypographySequence(item.value)}
                    />
                  ))}
                </CardGrid>

                <SectionHeading
                  eyebrow="COMPOSITION"
                  title="Word architecture"
                  description="Where complete words live in frame. Independent from glyph motion."
                  resolved={state.activeLayout.replaceAll("-", " ").toUpperCase()}
                  compact
                />
                <CardGrid>
                  {LAYOUT_CATALOG.map(item => (
                    <EffectCard
                      key={item.value}
                      item={item}
                      selected={state.typographyLayout === item.value}
                      resolved={state.typographyLayout === "auto" && state.activeLayout === item.value}
                      onClick={() => state.setTypographyLayout(item.value)}
                    />
                  ))}
                </CardGrid>
              </>
            )}

            {section === "motion" && (
              <>
                <SectionHeading
                  eyebrow="CHOREOGRAPHY"
                  title="Composition motion"
                  description="Whole-stage and per-word movement grammar. This is the connective tissue between lyric moments."
                  resolved={state.activeMotion.replaceAll("-", " ").toUpperCase()}
                />
                <CardGrid>
                  {MOTION_CATALOG.map(item => (
                    <EffectCard
                      key={item.value}
                      item={item}
                      selected={state.compositionMotion === item.value}
                      resolved={state.compositionMotion === "auto" && state.activeMotion === item.value}
                      onClick={() => state.setCompositionMotion(item.value)}
                    />
                  ))}
                </CardGrid>
              </>
            )}

            {section === "world" && (
              <>
                <SectionHeading
                  eyebrow="ART DIRECTION"
                  title="Visual world"
                  description="The environment behind the lyrics — from quiet fields to architectural and procedural worlds."
                  resolved={state.activeBackground.replaceAll("-", " ").toUpperCase()}
                />
                <CardGrid>
                  {BACKGROUND_CATALOG.map(item => (
                    <EffectCard
                      key={item.value}
                      item={item}
                      selected={state.backgroundPreset === item.value}
                      resolved={state.backgroundPreset === "auto" && state.activeBackground === item.value}
                      onClick={() => state.setBackgroundPreset(item.value)}
                    />
                  ))}
                </CardGrid>
              </>
            )}

            {section === "color" && (
              <>
                <SectionHeading
                  eyebrow="COLOR DIRECTION"
                  title="Mood"
                  description="Emotional color pressure, independent from harmony and canvas polarity."
                  resolved={state.activeMood.toUpperCase()}
                />
                <CompactCardGrid>
                  {COLOR_MOOD_CATALOG.map(item => (
                    <EffectCard
                      key={item.value}
                      item={item}
                      selected={state.colorMood === item.value}
                      resolved={state.colorMood === "auto" && state.activeMood === item.value}
                      onClick={() => state.setColorMood(item.value)}
                      compact
                    />
                  ))}
                </CompactCardGrid>

                <SectionHeading
                  eyebrow="CANVAS"
                  title="Light / dark field"
                  description="Controls whether type lives on dark, light or chromatic space."
                  resolved={state.activeCanvas.replaceAll("-", " ").toUpperCase()}
                  compact
                />
                <CompactCardGrid>
                  {COLOR_CANVAS_CATALOG.map(item => (
                    <EffectCard
                      key={item.value}
                      item={item}
                      selected={state.colorCanvas === item.value}
                      resolved={state.colorCanvas === "auto" && state.activeCanvas === item.value}
                      onClick={() => state.setColorCanvas(item.value)}
                      compact
                    />
                  ))}
                </CompactCardGrid>

                <SectionHeading
                  eyebrow="OKLCH"
                  title="Harmony"
                  description="Hue relationship. Contrast guarantees are applied after palette generation."
                  resolved={state.activeHarmony.replaceAll("-", " ").toUpperCase()}
                  compact
                />
                <CompactCardGrid>
                  {COLOR_HARMONY_CATALOG.map(item => (
                    <EffectCard
                      key={item.value}
                      item={item}
                      selected={state.colorHarmony === item.value}
                      resolved={state.colorHarmony === "auto" && state.activeHarmony === item.value}
                      onClick={() => state.setColorHarmony(item.value)}
                      compact
                    />
                  ))}
                </CompactCardGrid>

                <button
                  className={`director-rainbow ${state.colorFlow === "rainbow" ? "is-active" : ""}`}
                  onClick={() => state.setColorFlow(state.colorFlow === "rainbow" ? "static" : "rainbow")}
                >
                  <span className="director-rainbow__preview" />
                  <span>
                    <b>Rainbow Drift</b>
                    <small>Slow coherent spectrum travel</small>
                  </span>
                  <strong>{state.colorFlow === "rainbow" ? "ON" : "OFF"}</strong>
                </button>

                {state.activePalette && (
                  <div className="director-palette" aria-label="Active generated palette">
                    {([
                      ["BG", state.activePalette.background],
                      ["TEXT", state.activePalette.textPrimary],
                      ["A", state.activePalette.accentA],
                      ["B", state.activePalette.accentB],
                      ["GLOW", state.activePalette.glow],
                    ] as const).map(([label, color]) => (
                      <span key={label} title={`${label} · ${hexColorToCss(color)}`}>
                        <i style={{ background: hexColorToCss(color) }} />
                        <small>{label}</small>
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}

            {section === "system" && (
              <>
                <SectionHeading
                  eyebrow="PERFORMANCE"
                  title="Output controls"
                  description="Global energy, lyric sync and renderer quality. These do not change the authored visual family."
                />

                <div className="director-audio-mini" aria-label="Audio reactive bands">
                  {([
                    ["BASS", state.directorAudioBands.bass],
                    ["MID", state.directorAudioBands.mid],
                    ["AIR", state.directorAudioBands.treble],
                  ] as const).map(([label, value]) => (
                    <span key={label}>
                      <i><b style={{ transform: `scaleY(${Math.max(0.04, value)})` }} /></i>
                      <small>{label}</small>
                    </span>
                  ))}
                </div>

                <ControlSlider
                  label="Intensity"
                  value={Math.round(state.intensity * 100)}
                  suffix="%"
                  min={20}
                  max={180}
                  step={1}
                  onChange={value => state.setIntensity(value / 100)}
                />

                <div className="director-system-card">
                  <div>
                    <span className="director-setting-label">LYRIC SYNC</span>
                    <b>{state.syncMs >= 0 ? "+" : ""}{state.syncMs} ms</b>
                  </div>
                  <input
                    type="range"
                    min="-1500"
                    max="1500"
                    value={state.syncMs}
                    step="10"
                    aria-label="Lyric sync offset"
                    onChange={event => state.setSyncMs(Number(event.target.value))}
                  />
                  <div className="director-stepper">
                    <button onClick={() => state.setSyncMs(Math.max(-1500, state.syncMs - 50))}>−50</button>
                    <button onClick={() => state.setSyncMs(0)}>RESET</button>
                    <button onClick={() => state.setSyncMs(Math.min(1500, state.syncMs + 50))}>+50</button>
                  </div>
                </div>

                <div className="director-system-card">
                  <span className="director-setting-label">RENDER QUALITY</span>
                  <div className="director-quality">
                    {(["performance", "cinema"] as QualityMode[]).map(value => (
                      <button
                        key={value}
                        className={state.quality === value ? "is-active" : ""}
                        onClick={() => state.setQuality(value)}
                      >
                        <b>{value === "performance" ? "Performance" : "Cinema"}</b>
                        <small>{value === "performance" ? "Lower GPU budget" : "Full visual fidelity"}</small>
                      </button>
                    ))}
                  </div>
                </div>

                <DirectorNote>
                  Keyboard remains available: T typography · L composition · G motion · B world · E mood · V canvas · C harmony · R rainbow.
                </DirectorNote>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  resolved,
  compact = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  resolved?: string;
  compact?: boolean;
}) {
  return (
    <div className={`director-section-heading ${compact ? "is-compact" : ""}`}>
      <div>
        <span>{eyebrow}</span>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {resolved && <strong>{resolved}</strong>}
    </div>
  );
}

function CardGrid({ children }: { children: ReactNode }) {
  return <div className="director-card-grid">{children}</div>;
}

function CompactCardGrid({ children }: { children: ReactNode }) {
  return <div className="director-card-grid director-card-grid--compact">{children}</div>;
}

function EffectCard<T extends string>({
  item,
  selected,
  resolved,
  onClick,
  compact = false,
}: {
  item: DirectorCatalogItem<T>;
  selected: boolean;
  resolved?: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      className={[
        "director-effect-card",
        selected ? "is-selected" : "",
        resolved ? "is-resolved" : "",
        compact ? "is-compact" : "",
      ].filter(Boolean).join(" ")}
      onClick={onClick}
      title={`${item.label} — ${item.description}`}
    >
      <EffectPreview kind={item.preview} />
      <span className="director-effect-copy">
        <span className="director-effect-title">
          <b>{item.label}</b>
          {resolved && <em>LIVE</em>}
        </span>
        <small>{item.description}</small>
      </span>
    </button>
  );
}

function EffectPreview({ kind }: { kind: string }) {
  return (
    <span className="director-miniature" data-preview={kind} aria-hidden="true">
      <i className="p-a" />
      <i className="p-b" />
      <i className="p-c" />
      <i className="p-d" />
      <b>MO</b>
    </span>
  );
}

function ControlSlider({
  label,
  value,
  suffix,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  suffix: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="director-system-card director-slider">
      <span>
        <span className="director-setting-label">{label}</span>
        <b>{value}{suffix}</b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={event => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function DirectorNote({ children }: { children: ReactNode }) {
  return <div className="director-note"><i>i</i><p>{children}</p></div>;
}
