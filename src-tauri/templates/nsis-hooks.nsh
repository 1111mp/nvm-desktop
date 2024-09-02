
!include "StrFunc.nsh"
${StrStr}
${UnStrStr}
${UnStrRep}

!macro NSIS_HOOK_POSTINSTALL

  ; Get the current user's %HOMEDRIVE% and %HOMEPATH%
  ReadEnvStr $0 "HOMEDRIVE"
  ReadEnvStr $1 "HOMEPATH"
  StrCpy $1 "$0$1\.nvmd\bin"

  ; Read the system-wide PATH environment variable
  ReadRegStr $2 HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "PATH"
  StrCmp $2 "" 0 +2
  StrCpy $2 "$2;"

  ; Check if the directory is in your PATH
  ${StrStr} $3 "$2" "$1"
  StrCmp $3 "" 0 +3
  ; If the directory is not in PATH, add
  StrCpy $2 "$2$1"

  ; Update the registry
  WriteRegStr HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "PATH" "$2"

  ; Notify the system that environment variables have been updated
  System::Call 'KERNEL32::SendMessageTimeoutA(i 0xFFFF, i ${WM_SETTINGCHANGE}, i 0, t "Environment", i 0x0, i 1000, *i 0)'

!macroend

!macro NSIS_HOOK_PREUNINSTALL

  ; Get the current user's %HOMEDRIVE% and %HOMEPATH%
  ReadEnvStr $0 "HOMEDRIVE"
  ReadEnvStr $1 "HOMEPATH"
  StrCpy $1 "$0$1\.nvmd\bin"

  ; Read the system-wide PATH environment variable
  ReadRegStr $2 HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "PATH"

  ; Check if the directory is in your PATH
  ${UnStrStr} $3 "$2" "$1"

  ; Confirm the check results and remove the directory
  StrCmp $3 "" 0 +3
  ; Skip removal
  Goto done

  ; If the directory is in PATH, remove
  ; Remove the middle path
  ${UnStrRep} $4 "$2" "$1;" ""
  ${UnStrRep} $4 "$4" ";$1" "" ; Remove the path at the beginning
  ${UnStrRep} $4 "$4" "$1" "" ; Remove the trailing path
  
  ; Remove extra semicolons
	; Prevent redundant double semicolons
  ${UnStrRep} $4 "$4" ";;" ";"

  ; Fix possible leading and trailing semicolons
  ${UnStrRep} $4 "$4" "^;" "" ; Remove the leading semicolon
  ${UnStrRep} $4 "$4" ";$" "" ; Remove the trailing semicolon

  ; Update the registry
  WriteRegStr HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "PATH" "$4"

  ; Notify the system that environment variables have been updated
  System::Call 'KERNEL32::SendMessageTimeoutA(i 0xFFFF, i ${WM_SETTINGCHANGE}, i 0, t "Environment", i 0x0, i 1000, *i 0)'

  done:
!macroend
