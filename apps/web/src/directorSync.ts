import { directorSharedState, useUiStore, type DirectorSharedState } from "./store";

const STATE_CHANNEL_NAME = "emo-director-control-v1";
const COMMAND_CHANNEL_NAME = "emo-director-command-v1";

type SyncMessage =
  | { kind: "hello"; source: string }
  | { kind: "state"; source: string; payload: DirectorSharedState };

export type DirectorCommand =
  | { kind: "toggle-play" }
  | { kind: "seek"; seconds: number }
  | { kind: "seek-relative"; seconds: number }
  | { kind: "toggle-mute" }
  | { kind: "set-volume"; volume: number }
  | { kind: "toggle-fullscreen" }
  | { kind: "load-audio"; file: File }
  | { kind: "load-lyrics"; file: File }
  | { kind: "presence"; open: boolean };

export function startDirectorSync() {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return () => {};
  }

  const source = createSourceId();
  const channel = new BroadcastChannel(STATE_CHANNEL_NAME);
  let applyingRemote = false;
  let lastSerialized = JSON.stringify(directorSharedState(useUiStore.getState()));

  const sendState = () => {
    const payload = directorSharedState(useUiStore.getState());
    lastSerialized = JSON.stringify(payload);
    channel.postMessage({ kind: "state", source, payload } satisfies SyncMessage);
  };

  const unsubscribe = useUiStore.subscribe(state => {
    if (applyingRemote) return;
    const payload = directorSharedState(state);
    const serialized = JSON.stringify(payload);
    if (serialized === lastSerialized) return;
    lastSerialized = serialized;
    channel.postMessage({ kind: "state", source, payload } satisfies SyncMessage);
  });

  channel.onmessage = event => {
    const message = event.data as SyncMessage;
    if (!message || message.source === source) return;

    if (message.kind === "hello") {
      sendState();
      return;
    }

    if (message.kind === "state") {
      applyingRemote = true;
      useUiStore.setState(message.payload);
      lastSerialized = JSON.stringify(message.payload);
      applyingRemote = false;
    }
  };

  channel.postMessage({ kind: "hello", source } satisfies SyncMessage);

  return () => {
    unsubscribe();
    channel.close();
  };
}

export function sendDirectorCommand(command: DirectorCommand) {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(COMMAND_CHANNEL_NAME);
  channel.postMessage(command);
  window.setTimeout(() => channel.close(), 0);
}

export function listenDirectorCommands(listener: (command: DirectorCommand) => void) {
  if (typeof BroadcastChannel === "undefined") return () => {};
  const channel = new BroadcastChannel(COMMAND_CHANNEL_NAME);
  channel.onmessage = event => listener(event.data as DirectorCommand);
  return () => channel.close();
}

function createSourceId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
