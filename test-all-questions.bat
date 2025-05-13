@echo off
echo Testing Groq API with all question types...
echo.

echo This script will test the Groq API endpoint with both MCQ and non-MCQ questions.
echo.

echo Make sure the Groq API server is running before running this test.
echo If the server is not running, please start it using the start-app-with-groq.bat script.
echo.

echo Running test...
node test-all-question-types.js

echo.
echo Test completed.
pause
