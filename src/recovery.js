// src/recovery.js
//
// Automates (safely) the "rename data to data_old, restore from backup"
// dance. Only the InnoDB *system* files (ibdata1, ib_logfile0, ib_logfile1)
// get archived -- individual database files are untouched as long as
// innodb_file_per_table is on, which bootstrap.js's generated my.ini always
// sets.
//
// This is NOT a substitute for real backups. It reduces the blast radius
// of the manual process, it doesn't eliminate risk.

const fs = require('fs');
const path = require('path');
const { paths } = require('./config');

const SYSTEM_FILES = ['ibdata1', 'ib_logfile0', 'ib_logfile1', 'ib_buffer_pool'];

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function attemptCleanRecovery() {
  const p = paths();
  const dataDir = p.mysql.dataDir;
  const archiveDir = path.join(dataDir, `_helm_innodb_archive_${timestamp()}`);

  fs.mkdirSync(archiveDir, { recursive: true });

  const moved = [];
  const skipped = [];

  for (const file of SYSTEM_FILES) {
    const src = path.join(dataDir, file);
    const dest = path.join(archiveDir, file);
    if (fs.existsSync(src)) {
      fs.renameSync(src, dest);
      moved.push(file);
    } else {
      skipped.push(file);
    }
  }

  return {
    archiveDir,
    moved,
    skipped,
    message: moved.length
      ? `Archived ${moved.join(', ')} to ${archiveDir}. Start MySQL now -- InnoDB will rebuild fresh system files. Your individual databases were not touched.`
      : `No InnoDB system files were found in ${dataDir} to archive. This may not be an InnoDB corruption issue -- check the error log.`
  };
}

module.exports = { attemptCleanRecovery, SYSTEM_FILES };
