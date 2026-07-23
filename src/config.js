// src/config.js
//
// Everything -- vendor binaries AND the data they generate (MySQL's data
// directory, htdocs, logs, generated configs) -- lives under one root, the
// same way XAMPP puts everything under C:\xampp.
//
//   Packaged:  <install dir>\resources\server
//   Dev:       <repo>\resources\server
//
// This used to be split into a separate "resources root" (binaries) and
// "data root" (LOCALAPPDATA, for mutable data) specifically to avoid
// needing admin rights for routine writes -- that split only matters if
// Helm installs into C:\Program Files, which has restrictive permissions
// by default. Helm's installer instead defaults to C:\Helm (see
// build/installer.nsh), a plain top-level folder with normal permissions
// -- the same reasoning XAMPP itself uses for recommending C:\xampp over
// Program Files. Once that's true, the split serves no purpose.

const fs = require('fs');
const path = require('path');
const { app } = require('electron');

function resourcesRoot() {
  // process.resourcesPath is already the "resources" folder inside an
  // installed app (that's Electron's own convention) -- appending
  // 'resources' again on top of it, the way the dev-mode branch correctly
  // does relative to the plain repo folder, produces a doubled
  // resources\resources\server path. Only append 'server' in the packaged
  // case; the dev case still needs both segments since __dirname there is
  // just the repo root, with no pre-existing "resources" component.
  if (app && app.isPackaged) {
    return path.join(process.resourcesPath, 'server');
  }
  return path.join(__dirname, '..', 'resources', 'server');
}

// Kept as an alias so nothing elsewhere needs to know the two roots were
// ever separate -- it's just resourcesRoot() now.
function dataRoot() {
  return resourcesRoot();
}

function settingsFile() {
  const dir = app ? app.getPath('userData') : require('os').tmpdir();
  return path.join(dir, 'helm.settings.json');
}

function paths() {
  const root = resourcesRoot();

  return {
    root,
    resourcesRoot: root,
    dataRoot: root,

    apache: {
      serviceName: 'HelmApache',
      binary: path.join(root, 'apache', 'bin', 'httpd.exe'),
      vendorConf: path.join(root, 'apache', 'conf', 'httpd.conf'),
      generatedConf: path.join(root, 'apache', 'conf', 'httpd-helm.conf'),
      logsDir: path.join(root, 'apache', 'logs'),
      errorLog: path.join(root, 'apache', 'logs', 'error.log'),
      pidFile: path.join(root, 'apache', 'logs', 'httpd.pid'),
      port: 80
    },

    mysql: {
      serviceName: 'HelmMySQL',
      binary: path.join(root, 'mysql', 'bin', 'mysqld.exe'),
      installDbBinary: path.join(root, 'mysql', 'bin', 'mariadb-install-db.exe'),
      basedir: path.join(root, 'mysql'),
      iniFile: path.join(root, 'mysql', 'my.ini'),
      dataDir: path.join(root, 'mysql', 'data'),
      errorLog: path.join(root, 'mysql', 'data', 'mysql_error.log'),
      port: 3306
    },

    php: {
      dir: path.join(root, 'php'),
      extDir: path.join(root, 'php', 'ext'),
      apacheModule: path.join(root, 'php', 'php8apache2_4.dll'),
      vendorIniDev: path.join(root, 'php', 'php.ini-development'),
      iniFile: path.join(root, 'php', 'php.ini')
    },

    // vendorDir and dataDir are now the same folder -- phpMyAdmin gets
    // configured in place, no copy step needed, since there's no more
    // read-only-vendor vs. mutable-data distinction.
    phpMyAdmin: {
      vendorDir: path.join(root, 'phpmyadmin'),
      dataDir: path.join(root, 'phpmyadmin'),
      configFile: path.join(root, 'phpmyadmin', 'config.inc.php')
    },

    prereqs: {
      vcRedistInstaller: path.join(root, 'prereqs', 'vc_redist.x64.exe')
    },

    htdocs: path.join(root, 'htdocs')
  };
}

function binariesPresent() {
  return diagnoseBinaries().every((item) => item.exists);
}

function diagnoseBinaries() {
  const p = paths();
  return [
    { label: 'Apache (httpd.exe)', path: p.apache.binary, exists: fs.existsSync(p.apache.binary) },
    { label: 'MySQL (mysqld.exe)', path: p.mysql.binary, exists: fs.existsSync(p.mysql.binary) },
    { label: 'MySQL install tool (mariadb-install-db.exe)', path: p.mysql.installDbBinary, exists: fs.existsSync(p.mysql.installDbBinary) },
    { label: 'PHP Apache module (php8apache2_4.dll)', path: p.php.apacheModule, exists: fs.existsSync(p.php.apacheModule) },
    { label: 'phpMyAdmin (index.php)', path: path.join(p.phpMyAdmin.vendorDir, 'index.php'), exists: fs.existsSync(path.join(p.phpMyAdmin.vendorDir, 'index.php')) },
    { label: 'Visual C++ Redistributable installer', path: p.prereqs.vcRedistInstaller, exists: fs.existsSync(p.prereqs.vcRedistInstaller) }
  ];
}

function isBootstrapped() {
  const p = paths();
  return fs.existsSync(p.apache.generatedConf)
    && fs.existsSync(p.mysql.iniFile)
    && fs.existsSync(path.join(p.mysql.dataDir, 'mysql')) // system schema present
    && fs.existsSync(p.phpMyAdmin.configFile);
}

function loadSettings() {
  try {
    return JSON.parse(fs.readFileSync(settingsFile(), 'utf8'));
  } catch (err) {
    return { autoStart: { apache: false, mysql: false } };
  }
}

function saveSettings(settings) {
  fs.mkdirSync(path.dirname(settingsFile()), { recursive: true });
  fs.writeFileSync(settingsFile(), JSON.stringify(settings, null, 2), 'utf8');
  return settings;
}

module.exports = {
  resourcesRoot,
  dataRoot,
  paths,
  binariesPresent,
  diagnoseBinaries,
  isBootstrapped,
  loadSettings,
  saveSettings
};
