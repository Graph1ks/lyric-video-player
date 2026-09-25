import { directorSharedState, useUiStore, type DirectorSharedState } from "./store";

const CHANNEL_NAME = "emo-director-control-v1";

type SyncMessage =
  | { kind: "hello"; source: string }
  | { kind: "state"; source: string; payload: DirectorSharedState };

export function startDirectorSync() {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return () => {};
  }

  const source = createSourceId();
  const channel = new BroadcastChannel(CHANNEL_NAME);
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

function createSourceId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
