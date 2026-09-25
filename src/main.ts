import "./styles.css";
import { AudioEngine } from "./audio/AudioEngine";
import { MasterClock } from "./core/MasterClock";
import type { QualityMode, VisualMode } from "./core/VisualTypes";
import { SCENE_LABELS } from "./core/VisualTypes";
import { ELRCParser, type ParsedLyrics } from "./lyrics/ELRCParser";
import { EngineRenderer } from "./render/EngineRenderer";

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
  <main class="shell" id="shell" data-ui-visible="true">
    <div id="stage" aria-label="Realtime lyric rendering stage"></div>
    <div class="screen-fx" aria-hidden="true">
      <div class="screen-fx__bloom"></div>
      <div class="screen-fx__scanlines"></div>
      <div class="screen-fx__grain"></div>
      <div class="screen-fx__vignette"></div>
    </div>

    <div class="drop-overlay" id="dropOverlay" aria-hidden="true">
      <div class="drop-card">
        <span class="drop-kicker">E-MO-ENGINE INGEST</span>
        <strong>DROP AUDIO + ENHANCED LRC</strong>
        <span>MP3 · M4A · AAC · LRC</span>
      </div>
    </div>

    <div class="ui-layer" id="uiLayer">
      <header class="topbar glass-panel">
        <div class="brand-lockup">
          <div class="brand-mark">E</div>
          <div>
            <div class="brand">E-MO-ENGINE</div>
            <div class="brand-sub">GRAPH1KS REALTIME LYRIC ENGINE · v0.3</div>
          </div>
        </div>
        <div class="top-actions">
          <div class="status-pill"><span class="status-dot"></span><span id="engineStatus">ENGINE READY</span></div>
          <button class="icon-button" id="fullscreen" title="Fullscreen · F" aria-label="Toggle fullscreen">⛶</button>
          <button class="icon-button" id="hideUi" title="Hide UI · Ctrl+Shift+H" aria-label="Hide interface">HUD</button>
        </div>
      </header>

      <aside class="scene-panel glass-panel">
        <div class="panel-kicker">VISUAL DIRECTOR</div>
        <div class="scene-tabs" role="group" aria-label="Visual mode">
          <button class="scene-tab is-active" data-mode="auto">AUTO</button>
          <button class="scene-tab" data-mode="poster">POSTER</button>
          <button class="scene-tab" data-mode="neon">NEON</button>
          <button class="scene-tab" data-mode="vortex">VORTEX</button>
        </div>

        <div class="readout-row">
          <span>ACTIVE SCENE</span><strong id="sceneReadout">Neon Cinema</strong>
        </div>

        <div class="audio-meter" aria-label="Audio reactive bands">
          <div><span class="meter-track"><i id="meterBass"></i></span><b>BASS</b></div>
          <div><span class="meter-track"><i id="meterMid"></i></span><b>MID</b></div>
          <div><span class="meter-track"><i id="meterTreble"></i></span><b>AIR</b></div>
        </div>

        <label class="control-row">
          <span>INTENSITY <b id="intensityValue">100%</b></span>
          <input id="intensity" type="range" min="20" max="180" value="100" step="1">
        </label>

        <div class="sync-control">
          <div class="control-heading"><span>LYRIC SYNC</span><b id="syncValue">+0 ms</b></div>
          <input id="syncOffset" type="range" min="-1500" max="1500" value="0" step="10" aria-label="Lyric sync offset">
          <div class="sync-buttons">
            <button class="micro-button" id="syncMinus">−50</button>
            <button class="micro-button" id="syncReset">RESET</button>
            <button class="micro-button" id="syncPlus">+50</button>
          </div>
        </div>

        <div class="quality-toggle" role="group" aria-label="Render quality">
          <button class="quality-button" data-quality="performance">PERF</button>
          <button class="quality-button is-active" data-quality="cinema">CINEMA</button>
        </div>

        <div class="director-footnote">AUTO uses lyric structure + repeated hooks for deterministic scene direction.</div>
      </aside>

      <section class="empty-state" id="emptyState">
        <div class="eyebrow">REALTIME MOTION GRAPHICS</div>
        <h1>DROP THE TRACK.<br><span>LET THE LYRICS MOVE.</span></h1>
        <p>MP3 / M4A + Enhanced LRC · word-sync · reactive camera · deterministic director</p>
        <div class="empty-actions">
          <label class="primary-file">LOAD AUDIO<input id="audioFile" type="file" accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,.mp3,.m4a,.aac"></label>
          <label class="secondary-file">LOAD LRC<input id="lrcFile" type="file" accept=".lrc,text/plain"></label>
        </div>
        <div class="drop-hint">or drop both files anywhere</div>
      </section>

      <footer class="transport glass-panel">
        <div class="transport-left">
          <button class="play-button" id="play" aria-label="Play or pause"><span id="playIcon">▶</span></button>
          <button class="mini-button" id="mute" aria-label="Mute or unmute">VOL</button>
          <input class="volume" id="volume" type="range" min="0" max="100" value="90" aria-label="Volume">
        </div>

        <div class="timeline-wrap">
          <div class="track-meta">
            <div class="track-text">
              <strong id="trackTitle">NO TRACK LOADED</strong>
              <span id="trackMeta">Load an audio file + Enhanced LRC</span>
            </div>
            <div class="time" id="time">00:00.000 / 00:00.000</div>
          </div>
          <input id="seek" class="seek" type="range" min="0" max="1000" value="0" aria-label="Playback position">
        </div>

        <div class="transport-right">
          <label class="compact-file">AUDIO<input id="audioFileBottom" type="file" accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,.mp3,.m4a,.aac"></label>
          <label class="compact-file">LRC<input id="lrcFileBottom" type="file" accept=".lrc,text/plain"></label>
          <div class="shortcut-hint"><kbd>CTRL</kbd><kbd>SHIFT</kbd><kbd>H</kbd><span>HUD</span></div>
        </div>
      </footer>
    </div>

    <button class="ui-restore" id="showUi" aria-label="Show interface">SHOW HUD · CTRL+SHIFT+H</button>
  </main>`;

const audio = new AudioEngine();
const clock = new MasterClock(audio.element);
const renderer = new EngineRenderer();
const parser = new ELRCParser();
let lyrics: ParsedLyrics = { offsetMs: 0, lines: [], meta: {} };
let seeking = false;
let loadedAudioName = "";
let loadedLyricsName = "";
let manualSyncMs = 0;
let dragDepth = 0;

const shell = byId<HTMLElement>("shell");
const stage = byId<HTMLElement>("stage");
const play = byId<HTMLButtonElement>("play");
const playIcon = byId<HTMLSpanElement>("playIcon");
const seek = byId<HTMLInputElement>("seek");
const timeEl = byId<HTMLDivElement>("time");
const volume = byId<HTMLInputElement>("volume");
const mute = byId<HTMLButtonElement>("mute");
const emptyState = byId<HTMLElement>("emptyState");
const trackTitle = byId<HTMLElement>("trackTitle");
const trackMeta = byId<HTMLElement>("trackMeta");
const engineStatus = byId<HTMLElement>("engineStatus");
const sceneReadout = byId<HTMLElement>("sceneReadout");
const intensity = byId<HTMLInputElement>("intensity");
const intensityValue = byId<HTMLElement>("intensityValue");
const syncOffset = byId<HTMLInputElement>("syncOffset");
const syncValue = byId<HTMLElement>("syncValue");
const dropOverlay = byId<HTMLElement>("dropOverlay");
const meterBass = byId<HTMLElement>("meterBass");
const meterMid = byId<HTMLElement>("meterMid");
const meterTreble = byId<HTMLElement>("meterTreble");

await renderer.init(stage);
renderer.setVisualMode("auto");
renderer.setIntensity(1);
renderer.setQuality("cinema");
clock.start();

renderer.onModeChange(mode => {
  sceneReadout.textContent = SCENE_LABELS[mode];
});

const audioInputs = [byId<HTMLInputElement>("audioFile"), byId<HTMLInputElement>("audioFileBottom")];
const lrcInputs = [byId<HTMLInputElement>("lrcFile"), byId<HTMLInputElement>("lrcFileBottom")];

audioInputs.forEach(input => input.addEventListener("change", async () => {
  const file = input.files?.[0];
  if (file) await loadAudioFile(file);
}));

lrcInputs.forEach(input => input.addEventListener("change", async () => {
  const file = input.files?.[0];
  if (file) await loadLyricsFile(file);
}));

play.addEventListener("click", async () => {
  await audio.toggle();
  syncPlayState();
});

audio.element.addEventListener("play", syncPlayState);
audio.element.addEventListener("pause", syncPlayState);
audio.element.addEventListener("ended", syncPlayState);

seek.addEventListener("pointerdown", () => seeking = true);
window.addEventListener("pointerup", () => {
  if (!seeking) return;
  seeking = false;
  seekToSlider();
});
seek.addEventListener("input", () => {
  if (clock.duration) seekToSlider();
});

volume.addEventListener("input", () => {
  audio.setVolume(Number(volume.value) / 100);
  syncMuteState();
});
mute.addEventListener("click", () => {
  audio.toggleMute();
  syncMuteState();
});

for (const button of document.querySelectorAll<HTMLButtonElement>(".scene-tab")) {
  button.addEventListener("click", () => setVisualMode(button.dataset.mode as VisualMode));
}

intensity.addEventListener("input", () => {
  const value = Number(intensity.value) / 100;
  renderer.setIntensity(value);
  intensityValue.textContent = `${intensity.value}%`;
});

syncOffset.addEventListener("input", () => setSyncOffset(Number(syncOffset.value)));
byId<HTMLButtonElement>("syncMinus").addEventListener("click", () => setSyncOffset(manualSyncMs - 50));
byId<HTMLButtonElement>("syncReset").addEventListener("click", () => setSyncOffset(0));
byId<HTMLButtonElement>("syncPlus").addEventListener("click", () => setSyncOffset(manualSyncMs + 50));

for (const button of document.querySelectorAll<HTMLButtonElement>(".quality-button")) {
  button.addEventListener("click", () => {
    const quality = button.dataset.quality as QualityMode;
    renderer.setQuality(quality);
    document.querySelectorAll(".quality-button").forEach(node => node.classList.toggle("is-active", node === button));
  });
}

byId<HTMLButtonElement>("hideUi").addEventListener("click", () => setUiVisible(false));
byId<HTMLButtonElement>("showUi").addEventListener("click", () => setUiVisible(true));
byId<HTMLButtonElement>("fullscreen").addEventListener("click", toggleFullscreen);

window.addEventListener("keydown", async event => {
  if (event.ctrlKey && event.shiftKey && event.code === "KeyH") {
    event.preventDefault();
    setUiVisible(shell.dataset.uiVisible !== "true");
    return;
  }
  if (isTextControl(event.target)) return;

  if (event.code === "Space") {
    event.preventDefault();
    await audio.toggle();
    syncPlayState();
  } else if (event.code === "KeyF") {
    event.preventDefault();
    await toggleFullscreen();
  } else if (event.code === "KeyM") {
    event.preventDefault();
    audio.toggleMute();
    syncMuteState();
  } else if (event.code === "ArrowLeft") {
    event.preventDefault();
    clock.seek(clock.time - (event.shiftKey ? 15 : 5));
  } else if (event.code === "ArrowRight") {
    event.preventDefault();
    clock.seek(clock.time + (event.shiftKey ? 15 : 5));
  } else if (event.code === "Escape" && shell.classList.contains("ui-hidden")) {
    setUiVisible(true);
  } else if (event.code === "Digit0") setVisualMode("auto");
  else if (event.code === "Digit1") setVisualMode("poster");
  else if (event.code === "Digit2") setVisualMode("neon");
  else if (event.code === "Digit3") setVisualMode("vortex");
  else if (event.code === "Comma") setSyncOffset(manualSyncMs - 50);
  else if (event.code === "Period") setSyncOffset(manualSyncMs + 50);
});

window.addEventListener("dragenter", event => {
  event.preventDefault();
  dragDepth += 1;
  dropOverlay.classList.add("is-visible");
});
window.addEventListener("dragover", event => event.preventDefault());
window.addEventListener("dragleave", event => {
  event.preventDefault();
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) dropOverlay.classList.remove("is-visible");
});
window.addEventListener("drop", async event => {
  event.preventDefault();
  dragDepth = 0;
  dropOverlay.classList.remove("is-visible");
  const files = [...(event.dataTransfer?.files ?? [])];
  const audioFile = files.find(isAudioFile);
  const lrcFile = files.find(file => file.name.toLowerCase().endsWith(".lrc"));
  if (audioFile) await loadAudioFile(audioFile);
  if (lrcFile) await loadLyricsFile(lrcFile);
});

clock.onTick(time => {
  const bands = audio.bands();
  const lyricTime = time + manualSyncMs / 1000;
  const index = activeLineIndex(lyrics, lyricTime);
  renderer.setLine(index >= 0 ? lyrics.lines[index] : undefined, index);
  renderer.update(time, bands, lyricTime);

  shell.style.setProperty("--bass", bands.bass.toFixed(3));
  shell.style.setProperty("--energy", bands.energy.toFixed(3));
  shell.style.setProperty("--transient", bands.transient.toFixed(3));
  meterBass.style.transform = `scaleY(${Math.max(0.04, bands.bass)})`;
  meterMid.style.transform = `scaleY(${Math.max(0.04, bands.mid)})`;
  meterTreble.style.transform = `scaleY(${Math.max(0.04, bands.treble)})`;

  if (!seeking && clock.duration) seek.value = String(Math.round((time / clock.duration) * 1000));
  timeEl.textContent = `${fmt(time)} / ${fmt(clock.duration)}`;
});

async function loadAudioFile(file: File) {
  engineStatus.textContent = "LOADING AUDIO";
  try {
    await audio.load(file);
    loadedAudioName = file.name;
    emptyState.classList.add("is-dismissed");
    engineStatus.textContent = "AUDIO READY";
    updateTrackMeta();
  } catch (error) {
    engineStatus.textContent = "AUDIO ERROR";
    console.error(error);
  }
}

async function loadLyricsFile(file: File) {
  try {
    lyrics = parser.parse(await file.text());
    renderer.setLyrics(lyrics.lines);
    loadedLyricsName = file.name;
    emptyState.classList.add("is-dismissed");
    engineStatus.textContent = `${lyrics.lines.length} CUES READY`;
    updateTrackMeta();
  } catch (error) {
    engineStatus.textContent = "LRC ERROR";
    console.error(error);
  }
}

function setVisualMode(mode: VisualMode) {
  renderer.setVisualMode(mode);
  document.querySelectorAll<HTMLButtonElement>(".scene-tab").forEach(node => {
    node.classList.toggle("is-active", node.dataset.mode === mode);
  });
}

function setSyncOffset(value: number) {
  manualSyncMs = Math.max(-1500, Math.min(1500, Math.round(value / 10) * 10));
  syncOffset.value = String(manualSyncMs);
  syncValue.textContent = `${manualSyncMs >= 0 ? "+" : ""}${manualSyncMs} ms`;
}

function setUiVisible(visible: boolean) {
  shell.dataset.uiVisible = String(visible);
  shell.classList.toggle("ui-hidden", !visible);
}

async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) await shell.requestFullscreen();
    else await document.exitFullscreen();
  } catch (error) {
    console.warn("Fullscreen unavailable", error);
  }
}

function seekToSlider() {
  if (!clock.duration) return;
  clock.seek((Number(seek.value) / 1000) * clock.duration);
}

function syncPlayState() {
  const paused = audio.element.paused;
  play.classList.toggle("is-playing", !paused);
  playIcon.textContent = paused ? "▶" : "❚❚";
  engineStatus.textContent = paused ? (audio.hasSource ? "PAUSED" : "ENGINE READY") : "PLAYING LIVE";
}

function syncMuteState() {
  mute.textContent = audio.muted || audio.volume < 0.001 ? "MUTED" : "VOL";
  mute.classList.toggle("is-muted", audio.muted || audio.volume < 0.001);
}

function updateTrackMeta() {
  const metaTitle = lyrics.meta.title?.trim();
  const metaArtist = lyrics.meta.artist?.trim();
  trackTitle.textContent = metaTitle || loadedAudioName.replace(/\.[^.]+$/, "") || "TRACK LOADED";
  const parts = [
    metaArtist,
    loadedLyricsName ? `${lyrics.lines.length} lyric cues` : undefined,
    loadedAudioName ? loadedAudioName.split(".").pop()?.toUpperCase() : undefined,
  ].filter(Boolean);
  trackMeta.textContent = parts.join(" · ") || "Ready";
}

function activeLineIndex(data: ParsedLyrics, time: number) {
  let lo = 0;
  let hi = data.lines.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const line = data.lines[mid];
    if (time < line.start) hi = mid - 1;
    else if (time >= line.end) lo = mid + 1;
    else return mid;
  }
  return -1;
}

function isAudioFile(file: File) {
  return file.type.startsWith("audio/") || /\.(mp3|m4a|aac)$/i.test(file.name);
}

function isTextControl(target: EventTarget | null) {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
}

function byId<T extends HTMLElement>(id: string) {
  return document.getElementById(id) as T;
}

function fmt(value: number) {
  if (!Number.isFinite(value)) value = 0;
  const m = Math.floor(value / 60).toString().padStart(2, "0");
  const s = Math.floor(value % 60).toString().padStart(2, "0");
  const ms = Math.floor((value % 1) * 1000).toString().padStart(3, "0");
  return `${m}:${s}.${ms}`;
}
