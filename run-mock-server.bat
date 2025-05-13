@echo off
echo Starting mock server...
echo.

node mock-server.js

if %ERRORLEVEL% NEQ 0 (
  echo.
  echo Server exited with error code %ERRORLEVEL%
  pause
)
