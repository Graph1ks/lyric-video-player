import { app, BrowserWindow, dialog, ipcMain, type OpenDialogOptions } from "electron";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createEmoServer } from "@graph1ks/emo-server";

const moduleDir = resolve(fileURLToPath(new URL(".", import.meta.url)));
let mainWindow: BrowserWindow | null = null;
let server: ReturnType<typeof createEmoServer> | null = null;
let serverUrl = "";

app.whenReady().then(async () => {
  const initialRoot = resolve(readArg("--root") || process.env.EMO_PROJECT_ROOT || resolve(process.cwd(), "projects"));
  const webDist = app.isPackaged
    ? join(process.resourcesPath, "web")
    : resolve(app.getAppPath(), "../web/dist");

  server = createEmoServer({
    projectRoot: initialRoot,
    webDist,
    mode: "desktop",
    canChooseDirectory: true,
    canWriteProjectRoot: false,
  });
  const listening = await server.listen(0, "127.0.0.1");
  serverUrl = listening.url;

  ipcMain.handle("emo:choose-project-root", async () => {
    if (!server) return null;
    const options: OpenDialogOptions = {
      title: "Choose E-MO project directory",
      properties: ["openDirectory", "createDirectory"],
    };
    const result = mainWindow
      ? await dialog.showOpenDialog(mainWindow, options)
      : await dialog.showOpenDialog(options);
    if (result.canceled || !result.filePaths[0]) return null;
    server.setProjectRoot(result.filePaths[0]);
    return server.listProjects();
  });

  await createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) void createMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (server) void server.close();
});

async function createMainWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: "#030407",
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(moduleDir, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow = win;
  win.once("ready-to-show", () => win.show());
  win.on("closed", () => {
    if (mainWindow === win) mainWindow = null;
  });
  await win.loadURL(serverUrl);
}

function readArg(name: string) {
  const direct = process.argv.find(arg => arg.startsWith(`${name}=`));
  if (direct) return direct.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}
