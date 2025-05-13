@echo off
echo Testing Groq API with OCR issues...
echo.

echo This script will test the Groq API endpoint with questions that have OCR issues.
echo.

echo Make sure the Groq API server is running before running this test.
echo If the server is not running, please start it using the start-app-with-groq.bat script.
echo.

echo Running test...
node test-ocr-issues.js

echo.
echo Test completed.
pause
