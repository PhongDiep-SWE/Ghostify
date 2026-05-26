const { app, BrowserWindow, globalShortcut, ipcMain } = require("electron");
const path = require("path");
const store = require("./store/index");

const isDev = process.env.NODE_ENV === "development";

function createWindow() {
  const win = new BrowserWindow({
    width: 780,
    height: 540,
    minWidth: 560,
    minHeight: 400,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Hide window from screen sharing — only you can see it
  win.setContentProtection(true);
  win.setAlwaysOnTop(true, "floating");

  if (isDev) {
    win.loadURL("http://localhost:5275");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

// a funtion that takes a key (notebooks, folders) and registers the corresponding handlers (delete, create, getAll) for it
const registerCrud = (key) => {
  ipcMain.handle(`${key}:getAll`, () => store.get(key));

  ipcMain.handle(`${key}:create`, (_, obj) => {
    const objects = store.get(key);
    store.set(key, [...objects, obj]);
    return obj;
  });

  ipcMain.handle(`${key}:update`, (_, obj) => {
    const objects = store.get(key);
    store.set(
      key,
      objects.map((o) => (o.id === obj.id ? obj : o))
    );
    return obj;
  });

  ipcMain.handle(`${key}:delete`, (_, id) => {
    const objects = store.get(key);
    store.set(
      key,
      objects.filter((o) => o.id !== id)
    );
  });
};

registerCrud("folders");
registerCrud("notebooks");

app.whenReady().then(() => {
  createWindow();

  // Global shortcut: Cmd+Shift+0 hides/shows the window
  globalShortcut.register("CommandOrControl+Shift+0", () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (!win) return;
    win.isVisible() ? win.hide() : win.show();
  });
});

app.on("window-all-closed", () => {
  globalShortcut.unregisterAll();
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.handle("window:enterLive", (_, { x, y, width, height }) => {
  const win = BrowserWindow.getAllWindows()[0];
  win.setSize(width, height);
  win.setPosition(x, y);
  win.setAlwaysOnTop(true, "screen-saver");
  win.setHasShadow(true);
});

ipcMain.handle("window:exitLive", (_, { x, y, width, height }) => {
  const win = BrowserWindow.getAllWindows()[0];
  win.setSize(width, height);
  win.setPosition(x, y);
  win.setAlwaysOnTop(true, "floating");
});

ipcMain.handle("window:getBounds", () => {
  const win = BrowserWindow.getAllWindows()[0];
  return win.getBounds();
});
