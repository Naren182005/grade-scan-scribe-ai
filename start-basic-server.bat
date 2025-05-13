@echo off
echo Starting Basic Server...
echo.

node basic-server.js

if %ERRORLEVEL% NEQ 0 (
  echo.
  echo Server exited with error code %ERRORLEVEL%
  pause
)
