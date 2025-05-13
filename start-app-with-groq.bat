@echo off
echo Starting Grade Scan Scribe AI with Groq API Server...
echo.

echo This script will start both the Groq API server and the frontend application.
echo.

echo Starting Groq API server...
start cmd /k "node simple-test-server.mjs"

echo Waiting for Groq API server to start...
timeout /t 5 /nobreak > nul

echo Starting frontend application...
start cmd /k "npm run dev"

echo.
echo Application started!
echo Groq API server is running at http://localhost:3000/api/groq
echo Frontend application is running at http://localhost:8080
echo.
echo You can now use the application to scan any type of question paper and generate answers using the Groq API.
echo The application will:
echo - For MCQ questions: Generate only the letter of the correct answer (A, B, C, or D)
echo - For non-MCQ questions: Generate a concise and accurate answer
echo.
