import type { DirectorCatalogItem } from "./directorCatalog";
import type { UiLanguage } from "./store";

interface ItemTranslation {
  label?: string;
  description: string;
}

const DE_ITEMS: Record<string, ItemTranslation> = {
  "scene-auto": { label: "Auto-Regie", description: "Phrasenbewusste automatische Szenenregie" },
  "scene-poster": { description: "Grafisch, plakativ und editorial" },
  "scene-neon": { description: "Elastisch, leuchtend und kinetisch" },
  "scene-vortex": { description: "Tiefe, Tunnel und räumlicher Sog" },

  "type-auto": { description: "Die Regie wählt ein zusammenhängendes Typo-Verhalten" },
  "type-impact": { description: "Harter Punch und dominante Hero-Betonung" },
  "type-cascade": { description: "Gestaffelter Aufbau durch das Wort" },
  "type-wave": { description: "Fließender Rhythmus durch einzelne Glyphen" },
  "type-scatter": { description: "Explodierter Einstieg, der sich zur Form sammelt" },
  "type-elastic": { description: "Gezogener Stretch mit Overshoot und Settle" },
  "type-outline": { description: "Grafische Kontur und Echo-Hierarchie" },
  "type-tunnel": { description: "Rekursive Tiefe und Perspektive" },
  "type-glitch": { description: "Gebrochene digitale Verschiebung" },

  "sequence-auto": { label: "Auto-Sequenz", description: "Die Regie aktiviert persistente Multi-Cue-Szenen passend zur Phrase" },
  "sequence-off": { label: "Klassische Zeile", description: "Persistente Sequenzen aus; normale aktuelle Zeilenkomposition" },
  "sequence-spiral": { description: "Neuestes Wort groß, ältere Wörter ziehen kontinuierlich in die Spiraltiefe" },
  "sequence-hero": { description: "Ein dominantes Wort führt, Lyric-Historie wird zur Hintergrundstruktur" },
  "sequence-shape": { description: "Wörter bauen Rahmen- und Ring-Calligrams ohne alte Slots neu zu sortieren" },
  "sequence-ribbon": { description: "Aktive und ältere Wörter laufen gemeinsam auf einer S-Kurve" },

  "layout-auto": { description: "Die Regie wählt die passende Wortkomposition" },
  "layout-center-stack": { description: "Zentrierte Hierarchie und Größenstaffelung" },
  "layout-directional-stage": { description: "Wörter betreten die Bühne aus gerichteten Vektoren" },
  "layout-editorial": { description: "Asymmetrische Magazin-Komposition" },
  "layout-vertical-accent": { description: "Horizontales Lesen mit vertikalem Randakzent" },
  "layout-split-stage": { description: "Strukturierte Zwei-Zonen-Komposition" },
  "layout-crossword": { description: "Ineinandergreifende typografische Struktur" },

  "motion-auto": { description: "Phrasenkompatible Bewegungsgrammatik" },
  "motion-handoff": { description: "Fokus wird kontrolliert von Wort zu Wort übergeben" },
  "motion-conveyor": { description: "Kontinuierliche gerichtete Bewegung" },
  "motion-anchor-build": { description: "Aufbau um einen stabilen visuellen Anker" },
  "motion-collapse": { description: "Komposition zieht kontrolliert nach innen" },
  "motion-takeover": { description: "Ein Wort übernimmt dominant den gesamten Frame" },
  "motion-flip": { description: "Rotierender Handoff wie über eine Ebene" },
  "motion-camera-handoff": { description: "Bühnenbewegung mit kontinuierlicher Blickführung" },
  "motion-portal": { description: "Tiefenfahrt durch die Typografie" },
  "motion-panel": { description: "Grafische Panel-Reveals und Verschiebungen" },

  "world-auto": { description: "Die Regie wählt automatisch die visuelle Welt" },
  "world-cinematic": { description: "Weiche Tiefe, Glow und Atmosphäre" },
  "world-nebula": { description: "Leuchtende Wolken und räumliche Tiefe" },
  "world-grid": { description: "Perspektivische grafische Gitterstruktur" },
  "world-starfield": { description: "Tiefes räumliches Partikelfeld" },
  "world-rays": { description: "Gerichtete Lichtarchitektur" },
  "world-vortex": { description: "Rotierende Tiefe und Sog" },
  "world-liquid": { description: "Prozedurale flüssige Bewegung" },
  "world-spectrum": { description: "Audiogeformte Bänder und Spektrallinien" },
  "world-sparks": { description: "Reaktive Funken, Trails und Partikel" },
  "world-lyrics": { label: "Rekursive Lyrics", description: "Typografie wird selbst zur Umgebung" },
  "world-minimal": { description: "Ruhiges Feld mit starkem Fokus" },
  "world-editorial": { description: "Flächen, Balken und grafische Rahmung" },
  "world-print": { description: "Halftone, Bänder und Print-Registrierung" },
  "world-architecture": { description: "Rahmen, Säulen und Perspektivräume" },
  "world-aurora": { description: "Geschichtete Bänder und Horizont-Glow" },

  "mood-auto": { description: "Die Regie wählt die emotionale Farbspannung" },
  "mood-tender": { description: "Weiche Wärme und geringe Aggression" },
  "mood-heartbreak": { description: "Kalt-dunkle Spannung mit verletzten Akzenten" },
  "mood-longing": { description: "Gedämpfte Distanz und schwebende Farbe" },
  "mood-euphoria": { description: "Leuchtender Kontrast mit hoher Energie" },
  "mood-rage": { description: "Heiße Spannung und harter Kontrast" },
  "mood-dream": { description: "Weiche chromatische Atmosphäre" },
  "mood-tension": { description: "Komprimierter Kontrast und Unruhe" },
  "mood-calm": { description: "Ruhige Farbe mit niedrigem Druck" },

  "canvas-auto": { description: "Stabile automatische Canvas-Wahl pro Kapitel" },
  "canvas-night": { description: "Dunkles, fast neutrales Feld" },
  "canvas-paper": { description: "Helles getöntes Feld mit dunkler Schrift" },
  "canvas-color-field": { description: "Tiefes chromatisches Farbfeld" },
  "canvas-poster": { description: "Helles grafisches Feld mit dunkler Schrift" },

  "harmony-auto": { description: "Szenenbewusste OKLCH-Harmonie" },
  "harmony-split": { description: "Kontrast mit zwei benachbarten Gegenfarben" },
  "harmony-analogous": { description: "Nahe Farbtöne für eine zusammenhängende Atmosphäre" },
  "harmony-complement": { description: "Direkter Kontrast zweier Gegenfarben" },
  "harmony-triad": { description: "Drei ausgewogene Farbanker" },
  "harmony-tetrad": { description: "Vierpunkt-Palette mit grafischer Spannung" },
  "harmony-monochrome": { description: "Eine Farbe mit tonaler Hierarchie" },

  "lower-auto": { label: "Auto-Rotation", description: "Rotiert bei wiederkehrenden Einblendungen durch die Lower-Third-Familie" },
  "lower-clean": { description: "Ausgewogene Broadcast-Hierarchie mit zurückhaltender Bewegung" },
  "lower-underline": { description: "Ruhige Typografie mit einer einzelnen animierten Linie" },
  "lower-editorial": { description: "Magazinartige Künstler-/Titel-Aufteilung mit klarer Ausrichtung" },
  "lower-block": { description: "Massive Farbfläche für laute, direkte Intros" },
  "lower-glass": { description: "Transparente Glasfläche mit moderner Tiefenwirkung" },
  "lower-neon": { description: "Kompakter leuchtender Tag für dunkle Bildwelten" },
  "lower-corner": { description: "Eng gestapelte Typografie in der Safe-Area-Ecke" },
  "lower-ribbon": { description: "Langes horizontales Band mit gerichteter Einfahrt" },
  "lower-stamp": { description: "Gedrehter grafischer Stempel mit Poster-Energie" },
  "lower-credit": { description: "Elegante Film-Credit-Anmutung mit weiter Laufweite" },
};

export function localizeDirectorItem<T extends string>(
  item: DirectorCatalogItem<T>,
  language: UiLanguage,
): DirectorCatalogItem<T> {
  if (language === "en") return item;
  const translated = DE_ITEMS[item.preview];
  if (!translated) return item;
  return {
    ...item,
    label: translated.label ?? item.label,
    description: translated.description,
  };
}

export function copy(language: UiLanguage, english: string, german: string) {
  return language === "de" ? german : english;
}
