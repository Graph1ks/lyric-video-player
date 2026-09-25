import { contextBridge, ipcRenderer } from "electron";
import type { DesktopBridge } from "@graph1ks/emo-app-contracts";

const bridge: DesktopBridge = {
  chooseProjectRoot: () => ipcRenderer.invoke("emo:choose-project-root"),
};

contextBridge.exposeInMainWorld("emoDesktop", bridge);
