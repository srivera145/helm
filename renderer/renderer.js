// renderer.js -- no Node access here, only window.helm exposed by preload.js

const setupScreen = document.getElementById('setup-screen');
const mainScreen = document.getElementById('main-screen');
const setupError = document.getElementById('setup-error');
const setupProgress = document.getElementById('setup-progress');
const setupProgressText = document.getElementById('setup-progress-text');
const continueBtn = document.getElementById('continue-btn');
const installBanner = document.getElementById('install-banner');
const statusText = document.getElementById('status-text');

let pollTimer = null;

const STATE_TO_DOT = {
  RUNNING: 'dot-running',
  STOPPED: 'dot-stopped',
  START_PENDING: 'dot-transition',
  STOP_PENDING: 'dot-transition',
  NOT_INSTALLED: 'dot-stopped',
  UNKNOWN: 'dot-transition'
};

function humanState(state) {
  switch (state) {
    case 'RUNNING': return 'Running';
    case 'STOPPED': return 'Stopped';
    case 'START_PENDING': return 'Starting\u2026';
    case 'STOP_PENDING': return 'Stopping\u2026';
    case 'NOT_INSTALLED': return 'Not registered as a service';
    default: return 'Unknown';
  }
}

async function init() {
  const status = await window.helm.getBootstrapStatus();

  if (!status.binariesPresent) {
    setupScreen.classList.remove('hidden');
    mainScreen.classList.add('hidden');
    const missing = status.binaryDiagnostics.filter((item) => !item.exists);
    const lines = missing.map((item) => `\u2717 ${item.label}\n  expected at: ${item.path}`);
    setupError.textContent = 'Missing bundled server files:\n\n' + lines.join('\n\n') +
      '\n\nRun npm run build:server again, or check the file above landed where expected.';
    setupError.classList.remove('hidden');
    continueBtn.disabled = true;
    return;
  }

  if (!status.isBootstrapped) {
    setupScreen.classList.remove('hidden');
    mainScreen.classList.add('hidden');
    return;
  }

  showMainScreen();
}

function showMainScreen() {
  setupScreen.classList.add('hidden');
  mainScreen.classList.remove('hidden');
  window.helm.getBootstrapStatus().then((status) => {
    document.getElementById('settings-data-root').textContent = status.dataRoot;
  });
  refreshStatus();
  if (!pollTimer) pollTimer = setInterval(refreshStatus, 4000);
}

// ---------- Setup screen ----------

window.helm.onBootstrapProgress((step) => {
  setupProgress.classList.remove('hidden');
  setupProgressText.textContent = step;
});

continueBtn.addEventListener('click', async () => {
  setupError.classList.add('hidden');
  continueBtn.disabled = true;
  continueBtn.textContent = 'Setting up\u2026';
  setupProgress.classList.remove('hidden');

  const res = await window.helm.runBootstrap();

  continueBtn.disabled = false;
  continueBtn.textContent = 'Set up Helm';

  if (!res.ok) {
    setupError.textContent = res.error;
    setupError.classList.remove('hidden');
    return;
  }

  showMainScreen();
});

document.getElementById('rerun-setup-btn').addEventListener('click', async () => {
  settingsDrawer.classList.add('hidden');
  mainScreen.classList.add('hidden');
  setupScreen.classList.remove('hidden');
  setupProgress.classList.add('hidden');
  setupError.classList.add('hidden');
});

// ---------- Status polling ----------

async function refreshStatus() {
  const status = await window.helm.getStatus();
  let needsAttention = false;
  const unknownErrors = [];

  for (const key of ['apache', 'mysql']) {
    const info = status[key];
    if (info.state === 'NOT_INSTALLED') needsAttention = true;
    if (info.state === 'UNKNOWN') {
      // Treat UNKNOWN the same as NOT_INSTALLED for the banner -- if
      // Helm can't positively confirm a service is registered, the safe
      // assumption is that it isn't, rather than silently doing nothing.
      needsAttention = true;
      if (info.error) unknownErrors.push(`${key}: ${info.error}`);
    }
    applyState(key, info.state);
  }

  installBanner.classList.toggle('hidden', !needsAttention);
  statusText.textContent = unknownErrors.length
    ? `Last checked ${new Date().toLocaleTimeString()} -- ${unknownErrors.join(' | ')}`
    : `Last checked ${new Date().toLocaleTimeString()}`;
}

const GAUGE_IMAGES = {
  running: 'assets/gauge-ahead.png',
  stopped: 'assets/gauge-stop.png',
  transition: 'assets/gauge-standby.png'
};

function applyState(key, rawState) {
  const gauge = document.querySelector(`[data-gauge="${key}"]`);
  const dot = document.querySelector(`[data-dot="${key}"]`);
  const label = document.querySelector(`[data-state-text="${key}"]`);

  const bucket =
    rawState === 'RUNNING' ? 'running' :
    rawState === 'STOPPED' || rawState === 'NOT_INSTALLED' ? 'stopped' :
    'transition';

  const nextSrc = GAUGE_IMAGES[bucket];
  if (!gauge.src.endsWith(nextSrc)) gauge.src = nextSrc;

  dot.className = 'state-dot ' + (STATE_TO_DOT[rawState] || 'dot-transition');
  label.textContent = humanState(rawState);
}

// ---------- Start / Stop / Restart ----------

document.querySelectorAll('[data-action]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const action = btn.dataset.action;
    const target = btn.dataset.target;

    if (action === 'log') {
      openLogDrawer(target);
      return;
    }

    if (action === 'open') {
      window.helm.openInBrowser('http://localhost/');
      return;
    }

    if (action === 'open-pma') {
      window.helm.openInBrowser('http://localhost/phpmyadmin/');
      return;
    }

    if (action === 'open-htdocs') {
      window.helm.openHtdocsFolder();
      return;
    }

    btn.disabled = true;
    statusText.textContent = `${action === 'start' ? 'Starting' : action === 'stop' ? 'Stopping' : 'Restarting'} ${target}\u2026`;

    const fn = { start: window.helm.start, stop: window.helm.stop, restart: window.helm.restart }[action];
    const res = await fn(target);

    btn.disabled = false;
    if (!res.ok) {
      statusText.textContent = `${target}: ${res.error}`;
    }
    refreshStatus();
  });
});

document.querySelectorAll('[data-autostart]').forEach((checkbox) => {
  checkbox.addEventListener('change', async () => {
    const key = checkbox.dataset.autostart;
    await window.helm.setAutoStart(key, checkbox.checked);
  });
});

document.getElementById('install-btn').addEventListener('click', async () => {
  const btn = document.getElementById('install-btn');
  btn.disabled = true;
  btn.textContent = 'Registering\u2026 approve the Windows prompt';
  const res = await window.helm.install();
  btn.disabled = false;
  btn.textContent = 'Register services';
  if (!res.ok) {
    statusText.textContent = `Install failed: ${res.error}`;
  } else {
    statusText.textContent = 'Services registered.';
  }
  refreshStatus();
});

// ---------- Log drawer ----------

const logDrawer = document.getElementById('log-drawer');
const logDrawerTitle = document.getElementById('log-drawer-title');
const logText = document.getElementById('log-text');
const issuesPanel = document.getElementById('issues-panel');
const issuesList = document.getElementById('issues-list');
const recoverBtn = document.getElementById('recover-btn');
const recoveryResult = document.getElementById('recovery-result');

async function openLogDrawer(key) {
  logDrawerTitle.textContent = `${key === 'apache' ? 'Apache' : 'MySQL'} error log`;
  recoveryResult.classList.add('hidden');
  logDrawer.classList.remove('hidden');

  const { text, issues } = await window.helm.tailLog(key);
  logText.textContent = text || '(log is empty or not found yet)';

  if (issues.length && key === 'mysql') {
    issuesList.innerHTML = '';
    issues.forEach((issue) => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${issue.label}</strong><span class="hint">${issue.hint}</span>`;
      issuesList.appendChild(li);
    });
    issuesPanel.classList.remove('hidden');
    recoverBtn.classList.remove('hidden');
  } else {
    issuesPanel.classList.add('hidden');
  }
}

document.getElementById('close-drawer').addEventListener('click', () => {
  logDrawer.classList.add('hidden');
});

recoverBtn.addEventListener('click', async () => {
  recoverBtn.disabled = true;
  recoverBtn.textContent = 'Archiving InnoDB system files\u2026';
  const res = await window.helm.recoverMysql();
  recoverBtn.disabled = false;
  recoverBtn.textContent = 'Attempt clean recovery';

  recoveryResult.classList.remove('hidden');
  recoveryResult.textContent = res.ok ? res.message : `Recovery failed: ${res.error}`;
});

// ---------- Settings drawer ----------

const settingsDrawer = document.getElementById('settings-drawer');

document.getElementById('settings-btn').addEventListener('click', () => {
  settingsDrawer.classList.remove('hidden');
});
document.getElementById('close-settings').addEventListener('click', () => {
  settingsDrawer.classList.add('hidden');
});

document.getElementById('uninstall-btn').addEventListener('click', async () => {
  const confirmed = confirm('This unregisters the Helm-managed Apache and MySQL Windows services. Your htdocs and databases are untouched. Continue?');
  if (!confirmed) return;
  const res = await window.helm.uninstall();
  statusText.textContent = res.ok ? 'Services unregistered.' : `Uninstall failed: ${res.error}`;
  refreshStatus();
});

document.querySelectorAll('[data-check-port]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const port = Number(btn.dataset.checkPort);
    const result = document.getElementById('port-check-result');
    result.textContent = 'Checking\u2026';
    const res = await window.helm.checkPort(port);
    if (!res.inUse) {
      result.textContent = `Port ${port} is free.`;
    } else {
      result.textContent = `Port ${port} is in use by: ` +
        res.processes.map((p) => `${p.name} (PID ${p.pid})`).join(', ');
    }
  });
});

init();
