; Close the running app before installing / updating (also when it is stuck in the background)
!macro customCheckAppRunning
  nsExec::Exec `"$SYSDIR\cmd.exe" /c taskkill /f /t /im "${APP_EXECUTABLE_FILENAME}" /fi "USERNAME eq %USERNAME%"`
  Pop $0
  Sleep 2000
!macroend

; ---------- Installation password ----------
; build/pass.nsh is made by build/make-pass.js from the GitHub secret GOC_INSTALL_PASSWORD.
; It holds only a salted PBKDF2 hash, never the password itself.
!include "${BUILD_RESOURCES_DIR}\pass.nsh"

!ifdef GOC_PASS_HASH
  !include LogicLib.nsh
  !include nsDialogs.nsh

  ; A NEW install that is silent (/S, no password page) is refused. Automatic updates are silent too,
  ; but the app is installed already then, so they still work.
  !macro customInit
    ${If} ${Silent}
    ${AndIf} $perUserInstallationFolder == ""
    ${AndIf} $perMachineInstallationFolder == ""
      SetErrorLevel 2
      Quit
    ${EndIf}
  !macroend

  ; The first page asks for the installation password (not when the app is installed already: update / reinstall)
  !macro customWelcomePage
    Var GocPwField
    Page custom GocPassShow GocPassLeave

    Function GocPassShow
      ${If} ${UAC_IsInnerInstance}
        Abort
      ${EndIf}
      ${If} $perUserInstallationFolder != ""
      ${OrIf} $perMachineInstallationFolder != ""
        Abort
      ${EndIf}
      !insertmacro MUI_HEADER_TEXT "Installation password" "This app can only be installed with the GOC Builders installation password."
      nsDialogs::Create 1018
      Pop $0
      ${If} $0 == error
        Abort
      ${EndIf}
      ${NSD_CreateLabel} 0 0 100% 24u "Type the installation password, then click Next.$\r$\nAsk the GOC Builders IT / office if you do not have it."
      Pop $0
      ${NSD_CreateLabel} 0 34u 100% 10u "Password:"
      Pop $0
      ${NSD_CreatePassword} 0 46u 60% 13u ""
      Pop $GocPwField
      ${NSD_SetFocus} $GocPwField
      nsDialogs::Show
    FunctionEnd

    Function GocPassLeave
      ${NSD_GetText} $GocPwField $0
      ${If} $0 == ""
        MessageBox MB_ICONEXCLAMATION|MB_OK "Please type the installation password."
        Abort
      ${EndIf}
      ; the password goes to PowerShell through an environment variable (not on the command line)
      System::Call 'Kernel32::SetEnvironmentVariable(t "GOC_INSTALL_PW", t r0) i.r1'
      nsExec::ExecToStack `"$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "$$k = [System.Security.Cryptography.Rfc2898DeriveBytes]::new([string]$$env:GOC_INSTALL_PW, [Convert]::FromBase64String('${GOC_PASS_SALT}'), ${GOC_PASS_ITER}); if ([Convert]::ToBase64String($$k.GetBytes(32)) -eq '${GOC_PASS_HASH}') { 'GOC-OK' } else { 'GOC-NO' }"`
      Pop $1
      Pop $2
      System::Call 'Kernel32::SetEnvironmentVariable(t "GOC_INSTALL_PW", p 0) i.r1'
      StrCpy $3 $2 6
      ${If} $3 == "GOC-OK"
        Return
      ${EndIf}
      ${If} $3 == "GOC-NO"
        MessageBox MB_ICONSTOP|MB_OK "Wrong installation password. Please try again."
      ${Else}
        MessageBox MB_ICONSTOP|MB_OK "The password could not be checked on this computer (Windows PowerShell did not answer).$\r$\n$\r$\n$2"
      ${EndIf}
      ${NSD_SetText} $GocPwField ""
      Abort
    FunctionEnd
  !macroend

  ; mark this installation as done with the password (the app checks it; installs and updates both write it)
  !macro customInstall
    FileOpen $0 "$INSTDIR\goc-activated" w
    FileWrite $0 "1"
    FileClose $0
  !macroend
!endif
