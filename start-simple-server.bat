@echo off
echo Starting Grade Scan Scribe AI Server...
echo.

echo NOTE: This script will use the API keys from the .env file.
echo Make sure you have set valid API keys in the .env file.
echo.

rem Set basic environment variables
set PORT=3000
set NODE_ENV=development

echo Environment variables set:
echo PORT: %PORT%
echo NODE_ENV: %NODE_ENV%
echo.

echo Starting server...
node simple-server.js

rem If the server exits with an error, pause to show the error message
if %ERRORLEVEL% NEQ 0 (
  echo.
  echo Server exited with error code %ERRORLEVEL%
  pause
)
