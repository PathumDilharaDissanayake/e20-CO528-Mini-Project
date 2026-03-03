@echo off
chcp 65001 >nul
title DECP Frontend Diagnostics
color 0B

cls
echo ============================================
echo   🔍 DECP Frontend Diagnostics
echo ============================================
echo.

cd decp-platform\frontend

echo 📁 Checking node_modules...
if not exist node_modules (
    echo ❌ node_modules not found! Running npm install...
    call npm install
    if errorlevel 1 (
        echo ❌ npm install failed!
        pause
        exit /b 1
    )
) else (
    echo ✅ node_modules exists
)

echo.
echo 📦 Checking for required dependencies...
npm list react react-dom @mui/material @reduxjs/toolkit react-router-dom --depth=0 2>nul
if errorlevel 1 (
    echo ⚠️  Some dependencies may be missing
    echo 🔄 Reinstalling dependencies...
    call npm install
)

echo.
echo 🔍 Checking for syntax errors in key files...
echo.

echo Checking main.tsx...
>nul findstr /C:"import React" src\main.tsx && echo ✅ main.tsx looks good || echo ❌ main.tsx may have issues

echo Checking App.tsx...
>nul findstr /C:"export default App" src\App.tsx && echo ✅ App.tsx looks good || echo ❌ App.tsx may have issues

echo Checking store...
>nul findstr /C:"export const store" src\store\index.ts && echo ✅ store looks good || echo ❌ store may have issues

echo.
echo 🧹 Clearing Vite cache...
if exist node_modules\.vite (
    rmdir /s /q node_modules\.vite 2>nul
    echo ✅ Vite cache cleared
)

echo.
echo 🗑️ Clearing ts-node cache...
for /d %%i in (%TEMP%\ts-node*) do rmdir /s /q "%%i" 2>nul
echo ✅ ts-node cache cleared

echo.
echo 🚀 Starting development server with verbose output...
echo.
echo ============================================
echo ⚠️  If the browser shows white screen:
echo    1. Press F12 to open DevTools
echo    2. Check Console tab for red errors
echo    3. Note the error message and file
echo ============================================
echo.
pause

echo Starting Vite...
npm run dev

pause
