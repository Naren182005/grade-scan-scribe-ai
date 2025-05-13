@echo off
echo Starting Groq API Server...
echo.

echo Using Groq API key: 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
echo.

echo Starting server...
node simple-test-server.mjs

if %ERRORLEVEL% NEQ 0 (
  echo.
  echo Server exited with error code %ERRORLEVEL%
  pause
)
