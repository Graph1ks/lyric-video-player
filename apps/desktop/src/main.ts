import { app, BrowserWindow, dialog, ipcMain, type OpenDialogOptions } from "electron";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createEmoServer } from "@graph1ks/emo-server";

const moduleDir = resolve(fileURLToPath(new URL(".", import.meta.url)));
let mainWindow: BrowserWindow | null = null;
let directorWindow: BrowserWindow | null = null;
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

  ipcMain.handle("emo:open-director-window", async () => {
    await createDirectorWindow();
    return true;
  });

  ipcMain.handle("emo:choose-project-root", async () => {
    if (!server) return null;
    const selected = await chooseDirectory("Choose E-MO project directory", true);
    if (!selected) return null;
    server.setProjectRoot(selected);
    return server.listProjects();
  });

  ipcMain.handle("emo:choose-milkdrop-preset-root", async () => {
    if (!server) return null;
    const selected = await chooseDirectory("Choose MilkDrop preset library");
    if (!selected) return null;
    server.setMilkdropPresetRoot(selected);
    return server.getMilkdropLibrary();
  });

  ipcMain.handle("emo:choose-milkdrop-texture-root", async () => {
    if (!server) return null;
    const selected = await chooseDirectory("Choose MilkDrop texture directory");
    if (!selected) return null;
    server.setMilkdropTextureRoot(selected);
    return server.getMilkdropLibrary();
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

async function createDirectorWindow() {
  if (directorWindow && !directorWindow.isDestroyed()) {
    if (directorWindow.isMinimized()) directorWindow.restore();
    directorWindow.show();
    directorWindow.focus();
    return;
  }

  const win = new BrowserWindow({
    width: 1180,
    height: 860,
    minWidth: 760,
    minHeight: 620,
    backgroundColor: "#08090d",
    show: false,
    autoHideMenuBar: true,
    title: "E-MO Visual Director",
    webPreferences: {
      preload: join(moduleDir, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  directorWindow = win;
  win.once("ready-to-show", () => win.show());
  win.on("closed", () => {
    if (directorWindow === win) directorWindow = null;
  });
  await win.loadURL(`${serverUrl}/?director=1`);
}

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


async function chooseDirectory(title: string, allowCreate = false) {
  const properties: OpenDialogOptions["properties"] = allowCreate
    ? ["openDirectory", "createDirectory"]
    : ["openDirectory"];
  const options: OpenDialogOptions = { title, properties };
  const result = mainWindow
    ? await dialog.showOpenDialog(mainWindow, options)
    : await dialog.showOpenDialog(options);
  return result.canceled ? undefined : result.filePaths[0];
}
