import { useEffect } from "react";
import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "./App";
import { DirectorWindow } from "./DirectorWindow";
import { startDirectorSync } from "./directorSync";
import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/oswald";
import "@fontsource-variable/playfair-display";
import "@fontsource/ibm-plex-mono/700.css";
import "@fontsource-variable/caveat";
import "@fontsource/bangers/400.css";
import "./styles.css";
import "./milkdrop.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 2_000,
      refetchOnWindowFocus: false
    }
  }
});

function Root() {
  useEffect(() => startDirectorSync(), []);
  const isDirectorWindow = new URLSearchParams(window.location.search).get("director") === "1";
  return isDirectorWindow ? <DirectorWindow /> : <App />;
}

createRoot(document.getElementById("app")!).render(
  <QueryClientProvider client={queryClient}>
    <Root />
  </QueryClientProvider>
);
