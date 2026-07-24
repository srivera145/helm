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
<<<<<<< HEAD
; you choose a different location if you want one, and that manual override
; always works regardless of anything below.
;
; KNOWN FRAGILITY: overriding the default NSIS install path through
; electron-builder has a long history of breaking across versions --
; electron-userland/electron-builder#1961, #2855, #6357, #8164 are all the
; same underlying complaint, spanning years. #8164 specifically traces it to
; electron-builder's per-user ("assisted installer") NSIS template
; recomputing $INSTDIR after customInit runs, silently discarding the
; override -- package.json sets perMachine: true specifically to avoid that
; exact code path, since it only affects the per-user install mode.
;
; Two independent mechanisms are used here so one failing doesn't leave
; nothing: customHeader's InstallDir directive sets NSIS's own compile-time
; default, and customInit's StrCpy re-asserts it at runtime as a backup.
; If a future electron-builder version breaks both, the directory-picker
; page (allowToChangeInstallationDirectory) is the reliable fallback --
; typing C:\Helm there always works.

!macro customHeader
  InstallDir "C:\Helm"
!macroend
=======
; you choose a different location if you want one.
>>>>>>> b1dbe9de81cd4382b23fe705ce2962b4202883ac

!macro customInit
  StrCpy $INSTDIR "C:\Helm"
!macroend
<<<<<<< HEAD

=======
>>>>>>> b1dbe9de81cd4382b23fe705ce2962b4202883ac
