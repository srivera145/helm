# Helm

![Helm — Apache, MySQL, PHP](build/banner.jpg)

A local server for Apache, PHP, MySQL, and phpMyAdmin on Windows &mdash; one
installer, nothing else to download. Built to replace XAMPP and the InnoDB
corruption problem that comes with it. Companion tool to [Keel](https://get-keel.dev).

## The problem this fixes

XAMPP's control panel starts `mysqld.exe` and `httpd.exe` as bare child
processes and stops them with a hard kill. MySQL's InnoDB storage engine
needs a **clean shutdown** to flush `ibdata1` / `ib_logfile0` / `ib_logfile1`
to disk. A hard kill mid-write is what corrupts those files and produces the
classic:

```
Error: MySQL shutdown unexpectedly.
This may be due to a blocked port, missing dependencies,
improper privileges, a crash, or a shutdown by another method.
```

...followed by the rename-`data`-to-`data_old`-and-restore-from-backup dance.

## How Helm fixes it

[Helm](https://helm.get-keel.dev) ships Apache, PHP, and MySQL (MariaDB) **inside the installer itself**.
There's no separate XAMPP download and no "point Helm at your existing
install" step &mdash; you install Helm, it sets itself up, and Apache + MySQL
are registered as **native Windows services** from the start.

Windows' Service Control Manager stops a service by sending a proper
`SERVICE_CONTROL_STOP` signal. Both `httpd.exe` and `mysqld.exe` already
handle that natively as a graceful shutdown request &mdash; XAMPP's control
panel just never uses it. That one change removes the entire failure mode.

### One root, matching XAMPP

Everything lives under a single install folder, same as `C:\xampp`:

```
C:\Helm\resources\server\
  apache\    (binaries, generated config, logs)
  mysql\     (binaries, my.ini, data\)
  php\       (binaries, php.ini)
  phpmyadmin\
  htdocs\
```

The installer defaults to `C:\Helm` rather than `C:\Program Files\Helm`
(see `build/installer.nsh`) specifically so this works without needing
admin rights for routine writes &mdash; `C:\Program Files` has restrictive
permissions by default, `C:\Helm` doesn't, which is the same reasoning
XAMPP itself gives for recommending `C:\xampp` over Program Files. Only
registering/starting/stopping the actual Windows services needs elevation
(via a per-action prompt, not the whole app running elevated).

### What first run actually does

1. Extracts the vendor Apache config's own `LoadModule` list (so Helm never
   risks omitting a module the bundled build needs) and writes a generated
   `httpd-helm.conf` pointing at Helm's `htdocs`/logs/PHP module.
2. Copies PHP's own `php.ini-development` and enables the extensions your
   PHP 8.2 MVC stack needs (`mysqli`, `pdo_mysql`, `curl`, `mbstring`,
   `openssl`, `fileinfo`, `gd`, `intl`).
3. Writes a minimal `my.ini` with `innodb_file_per_table=1` &mdash; this is what
   lets the recovery panel archive only InnoDB's system files later, not
   your whole data folder.
4. Runs `mariadb-install-db.exe` once to create a fresh MySQL data
   directory (not `mysqld --initialize-insecure` -- that flag is
   MySQL-only, MariaDB never adopted it and ships this dedicated tool
   instead).
5. Creates `htdocs` with a default landing page.
6. Generates phpMyAdmin's `config.inc.php` in place (random blowfish
   secret, passwordless root login since step 4 creates root with no
   password).

After that, Apache and MySQL register as `HelmApache` / `HelmMySQL`
Windows services and the control panel takes over. Each station has an
admin-style shortcut like XAMPP's own panel: Apache's opens
`http://localhost`, MySQL's opens `http://localhost/phpmyadmin`.

### Other things Helm adds

- **Log-aware recovery** &mdash; the log drawer pattern-matches known InnoDB
  corruption signatures and offers a one-click "Attempt clean recovery"
  that archives only the InnoDB system files.
- **Port conflict detection** &mdash; checks what's actually bound to :80 or
  :3306 before you fight with a vague startup failure.
- **Auto-start toggle** per service, instead of all-or-nothing.

## For end users

Download the installer from Releases and run it &mdash; it defaults to
installing at `C:\Helm` (changeable on the installer's directory page).
The installer itself asks for admin approval once on launch (this is a
deliberate tradeoff -- see the note in `build/installer.nsh` on why the
non-elevated install mode couldn't reliably default to `C:\Helm`), but
**Helm itself never does**: opening the app and editing your project files
afterward needs no elevation. Open Helm, click **Set up Helm**, then
**Register services** &mdash; that step alone prompts for admin rights
again, since registering Windows services genuinely requires it. That's
it: one `.exe`, nothing else to install first, and no npm/VS Code/terminal
involved in actually using it day to day &mdash; those are only needed to
build Helm itself (see below).

## For maintainers: building a release

The vendor binaries aren't committed to this repo (they're large,
third-party redistributed builds with their own licenses) &mdash; they're
fetched at build time and baked into the installer.

```
npm install
npm run build:server   # fetches Apache + PHP + MariaDB + phpMyAdmin into resources/server
npm start                # run Helm in dev mode against those binaries
npm run dist               # produces the single Windows installer (electron-builder + NSIS)
```

`npm run dist` is the actual ".exe installer" step &mdash; electron-builder
packages Helm plus everything under `resources/server` into one NSIS
installer at `dist/Helm Setup <version>.exe`. That's the only file an end
user ever downloads; Apache, PHP, MySQL, and phpMyAdmin all ride inside it.
It defaults to installing at `C:\Helm` rather than Program Files (see
`build/installer.nsh`) so routine file access after install never needs
admin rights &mdash; only the installer itself (once, on launch) and the
in-app "Register services" action do.


If you want a custom taskbar/installer icon, drop a `build/icon.ico` and add
`"icon": "build/icon.ico"` back under `build.win` in `package.json` &mdash; it's
left out by default since no icon ships with this repo yet.

`npm run build:server` runs `server-build/fetch-binaries.ps1`. Apache Lounge,
PHP for Windows, MariaDB, and phpMyAdmin don't publish permanent "latest"
URLs &mdash; filenames change every release. The script forces TLS 1.2 and
retries downloads automatically (Windows PowerShell 5.1 often can't
negotiate TLS 1.2 by default, which otherwise looks exactly like a dead URL
even when the file is live). If a download still fails after retries, check
the page listed in the script's header comment, grab the current filename,
and update the version variable.

**Version matching matters**: PHP's Apache SAPI module (`php8apache2_4.dll`)
has to be built against the same Visual C++ toolset (VS16/VS17) as the
Apache build it loads into, or PHP won't load. The script's default
versions are picked to match; if you bump one, check the other. phpMyAdmin
has no such constraint &mdash; it's pure PHP.

## Project layout

```
main.js                 Electron main process, IPC handlers
preload.js               contextBridge API exposed to the renderer
src/
  config.js               Resolves the single unified server root's paths
  bootstrap.js             First-run: generates configs, inits MySQL data dir
  serviceManager.js        Installs/starts/stops/queries the Windows services
  portChecker.js           netstat-based port conflict detection
  logWatcher.js             Tails logs, matches known InnoDB failure signatures
  recovery.js               Automates safe InnoDB system-file recovery
  prereqs.js                Checks/installs the VC++ Redistributable
renderer/
  index.html / styles.css / renderer.js   The control panel UI
build/
  installer.nsh             Forces the installer's default path to C:\Helm
server-build/
  fetch-binaries.ps1        Maintainer-only: stages resources/server
scripts/
  install-services.ps1 / uninstall-services.ps1   CLI equivalents (assume
    setup has already run once via the app)
```

## Sites and backups

- **Sites panel** (top bar): give a project its own `*.local` domain instead
  of a folder under `localhost` &mdash; e.g. `claimiq.local` instead of
  `localhost/claimiq`. Adding a site writes a Windows hosts file entry
  (delimited by marker comments, so it never touches anything else already
  in that file) and an Apache `<VirtualHost>` block, both regenerated from
  a single `vhosts.json` registry so removing a site cleans up completely.
  Only `*.local` domains are ever accepted &mdash; the hosts file is
  security-sensitive, and this guarantees Helm can never be pointed at a
  real public domain. Each site is `Require local` by default (matching
  phpMyAdmin) rather than open to the network, since project folders
  routinely contain `.env` files and other things that shouldn't be
  browsable by anyone else on the same wifi. Point the folder at your
  project's actual public/servable directory (e.g. `public_html\`), not
  its root &mdash; pointing at the root serves `vendor\`, `composer.json`,
  and similar as a directory listing when there's no top-level `index.php`.
- **Database backup** (Settings): one-click `mysqldump --all-databases`
  snapshot. This is the actual guarantee behind the log-aware InnoDB
  recovery in `recovery.js`, which is explicitly best-effort automation of
  a manual rescue, not a promise. Checks for both `mysqldump.exe` and
  `mariadb-dump.exe` at call time rather than assuming one name, since
  MariaDB has been renaming its client tools.

## What Helm does not do (yet)

- PHP loads into Apache as `mod_php` (matches how XAMPP itself runs it).
  Isolating PHP into its own FastCGI process would let a PHP crash stay
  contained instead of taking Apache down with it &mdash; a reasonable
  future improvement for stability, but a bigger, riskier change (new
  bundled Apache module, a different PHP process model) that hasn't been
  attempted yet.

## License

MIT
