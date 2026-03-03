@echo off
chcp 65001 >nul
title DECP Platform - Stopping
color 0C

echo.
echo  ============================================================
echo    DECP Platform - Stopping All Services
echo  ============================================================
echo.

echo  Killing node processes on ports 3000-3009 and 5173...
for %%P in (3000 3001 3002 3003 3004 3005 3006 3007 3008 3009 5173) do (
    for /f "tokens=5" %%A in ('netstat -ano 2^>nul ^| findstr ":%%P "') do (
        taskkill /F /PID %%A >nul 2>&1
    )
)

:: Also kill any stray node.exe (ts-node-dev, etc.)
taskkill /F /IM node.exe >nul 2>&1
echo  [OK] All node processes stopped

echo.
echo  Ports 3000-3009 and 5173 are now free.
echo.
timeout /t 2 >nul
