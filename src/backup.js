// src/backup.js
//
// The log-aware InnoDB recovery in recovery.js is explicitly best-effort --
// it's automating a manual rescue, not guaranteeing one. This is the actual
// guarantee: a plain mysqldump snapshot you can restore from regardless of
// what state the data directory is in.
//
// NOTE: MariaDB has been renaming its client tools (mariadb-dump.exe
// alongside/instead of mysqldump.exe, the same pattern as
// mariadb-install-db.exe replacing mysqld --initialize-insecure). Rather
// than assume one name, both are checked at call time and whichever
// actually exists is used.

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { paths } = require('./config');

function resolveDumpBinary() {
  const p = paths();
  if (fs.existsSync(p.backups.mysqldumpBinary)) return p.backups.mysqldumpBinary;
  if (fs.existsSync(p.backups.mariadbDumpBinary)) return p.backups.mariadbDumpBinary;
  return null;
}

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function listBackups() {
  const p = paths();
  try {
    return fs.readdirSync(p.backups.dir)
      .filter((f) => f.endsWith('.sql'))
      .map((f) => {
        const full = path.join(p.backups.dir, f);
        const stat = fs.statSync(full);
        return { name: f, path: full, size: stat.size, createdAt: stat.mtime };
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch (err) {
    return [];
  }
}

function runBackup() {
  const p = paths();
  const dumpBin = resolveDumpBinary();

  if (!dumpBin) {
    return Promise.reject(new Error(
      'Could not find mysqldump.exe or mariadb-dump.exe in the bundled MySQL folder. ' +
      'Backup requires one of these tools to be present.'
    ));
  }

  fs.mkdirSync(p.backups.dir, { recursive: true });
  const outFile = path.join(p.backups.dir, `helm-backup-${timestamp()}.sql`);

  const args = [
    '--host=127.0.0.1', `--port=${p.mysql.port}`, '--user=root',
    '--all-databases', '--routines', '--triggers', '--events',
    '--single-transaction', `--result-file=${outFile}`
  ];

  return new Promise((resolve, reject) => {
    execFile(dumpBin, args, { windowsHide: true }, (err, stdout, stderr) => {
      if (err) {
        const detail = (stderr && stderr.trim()) || (stdout && stdout.trim()) || err.message;
        return reject(new Error(`Backup failed: ${detail}`));
      }
      let size = 0;
      try { size = fs.statSync(outFile).size; } catch (e) { /* ignore */ }
      if (size === 0) {
        return reject(new Error('Backup ran but produced an empty file -- is MySQL actually running?'));
      }
      resolve({ path: outFile, size });
    });
  });
}

module.exports = { runBackup, listBackups, resolveDumpBinary };
