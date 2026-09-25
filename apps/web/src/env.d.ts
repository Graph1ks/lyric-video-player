import type { DesktopBridge } from "@graph1ks/emo-app-contracts";

declare global {
  interface Window {
    emoDesktop?: DesktopBridge;
  }
}

export {};
