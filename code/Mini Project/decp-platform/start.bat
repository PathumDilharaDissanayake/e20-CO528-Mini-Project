@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title DECP Platform Launcher
color 0A

cls
echo.
echo  ============================================================
echo    DECP Platform - Department Engagement ^& Career Platform
echo  ============================================================
echo.

:: ----------------------------------------------------------------
:: Set base directory to wherever this .bat file lives
:: ----------------------------------------------------------------
set "BASE=%~dp0"
set "BACKEND=%BASE%backend"
set "FRONTEND=%BASE%frontend"
set "PSQL=C:\Program Files\PostgreSQL\18\bin\psql.exe"

:: ----------------------------------------------------------------
:: STEP 1 - Check PostgreSQL
:: ----------------------------------------------------------------
echo  [1/5] Checking PostgreSQL on port 5432...
curl -s --connect-timeout 2 http://localhost:5432 >nul 2>&1
"%PSQL%" -U postgres -c "SELECT 1" -o nul 2>nul
if errorlevel 1 (
    echo.
    echo  [ERROR] Cannot connect to PostgreSQL on port 5432.
    echo.
    echo  Make sure PostgreSQL is running. You can start it with:
    echo    net start postgresql-x64-18
    echo.
    pause
    exit /b 1
)
echo  [OK] PostgreSQL is running on port 5432
echo.

:: ----------------------------------------------------------------
:: STEP 2 - Create databases if they don't exist
:: ----------------------------------------------------------------
echo  [2/5] Ensuring all databases exist...
set "DBS=decp_auth decp_users decp_feed decp_jobs decp_events decp_research decp_messaging decp_notifications decp_analytics"
set "PGPASSWORD=12345"
for %%D in (%DBS%) do (
    "%PSQL%" -U postgres -lqt 2>nul | findstr /C:"%%D" >nul 2>&1
    if errorlevel 1 (
        "%PSQL%" -U postgres -c "CREATE DATABASE %%D;" >nul 2>&1
        echo  [DB] Created: %%D
    ) else (
        echo  [DB] Exists: %%D
    )
)
echo.

:: ----------------------------------------------------------------
:: STEP 3 - Kill any existing node processes on our ports
:: ----------------------------------------------------------------
echo  [3/5] Freeing ports 3000-3009 and 5173...
for %%P in (3000 3001 3002 3003 3004 3005 3006 3007 3008 3009 5173) do (
    for /f "tokens=5" %%A in ('netstat -ano 2^>nul ^| findstr ":%%P "') do (
        taskkill /F /PID %%A >nul 2>&1
    )
)
timeout /t 1 >nul
echo  [OK] Ports cleared
echo.

:: ----------------------------------------------------------------
:: STEP 4 - Build check (verify dist/ exists for each service)
:: ----------------------------------------------------------------
echo  [4/5] Checking compiled service builds...
set "MISSING_BUILDS="
for %%S in (api-gateway auth-service user-service feed-service jobs-service events-service research-service messaging-service notification-service analytics-service) do (
    if not exist "%BACKEND%\%%S\dist\server.js" (
        echo  [BUILD] Building %%S ...
        pushd "%BACKEND%\%%S"
        call npm run build >nul 2>&1
        if errorlevel 1 (
            echo  [WARN] Build failed for %%S - service may not start
        ) else (
            echo  [OK] Built %%S
        )
        popd
    ) else (
        echo  [OK] %%S  (dist ready)
    )
)
echo.

:: ----------------------------------------------------------------
:: STEP 5 - Start all services (each in its own window)
:: ----------------------------------------------------------------
echo  [5/5] Starting services...
echo.

:: Auth Service (3001) - start FIRST so gateway can reach it
echo  Starting Auth Service      (port 3001)...
start "Auth :3001" cmd /k "cd /d "%BACKEND%\auth-service" && node dist/server.js"
timeout /t 1 >nul

echo  Starting User Service      (port 3002)...
start "User :3002" cmd /k "cd /d "%BACKEND%\user-service" && node dist/server.js"
timeout /t 1 >nul

echo  Starting Feed Service      (port 3003)...
start "Feed :3003" cmd /k "cd /d "%BACKEND%\feed-service" && node dist/server.js"
timeout /t 1 >nul

echo  Starting Jobs Service      (port 3004)...
start "Jobs :3004" cmd /k "cd /d "%BACKEND%\jobs-service" && node dist/server.js"
timeout /t 1 >nul

echo  Starting Events Service    (port 3005)...
start "Events :3005" cmd /k "cd /d "%BACKEND%\events-service" && node dist/server.js"
timeout /t 1 >nul

echo  Starting Research Service  (port 3006)...
start "Research :3006" cmd /k "cd /d "%BACKEND%\research-service" && node dist/server.js"
timeout /t 1 >nul

echo  Starting Messaging Service (port 3007)...
start "Messaging :3007" cmd /k "cd /d "%BACKEND%\messaging-service" && node dist/server.js"
timeout /t 1 >nul

echo  Starting Notification Svc  (port 3008)...
start "Notify :3008" cmd /k "cd /d "%BACKEND%\notification-service" && node dist/server.js"
timeout /t 1 >nul

echo  Starting Analytics Service (port 3009)...
start "Analytics :3009" cmd /k "cd /d "%BACKEND%\analytics-service" && node dist/server.js"
timeout /t 2 >nul

:: API Gateway starts LAST (it proxies to all the above)
echo  Starting API Gateway       (port 3000)...
start "Gateway :3000" cmd /k "cd /d "%BACKEND%\api-gateway" && node dist/server.js"
timeout /t 3 >nul

echo.
echo  Starting Frontend          (port 5173)...
start "Frontend :5173" cmd /k "cd /d "%FRONTEND%" && npm run dev"

echo.
echo  ============================================================
echo.
echo  Waiting for API Gateway to be ready...
:wait_for_gateway
curl -s --connect-timeout 1 http://localhost:3000/health 2>nul | findstr "healthy" >nul
if errorlevel 1 (
    timeout /t 2 >nul
    goto wait_for_gateway
)
echo  [OK] API Gateway is up and all services connected
echo.

:: ----------------------------------------------------------------
:: Health Check Summary
:: ----------------------------------------------------------------
echo  Service Health Summary:
echo  ----------------------
for %%P in (3001 3002 3003 3004 3005 3006 3007 3008 3009) do (
    curl -s --connect-timeout 2 http://localhost:%%P/health 2>nul | findstr "true" >nul
    if errorlevel 1 (
        echo  [!!] Port %%P - NOT RESPONDING
    ) else (
        echo  [OK] Port %%P - UP
    )
)
echo.

:: ----------------------------------------------------------------
:: Open browser
:: ----------------------------------------------------------------
echo  Opening application in browser...
timeout /t 3 >nul
start "" http://localhost:5173

echo.
echo  ============================================================
echo   Access Points:
echo     Frontend:    http://localhost:5173
echo     API Gateway: http://localhost:3000/health
echo.
echo   Quick Test - Register at:
echo     http://localhost:5173  (click Sign Up)
echo.
echo   Or test the API directly:
echo     POST http://localhost:3000/api/v1/auth/register
echo.
echo   To STOP everything:
echo     Run stop.bat  OR  taskkill /F /IM node.exe
echo  ============================================================
echo.
pause
