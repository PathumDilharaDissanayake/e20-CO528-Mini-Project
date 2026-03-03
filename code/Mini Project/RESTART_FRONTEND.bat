@echo off
chcp 65001 >nul
title Restart Frontend
color 0A

echo ============================================
echo   🔄 Restarting Frontend
echo ============================================
echo.

cd decp-platform\frontend

echo 🛑 Stopping any running Node processes...
taskkill /F /IM node.exe 2>nul
echo ✅ Done

echo.
echo 🧹 Clearing Vite cache...
if exist node_modules\.vite (
    rmdir /s /q node_modules\.vite 2>nul
    echo ✅ Vite cache cleared
)

echo.
echo 🚀 Starting development server...
echo 🌐 Open http://localhost:5173 in your browser
echo.

start http://localhost:5173
npm run dev

pause
