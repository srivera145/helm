// preload.js -- exposes a narrow, safe API to the renderer (no direct Node access)

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('helm', {
  getBootstrapStatus: () => ipcRenderer.invoke('bootstrap:status'),
  runBootstrap: () => ipcRenderer.invoke('bootstrap:run'),
  onBootstrapProgress: (callback) => {
    const listener = (_evt, step) => callback(step);
    ipcRenderer.on('bootstrap:progress', listener);
    return () => ipcRenderer.removeListener('bootstrap:progress', listener);
  },

  getStatus: () => ipcRenderer.invoke('services:status'),
  install: () => ipcRenderer.invoke('services:install'),
  uninstall: () => ipcRenderer.invoke('services:uninstall'),

  start: (key) => ipcRenderer.invoke('services:start', key),
  stop: (key) => ipcRenderer.invoke('services:stop', key),
  restart: (key) => ipcRenderer.invoke('services:restart', key),
  setAutoStart: (key, enabled) => ipcRenderer.invoke('services:autostart', { key, enabled }),

  checkPort: (port) => ipcRenderer.invoke('ports:check', port),
  tailLog: (key) => ipcRenderer.invoke('logs:tail', key),
  recoverMysql: () => ipcRenderer.invoke('recovery:mysql'),
  openInBrowser: (url) => ipcRenderer.invoke('shell:open', url),
  openHtdocsFolder: () => ipcRenderer.invoke('shell:openHtdocsFolder'),

  listSites: () => ipcRenderer.invoke('vhosts:list'),
  pickSiteFolder: () => ipcRenderer.invoke('vhosts:pickFolder'),
  addSite: (domain, docRoot) => ipcRenderer.invoke('vhosts:add', { domain, docRoot }),
  removeSite: (domain) => ipcRenderer.invoke('vhosts:remove', domain),

  listBackups: () => ipcRenderer.invoke('backup:list'),
  runBackup: () => ipcRenderer.invoke('backup:run'),
  openBackupsFolder: () => ipcRenderer.invoke('shell:openBackupsFolder')
});
