@echo off
echo Stopping any running Node.js processes...
taskkill /f /im node.exe 2>nul

echo Clearing Vite cache...
if exist node_modules\.vite (
  rmdir /s /q node_modules\.vite
)

echo Clearing dist directory...
if exist dist (
  rmdir /s /q dist
)

echo Installing dependencies...
call npm install

echo Starting development server...
call npm run dev
