@echo off
chcp 65001 >nul
title Fix White Screen Issue
color 0A

cls
echo ============================================
echo   🔧 Fixing White Screen Issue
echo ============================================
echo.

cd decp-platform\frontend

echo Step 1/5: Stopping any running Node processes...
taskkill /F /IM node.exe 2>nul
echo ✅ Done

echo.
echo Step 2/5: Clearing all caches...
if exist node_modules\.vite (
    rmdir /s /q node_modules\.vite 2>nul
)
if exist dist (
    rmdir /s /q dist 2>nul
)
for /d %%i in (%TEMP%\ts-node*) do rmdir /s /q "%%i" 2>nul
for /d %%i in (%TEMP%\vite*) do rmdir /s /q "%%i" 2>nul
echo ✅ Caches cleared

echo.
echo Step 3/5: Removing node_modules...
if exist node_modules (
    rmdir /s /q node_modules 2>nul
    echo ✅ node_modules removed
) else (
    echo ℹ️  node_modules already clean
)

echo.
echo Step 4/5: Reinstalling dependencies...
echo ⏳ This may take 2-3 minutes...
call npm install
if errorlevel 1 (
    echo ❌ npm install failed!
    pause
    exit /b 1
)
echo ✅ Dependencies installed

echo.
echo Step 5/5: Starting development server...
echo.
echo ============================================
echo 🌐 Opening http://localhost:5173
echo.
echo ⚠️  If still white screen:
echo    1. Press F12 in browser
echo    2. Click Console tab
echo    3. Look for red error messages
echo    4. Screenshot the errors
echo ============================================
echo.
timeout /t 3 >nul
start http://localhost:5173
npm run dev

pause
