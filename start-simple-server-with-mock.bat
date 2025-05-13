@echo off
echo Starting Simple Server with Mock Hugging Face API...
echo.

echo This server includes built-in mock APIs for:
echo - Hugging Face API
echo - OCR API
echo - Evaluation API
echo.

echo Starting server on port 3000...
node simple-server-with-mock.js

if %ERRORLEVEL% NEQ 0 (
  echo.
  echo Server exited with error code %ERRORLEVEL%
  pause
)
