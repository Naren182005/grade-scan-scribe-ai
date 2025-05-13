@echo off
echo Testing HuggingFace API connectivity...
echo.

set HUGGINGFACE_API_TOKEN=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

echo Using API token: %HUGGINGFACE_API_TOKEN:~0,10%...
echo.

echo Running test script...
node test-huggingface-api.js

echo.
echo Test completed. Check the results above.
echo.
pause
