@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title DECP Platform Launcher
color 0A

cls
echo.
echo  ============================================================
echo    DECP Platform - Department Engagement ^& Career Platform
echo    Sprint 3 Build  ^|  Production Readiness: 93/100
echo  ============================================================
echo.

:: ----------------------------------------------------------------
:: Set base directory to wherever this .bat file lives
:: ----------------------------------------------------------------
set "BASE=%~dp0"
set "BACKEND=%BASE%backend"
set "FRONTEND=%BASE%frontend"
set "PSQL=C:\Program Files\PostgreSQL\18\bin\psql.exe"
set "PGPASSWORD=12345"

:: ----------------------------------------------------------------
:: PRE-CHECK - Node.js
:: ----------------------------------------------------------------
where node >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js not found. Please install it from https://nodejs.org
    echo  Then run this script again.
    pause
    exit /b 1
)
for /f "tokens=*" %%V in ('node --version 2^>nul') do set "NODE_VER=%%V"
echo  [OK] Node.js !NODE_VER! detected
echo.

:: ----------------------------------------------------------------
:: STEP 1 - Check PostgreSQL
:: ----------------------------------------------------------------
echo  [1/6] Checking PostgreSQL on port 5432...
"%PSQL%" -U postgres -c "SELECT 1" -o nul 2>nul
if errorlevel 1 (
    echo.
    echo  [ERROR] Cannot connect to PostgreSQL on port 5432.
    echo.
    echo  Start it with:   net start postgresql-x64-18
    echo.
    pause
    exit /b 1
)
echo  [OK] PostgreSQL is running
echo.

:: ----------------------------------------------------------------
:: STEP 2 - Create databases if they don't exist
:: ----------------------------------------------------------------
echo  [2/6] Ensuring all databases exist...
set "DBS=decp_auth decp_users decp_feed decp_jobs decp_events decp_research decp_messaging decp_notifications decp_analytics"
for %%D in (%DBS%) do (
    "%PSQL%" -U postgres -lqt 2>nul | findstr /C:"%%D" >nul 2>&1
    if errorlevel 1 (
        "%PSQL%" -U postgres -c "CREATE DATABASE %%D;" >nul 2>&1
        echo  [DB] Created: %%D
    ) else (
        echo  [DB] Exists:  %%D
    )
)
echo.

:: ----------------------------------------------------------------
:: STEP 3 - Free ports
:: ----------------------------------------------------------------
echo  [3/6] Freeing ports 3000-3009 and 5173...
for %%P in (3000 3001 3002 3003 3004 3005 3006 3007 3008 3009 5173) do (
    for /f "tokens=5" %%A in ('netstat -ano 2^>nul ^| findstr ":%%P "') do (
        taskkill /F /PID %%A >nul 2>&1
    )
)
timeout /t 1 >nul
echo  [OK] Ports cleared
echo.

:: ----------------------------------------------------------------
:: STEP 4 - Create required upload directories
:: ----------------------------------------------------------------
echo  [4/6] Ensuring upload directories exist...
if not exist "%BACKEND%\feed-service\uploads" mkdir "%BACKEND%\feed-service\uploads"
if not exist "%BACKEND%\research-service\uploads" mkdir "%BACKEND%\research-service\uploads"
echo  [OK] Upload dirs ready
echo.

:: ----------------------------------------------------------------
:: STEP 5 - Install npm dependencies (skipped if already installed)
:: ----------------------------------------------------------------
echo  [5/6] Checking npm dependencies...
echo.
set "INSTALL_NEEDED=0"
for %%S in (api-gateway auth-service user-service feed-service jobs-service events-service research-service messaging-service notification-service analytics-service) do (
    if not exist "%BACKEND%\%%S\node_modules" set "INSTALL_NEEDED=1"
)
if not exist "%FRONTEND%\node_modules" set "INSTALL_NEEDED=1"

if "!INSTALL_NEEDED!"=="1" (
    echo  First-time setup detected — installing npm dependencies.
    echo  This takes 2-5 minutes on first run, never again after that.
    echo.
    for %%S in (api-gateway auth-service user-service feed-service jobs-service events-service research-service messaging-service notification-service analytics-service) do (
        if not exist "%BACKEND%\%%S\node_modules" (
            echo  Installing %%S ...
            pushd "%BACKEND%\%%S"
            call npm install --prefer-offline >nul 2>&1
            if errorlevel 1 (
                echo  [FAIL] %%S npm install failed
            ) else (
                echo  [OK]   %%S
            )
            popd
        )
    )
    if not exist "%FRONTEND%\node_modules" (
        echo  Installing frontend ...
        pushd "%FRONTEND%"
        call npm install --prefer-offline >nul 2>&1
        if errorlevel 1 (
            echo  [FAIL] frontend npm install failed
        ) else (
            echo  [OK]   frontend
        )
        popd
    )
) else (
    echo  [OK] All dependencies already installed ^(skipping^)
)
echo.

:: ----------------------------------------------------------------
:: STEP 6 - Build all services (forced rebuild — new middleware added)
:: ----------------------------------------------------------------
echo  [6/7] Building all services (this takes ~60 seconds)...
echo.

set "BUILD_OK=1"
for %%S in (api-gateway auth-service user-service feed-service jobs-service events-service research-service messaging-service notification-service analytics-service) do (
    echo  Building %%S ...
    pushd "%BACKEND%\%%S"
    :: Remove stale dist so TypeScript picks up all new source files
    if exist dist rmdir /s /q dist >nul 2>&1
    call npm run build >nul 2>&1
    if errorlevel 1 (
        echo  [FAIL] %%S - build failed ^(TypeScript errors^)
        set "BUILD_OK=0"
    ) else (
        echo  [OK]   %%S
    )
    popd
)

if "%BUILD_OK%"=="0" (
    echo.
    echo  [ERROR] One or more services failed to build.
    echo  Run: cd backend\^<service^> ^&^& npm run build
    echo  to see the TypeScript errors.
    echo.
    pause
    exit /b 1
)
echo.

:: ----------------------------------------------------------------
:: STEP 7 - Start all services (each in its own window)
:: ----------------------------------------------------------------
echo  [7/7] Starting services...
echo.

:: Services start in dependency order; Auth first so gateway can reach it on boot
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

:: ----------------------------------------------------------------
:: Wait for API Gateway health check
:: ----------------------------------------------------------------
echo.
echo  Waiting for API Gateway to be ready...
:wait_for_gateway
curl -s --connect-timeout 1 http://localhost:3000/health 2>nul | findstr "healthy" >nul
if errorlevel 1 (
    timeout /t 2 >nul
    goto wait_for_gateway
)
echo  [OK] API Gateway is up
echo.

:: ----------------------------------------------------------------
:: Health Check Summary
:: ----------------------------------------------------------------
echo  Service Health Summary:
echo  -----------------------------------------------------------------
echo   Port   Service              Status
echo  -----------------------------------------------------------------
set "NAMES[3001]=Auth Service      "
set "NAMES[3002]=User Service      "
set "NAMES[3003]=Feed Service      "
set "NAMES[3004]=Jobs Service      "
set "NAMES[3005]=Events Service    "
set "NAMES[3006]=Research Service  "
set "NAMES[3007]=Messaging Service "
set "NAMES[3008]=Notification Svc  "
set "NAMES[3009]=Analytics Service "
for %%P in (3001 3002 3003 3004 3005 3006 3007 3008 3009) do (
    curl -s --connect-timeout 2 http://localhost:%%P/health 2>nul | findstr "true" >nul
    if errorlevel 1 (
        echo   %%P   !NAMES[%%P]!  [!! DOWN !!]
    ) else (
        echo   %%P   !NAMES[%%P]!  [OK]
    )
)
echo  -----------------------------------------------------------------
echo.

:: ----------------------------------------------------------------
:: Open browser
:: ----------------------------------------------------------------
echo  Opening application in browser...
timeout /t 3 >nul
start "" http://localhost:5173

:: ----------------------------------------------------------------
:: Summary
:: ----------------------------------------------------------------
echo.
echo  ============================================================
echo   Access Points:
echo  ============================================================
echo.
echo    Frontend App:   http://localhost:5173
echo    API Gateway:    http://localhost:3000/health
echo    Swagger UI:     http://localhost:3000/api/docs
echo    OpenAPI YAML:   http://localhost:3000/api/docs/openapi.yaml
echo.
echo  ============================================================
echo   Test Credentials:
echo  ============================================================
echo.
echo    Admin:   admin@decp.edu       / Admin1234x
echo    Faculty: prof.james@decp.edu  / Pass1234x
echo    Student: alice.student@decp.edu / Pass1234x
echo    Alumni:  david.alumni@decp.edu  / Pass1234x
echo.
echo  ============================================================
echo   Quick API Tests  (requires: curl):
echo  ============================================================
echo.
echo    Login:
echo      curl -X POST http://localhost:3000/api/v1/auth/login
echo           -H "Content-Type: application/json"
echo           -d "{""email"":""admin@decp.edu"",""password"":""Admin1234x""}"
echo.
echo    List Jobs (public):
echo      curl http://localhost:3000/api/v1/jobs
echo.
echo    List Events (public):
echo      curl http://localhost:3000/api/v1/events
echo.
echo  ============================================================
echo   Run unit tests in a new window:
echo  ============================================================
echo.
echo    test.bat         ^<-- runs all Jest unit tests
echo.
echo   Or seed demo data (with services running):
echo    node seed.js
echo.
echo  ============================================================
echo.
echo   To STOP everything:   stop.bat
echo  ============================================================
echo.
pause
