@echo off
echo Testing frontend integration with Groq API...
echo.

echo This script will test the integration between the frontend application and the Groq API server.
echo.

echo Make sure the Groq API server is running before running this test.
echo If the server is not running, please start it using the start-app-with-groq.bat script.
echo.

echo Running test...
node test-frontend-integration.js

echo.
echo Test completed.
pause
