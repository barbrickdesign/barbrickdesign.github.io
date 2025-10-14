@echo off
REM Start the Brain Cell server for MGC rewards

REM Change to the project directory (edit this path if needed)
cd /d "%~dp0"

REM Install dependencies if not already installed
if not exist node_modules (
    echo Installing dependencies...
    npm install
)

REM Start the server
echo Starting Brain Cell server...
node server.js

pause
