; build/installer.nsh
;
; Overrides electron-builder's default install location (normally
; C:\Program Files\Helm) to C:\Helm instead. This matters for more than
; just matching XAMPP's habit -- Program Files has restrictive permissions
; by default, which is exactly why Helm used to split "app binaries" from
; "your data" across two different folders. Installing to a plain
; top-level C:\ folder instead (same reasoning XAMPP itself gives for
; recommending C:\xampp over Program Files) means that split isn't needed:
; everything can live in one tree with normal, writable permissions.
;
; allowToChangeInstallationDirectory stays enabled in package.json, so this
; is only the *default* -- the installer's directory-picker page still lets
; you choose a different location if you want one.

!macro customInit
  StrCpy $INSTDIR "C:\Helm"
!macroend
