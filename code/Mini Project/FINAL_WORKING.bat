@echo off
chcp 65001 >nul
cls
echo ============================================================
echo   DECP Platform - FINAL WORKING VERSION (Password: 12345)
echo ============================================================
echo.

set PROJECT_ROOT=E:\Academic\Semester_7\CO528\Mini Project\decp-platform

echo [*] Killing old processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM npm.exe >nul 2>&1
for /d %%i in (%TEMP%\ts-node*) do @rmdir /s /q "%%i" 2>nul
echo     Done.
echo.

echo [*] Starting infrastructure...
docker start decp-postgres decp-redis decp-rabbitmq >nul 2>&1
if errorlevel 1 (
    echo     Creating new infrastructure...
    docker run -d --name decp-postgres -e POSTGRES_PASSWORD=12345 -p 5432:5432 postgres:16-alpine
    docker run -d --name decp-redis -p 6379:6379 redis:7-alpine
    docker run -d --name decp-rabbitmq -p 5672:5672 -p 15672:15672 -e RABBITMQ_DEFAULT_USER=admin -e RABBITMQ_DEFAULT_PASS=admin rabbitmq:3-management-alpine
    echo     Waiting 25 seconds for PostgreSQL...
    timeout /t 25 /nobreak >nul
    echo     Creating databases...
    docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_auth;" >nul 2>&1
    docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_users;" >nul 2>&1
    docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_feed;" >nul 2>&1
    docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_jobs;" >nul 2>&1
    docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_events;" >nul 2>&1
    docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_research;" >nul 2>&1
    docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_messaging;" >nul 2>&1
    docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_notifications;" >nul 2>&1
    docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_analytics;" >nul 2>&1
) else (
    echo     Infrastructure already running.
    timeout /t 3 /nobreak >nul
)
echo.

echo [*] Ensuring all databases exist...
docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_auth;" >nul 2>&1
docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_users;" >nul 2>&1
docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_feed;" >nul 2>&1
docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_jobs;" >nul 2>&1
docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_events;" >nul 2>&1
docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_research;" >nul 2>&1
docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_messaging;" >nul 2>&1
docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_notifications;" >nul 2>&1
docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_analytics;" >nul 2>&1
echo     Done.
echo.

echo [*] Testing database connection with password '12345'...
docker exec decp-postgres psql postgresql://postgres:12345@localhost:5432/decp_messaging -c "SELECT 'DATABASE OK';"
echo.

echo [*] Starting all services (password hardcoded as '12345')...
echo.

cd /d "%PROJECT_ROOT%\backend\auth-service"
start "Auth (3001)" cmd /k "echo === Auth Service === && npm run dev"
timeout /t 3 >nul

cd /d "%PROJECT_ROOT%\backend\user-service"
start "User (3002)" cmd /k "echo === User Service === && npm run dev"
timeout /t 3 >nul

cd /d "%PROJECT_ROOT%\backend\feed-service"
start "Feed (3003)" cmd /k "echo === Feed Service === && npm run dev"
timeout /t 3 >nul

cd /d "%PROJECT_ROOT%\backend\jobs-service"
start "Jobs (3004)" cmd /k "echo === Jobs Service === && npm run dev"
timeout /t 3 >nul

cd /d "%PROJECT_ROOT%\backend\events-service"
start "Events (3005)" cmd /k "echo === Events Service === && npm run dev"
timeout /t 3 >nul

cd /d "%PROJECT_ROOT%\backend\research-service"
start "Research (3006)" cmd /k "echo === Research Service === && npm run dev"
timeout /t 3 >nul

cd /d "%PROJECT_ROOT%\backend\messaging-service"
start "Messaging (3007)" cmd /k "echo === Messaging Service === && npm run dev"
timeout /t 3 >nul

cd /d "%PROJECT_ROOT%\backend\api-gateway"
start "Gateway (3000)" cmd /k "echo === API Gateway === && npm run dev"

echo.
echo   8 service windows opened.
echo [*] Waiting 15 seconds for services to start...
timeout /t 15 /nobreak >nul

echo.
echo [*] Starting Frontend...
cd /d "%PROJECT_ROOT%\frontend"
echo VITE_API_URL=http://localhost:3000/api> .env
echo VITE_SOCKET_URL=http://localhost:3007>> .env
start "Frontend (5173)" cmd /k "echo === Frontend === && npm run dev"

echo.
echo ============================================================
echo   ALL STARTED! Opening browser...
echo ============================================================
timeout /t 5 /nobreak >nul
start http://localhost:5173

echo.
echo Press any key to STOP everything...
pause >nul
taskkill /F /IM node.exe >nul 2>&1
docker stop decp-postgres decp-redis decp-rabbitmq >nul 2>&1
echo Done!
