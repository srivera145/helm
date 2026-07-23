// main.js -- Electron main process

const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');

const cfg = require('./src/config');
const bootstrap = require('./src/bootstrap');
const serviceManager = require('./src/serviceManager');
const portChecker = require('./src/portChecker');
const logWatcher = require('./src/logWatcher');
const recovery = require('./src/recovery');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 640,
    minWidth: 760,
    minHeight: 560,
    backgroundColor: '#0B1215',
    title: 'Helm',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// --- Bootstrap (first run) -----------------------------------------

ipcMain.handle('bootstrap:status', () => ({
  binariesPresent: cfg.binariesPresent(),
  binaryDiagnostics: cfg.diagnoseBinaries(),
  isBootstrapped: cfg.isBootstrapped(),
  dataRoot: cfg.dataRoot()
}));

ipcMain.handle('bootstrap:run', async () => {
  try {
    await bootstrap.runBootstrap((step) => {
      if (mainWindow) mainWindow.webContents.send('bootstrap:progress', step);
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// --- Services --------------------------------------------------------

ipcMain.handle('services:status', async () => {
  const p = cfg.paths();
  const apache = await serviceManager.queryServiceStatus(p.apache.serviceName);
  const mysql = await serviceManager.queryServiceStatus(p.mysql.serviceName);
  return { apache, mysql };
});

ipcMain.handle('services:install', async () => {
  try {
    await serviceManager.installServices();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('services:uninstall', async () => {
  try {
    await serviceManager.uninstallServices();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

function serviceNameFor(key) {
  const p = cfg.paths();
  return key === 'apache' ? p.apache.serviceName : p.mysql.serviceName;
}

ipcMain.handle('services:start', async (_evt, key) => {
  try {
    await serviceManager.startService(serviceNameFor(key));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('services:stop', async (_evt, key) => {
  try {
    await serviceManager.stopService(serviceNameFor(key));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('services:restart', async (_evt, key) => {
  try {
    await serviceManager.restartService(serviceNameFor(key));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('services:autostart', async (_evt, { key, enabled }) => {
  try {
    await serviceManager.setAutoStart(serviceNameFor(key), enabled);
    const settings = cfg.loadSettings();
    settings.autoStart = settings.autoStart || {};
    settings.autoStart[key] = enabled;
    cfg.saveSettings(settings);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// --- Ports / Logs / Recovery ------------------------------------------

ipcMain.handle('ports:check', async (_evt, port) => {
  return portChecker.checkPort(port);
});

ipcMain.handle('logs:tail', async (_evt, key) => {
  const p = cfg.paths();
  const logPath = key === 'apache' ? p.apache.errorLog : p.mysql.errorLog;
  const text = logWatcher.tailFile(logPath);
  const issues = logWatcher.detectIssues(text);
  return { text, issues };
});

ipcMain.handle('recovery:mysql', async () => {
  try {
    const result = await recovery.attemptCleanRecovery();
    return { ok: true, ...result };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('shell:openHtdocsFolder', () => {
  const p = cfg.paths();
  shell.openPath(p.htdocs);
  return { ok: true };
});

// --- Open in browser (Apache site / phpMyAdmin) ------------------------
// Restricted to localhost so this can only ever open Helm's own services,
// never an arbitrary URL passed from elsewhere.

ipcMain.handle('shell:open', (_evt, url) => {
  let parsed;
  try {
    parsed = new URL(url);
  } catch (err) {
    return { ok: false, error: 'Invalid URL' };
  }
  if (!/^(localhost|127\.0\.0\.1)$/.test(parsed.hostname) || parsed.protocol !== 'http:') {
    return { ok: false, error: 'Only http://localhost URLs can be opened' };
  }
  shell.openExternal(url);
  return { ok: true };
});
