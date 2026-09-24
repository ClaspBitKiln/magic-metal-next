@echo off
setlocal
cd /d "%~dp0.."
if not defined KOMTENDER_API_KEY (
  echo ERROR: KOMTENDER_API_KEY is not available in this process.
  exit /b 2
)
python scripts\komtender_simple_runner.py
if errorlevel 1 exit /b %errorlevel%
echo KOMTENDER_SIMPLE_RUN=PASS
