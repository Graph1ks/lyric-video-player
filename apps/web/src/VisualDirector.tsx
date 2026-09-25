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
import { copy, localizeDirectorItem } from "./directorI18n";
import { LOWER_THIRD_PRESETS, type LowerThirdPresetInfo } from "./lowerThirds";
import { useUiStore } from "./store";

type DirectorSection = "scene" | "type" | "motion" | "world" | "color" | "titles" | "system";

export function VisualDirector({
  variant = "dock",
  onPopout,
}: {
  variant?: "dock" | "window";
  onPopout?: () => void;
}) {
  const [section, setSection] = useState<DirectorSection>("scene");
  const state = useUiStore();
  const de = state.uiLanguage === "de";
  const t = (en: string, german: string) => copy(state.uiLanguage, en, german);

  const sections: { id: DirectorSection; label: string; hint: string }[] = [
    { id: "scene", label: t("Scene", "Szene"), hint: t("Direction", "Regie") },
    { id: "type", label: t("Type", "Typo"), hint: t("Words", "Wörter") },
    { id: "motion", label: t("Motion", "Motion"), hint: t("Movement", "Bewegung") },
    { id: "world", label: t("World", "Welt"), hint: t("Background", "Hintergrund") },
    { id: "color", label: t("Color", "Farbe"), hint: t("Palette", "Palette") },
    { id: "titles", label: t("Titles", "Titel"), hint: "Lower Thirds" },
    { id: "system", label: t("System", "System"), hint: t("Output", "Ausgabe") },
  ];

  const resolvedStack = [
    { label: t("Scene", "Szene"), value: SCENE_LABELS[state.activeScene] },
    { label: t("Type", "Typo"), value: state.activeTypography.replaceAll("-", " ") },
    { label: t("Sequence", "Sequenz"), value: state.activeSequence.replaceAll("-", " ") },
    { label: t("Motion", "Motion"), value: state.activeMotion.replaceAll("-", " ") },
    { label: t("World", "Welt"), value: state.activeBackground.replaceAll("-", " ") },
  ];

  return (
    <section className={`visual-director visual-director--${variant}`}>
      <header className="director-header">
        <div>
          <span className="director-eyebrow">E-MO / VISUAL DIRECTOR</span>
          <div className="director-title-row">
            <strong>{t("LIVE LOOK", "LIVE LOOK")}</strong>
            <span className="director-live"><i /> {state.directorPlaying ? t("PLAYING", "LÄUFT") : t("READY", "BEREIT")}</span>
          </div>
        </div>
        <div className="director-header-actions">
          <div className="director-language" aria-label={t("Interface language", "Sprache der Oberfläche")}>
            <button className={!de ? "is-active" : ""} onClick={() => state.setUiLanguage("en")}>EN</button>
            <button className={de ? "is-active" : ""} onClick={() => state.setUiLanguage("de")}>DE</button>
          </div>
          {onPopout && (
            <button
              className="director-popout"
              onClick={onPopout}
              title={t("Open Visual Director in its own window", "Visual Director in eigenem Fenster öffnen")}
            >
              <span>{t("POPOUT", "FENSTER")}</span><b>↗</b>
            </button>
          )}
        </div>
      </header>

      <div className="director-stack" aria-label={t("Resolved visual stack", "Aktiv aufgelöster visueller Stack")}>
        {resolvedStack.map(item => (
          <span key={item.label}>
            <small>{item.label}</small>
            <b>{item.value}</b>
          </span>
        ))}
      </div>

      <nav className="director-nav" aria-label={t("Director sections", "Director-Bereiche")}>
        {sections.map(item => (
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
                  eyebrow={t("DIRECTION", "REGIE")}
                  title={t("Scene family", "Szenenfamilie")}
                  description={t(
                    "Choose the master visual language. AUTO keeps phrase-aware direction.",
                    "Wähle die übergeordnete Bildsprache. AUTO hält die Regie phrasenbewusst zusammen.",
                  )}
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
                  {t(
                    "AUTO is recommended for performance: scene, typography, composition and motion remain phrase-coherent.",
                    "AUTO ist für Performance empfohlen: Szene, Typografie, Komposition und Motion bleiben phrasenweise zusammenhängend.",
                  )}
                </DirectorNote>
              </>
            )}

            {section === "type" && (
              <>
                <SectionHeading
                  eyebrow={t("TYPOGRAPHY", "TYPOGRAFIE")}
                  title={t("Character", "Charakter")}
                  description={t(
                    "How the letters behave. Each card previews the motion/type signature before you click.",
                    "Wie sich die Buchstaben verhalten. Jede Karte zeigt die Signatur des Effekts schon vor dem Klick.",
                  )}
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
                  eyebrow={t("CINEMATIC SEQUENCE", "CINEMATIC SEQUENCE")}
                  title={t("Multi-cue scenes", "Multi-Cue-Szenen")}
                  description={t(
                    "Persistent lyric history across cues: Spiral, Hero/Echo, Shape Build or Ribbon.",
                    "Persistente Lyric-Historie über mehrere Cues: Spirale, Hero/Echo, Shape Build oder Ribbon.",
                  )}
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
                  eyebrow={t("COMPOSITION", "KOMPOSITION")}
                  title={t("Word architecture", "Wortarchitektur")}
                  description={t(
                    "Where complete words live in frame. Independent from glyph motion.",
                    "Wo ganze Wörter im Frame leben – unabhängig von der Glyphenbewegung.",
                  )}
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
                  eyebrow={t("CHOREOGRAPHY", "CHOREOGRAFIE")}
                  title={t("Composition motion", "Kompositionsbewegung")}
                  description={t(
                    "Whole-stage and per-word movement grammar connecting lyric moments.",
                    "Bewegungsgrammatik für Bühne und Wörter – das Bindeglied zwischen Lyric-Momenten.",
                  )}
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
                  eyebrow={t("ART DIRECTION", "ART DIRECTION")}
                  title={t("Visual world", "Visuelle Welt")}
                  description={t(
                    "The environment behind the lyrics — from quiet fields to architectural and procedural worlds.",
                    "Die Umgebung hinter den Lyrics – von ruhigen Flächen bis zu Architektur und prozeduralen Welten.",
                  )}
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
                  eyebrow={t("COLOR DIRECTION", "FARBREGIE")}
                  title={t("Mood", "Stimmung")}
                  description={t(
                    "Emotional color pressure, independent from harmony and canvas polarity.",
                    "Emotionale Farbspannung – unabhängig von Harmonie und Hell/Dunkel-Canvas.",
                  )}
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
                  title={t("Light / dark field", "Hell / Dunkel")}
                  description={t(
                    "Controls whether type lives on dark, light or chromatic space.",
                    "Bestimmt, ob Typografie auf dunklem, hellem oder chromatischem Raum lebt.",
                  )}
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
                  title={t("Harmony", "Harmonie")}
                  description={t(
                    "Hue relationship. Contrast guarantees are applied after palette generation.",
                    "Beziehung der Farbtöne. Kontrastgarantien greifen nach der Palettenerzeugung.",
                  )}
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
                    <small>{t("Slow coherent spectrum travel", "Langsame zusammenhängende Spektrumfahrt")}</small>
                  </span>
                  <strong>{state.colorFlow === "rainbow" ? "ON" : "OFF"}</strong>
                </button>

                {state.activePalette && (
                  <div className="director-palette" aria-label={t("Active generated palette", "Aktive generierte Palette")}>
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

            {section === "titles" && (
              <LowerThirdDirector />
            )}

            {section === "system" && (
              <>
                <SectionHeading
                  eyebrow={t("PERFORMANCE", "PERFORMANCE")}
                  title={t("Output controls", "Ausgabesteuerung")}
                  description={t(
                    "Global energy, lyric sync and renderer quality. These do not change the authored visual family.",
                    "Globale Energie, Lyric-Sync und Render-Qualität. Diese ändern nicht die gewählte visuelle Familie.",
                  )}
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
                  label={t("Intensity", "Intensität")}
                  value={Math.round(state.intensity * 100)}
                  suffix="%"
                  min={20}
                  max={180}
                  step={1}
                  onChange={value => state.setIntensity(value / 100)}
                />

                <div className="director-system-card">
                  <div>
                    <span className="director-setting-label">{t("LYRIC SYNC", "LYRIC-SYNC")}</span>
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
                  <span className="director-setting-label">{t("RENDER QUALITY", "RENDER-QUALITÄT")}</span>
                  <div className="director-quality">
                    {(["performance", "cinema"] as QualityMode[]).map(value => (
                      <button
                        key={value}
                        className={state.quality === value ? "is-active" : ""}
                        onClick={() => state.setQuality(value)}
                      >
                        <b>{value === "performance" ? "Performance" : "Cinema"}</b>
                        <small>{value === "performance"
                          ? t("Lower GPU budget", "Niedrigeres GPU-Budget")
                          : t("Full visual fidelity", "Volle visuelle Qualität")}</small>
                      </button>
                    ))}
                  </div>
                </div>

                <DirectorNote>
                  {t(
                    "Keyboard: T typography · S sequence · L composition · G motion · B world · E mood · V canvas · C harmony · R rainbow.",
                    "Tastatur: T Typo · S Sequenz · L Komposition · G Motion · B Welt · E Mood · V Canvas · C Harmonie · R Rainbow.",
                  )}
                </DirectorNote>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

function LowerThirdDirector() {
  const state = useUiStore();
  const t = (en: string, german: string) => copy(state.uiLanguage, en, german);

  function loadImage(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") state.setLowerThirdArtistImage(reader.result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <>
      <SectionHeading
        eyebrow="LOWER THIRDS"
        title={t("Artist + track identity", "Künstler + Song-Identität")}
        description={t(
          "Screen-space title treatments stay crisp and independent from lyric camera/CRT deformation.",
          "Screen-Space-Titel bleiben gestochen scharf und unabhängig von Lyric-Kamera oder CRT-Verzerrung.",
        )}
      />

      <div className="director-segmented director-segmented--three">
        {([
          ["off", t("Off", "Aus")],
          ["intro", t("Intro only", "Nur Intro")],
          ["rotate", t("Rotate", "Rotieren")],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            className={state.lowerThirdMode === value ? "is-active" : ""}
            onClick={() => state.setLowerThirdMode(value)}
          >{label}</button>
        ))}
      </div>

      <CardGrid>
        {LOWER_THIRD_PRESETS.map(item => (
          <EffectCard
            key={item.value}
            item={item}
            selected={state.lowerThirdPreset === item.value}
            onClick={() => state.setLowerThirdPreset(item.value)}
          />
        ))}
      </CardGrid>

      <SectionHeading
        eyebrow={t("CONTENT", "INHALT")}
        title={t("Metadata + optional portrait", "Metadaten + optionales Künstlerbild")}
        description={t(
          "Leave overrides empty to use Enhanced LRC / track metadata.",
          "Overrides leer lassen, um Enhanced-LRC-/Track-Metadaten zu verwenden.",
        )}
        compact
      />

      <div className="director-form-grid">
        <label>
          <span>{t("ARTIST OVERRIDE", "KÜNSTLER OVERRIDE")}</span>
          <input
            value={state.lowerThirdArtistOverride}
            onChange={event => state.setLowerThirdArtistOverride(event.target.value)}
            placeholder={state.directorArtist || t("Artist", "Künstler")}
          />
        </label>
        <label>
          <span>{t("TITLE OVERRIDE", "TITEL OVERRIDE")}</span>
          <input
            value={state.lowerThirdTitleOverride}
            onChange={event => state.setLowerThirdTitleOverride(event.target.value)}
            placeholder={state.directorTrackTitle}
          />
        </label>
        <label className="director-form-grid__wide">
          <span>{t("ARTIST IMAGE URL", "KÜNSTLERBILD URL")}</span>
          <input
            value={state.lowerThirdArtistImage.startsWith("data:") ? "" : state.lowerThirdArtistImage}
            onChange={event => state.setLowerThirdArtistImage(event.target.value)}
            placeholder="https://…"
          />
        </label>
      </div>

      <div className="lower-third-tools">
        <label className="director-upload">
          {t("UPLOAD IMAGE", "BILD HOCHLADEN")}
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => {
            loadImage(event.target.files?.[0]);
            event.currentTarget.value = "";
          }} />
        </label>
        {state.lowerThirdArtistImage && (
          <button onClick={() => state.setLowerThirdArtistImage("")}>{t("REMOVE IMAGE", "BILD ENTFERNEN")}</button>
        )}
        <button className="is-primary" onClick={() => state.previewLowerThird()}>
          {t("SHOW 7s PREVIEW", "7s VORSCHAU")}
        </button>
      </div>

      <DirectorNote>
        {t(
          "AUTO rotates the ten designs on recurring appearances. ROTATE shows a lower third for seven seconds every 45 seconds; INTRO shows only the opening eight seconds.",
          "AUTO rotiert die zehn Designs bei wiederkehrenden Einblendungen. ROTIEREN zeigt sieben Sekunden alle 45 Sekunden; INTRO nur die ersten acht Sekunden.",
        )}
      </DirectorNote>
    </>
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
  item: DirectorCatalogItem<T> | LowerThirdPresetInfo;
  selected: boolean;
  resolved?: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  const language = useUiStore(state => state.uiLanguage);
  const localized = "value" in item
    ? localizeDirectorItem(item as DirectorCatalogItem<T>, language)
    : item;

  return (
    <button
      className={[
        "director-effect-card",
        selected ? "is-selected" : "",
        resolved ? "is-resolved" : "",
        compact ? "is-compact" : "",
      ].filter(Boolean).join(" ")}
      onClick={onClick}
      title={`${localized.label} — ${localized.description}`}
    >
      <EffectPreview kind={localized.preview} />
      <span className="director-effect-copy">
        <span className="director-effect-title">
          <b>{localized.label}</b>
          {resolved && <em>LIVE</em>}
        </span>
        <small>{localized.description}</small>
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
