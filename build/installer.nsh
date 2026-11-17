; GOC apps installer - included automatically by electron-builder (build/installer.nsh).
; Before installing (or updating), close the running GOC app for sure and wait a moment,
; instead of the default check that can stop with "GOC Builders cannot be closed".
!macro customCheckAppRunning
  nsExec::Exec `"$SYSDIR\cmd.exe" /c taskkill /f /t /im "${APP_EXECUTABLE_FILENAME}" /fi "USERNAME eq %USERNAME%"`
  Pop $0
  Sleep 2000
!macroend