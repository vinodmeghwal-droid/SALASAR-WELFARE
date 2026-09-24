@echo off
REM Double-click this file to start the HR Welfare dashboard (API + web app).
REM Keep this window open while you use the dashboard; close it to stop both.
cd /d "%~dp0"
echo Starting HR Welfare dashboard...
echo Dashboard: http://localhost:3000
echo.
call npm run dev
pause
