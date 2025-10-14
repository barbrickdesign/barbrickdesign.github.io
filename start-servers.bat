@echo off
echo ========================================
echo  BARBRICKDESIGN SERVER STARTUP
echo ========================================
echo.
echo Starting all servers...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Run the server startup script
node start-all-servers.js

pause
