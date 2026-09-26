import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { fetchMilkdropLibrary } from "@graph1ks/emo-platform-web";
import { copy } from "./directorI18n";
import { useUiStore } from "./store";

export function MilkdropLibraryPanel() {
  const queryClient = useQueryClient();
  const language = useUiStore(state => state.uiLanguage);
  const t = (en: string, de: string) => copy(language, en, de);
  const selectedId = useUiStore(state => state.milkdropPresetId);
  const statuses = useUiStore(state => state.milkdropPresetStatuses);
  const backgroundEngine = useUiStore(state => state.backgroundEngine);
  const setBackgroundEngine = useUiStore(state => state.setBackgroundEngine);
  const setPresetId = useUiStore(state => state.setMilkdropPresetId);
  const opacity = useUiStore(state => state.milkdropOpacity);
  const paletteInfluence = useUiStore(state => state.milkdropPaletteInfluence);
  const renderScale = useUiStore(state => state.milkdropRenderScale);
  const fxaa = useUiStore(state => state.milkdropFxaa);
  const blendSeconds = useUiStore(state => state.milkdropBlendSeconds);
  const setOpacity = useUiStore(state => state.setMilkdropOpacity);
  const setPaletteInfluence = useUiStore(state => state.setMilkdropPaletteInfluence);
  const setRenderScale = useUiStore(state => state.setMilkdropRenderScale);
  const setFxaa = useUiStore(state => state.setMilkdropFxaa);
  const setBlendSeconds = useUiStore(state => state.setMilkdropBlendSeconds);

  const [search, setSearch] = useState("");
  const [folder, setFolder] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const libraryQuery = useQuery({
    queryKey: ["milkdrop-library"],
    queryFn: fetchMilkdropLibrary,
    staleTime: 5_000,
  });
  const library = libraryQuery.data;

  const folders = useMemo(() => {
    const values = new Set<string>();
    for (const preset of library?.presets ?? []) {
      for (let depth = 1; depth <= preset.folders.length; depth++) {
        values.add(preset.folders.slice(0, depth).join("/"));
      }
    }
    return [...values].sort((a, b) => a.localeCompare(b));
  }, [library]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (library?.presets ?? []).filter(preset => {
      const folderMatch = !folder || preset.relativePath.startsWith(`${folder}/`);
      if (!folderMatch) return false;
      if (!needle) return true;
      return preset.name.toLowerCase().includes(needle)
        || preset.relativePath.toLowerCase().includes(needle);
    });
  }, [folder, library, search]);

  const virtual = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 58,
    overscan: 12,
  });

  async function choosePresetRoot() {
    const result = await window.emoDesktop?.chooseMilkdropPresetRoot();
    if (result) queryClient.setQueryData(["milkdrop-library"], result);
  }

  async function chooseTextureRoot() {
    const result = await window.emoDesktop?.chooseMilkdropTextureRoot();
    if (result) queryClient.setQueryData(["milkdrop-library"], result);
  }

  function randomPreset() {
    if (!filtered.length) return;
    const index = Math.floor(Math.random() * filtered.length);
    setPresetId(filtered[index].id);
  }

  return (
    <section className="milkdrop-library">
      <div className="milkdrop-library__head">
        <div>
          <span>MILKDROP / BUTTERCHURN</span>
          <b>{t("Local preset library", "Lokale Preset-Bibliothek")}</b>
          <small>
            {library?.configured
              ? `${library.presets.length.toLocaleString()} presets · ${library.rootLabel}`
              : t("Choose any folder containing .milk presets.", "Wähle einen beliebigen Ordner mit .milk-Presets.")}
          </small>
        </div>
        <div className="milkdrop-library__actions">
          {window.emoDesktop && (
            <>
              <button onClick={() => void choosePresetRoot()}>{t("PRESET FOLDER", "PRESET-ORDNER")}</button>
              <button onClick={() => void chooseTextureRoot()}>{t("TEXTURE FOLDER", "TEXTUR-ORDNER")}</button>
            </>
          )}
          <button
            className={backgroundEngine === "emo" ? "is-active" : ""}
            onClick={() => setBackgroundEngine("emo")}
          >
            E-MO WORLDS
          </button>
        </div>
      </div>

      {library?.configured ? (
        <>
          <div className="milkdrop-library__toolbar">
            <input
              type="search"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder={t("Search name or path…", "Name oder Pfad suchen…")}
            />
            <select value={folder} onChange={event => setFolder(event.target.value)}>
              <option value="">{t("All folders", "Alle Ordner")}</option>
              {folders.map(value => <option key={value} value={value}>{value}</option>)}
            </select>
            <button onClick={randomPreset} disabled={!filtered.length}>
              {t("RANDOM", "ZUFALL")}
            </button>
            <strong>{filtered.length.toLocaleString()}</strong>
          </div>

          <div className="milkdrop-library__browser">
            <aside>
              <button className={!folder ? "is-active" : ""} onClick={() => setFolder("")}>
                {t("All presets", "Alle Presets")}
              </button>
              {folders.map(value => (
                <button
                  key={value}
                  className={folder === value ? "is-active" : ""}
                  onClick={() => setFolder(value)}
                  title={value}
                >
                  {value}
                </button>
              ))}
            </aside>

            <div className="milkdrop-library__list" ref={listRef}>
              <div
                className="milkdrop-library__virtual"
                style={{ height: virtual.getTotalSize() }}
              >
                {virtual.getVirtualItems().map(row => {
                  const preset = filtered[row.index];
                  const status = statuses[preset.id]?.compatibility ?? "unconverted";
                  return (
                    <button
                      key={preset.id}
                      className={[
                        "milkdrop-preset-row",
                        selectedId === preset.id ? "is-selected" : "",
                      ].filter(Boolean).join(" ")}
                      style={{ transform: `translateY(${row.start}px)` }}
                      onClick={() => setPresetId(preset.id)}
                      title={preset.relativePath}
                    >
                      <span>
                        <b>{preset.name}</b>
                        <small>{preset.folders.join(" / ") || "/"}</small>
                      </span>
                      <em data-status={status}>{status.replaceAll("-", " ")}</em>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="milkdrop-library__settings">
            <label>
              <span>{t("OPACITY", "DECKKRAFT")} <b>{Math.round(opacity * 100)}%</b></span>
              <input type="range" min="0" max="1" step="0.01" value={opacity}
                onChange={event => setOpacity(Number(event.target.value))} />
            </label>
            <label>
              <span>{t("OKLCH PALETTE INFLUENCE", "OKLCH-PALETTENEINFLUSS")} <b>{Math.round(paletteInfluence * 100)}%</b></span>
              <input type="range" min="0" max="1" step="0.01" value={paletteInfluence}
                onChange={event => setPaletteInfluence(Number(event.target.value))} />
            </label>
            <label>
              <span>{t("PRESET BLEND", "PRESET-BLEND")} <b>{blendSeconds.toFixed(1)}s</b></span>
              <input type="range" min="0" max="8" step="0.1" value={blendSeconds}
                onChange={event => setBlendSeconds(Number(event.target.value))} />
            </label>
            <div>
              <span>{t("RENDER SCALE", "RENDER-SKALIERUNG")}</span>
              <div className="milkdrop-segmented">
                {([1, 1.5, 2] as const).map(value => (
                  <button
                    key={value}
                    className={renderScale === value ? "is-active" : ""}
                    onClick={() => setRenderScale(value)}
                  >{value}×</button>
                ))}
              </div>
            </div>
            <div>
              <span>FXAA</span>
              <button className={fxaa ? "is-active" : ""} onClick={() => setFxaa(!fxaa)}>
                {fxaa ? "ON" : "OFF"}
              </button>
            </div>
          </div>

          <div className="milkdrop-library__foot">
            <span>
              {t("Textures", "Texturen")}: {library.textureRootLabel ?? t("not configured", "nicht konfiguriert")}
              {" · "}{library.textures.length.toLocaleString()}
            </span>
            <span>
              {t(
                "Conversion is on-demand; failed presets remain visible with diagnostics.",
                "Konvertierung erfolgt bei Bedarf; fehlerhafte Presets bleiben mit Diagnose sichtbar.",
              )}
            </span>
          </div>
        </>
      ) : (
        <div className="milkdrop-library__empty">
          {libraryQuery.isLoading
            ? t("Scanning library…", "Bibliothek wird gescannt…")
            : window.emoDesktop
              ? t("No MilkDrop preset folder selected.", "Kein MilkDrop-Preset-Ordner ausgewählt.")
              : t(
                  "No MilkDrop library is configured on this runtime.",
                  "Für diese Runtime ist keine MilkDrop-Bibliothek konfiguriert.",
                )}
        </div>
      )}
    </section>
  );
}
