@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%diagnose_remote_desktop_commander.ps1" -Action Start
set "EXIT_CODE=%ERRORLEVEL%"
if not "%EXIT_CODE%"=="0" (
  echo.
  echo Remote Desktop Commander was not started. Exit code: %EXIT_CODE%
  pause
)
exit /b %EXIT_CODE%
