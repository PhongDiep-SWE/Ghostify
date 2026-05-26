export const api = {
  folders: {
    getAll: () => window.electronAPI?.folders.getAll(),
    create: (folder) => window.electronAPI.folders.create(folder),
    delete: (id) => window.electronAPI.folders.delete(id),
    update: (folder) => window.electronAPI.folders.update(folder),
  },
  notebooks: {
    getAll: () => window.electronAPI?.notebooks.getAll(),
    create: (notebook) => window.electronAPI.notebooks.create(notebook),
    update: (updated) => window.electronAPI.notebooks.update(updated),
    delete: (id) => window.electronAPI.notebooks.delete(id),
  },
  livemode: {
    goLive: (screen) => window.electronAPI.window.enterLive(screen),
    exitLive: (bound) => window.electronAPI.window.exitLive(bound),
    getBounds: () => window.electronAPI?.window.getBounds(),
  },
};
