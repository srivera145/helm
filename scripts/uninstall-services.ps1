<#
.SYNOPSIS
  Removes the HelmApache / HelmMySQL Windows services. Does not touch your
  htdocs, databases, or generated configs -- only the service registration.

.PARAMETER ResourcesRoot
  Path to the bundled server binaries and data (one unified folder).
  Defaults to resources\server next to this script.
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

$apacheBin = Join-Path $ResourcesRoot "apache\bin\httpd.exe"

Write-Host "Stopping services if running..." -ForegroundColor Cyan
sc.exe stop HelmMySQL  | Out-Null
sc.exe stop HelmApache | Out-Null
Start-Sleep -Seconds 2

if (Test-Path $apacheBin) {
  Write-Host "Removing HelmApache..." -ForegroundColor Cyan
  & $apacheBin -k uninstall -n "HelmApache"
}

# NOTE: "mysqld --remove" was removed from MariaDB's mysqld.exe (MDEV-19358,
# 2024) -- sc delete is the current, correct way to remove the service.
Write-Host "Removing HelmMySQL..." -ForegroundColor Cyan
sc.exe delete "HelmMySQL" | Out-Null

Write-Host "Done. Your htdocs, databases, and configs were not touched." -ForegroundColor Green
