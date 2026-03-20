@echo off
setlocal EnableDelayedExpansion
cls

:: ================================================================
::   DECP PLATFORM — ONE-CLICK SETUP
::   Digital Engineering Career Platform
::
::   Run this from the decp-platform\ root folder.
::   It will install dependencies, set up databases, and
::   launch all 10 backend services + 2 frontends.
::
::   MODES:
::     [1] Docker  — PostgreSQL + Redis run in Docker containers
::                   Node.js services run locally
::                   (Recommended — no PostgreSQL install needed)
::
::     [2] Local   — Use your already-installed PostgreSQL
::                   You supply the connection details
::
::   PREREQUISITES (both modes):
::     - Node.js 18+   https://nodejs.org  (choose LTS)
::     - Git (to have cloned this repo)
::
::   PREREQUISITES (Docker mode only):
::     - Docker Desktop  https://www.docker.com/products/docker-desktop
::
::   PREREQUISITES (Local mode only):
::     - PostgreSQL 14 or newer  https://www.postgresql.org/download/windows/
::       (psql.exe must be in your PATH, or in a standard install location)
::     - Redis (optional, needed for real-time chat)
::       https://github.com/tporadowski/redis/releases  (Windows port)
:: ================================================================

title DECP Platform — One-Click Setup
mode con: cols=82 lines=50
color 0A

echo.
echo  ================================================================
echo    DECP PLATFORM — One-Click Setup
echo    Digital Engineering Career Platform
echo  ================================================================
echo.

:: ----------------------------------------------------------------
:: Sanity check: must be in decp-platform root
:: ----------------------------------------------------------------
if not exist "%~dp0backend\" (
    echo  [ERROR] Run this script from the decp-platform\ folder.
    echo          Cannot find the "backend" subfolder here.
    pause & exit /b 1
)
cd /d "%~dp0"

:: ----------------------------------------------------------------
:: Check Node.js
:: ----------------------------------------------------------------
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] Node.js is not installed.
    echo          Download the LTS version from: https://nodejs.org
    pause & exit /b 1
)
for /f "tokens=*" %%V in ('node -v 2^>nul') do set NODE_VER=%%V
echo  [OK] Node.js %NODE_VER%

where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] npm not found. Please reinstall Node.js.
    pause & exit /b 1
)
for /f "tokens=*" %%V in ('npm -v 2^>nul') do set NPM_VER=%%V
echo  [OK] npm v%NPM_VER%
echo.

:: ================================================================
:: MODE SELECTION
:: ================================================================
echo  ================================================================
echo    How would you like to run PostgreSQL?
echo  ================================================================
echo.
echo   [1]  DOCKER  (Recommended)
echo        - PostgreSQL 16 + Redis run as Docker containers
echo        - All 9 databases created automatically
echo        - No PostgreSQL install needed on your machine
echo        - Requires: Docker Desktop running
echo.
echo   [2]  LOCAL POSTGRESQL
echo        - Use your existing PostgreSQL installation
echo        - You'll be asked for host / port / user / password
echo        - Databases will be created for you automatically
echo        - Requires: psql in PATH (or a standard install location)
echo.
echo   [Q]  Quit
echo.
set /p CHOICE="   Your choice (1 / 2 / Q): "

if /i "!CHOICE!"=="Q" exit /b 0
if "!CHOICE!"=="1" goto DOCKER_MODE
if "!CHOICE!"=="2" goto LOCAL_MODE
echo  Invalid choice. Exiting.
pause & exit /b 1


:: ================================================================
:: MODE 1: DOCKER (PostgreSQL + Redis in Docker)
:: ================================================================
:DOCKER_MODE
echo.
echo  ================================================================
echo    DOCKER MODE
echo  ================================================================
echo.

:: Check Docker CLI
where docker >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] Docker is not found in PATH.
    echo          Install Docker Desktop: https://www.docker.com/products/docker-desktop
    pause & exit /b 1
)

:: Check Docker daemon
docker info >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] Docker daemon is not running.
    echo          Please open Docker Desktop and wait for it to fully start, then re-run this script.
    pause & exit /b 1
)
echo  [OK] Docker Desktop is running.
echo.

:: Stop any old containers that might conflict
echo  Stopping any old DECP containers...
docker stop decp-postgres decp-redis >nul 2>&1
docker rm   decp-postgres decp-redis >nul 2>&1

:: Start only postgres + redis from the DB-only compose file
echo  Starting PostgreSQL and Redis containers...
cd backend
docker-compose -f docker-compose-db.yml up -d
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] docker-compose failed. See error above.
    cd ..
    pause & exit /b 1
)
cd ..

echo.
echo  [OK] Containers started. Waiting for PostgreSQL to accept connections...

:WAIT_PG_DOCKER
timeout /t 3 /nobreak >nul
docker exec decp-postgres pg_isready -U postgres >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo      Still waiting...
    goto WAIT_PG_DOCKER
)
echo  [OK] PostgreSQL is ready.

:: Also give Redis a moment
timeout /t 2 /nobreak >nul
docker exec decp-redis redis-cli ping >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo  [WARN] Redis might not be ready yet — messaging service will retry on its own.
) else (
    echo  [OK] Redis is ready.
)
echo.

:: Set env vars for .env generation
set DB_HOST=localhost
set DB_PORT=5432
set DB_USER=postgres
set DB_PASSWORD=12345
set REDIS_URL=redis://localhost:6379
goto WRITE_ENV_FILES


:: ================================================================
:: MODE 2: LOCAL POSTGRESQL
:: ================================================================
:LOCAL_MODE
echo.
echo  ================================================================
echo    LOCAL POSTGRESQL MODE
echo  ================================================================
echo.
echo  Press ENTER to accept the [default] value shown in brackets.
echo.

set DB_HOST=localhost
set DB_PORT=5432
set DB_USER=postgres
set DB_PASSWORD=12345

set /p _H="   Host     [localhost]: "
if not "!_H!"=="" set DB_HOST=!_H!

set /p _P="   Port     [5432]: "
if not "!_P!"=="" set DB_PORT=!_P!

set /p _U="   Username [postgres]: "
if not "!_U!"=="" set DB_USER=!_U!

set /p _W="   Password [12345]: "
if not "!_W!"=="" set DB_PASSWORD=!_W!

echo.

:: Find psql — check PATH first, then common install locations
set PSQL_CMD=psql
where psql >nul 2>&1
if %ERRORLEVEL% neq 0 (
    :: Search common PostgreSQL install paths on Windows
    for %%V in (17 16 15 14 13) do (
        if exist "C:\Program Files\PostgreSQL\%%V\bin\psql.exe" (
            set PSQL_CMD=C:\Program Files\PostgreSQL\%%V\bin\psql.exe
            echo  [INFO] Found psql at: !PSQL_CMD!
            goto PSQL_FOUND
        )
    )
    echo  [ERROR] psql.exe not found.
    echo          Add PostgreSQL's bin folder to your PATH, e.g.:
    echo          C:\Program Files\PostgreSQL\16\bin
    echo          Then restart this script.
    pause & exit /b 1
    :PSQL_FOUND
)

:: Test connection
set PGPASSWORD=!DB_PASSWORD!
"!PSQL_CMD!" -h !DB_HOST! -p !DB_PORT! -U !DB_USER! -c "SELECT 1;" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] Cannot connect to PostgreSQL.
    echo          Check your credentials and that PostgreSQL is running.
    echo          (Make sure pg_hba.conf allows md5/scram auth for localhost)
    set PGPASSWORD=
    pause & exit /b 1
)
echo  [OK] PostgreSQL connection successful.
echo.

:: Create all 9 databases
echo  Creating databases (skipping any that already exist)...
for %%D in (decp_auth decp_users decp_feed decp_jobs decp_events decp_research decp_messaging decp_notifications decp_analytics) do (
    "!PSQL_CMD!" -h !DB_HOST! -p !DB_PORT! -U !DB_USER! -tc "SELECT 1 FROM pg_database WHERE datname='%%D'" 2>nul | findstr /C:"1" >nul 2>&1
    if !ERRORLEVEL! neq 0 (
        "!PSQL_CMD!" -h !DB_HOST! -p !DB_PORT! -U !DB_USER! -c "CREATE DATABASE %%D;" >nul 2>&1
        echo  [CREATED]  %%D
    ) else (
        echo  [EXISTS]   %%D
    )
)
set PGPASSWORD=
echo.

:: Check Redis
echo  Checking Redis on localhost:6379...
where redis-cli >nul 2>&1
if %ERRORLEVEL% equ 0 (
    redis-cli ping >nul 2>&1
    if !ERRORLEVEL! equ 0 (
        echo  [OK] Redis is running.
    ) else (
        echo  [WARN] Redis is installed but not running. Start it with:  redis-server
        echo         Messaging (chat) will not work without Redis.
    )
) else (
    echo  [WARN] redis-cli not found. Redis may not be installed.
    echo         The messaging service requires Redis for real-time chat.
    echo         Download: https://github.com/tporadowski/redis/releases
)
echo.
set REDIS_URL=redis://localhost:6379

goto WRITE_ENV_FILES


:: ================================================================
:: WRITE ALL .ENV FILES
:: ================================================================
:WRITE_ENV_FILES
echo  ================================================================
echo    Writing .env files for all services...
echo  ================================================================
echo.

:: ---- API Gateway ------------------------------------------------
(
    echo NODE_ENV=development
    echo PORT=3000
    echo JWT_SECRET=your-super-secret-jwt-key-change-in-production-12345678
    echo JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-12345678
    echo AUTH_SERVICE_URL=http://localhost:3001
    echo USER_SERVICE_URL=http://localhost:3002
    echo FEED_SERVICE_URL=http://localhost:3003
    echo JOBS_SERVICE_URL=http://localhost:3004
    echo EVENTS_SERVICE_URL=http://localhost:3005
    echo RESEARCH_SERVICE_URL=http://localhost:3006
    echo MESSAGING_SERVICE_URL=http://localhost:3007
    echo NOTIFICATION_SERVICE_URL=http://localhost:3008
    echo ANALYTICS_SERVICE_URL=http://localhost:3009
    echo RATE_LIMIT_WINDOW_MS=900000
    echo RATE_LIMIT_MAX_REQUESTS=360000
    echo INTERNAL_SERVICE_TOKEN=decp-internal-svc-token-change-in-production-2026
    echo CORS_ORIGIN=http://localhost:5173,http://localhost:5174
) > "backend\api-gateway\.env"
echo  [OK] api-gateway

:: ---- Auth Service -----------------------------------------------
(
    echo NODE_ENV=development
    echo PORT=3001
    echo DB_HOST=!DB_HOST!
    echo DB_PORT=!DB_PORT!
    echo DB_NAME=decp_auth
    echo DB_USER=!DB_USER!
    echo DB_PASSWORD=!DB_PASSWORD!
    echo JWT_SECRET=your-super-secret-jwt-key-change-in-production-12345678
    echo JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-12345678
    echo JWT_EXPIRES_IN=1d
    echo JWT_REFRESH_EXPIRES_IN=7d
    echo GOOGLE_CLIENT_ID=
    echo GOOGLE_CLIENT_SECRET=
    echo GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback
    echo SMTP_HOST=smtp.gmail.com
    echo SMTP_PORT=587
    echo SMTP_USER=
    echo SMTP_PASS=
    echo SMTP_FROM=DECP Platform
    echo FRONTEND_URL=http://localhost:5173
    echo INTERNAL_SERVICE_TOKEN=decp-internal-svc-token-change-in-production-2026
) > "backend\auth-service\.env"
echo  [OK] auth-service

:: ---- User Service -----------------------------------------------
(
    echo NODE_ENV=development
    echo PORT=3002
    echo DB_HOST=!DB_HOST!
    echo DB_PORT=!DB_PORT!
    echo DB_NAME=decp_users
    echo DB_USER=!DB_USER!
    echo DB_PASSWORD=!DB_PASSWORD!
    echo INTERNAL_SERVICE_TOKEN=decp-internal-svc-token-change-in-production-2026
) > "backend\user-service\.env"
echo  [OK] user-service

:: ---- Feed Service -----------------------------------------------
(
    echo NODE_ENV=development
    echo PORT=3003
    echo DB_HOST=!DB_HOST!
    echo DB_PORT=!DB_PORT!
    echo DB_NAME=decp_feed
    echo DB_USER=!DB_USER!
    echo DB_PASSWORD=!DB_PASSWORD!
    echo UPLOAD_DIR=uploads
    echo MAX_FILE_SIZE=20971520
    echo INTERNAL_SERVICE_TOKEN=decp-internal-svc-token-change-in-production-2026
) > "backend\feed-service\.env"
echo  [OK] feed-service

:: ---- Jobs Service -----------------------------------------------
(
    echo NODE_ENV=development
    echo PORT=3004
    echo DB_HOST=!DB_HOST!
    echo DB_PORT=!DB_PORT!
    echo DB_NAME=decp_jobs
    echo DB_USER=!DB_USER!
    echo DB_PASSWORD=!DB_PASSWORD!
    echo INTERNAL_SERVICE_TOKEN=decp-internal-svc-token-change-in-production-2026
) > "backend\jobs-service\.env"
echo  [OK] jobs-service

:: ---- Events Service ---------------------------------------------
(
    echo NODE_ENV=development
    echo PORT=3005
    echo DB_HOST=!DB_HOST!
    echo DB_PORT=!DB_PORT!
    echo DB_NAME=decp_events
    echo DB_USER=!DB_USER!
    echo DB_PASSWORD=!DB_PASSWORD!
    echo UPLOAD_DIR=uploads
    echo INTERNAL_SERVICE_TOKEN=decp-internal-svc-token-change-in-production-2026
) > "backend\events-service\.env"
echo  [OK] events-service

:: ---- Research Service -------------------------------------------
(
    echo NODE_ENV=development
    echo PORT=3006
    echo DB_HOST=!DB_HOST!
    echo DB_PORT=!DB_PORT!
    echo DB_NAME=decp_research
    echo DB_USER=!DB_USER!
    echo DB_PASSWORD=!DB_PASSWORD!
    echo UPLOAD_DIR=uploads
    echo INTERNAL_SERVICE_TOKEN=decp-internal-svc-token-change-in-production-2026
) > "backend\research-service\.env"
echo  [OK] research-service

:: ---- Messaging Service ------------------------------------------
(
    echo NODE_ENV=development
    echo PORT=3007
    echo DB_HOST=!DB_HOST!
    echo DB_PORT=!DB_PORT!
    echo DB_NAME=decp_messaging
    echo DB_USER=!DB_USER!
    echo DB_PASSWORD=!DB_PASSWORD!
    echo JWT_SECRET=your-super-secret-jwt-key-change-in-production-12345678
    echo REDIS_URL=!REDIS_URL!
    echo INTERNAL_SERVICE_TOKEN=decp-internal-svc-token-change-in-production-2026
) > "backend\messaging-service\.env"
echo  [OK] messaging-service

:: ---- Notification Service ---------------------------------------
(
    echo NODE_ENV=development
    echo PORT=3008
    echo DB_HOST=!DB_HOST!
    echo DB_PORT=!DB_PORT!
    echo DB_NAME=decp_notifications
    echo DB_USER=!DB_USER!
    echo DB_PASSWORD=!DB_PASSWORD!
    echo SMTP_HOST=smtp.gmail.com
    echo SMTP_PORT=587
    echo SMTP_USER=
    echo SMTP_PASS=
    echo VAPID_PUBLIC_KEY=
    echo VAPID_PRIVATE_KEY=
    echo INTERNAL_SERVICE_TOKEN=decp-internal-svc-token-change-in-production-2026
) > "backend\notification-service\.env"
echo  [OK] notification-service

:: ---- Analytics Service ------------------------------------------
(
    echo NODE_ENV=development
    echo PORT=3009
    echo DB_HOST=!DB_HOST!
    echo DB_PORT=!DB_PORT!
    echo DB_NAME=decp_analytics
    echo DB_USER=!DB_USER!
    echo DB_PASSWORD=!DB_PASSWORD!
    echo INTERNAL_SERVICE_TOKEN=decp-internal-svc-token-change-in-production-2026
) > "backend\analytics-service\.env"
echo  [OK] analytics-service

:: ---- Frontends --------------------------------------------------
(
    echo VITE_API_URL=http://localhost:3000/api/v1
) > "frontend\.env"
echo  [OK] frontend

(
    echo VITE_API_URL=http://localhost:3000/api/v1
) > "mobile-web\.env"
echo  [OK] mobile-web

echo.

:: ================================================================
:: NPM INSTALL — BACKEND SERVICES
:: ================================================================
echo  ================================================================
echo    Installing npm packages for all services...
echo    (First run takes a few minutes — subsequent runs are fast)
echo  ================================================================
echo.

set BACKEND_SERVICES=api-gateway auth-service user-service feed-service jobs-service events-service research-service messaging-service notification-service analytics-service

for %%S in (%BACKEND_SERVICES%) do (
    echo  Installing backend\%%S ...
    pushd "backend\%%S"
    call npm install --prefer-offline --loglevel=error 2>&1 | findstr /V "^npm warn"
    if !ERRORLEVEL! neq 0 (
        echo  [ERROR] npm install failed for %%S — check the output above.
    ) else (
        echo  [OK]   backend\%%S
    )
    popd
)

echo.
echo  Installing frontend ...
pushd frontend
call npm install --prefer-offline --loglevel=error 2>&1 | findstr /V "^npm warn"
echo  [OK]   frontend
popd

echo.
echo  Installing mobile-web ...
pushd mobile-web
call npm install --prefer-offline --loglevel=error 2>&1 | findstr /V "^npm warn"
echo  [OK]   mobile-web
popd

echo.

:: ================================================================
:: CREATE UPLOAD FOLDERS (feed-service, events-service, research-service)
:: ================================================================
if not exist "backend\feed-service\uploads"     mkdir "backend\feed-service\uploads"
if not exist "backend\events-service\uploads"   mkdir "backend\events-service\uploads"
if not exist "backend\research-service\uploads" mkdir "backend\research-service\uploads"
echo  [OK] Upload directories ready.
echo.

:: ================================================================
:: START ALL SERVICES
:: (Each opens in its own cmd window so you can see logs)
:: ================================================================
echo  ================================================================
echo    Launching services in separate windows...
echo    Each service opens its own console window.
echo    Close those windows to stop individual services.
echo  ================================================================
echo.

:: Start microservices first (give them time to connect to DB)
set BACKEND_SVC_LIST=auth-service user-service feed-service jobs-service events-service research-service messaging-service notification-service analytics-service

for %%S in (%BACKEND_SVC_LIST%) do (
    echo  Starting %%S  (port will be shown in its window)
    start "DECP: %%S" cmd /k "title DECP: %%S && cd /d "%~dp0backend\%%S" && npm run dev"
    timeout /t 1 /nobreak >nul
)

:: API Gateway last (depends on other services being up)
echo.
echo  Waiting 5 seconds before starting API Gateway...
timeout /t 5 /nobreak >nul
echo  Starting api-gateway (port 3000)
start "DECP: api-gateway" cmd /k "title DECP: api-gateway && cd /d "%~dp0backend\api-gateway" && npm run dev"

:: Frontends
echo.
timeout /t 2 /nobreak >nul
echo  Starting frontend (port 5173)
start "DECP: frontend" cmd /k "title DECP: frontend && cd /d "%~dp0frontend" && npm run dev"

timeout /t 1 /nobreak >nul
echo  Starting mobile-web (port 5174)
start "DECP: mobile-web" cmd /k "title DECP: mobile-web && cd /d "%~dp0mobile-web" && npm run dev"

:: ================================================================
:: DONE
:: ================================================================
echo.
echo  ================================================================
echo    All services launched!
echo  ================================================================
echo.
echo   Give the services about 15-30 seconds to fully start up.
echo   (Watch the individual windows — each prints "running on port X"
echo    when ready. TypeScript compilation happens on first launch.)
echo.
echo   ---- URLs -----------------------------------------------
echo.
echo    Frontend (Main Web App)   http://localhost:5173
echo    Mobile Web App            http://localhost:5174
echo    API Gateway               http://localhost:3000
echo    API Documentation         http://localhost:3000/api/docs
echo.
echo   ---- Backend Services -----------------------------------
echo.
echo    Auth Service              http://localhost:3001/health
echo    User Service              http://localhost:3002/health
echo    Feed Service              http://localhost:3003/health
echo    Jobs Service              http://localhost:3004/health
echo    Events Service            http://localhost:3005/health
echo    Research Service          http://localhost:3006/health
echo    Messaging Service         http://localhost:3007/health
echo    Notification Service      http://localhost:3008/health
echo    Analytics Service         http://localhost:3009/health
echo.
echo   ---- Database -------------------------------------------
echo.
echo    Host:      !DB_HOST!:!DB_PORT!
echo    User:      !DB_USER!
echo    Databases: decp_auth, decp_users, decp_feed, decp_jobs,
echo               decp_events, decp_research, decp_messaging,
echo               decp_notifications, decp_analytics
echo.
echo   ---- Stopping everything --------------------------------
echo.
echo    Close each service's console window individually, or
echo    run:  stop-all.bat  (created next to this file)
echo.
echo  ================================================================

:: ================================================================
:: CREATE stop-all.bat AS A BONUS
:: ================================================================
(
    echo @echo off
    echo title DECP Platform — Stop All
    echo echo Stopping all DECP service windows...
    echo taskkill /FI "WINDOWTITLE eq DECP: *" /T /F ^>nul 2^>^&1
    echo.
    echo :: Stop Docker containers if they are running
    echo docker stop decp-postgres decp-redis ^>nul 2^>^&1
    echo.
    echo echo All DECP processes stopped.
    echo pause
) > "%~dp0stop-all.bat"

echo  (stop-all.bat has been created in the same folder as setup.bat)
echo.
echo  Press any key to close this setup window...
pause >nul
endlocal
