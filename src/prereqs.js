// src/prereqs.js
//
// MariaDB's Windows build (like most compiled C/C++ Windows software,
// including MySQL/MariaDB in XAMPP itself) depends on the Visual C++
// Redistributable for Visual Studio 2015-2022 (x64) being installed
// system-wide. Without it, mysqld.exe crashes at the Windows loader level
// before it can print anything -- which is exactly the silent, no-output
// "Command failed" pattern this module exists to prevent.
//
// Helm bundles the official Microsoft installer (fetched at build time by
// server-build/fetch-binaries.ps1 from Microsoft's permanent aka.ms
// redirect) and installs it silently, once, as part of first-run setup --
// so this is never something the person running Helm has to know about or
// do manually.

const { exec, execFile } = require('child_process');
const sudo = require('sudo-prompt');
const { paths } = require('./config');

const SUDO_OPTIONS = { name: 'Helm' };

// Microsoft documents this redistributable's registry key as living under
// Wow6432Node even on 64-bit Windows, because the installer itself runs as
// a 32-bit process (see https://learn.microsoft.com/cpp/windows/redistributing-visual-cpp-files).
// Some installer versions have also been seen writing the non-redirected
// path, so both are checked -- whichever exists confirms it's installed.
const REGISTRY_KEYS = [
  'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\VisualStudio\\14.0\\VC\\Runtimes\\X64',
  'HKLM\\SOFTWARE\\Microsoft\\VisualStudio\\14.0\\VC\\Runtimes\\X64'
];

function queryRegistryInstalled(key) {
  return new Promise((resolve) => {
    exec(`reg query "${key}" /v Installed`, { windowsHide: true }, (err, stdout) => {
      if (err) return resolve(false);
      resolve(/0x1\b/.test(stdout));
    });
  });
}

async function isVCRedistInstalled() {
  for (const key of REGISTRY_KEYS) {
    if (await queryRegistryInstalled(key)) return true;
  }
  return false;
}

function installVCRedist() {
  const p = paths();
  const installerPath = p.prereqs.vcRedistInstaller;

  return new Promise((resolve, reject) => {
    // /install /quiet /norestart: no UI, no reboot prompt -- matches the
    // rest of Helm's "one click, no extra dialogs" setup flow. Needs
    // elevation since it installs system-wide runtime files, same as
    // service registration does.
    const cmd = `"${installerPath}" /install /quiet /norestart`;
    sudo.exec(cmd, SUDO_OPTIONS, (err, stdout, stderr) => {
      if (err) return reject(new Error(String(stderr || err.message || err)));
      resolve(true);
    });
  });
}

// Checks and installs only if missing -- safe to call on every setup run.
async function ensureVCRedist(onProgress = () => {}) {
  const installed = await isVCRedistInstalled();
  if (installed) {
    onProgress('Visual C++ Redistributable already installed');
    return { installed: true, didInstall: false };
  }

  onProgress('Installing Visual C++ Redistributable (one-time, needs admin approval)');
  await installVCRedist();

  // Re-check rather than trust the exit code blindly -- some redist
  // installers return 0 even on a no-op or partial failure.
  const nowInstalled = await isVCRedistInstalled();
  if (!nowInstalled) {
    throw new Error(
      'The Visual C++ Redistributable installer ran but the runtime still isn\'t detected. ' +
      'Try installing it manually from https://aka.ms/vs/17/release/vc_redist.x64.exe, then run setup again.'
    );
  }

  return { installed: true, didInstall: true };
}

module.exports = { isVCRedistInstalled, installVCRedist, ensureVCRedist };
