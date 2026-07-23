// src/portChecker.js
// Detects what's already bound to a port before Helm tries to start a
// service on it -- the other classic XAMPP failure mode alongside InnoDB
// corruption (Skype, IIS, a stray mysqld.exe from a previous session, etc).

const { exec } = require('child_process');

function run(cmd) {
  return new Promise((resolve) => {
    exec(cmd, { windowsHide: true }, (err, stdout) => {
      // netstat/tasklist returning nothing isn't an error condition here
      resolve(err ? '' : stdout);
    });
  });
}

async function checkPort(port) {
  const out = await run(`netstat -ano | findstr :${port}`);
  const lines = out.split('\n').map((l) => l.trim()).filter(Boolean);

  const listeners = [];
  for (const line of lines) {
    const parts = line.split(/\s+/);
    const localAddr = parts[1];
    const state = parts[3];
    const pid = parts[parts.length - 1];
    if (localAddr && localAddr.endsWith(`:${port}`) && state === 'LISTENING') {
      listeners.push({ pid, localAddr });
    }
  }

  if (listeners.length === 0) {
    return { port, inUse: false, processes: [] };
  }

  const processes = [];
  for (const { pid } of listeners) {
    const taskOut = await run(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`);
    const nameMatch = taskOut.match(/^"([^"]+)"/);
    processes.push({ pid, name: nameMatch ? nameMatch[1] : 'Unknown process' });
  }

  return { port, inUse: true, processes };
}

module.exports = { checkPort };
