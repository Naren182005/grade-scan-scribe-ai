@echo off
echo Testing answer evaluation endpoint...
echo.

echo This script will test the answer evaluation endpoint.
echo.

echo Make sure the server is running before running this test.
echo If the server is not running, please start it using node express-server.mjs or node simple-test-server.mjs.
echo.

echo Running test...
node test-answer-evaluation.js

echo.
echo Test completed.
pause
