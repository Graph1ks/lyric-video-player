import { directorSharedState, useUiStore, type DirectorSharedState } from "./store";

const STATE_CHANNEL_NAME = "emo-director-control-v1";
const COMMAND_CHANNEL_NAME = "emo-director-command-v1";

type DirectorStatePatch = Partial<DirectorSharedState>;

type SyncMessage =
  | { kind: "hello"; source: string }
  | { kind: "state"; source: string; payload: DirectorSharedState }
  | { kind: "patch"; source: string; payload: DirectorStatePatch };

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
  let previous = directorSharedState(useUiStore.getState());

  const sendState = () => {
    const payload = directorSharedState(useUiStore.getState());
    previous = payload;
    channel.postMessage({ kind: "state", source, payload } satisfies SyncMessage);
  };

  const unsubscribe = useUiStore.subscribe(state => {
    if (applyingRemote) return;
    const next = directorSharedState(state);
    const patch = diffDirectorSharedState(previous, next);
    previous = next;
    if (!Object.keys(patch).length) return;
    channel.postMessage({ kind: "patch", source, payload: patch } satisfies SyncMessage);
  });

  channel.onmessage = event => {
    const message = event.data as SyncMessage;
    if (!message || message.source === source) return;

    if (message.kind === "hello") {
      sendState();
      return;
    }

    if (message.kind === "state" || message.kind === "patch") {
      applyingRemote = true;
      useUiStore.setState(message.payload);
      previous = directorSharedState(useUiStore.getState());
      applyingRemote = false;
    }
  };

  channel.postMessage({ kind: "hello", source } satisfies SyncMessage);

  return () => {
    unsubscribe();
    channel.close();
  };
}

export function diffDirectorSharedState(
  previous: DirectorSharedState,
  next: DirectorSharedState,
): DirectorStatePatch {
  const patch: DirectorStatePatch = {};
  for (const key of Object.keys(next) as Array<keyof DirectorSharedState>) {
    if (Object.is(previous[key], next[key])) continue;
    // TypeScript cannot express keyed assignment of a heterogeneous Partial
    // without collapsing the value to never. Runtime keys and values both
    // originate from DirectorSharedState, so the assignment is safe.
    (patch as Record<string, unknown>)[key] = next[key];
  }
  return patch;
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
