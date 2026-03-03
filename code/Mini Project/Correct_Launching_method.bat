@echo off
chcp 65001 >nul
title DECP Platform - Fixed Launch
color 0A

cls
echo ============================================
echo   DECP Platform - Fixed Launch Script
echo ============================================
echo.

:: Get current directory (where the bat file is located)
set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%decp-platform"
set "BACKEND_ROOT=%PROJECT_ROOT%\backend"

:: Kill any running node processes
echo [*] Stopping any running services...
taskkill /F /IM node.exe 2>nul
echo     Done.
echo.

:: Start Docker containers
echo [*] Starting Docker containers...
docker start decp-postgres decp-redis decp-rabbitmq 2>nul
if errorlevel 1 (
    docker run -d --name decp-postgres -e POSTGRES_PASSWORD=12345 -p 5433:5432 postgres:16-alpine
    docker run -d --name decp-redis -p 6379:6379 redis:7-alpine 2>nul
    docker run -d --name decp-rabbitmq -p 5672:5672 -p 15672:15672 -e RABBITMQ_DEFAULT_USER=admin -e RABBITMQ_DEFAULT_PASS=admin rabbitmq:3-management-alpine 2>nul
)
echo     Docker containers started.
echo.

:: Wait for PostgreSQL
echo [*] Waiting for PostgreSQL...
:wait_postgres
docker exec decp-postgres pg_isready -U postgres >nul 2>&1
if errorlevel 1 (
    timeout /t 1 >nul
    goto wait_postgres
)
echo     PostgreSQL is ready.
echo.

:: Create databases
echo [*] Creating databases...
docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_auth;" 2>nul
docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_users;" 2>nul
docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_feed;" 2>nul
docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_jobs;" 2>nul
docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_events;" 2>nul
docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_research;" 2>nul
docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_messaging;" 2>nul
docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_notifications;" 2>nul
docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_analytics;" 2>nul
echo     Databases created/verified.
echo.

:: Start backend services
echo [*] Starting Backend Services...
echo.

:: Auth Service (port 3001) - MUST START FIRST
start "Auth Service :3001" cmd /k "cd /d "%BACKEND_ROOT%\auth-service" && npm run dev"

timeout /t 3 >nul

:: API Gateway (port 3000)
start "API Gateway :3000" cmd /k "cd /d "%BACKEND_ROOT%\api-gateway" && npm run dev"

timeout /t 2 >nul

:: User Service (port 3002)
start "User Service :3002" cmd /k "cd /d "%BACKEND_ROOT%\user-service" && npm run dev"

:: Feed Service (port 3003)
start "Feed Service :3003" cmd /k "cd /d "%BACKEND_ROOT%\feed-service" && npm run dev"

:: Jobs Service (port 3004)
start "Jobs Service :3004" cmd /k "cd /d "%BACKEND_ROOT%\jobs-service" && npm run dev"

:: Events Service (port 3005)
start "Events Service :3005" cmd /k "cd /d "%BACKEND_ROOT%\events-service" && npm run dev"

:: Research Service (port 3006)
start "Research Service :3006" cmd /k "cd /d "%BACKEND_ROOT%\research-service" && npm run dev"

:: Messaging Service (port 3007)
start "Messaging Service :3007" cmd /k "cd /d "%BACKEND_ROOT%\messaging-service" && npm run dev"

:: Notification Service (port 3008)
start "Notification Service :3008" cmd /k "cd /d "%BACKEND_ROOT%\notification-service" && npm run dev"

:: Analytics Service (port 3009)
start "Analytics Service :3009" cmd /k "cd /d "%BACKEND_ROOT%\analytics-service" && npm run dev"

echo     Backend services started.
echo.

:: Start Frontend
echo [*] Starting Frontend...
start "Frontend :5173" cmd /k "cd /d "%PROJECT_ROOT%\frontend" && npm run dev"

echo.
echo ============================================
echo   All Services Started!
echo ============================================
echo.
echo Access URLs:
echo   - Web App:     http://localhost:5173
echo   - API Gateway: http://localhost:3000
echo   - Auth Service: http://localhost:3001
echo.
echo IMPORTANT NOTES:
echo   - Registration works via direct auth service (port 3001)
echo   - Email verification is disabled (no SMTP)
echo   - Users can login immediately after registering
echo.
echo Press any key to exit this window...
pause >nul
