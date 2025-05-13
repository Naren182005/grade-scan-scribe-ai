@echo off
echo Starting test server...
echo.

node test-server.js

if %ERRORLEVEL% NEQ 0 (
  echo.
  echo Server exited with error code %ERRORLEVEL%
  pause
)
