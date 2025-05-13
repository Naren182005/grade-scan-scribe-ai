@echo off
echo Starting Grade Scan Scribe AI Minimal Server...
echo.

rem Set environment variables
set PORT=3000
set NODE_ENV=development

echo Environment variables set:
echo PORT: %PORT%
echo NODE_ENV: %NODE_ENV%
echo.

echo Starting minimal server...
node minimal-server.js

rem If the server exits with an error, pause to show the error message
if %ERRORLEVEL% NEQ 0 (
  echo.
  echo Server exited with error code %ERRORLEVEL%
  pause
)
