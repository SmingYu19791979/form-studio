@echo off
setlocal
chcp 65001 >nul
set PYTHONUTF8=1
cd /d "%~dp0"
where py >nul 2>nul
if not errorlevel 1 (
  py -3 -c "import sys; sys.exit(0 if sys.version_info >= (3,11) else 1)" >nul 2>nul
  if not errorlevel 1 goto use_py
)
where python >nul 2>nul
if not errorlevel 1 (
  python -c "import sys; sys.exit(0 if sys.version_info >= (3,11) else 1)" >nul 2>nul
  if not errorlevel 1 goto use_python
)
echo Please install Python 3.11 or newer: https://www.python.org/downloads/
echo Enable the Python launcher or Add python.exe to PATH during installation.
pause
exit /b 1
:use_py
py -3 launch.py %*
goto finish
:use_python
python launch.py %*
:finish
if errorlevel 1 pause
