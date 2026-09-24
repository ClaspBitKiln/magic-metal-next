@echo off
setlocal
cd /d "%~dp0.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run_komtender_local.ps1"
if errorlevel 1 exit /b %errorlevel%
