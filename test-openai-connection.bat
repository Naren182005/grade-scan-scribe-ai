@echo off
echo Testing OpenAI API Connection...
echo.
echo This script will test the connection to the OpenAI API using the API key from the .env file.
echo.

echo Running test script...
node test-openai-connection.js

echo.
if %ERRORLEVEL% NEQ 0 (
  echo Test failed with error code %ERRORLEVEL%
) else (
  echo Test completed.
)

pause
