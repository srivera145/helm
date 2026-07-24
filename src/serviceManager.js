// src/serviceManager.js
//
// Registers Helm's bundled Apache and MySQL binaries as native Windows
// services, pointed at the configs bootstrap.js generated under DATA ROOT.
//
// This is still the core fix for XAMPP's "MySQL shutdown unexpectedly":
// Windows' Service Control Manager stops a service with a proper
// SERVICE_CONTROL_STOP signal, which both httpd.exe and mysqld.exe handle
// as a graceful shutdown -- unlike XAMPP's control panel, which hard-kills
// the bare child processes it spawns.
//
// NOTE: MySQL's own "mysqld --install <name>" flag registers a Windows
// service too, but MariaDB deliberately removed that from mysqld.exe
// (MDEV-19358, resolved 2024) in favor of registering the service the
// standard Windows way with `sc create`. Apache is unaffected -- `httpd.exe
// -k install` is Apache's own long-standing, still-current mechanism.
//
// PERMISSIONS: by default, only Administrators can start/stop a Windows
// service, even one already registered -- that's why every Start/Stop
// click prompted for UAC. Registering the service (installServices, below)
// also grants the current session's "Authenticated Users" group explicit
// SERVICE_START/SERVICE_STOP rights on just these two services, via the
// service's own security descriptor (SDDL) -- nothing broader like
// SERVICE_CHANGE_CONFIG. After that one-time grant, day-to-day start/stop
// genuinely doesn't need elevation. start/stop still try the elevated path
// as a fallback in case that grant didn't take for some reason, so nothing
// breaks even if it doesn't apply cleanly on a given machine.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { exec } = require('child_process');
const sudo = require('sudo-prompt');
const { paths } = require('./config');

const SUDO_OPTIONS = { name: 'Helm' };

function run(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { windowsHide: true }, (err, stdout, stderr) => {
      if (err) {
        // sc.exe writes its "service does not exist" message to STDOUT,
        // not STDERR -- using stderr alone here was silently dropping the
        // one piece of text queryServiceStatus actually needs to tell
        // "not installed yet" apart from a real failure.
        const combined = [stdout, stderr].filter((s) => s && s.trim()).join('\n');
        return reject(new Error(combined || err.message));
      }
      resolve(stdout.trim());
    });
  });
}

function runElevated(cmd) {
  return new Promise((resolve, reject) => {
    sudo.exec(cmd, SUDO_OPTIONS, (err, stdout, stderr) => {
      if (err) {
        const combined = [stdout, stderr].filter((s) => s && String(s).trim()).join('\n');
        return reject(new Error(combined || err.message));
      }
      resolve(String(stdout || '').trim());
    });
  });
}

// Elevated multi-step Windows operations go through a generated .bat file
// rather than one long inline "cmd1 & cmd2 & cmd3" string. `sc create`'s
// binPath value needs its own embedded, backslash-escaped quotes (see
// mysqlServiceLine below) -- nesting that correctly inside an
// already-quoted inline shell string invites exactly the kind of subtle
// Windows quoting bug this project has already hit twice. A plain .bat
// file with one command per line sidesteps that, and it's easy to inspect
// in %TEMP% if something still goes wrong.
function runElevatedScript(lines) {
  const scriptPath = path.join(os.tmpdir(), `helm-${Date.now()}.bat`);
  fs.writeFileSync(scriptPath, '@echo off\r\n' + lines.join('\r\n') + '\r\n', 'utf8');
  return runElevated(`"${scriptPath}"`).finally(() => {
    fs.unlink(scriptPath, () => {});
  });
}

// Reads a service's *existing* security descriptor and adds SERVICE_START
// (RP) + SERVICE_STOP (WP) to whatever "Authenticated Users" (AU) already
// has, rather than writing a whole new descriptor from scratch -- that
// keeps every other entry (SYSTEM, Administrators, etc.) exactly as
// Windows set them up, so there's no way this accidentally locks anyone
// out of managing the service. If no AU entry exists at all, it leaves
// the descriptor untouched rather than guessing one into existence.
//
// Windows' default service SDDL isn't identical across systems -- some use
// an AU (Authenticated Users) entry for the "ordinary logged-in user"
// group, others (confirmed on at least one real machine this shipped to)
// use IU (Interactive Users) instead, with no AU entry at all. IU is
// actually the more precise target for this anyway -- it specifically
// means "whoever is logged into the interactive session" (i.e. the person
// clicking Start/Stop in Helm's GUI), rather than the broader "any
// authenticated logon, including remote/network" that AU covers. Both are
// tried in order; whichever one actually exists in the descriptor gets
// the grant.
function grantStartStopScriptContent() {
  return `param([string]$ServiceName)

$rawLines = & sc.exe sdshow $ServiceName
$raw = ($rawLines -join '').Trim()

$candidates = @('AU', 'IU')
$applied = $false

foreach ($sid in $candidates) {
  if ($raw -match "\\(A;;([A-Z]+);;;$sid\\)") {
    $rights = $matches[1]
    $newRights = $rights
    if ($newRights -notmatch 'RP') { $newRights = $newRights + 'RP' }
    if ($newRights -notmatch 'WP') { $newRights = $newRights + 'WP' }

    if ($newRights -ne $rights) {
      $oldAce = "(A;;$rights;;;$sid)"
      $newAce = "(A;;$newRights;;;$sid)"
      $newSddl = $raw.Replace($oldAce, $newAce)
      & sc.exe sdset $ServiceName $newSddl | Out-Null
      Write-Host "Granted start/stop rights to $sid for $ServiceName"
    } else {
      Write-Host "$ServiceName already allows non-admin start/stop via $sid"
    }
    $applied = $true
    break
  }
}

if (-not $applied) {
  Write-Host "No AU or IU entry found in \${ServiceName}'s security descriptor -- leaving permissions unchanged"
  Write-Host "Actual descriptor was: $raw"
}
`;
}

function writeGrantScript() {
  const scriptPath = path.join(os.tmpdir(), `helm-grant-startstop-${Date.now()}.ps1`);
  fs.writeFileSync(scriptPath, grantStartStopScriptContent(), 'utf8');
  return scriptPath;
}

async function queryServiceStatus(serviceName) {
  try {
    const out = await run(`sc query "${serviceName}"`);
    const match = out.match(/STATE\s*:\s*\d+\s+(\w+)/);
    if (!match) return { installed: false, state: 'NOT_INSTALLED' };
    return { installed: true, state: match[1] };
  } catch (err) {
    if (/1060/.test(err.message) || /does not exist/i.test(err.message)) {
      return { installed: false, state: 'NOT_INSTALLED' };
    }
    return { installed: false, state: 'UNKNOWN', error: err.message };
  }
}

async function installServices() {
  const p = paths();
  const grantScript = writeGrantScript();

  // The trailing service name after --defaults-file tells mysqld.exe which
  // service it's running as, so it registers itself with the Service
  // Control Dispatcher correctly when Windows starts it -- this is the
  // documented working pattern for running mysqld/mariadbd as a Windows
  // service via sc create (mariadb-install-db.exe's own --service flag
  // does the same thing internally).
  const mysqlServiceLine =
    `sc create "${p.mysql.serviceName}" binPath= "\\"${p.mysql.binary}\\" --defaults-file=\\"${p.mysql.iniFile}\\" ${p.mysql.serviceName}" start= demand`;

  try {
    return await runElevatedScript([
      // -f pins Apache to Helm's generated conf (htdocs/logs under DATA ROOT).
      `"${p.apache.binary}" -k install -n "${p.apache.serviceName}" -f "${p.apache.generatedConf}"`,
      mysqlServiceLine,
      `sc config "${p.apache.serviceName}" start= demand`,
      `powershell -ExecutionPolicy Bypass -File "${grantScript}" -ServiceName "${p.apache.serviceName}"`,
      `powershell -ExecutionPolicy Bypass -File "${grantScript}" -ServiceName "${p.mysql.serviceName}"`
    ]);
  } finally {
    fs.unlink(grantScript, () => {});
  }
}

async function uninstallServices() {
  const p = paths();

  return runElevatedScript([
    `"${p.apache.binary}" -k uninstall -n "${p.apache.serviceName}"`,
    `sc delete "${p.mysql.serviceName}"`
  ]);
}

async function startService(serviceName) {
  try {
    return await run(`net start "${serviceName}"`);
  } catch (err) {
    // Falls back to elevated if the permission grant hasn't been applied
    // yet (e.g. a service registered before this version of Helm).
    return runElevated(`net start "${serviceName}"`);
  }
}

async function stopService(serviceName) {
  try {
    return await run(`net stop "${serviceName}"`);
  } catch (err) {
    return runElevated(`net stop "${serviceName}"`);
  }
}

async function restartService(serviceName) {
  await stopService(serviceName).catch(() => {});
  return startService(serviceName);
}

async function setAutoStart(serviceName, enabled) {
  // Left elevated deliberately: SERVICE_CHANGE_CONFIG is a meaningfully
  // more sensitive right than start/stop (it can alter the service's own
  // binary path), and this is a rarely-toggled setting, not a per-use
  // action -- not worth widening the granted permissions for.
  const mode = enabled ? 'auto' : 'demand';
  return runElevated(`sc config "${serviceName}" start= ${mode}`);
}

module.exports = {
  queryServiceStatus,
  installServices,
  uninstallServices,
  startService,
  stopService,
  restartService,
  setAutoStart
};
