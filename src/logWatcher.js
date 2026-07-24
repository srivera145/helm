// src/logWatcher.js
// Tails error logs in real time and pattern-matches known failure signatures
// so Helm can tell you *what* actually broke instead of XAMPP's generic
// "press the Logs button" dead end.

const fs = require('fs');
const path = require('path');

// Known InnoDB corruption / unclean-shutdown signatures. This list is what
// lets Helm's recovery panel show "here's what's wrong" instead of just
// dumping raw log text.
const KNOWN_ISSUES = [
  {
    pattern: /InnoDB: Database page corruption/i,
    label: 'InnoDB page corruption',
    hint: 'A data page failed its checksum, usually from a prior unclean shutdown. Recovery will back up mysql/data and reset the InnoDB system files.'
  },
  {
    pattern: /Plugin 'InnoDB' registration as a STORAGE ENGINE failed/i,
    label: 'InnoDB engine failed to load',
    hint: 'InnoDB could not initialize, commonly due to a corrupted ibdata1 or log file mismatch.'
  },
  {
    pattern: /Attempted to open a previously opened tablespace/i,
    label: 'Tablespace conflict',
    hint: 'MySQL was not shut down cleanly last time and left tablespace metadata inconsistent.'
  },
  {
    pattern: /Unable to lock .*ibdata1/i,
    label: 'ibdata1 locked by another process',
    hint: 'Another mysqld.exe process (often a stray one from a previous session) is still holding the data files.'
  },
  {
    pattern: /InnoDB: Log file .* size .* is different from the one specified in the my\.cnf/i,
    label: 'InnoDB log file size mismatch',
    hint: 'my.ini was changed after the log files were created. Recovery will archive the old log files so MySQL can rebuild them.'
  }
];

function tailFile(filePath, maxBytes = 8000) {
  try {
    const stat = fs.statSync(filePath);
    const start = Math.max(0, stat.size - maxBytes);
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(stat.size - start);
    fs.readSync(fd, buffer, 0, buffer.length, start);
    fs.closeSync(fd);
    return buffer.toString('utf8');
  } catch (err) {
    return '';
  }
}

function detectIssues(logText) {
  const found = [];
  for (const issue of KNOWN_ISSUES) {
    if (issue.pattern.test(logText)) found.push(issue);
  }
  return found;
}

function watchLog(filePath, onChange) {
  // Poll-based watch (fs.watch is unreliable on Windows network/VM paths).
  let lastSize = 0;
  try {
    lastSize = fs.statSync(filePath).size;
  } catch (err) {
    lastSize = 0;
  }

  const interval = setInterval(() => {
    fs.stat(filePath, (err, stat) => {
      if (err) return;
      if (stat.size !== lastSize) {
        lastSize = stat.size;
        onChange(tailFile(filePath));
      }
    });
  }, 2000);

  return () => clearInterval(interval);
}

module.exports = { tailFile, detectIssues, watchLog, KNOWN_ISSUES };
