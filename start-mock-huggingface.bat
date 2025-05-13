@echo off
echo Starting Mock Hugging Face API Server...
echo.

echo This server will simulate Hugging Face API responses
echo for testing purposes.
echo.

echo Starting server on port 3002...
node mock-huggingface-server.js

if %ERRORLEVEL% NEQ 0 (
  echo.
  echo Server exited with error code %ERRORLEVEL%
  pause
)
