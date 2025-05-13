@echo off
echo Starting server and testing connectivity...
echo.

echo Creating a simple test file...
echo import http from 'http'; > test-server.mjs
echo. >> test-server.mjs
echo const server = http.createServer((req, res) => { >> test-server.mjs
echo   console.log(`Request received: ${req.method} ${req.url}`); >> test-server.mjs
echo   res.setHeader('Access-Control-Allow-Origin', '*'); >> test-server.mjs
echo   res.writeHead(200, { 'Content-Type': 'application/json' }); >> test-server.mjs
echo   res.end(JSON.stringify({ message: 'Server is working!' })); >> test-server.mjs
echo }); >> test-server.mjs
echo. >> test-server.mjs
echo const PORT = 3000; >> test-server.mjs
echo server.listen(PORT, () => { >> test-server.mjs
echo   console.log(`Server running at http://localhost:${PORT}/`); >> test-server.mjs
echo }); >> test-server.mjs

echo Starting server...
start cmd /k "node test-server.mjs"

echo Waiting for server to start...
timeout /t 5 /nobreak > nul

echo Testing server with curl...
curl http://localhost:3000/test

echo.
echo If you see a JSON response above, the server is working.
echo If you see an error, there might be an issue with the network configuration.
echo.
echo Press any key to exit...
pause > nul
