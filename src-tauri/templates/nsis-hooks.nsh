!macro NSIS_HOOK_POSTINSTALL

  ; Get the current user's %HOMEDRIVE% and %HOMEPATH%
  ReadEnvStr $0 "HOMEDRIVE"
  ReadEnvStr $1 "HOMEPATH"
  StrCpy $1 "$0$1\.nvmd\bin"

  ; Add the %HOMEPATH%\.nvmd\bin folder to the system PATH
  ExecWait '$INSTDIR\resources\PathEd.exe add "$1"' ; put the path in quotes because of possible spaces

end:
!macroend

!macro NSIS_HOOK_PREUNINSTALL

  ; Get the current user's %HOMEDRIVE% and %HOMEPATH%
  ReadEnvStr $0 "HOMEDRIVE"
  ReadEnvStr $1 "HOMEPATH"
  StrCpy $1 "$0$1\.nvmd\bin"

  ; Remove the %HOMEPATH%\.nvmd\bin folder from the system PATH
  ExecWait '$INSTDIR\resources\PathEd.exe remove "$1"'

  done:
!macroend
