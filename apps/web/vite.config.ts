import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const backendPort = process.env.EMO_PORT || "3040";
const backendUrl = process.env.EMO_DEV_SERVER_URL || `http://127.0.0.1:${backendPort}`;

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": { target: backendUrl, changeOrigin: false },
      "/media": { target: backendUrl, changeOrigin: false }
    }
  },
  build: {
    sourcemap: true
  }
});
