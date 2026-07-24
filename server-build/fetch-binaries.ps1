<#
.SYNOPSIS
  Downloads the official Windows builds of Apache, PHP, MariaDB, and
  phpMyAdmin, plus the Visual C++ Redistributable MariaDB needs at runtime,
  and stages them under resources/server/{apache,php,mysql,phpmyadmin,prereqs}.
  This is what gets embedded into the Helm installer via electron-builder's
  extraResources (see package.json) -- end users never run this script or
  see a separate download. It's a release-maintainer step, run once per
  Helm release (or whenever you want to bump a bundled version).

.NOTES
  Windows PowerShell 5.1 (the "powershell.exe" that ships with Windows, as
  opposed to PowerShell 7's "pwsh.exe") does NOT default to TLS 1.2 on a lot
  of machines. That makes Invoke-WebRequest silently fail to connect to any
  host that requires TLS 1.2+ -- which is effectively every download host
  below now -- even though the URL is genuinely live in a browser. This
  script forces TLS 1.2 at the top specifically because of that.

  None of these projects publish permanent "latest" download URLs for
  Windows -- filenames change every release (Apache Lounge in particular
  encodes the build date). The URLs below were verified live when this
  script was last updated; if a download still fails after this script's
  retries, open the matching page below, grab the current filename, and
  pass it with the matching -XxxUrl parameter.

    Apache : https://www.apachelounge.com/download/  (use the VS16 x64 build)
             NOTE: Apache Lounge froze its VS16 line at 2.4.57 ("not updated
             anymore" per their own site) and now builds new releases on
             VS17/VS18. httpd-2.4.57-win64-VS16.zip is the last VS16 build
             and is still hosted -- use it as-is. If you ever need a newer
             Apache, you must move to a VS17 Apache build AND a VS17 PHP
             build together (see PHP note below), not just one.
    PHP    : https://windows.php.net/download/ (or /downloads.php.net/~windows/releases/archives/
             for older branches like 8.2, which is what this project targets)
             PHP 8.2/8.3 are still built with VS16, matching Apache Lounge's
             VS16 line above. PHP 8.4+ moved to VS17 -- do not mix VS16
             Apache with a VS17 PHP build, php8apache2_4.dll will not load.
    MariaDB: https://mariadb.org/download/ (Windows, zip, x64) -- version
             matching doesn't apply here, MariaDB isn't loaded into Apache.
    phpMyAdmin: https://www.phpmyadmin.net/downloads/ -- pure PHP, no
             compiled binary, no version-matching constraint either.
    VC++ Redistributable: https://aka.ms/vs/17/release/vc_redist.x64.exe --
             this is Microsoft's own permanent "always latest" redirect, not
             a versioned file like the others, so it shouldn't need updating.
             MariaDB needs this installed system-wide to run at all; Helm
             installs it silently on first setup if it's missing (see
             src/prereqs.js). This is exactly the runtime XAMPP quietly
             depends on too, just never bundles or checks for.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\server-build\fetch-binaries.ps1
#>

param(
  [string]$ApacheUrl     = "https://www.apachelounge.com/download/VS16/binaries/httpd-2.4.57-win64-VS16.zip",
  [string]$PhpUrl         = "https://downloads.php.net/~windows/releases/archives/php-8.2.32-Win32-vs16-x64.zip",
  [string]$MariaDbUrl     = "https://archive.mariadb.org/mariadb-10.11.18/winx64-packages/mariadb-10.11.18-winx64.zip",
  [string]$PhpMyAdminUrl  = "https://files.phpmyadmin.net/phpMyAdmin/5.2.3/phpMyAdmin-5.2.3-english.zip",
  [string]$VcRedistUrl    = "https://aka.ms/vs/17/release/vc_redist.x64.exe",
  [string]$OutDir         = "$PSScriptRoot\..\resources\server"
)

$ErrorActionPreference = "Stop"

# --- Fix: force TLS 1.2 (+1.3 where available) ------------------------
# This is the actual fix for "URL not reachable" on URLs that are genuinely
# live -- see .NOTES above. Do this before any Invoke-WebRequest call.
try {
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13
} catch {
  # Tls13 isn't defined on older .NET Framework builds -- Tls12 alone is
  # sufficient for every host this script talks to.
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
}

# A couple of these hosts (Apache Lounge in particular, being a small
# donation-funded site) have been known to reject non-browser User-Agents.
# A normal browser UA avoids that entirely.
$BrowserUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

$tmp = Join-Path $env:TEMP "helm-fetch-$(Get-Random)"
New-Item -ItemType Directory -Path $tmp -Force | Out-Null

function Get-File($url, $label, $destPath, [int]$maxAttempts = 3) {
  if (Test-Path $destPath) {
    Write-Host "`n[$label] Already staged at $destPath -- skipping." -ForegroundColor DarkGray
    return
  }

  $lastError = $null
  for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
    try {
      Write-Host "`n[$label] Downloading (attempt $attempt/$maxAttempts): $url" -ForegroundColor Cyan
      New-Item -ItemType Directory -Path (Split-Path $destPath -Parent) -Force | Out-Null
      Invoke-WebRequest -Uri $url -OutFile $destPath -UseBasicParsing -UserAgent $BrowserUA -TimeoutSec 120
      $lastError = $null
      break
    } catch {
      $lastError = $_
      Write-Host "[$label] Attempt $attempt failed: $($_.Exception.Message)" -ForegroundColor Yellow
      Start-Sleep -Seconds 2
    }
  }

  if ($lastError) {
    Write-Host "`n[$label] Could not download after $maxAttempts attempts." -ForegroundColor Red
    Write-Host "Last error: $($lastError.Exception.Message)" -ForegroundColor Red
    throw "$label download failed: $url"
  }

  Write-Host "[$label] Staged at $destPath" -ForegroundColor Green
}

function Find-ComponentRoot($extractPath, $anchorRelativePath) {
  # Locates the real payload root inside an extracted zip by searching for a
  # known file (e.g. "bin\httpd.exe") and walking back up however many
  # segments that path has. This replaces a "count the top-level items"
  # guess, which breaks the moment a zip ships an extra readme/license file
  # alongside its real payload folder -- exactly what happened with Apache's
  # zip here.
  $anchorFileName = Split-Path $anchorRelativePath -Leaf
  $anchorParentSegments = @((Split-Path $anchorRelativePath -Parent) -split '\\' | Where-Object { $_ -ne '' })

  $candidates = Get-ChildItem -Path $extractPath -Recurse -Filter $anchorFileName -File -ErrorAction SilentlyContinue
  foreach ($candidate in $candidates) {
    $dir = $candidate.DirectoryName
    $matched = $true
    for ($i = $anchorParentSegments.Count - 1; $i -ge 0; $i--) {
      if ((Split-Path $dir -Leaf) -ne $anchorParentSegments[$i]) { $matched = $false; break }
      $dir = Split-Path $dir -Parent
    }
    if ($matched) { return $dir }
  }
  return $null
}

function Get-And-Expand($url, $label, $destSubfolder, $anchorRelativePath, [int]$maxAttempts = 3) {
  $dest = Join-Path $OutDir $destSubfolder
  $anchorInDest = Join-Path $dest $anchorRelativePath

  if (Test-Path $anchorInDest) {
    Write-Host "`n[$label] Already staged at $dest (found $anchorRelativePath) -- skipping." -ForegroundColor DarkGray
    return
  }

  $zipPath = Join-Path $tmp "$label.zip"
  $lastError = $null

  for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
    try {
      Write-Host "`n[$label] Downloading (attempt $attempt/$maxAttempts): $url" -ForegroundColor Cyan
      Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing -UserAgent $BrowserUA -TimeoutSec 120
      $lastError = $null
      break
    } catch {
      $lastError = $_
      Write-Host "[$label] Attempt $attempt failed: $($_.Exception.Message)" -ForegroundColor Yellow
      Start-Sleep -Seconds 2
    }
  }

  if ($lastError) {
    Write-Host "`n[$label] Could not download after $maxAttempts attempts." -ForegroundColor Red
    Write-Host "Last error: $($lastError.Exception.Message)" -ForegroundColor Red
    Write-Host "If this URL is genuinely dead, check the download page in this script's" -ForegroundColor Red
    Write-Host "header comment, grab the current filename, and pass it with -${label}Url." -ForegroundColor Red
    throw "$label download failed: $url"
  }

  $extractPath = Join-Path $tmp $label
  Write-Host "[$label] Extracting..." -ForegroundColor Cyan
  Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force

  $root = Find-ComponentRoot $extractPath $anchorRelativePath
  if (-not $root) {
    Write-Host "[$label] Could not find $anchorRelativePath anywhere in the extracted archive." -ForegroundColor Red
    Write-Host "The zip's internal structure may have changed. Contents were:" -ForegroundColor Red
    Get-ChildItem -Path $extractPath -Recurse | Select-Object -First 30 -ExpandProperty FullName | Write-Host
    throw "$label archive structure did not match what this script expects"
  }

  if (Test-Path $dest) {
    # Clear out any stale partial copy from a previous failed run before
    # re-staging, so leftover misplaced files don't linger alongside the
    # correct ones.
    Remove-Item $dest -Recurse -Force
  }
  New-Item -ItemType Directory -Path $dest -Force | Out-Null
  Copy-Item "$root\*" $dest -Recurse -Force

  if (-not (Test-Path $anchorInDest)) {
    throw "$label copy completed but $anchorRelativePath still isn't at $dest -- something is wrong with Find-ComponentRoot"
  }

  Write-Host "[$label] Staged at $dest (verified $anchorRelativePath)" -ForegroundColor Green
}

Write-Host "Helm binary fetch -> $OutDir" -ForegroundColor Yellow

Get-And-Expand $ApacheUrl "apache" "apache" "bin\httpd.exe"
Get-And-Expand $PhpUrl "php" "php" "php8apache2_4.dll"
Get-And-Expand $MariaDbUrl "mysql" "mysql" "bin\mysqld.exe"
Get-And-Expand $PhpMyAdminUrl "phpmyadmin" "phpmyadmin" "index.php"
Get-File $VcRedistUrl "vcredist" (Join-Path $OutDir "prereqs\vc_redist.x64.exe")

# PHP's extension DLLs (ext\php_curl.dll, ext\php_openssl.dll, etc.) depend
# on shared runtime DLLs (libssl, libcrypto, etc.) that ship in PHP's root
# folder, not ext\. When Apache runs as a Windows service rather than an
# interactively-launched process, that root folder isn't reliably on the
# service's DLL search path, which surfaces as "Unable to load dynamic
# library" for otherwise-present extensions at Apache startup. PHP's own
# extension loader always searches the same folder as the extension DLL
# itself, so copying the root-level runtime DLLs into ext\ resolves this
# unconditionally rather than depending on service environment quirks.
# Runs every time (not just on a fresh PHP download) so it also fixes an
# already-staged php\ folder from a previous run of this script.
Write-Host "`n[php] Copying root runtime DLLs into ext\ for reliable extension loading..." -ForegroundColor Cyan
$phpRoot = Join-Path $OutDir "php"
$phpExt = Join-Path $phpRoot "ext"
Get-ChildItem -Path $phpRoot -Filter "*.dll" -File -ErrorAction SilentlyContinue | Copy-Item -Destination $phpExt -Force

# The vendor MariaDB zip ships its own empty data/ folder -- Helm generates
# its own under the per-user DATA ROOT at first run, so drop the vendor one
# to avoid confusion about which "data" folder is actually live.
$vendorDataDir = Join-Path $OutDir "mysql\data"
if (Test-Path $vendorDataDir) {
  Remove-Item $vendorDataDir -Recurse -Force
}

Remove-Item $tmp -Recurse -Force

Write-Host "`nDone. resources/server contains apache/, php/, mysql/, phpmyadmin/, and prereqs/, each verified." -ForegroundColor Green
