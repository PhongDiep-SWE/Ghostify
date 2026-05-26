const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  folders: {
    getAll: () => ipcRenderer.invoke("folders:getAll"),
    create: (folder) => ipcRenderer.invoke("folders:create", folder),
    update: (folder) => ipcRenderer.invoke("folders:update", folder),
    delete: (id) => ipcRenderer.invoke("folders:delete", id),
  },
  notebooks: {
    getAll: () => ipcRenderer.invoke("notebooks:getAll"),
    create: (notebook) => ipcRenderer.invoke("notebooks:create", notebook),
    update: (notebook) => ipcRenderer.invoke("notebooks:update", notebook),
    delete: (id) => ipcRenderer.invoke("notebooks:delete", id),
  },
  window: {
    enterLive: (bounds) => ipcRenderer.invoke("window:enterLive", bounds),
    exitLive: (bounds) => ipcRenderer.invoke("window:exitLive", bounds),
    getBounds: () => ipcRenderer.invoke("window:getBounds"),
  },
});
