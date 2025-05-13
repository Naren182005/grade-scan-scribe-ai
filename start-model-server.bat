@echo off
echo Starting Model API Server...
echo.

echo Make sure you have set the MODEL_API_KEY in the .env file.
echo.

echo Starting server...
node model-api-server.mjs

if %ERRORLEVEL% NEQ 0 (
  echo.
  echo Server exited with error code %ERRORLEVEL%
  pause
)
