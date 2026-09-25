import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

function source(relativePath) {
  return readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

test("detached Director keeps operator actions and transport in separate rows", async () => {
  const [director, css] = await Promise.all([
    source("apps/web/src/DirectorWindow.tsx"),
    source("apps/web/src/styles.css"),
  ]);

  assert.match(director, /director-window-track director-window-transport/);
  assert.match(css, /\.director-window-transport\s*\{[\s\S]*grid-column:\s*1 \/ -1;[\s\S]*grid-row:\s*2;/);
  assert.match(css, /\.director-window-actions\s*\{[\s\S]*grid-row:\s*1;/);
});

test("HUD text control owns a text-sized border box", async () => {
  const [app, css] = await Promise.all([
    source("apps/web/src/App.tsx"),
    source("apps/web/src/styles.css"),
  ]);

  assert.match(app, /className="icon-button hud-button"/);
  assert.match(css, /\.hud-button\s*\{[\s\S]*width:\s*auto;[\s\S]*min-width:\s*52px;/);
});
