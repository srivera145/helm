<#
.SYNOPSIS
  Registers Helm's bundled Apache and MySQL as native Windows services.
  This is a CLI equivalent of the "Register services" button in the Helm
  app -- use it if you'd rather not run the GUI.

  Requires that Helm's one-time setup has already run at least once (either
  via the app's "Set up Helm" screen, or you've otherwise generated
  <install root>\apache\conf\httpd-helm.conf and
  <install root>\mysql\my.ini). This script does not generate those --
  config generation and MySQL data-dir initialization live in
  src/bootstrap.js so there's exactly one implementation to keep correct.

.PARAMETER ResourcesRoot
  Path to the bundled server binaries and data (one unified folder as of
  this version of Helm). Defaults to resources\server next to this script,
  which is where server-build/fetch-binaries.ps1 puts them in a dev
  checkout, or C:\Helm\resources\server for an installed copy.
#>

param(
  [string]$ResourcesRoot = "$PSScriptRoot\..\resources\server"
)

$ErrorActionPreference = "Stop"

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  Write-Host "This needs to run as Administrator. Re-launching with elevation..." -ForegroundColor Yellow
  Start-Process powershell -Verb RunAs -ArgumentList "-ExecutionPolicy Bypass -File `"$PSCommandPath`" -ResourcesRoot `"$ResourcesRoot`""
  exit
}

$apacheBin  = Join-Path $ResourcesRoot "apache\bin\httpd.exe"
$mysqlBin   = Join-Path $ResourcesRoot "mysql\bin\mysqld.exe"
$apacheConf = Join-Path $ResourcesRoot "apache\conf\httpd-helm.conf"
$mysqlIni   = Join-Path $ResourcesRoot "mysql\my.ini"

foreach ($p in @($apacheBin, $mysqlBin)) {
  if (-not (Test-Path $p)) { throw "Missing $p -- run npm run build:server first." }
}
foreach ($p in @($apacheConf, $mysqlIni)) {
  if (-not (Test-Path $p)) { throw "Missing $p -- run Helm's 'Set up Helm' screen once before using this script." }
}

Write-Host "Registering Apache as service 'HelmApache'..." -ForegroundColor Cyan
& $apacheBin -k install -n "HelmApache" -f "$apacheConf"

Write-Host "Registering MySQL as service 'HelmMySQL'..." -ForegroundColor Cyan
& $mysqlBin --install "HelmMySQL" --defaults-file="$mysqlIni"

sc.exe config HelmApache start= demand | Out-Null
sc.exe config HelmMySQL start= demand | Out-Null

Write-Host ""
Write-Host "Done. Start them with:" -ForegroundColor Green
Write-Host "  net start HelmApache"
Write-Host "  net start HelmMySQL"
