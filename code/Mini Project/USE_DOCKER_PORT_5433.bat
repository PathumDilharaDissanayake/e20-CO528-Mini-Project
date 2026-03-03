@echo off
chcp 65001 >nul
cls
echo ============================================================
echo Using Docker PostgreSQL on Port 5433 (Avoids Windows Conflict)
echo ============================================================
echo.

set PROJECT_ROOT=E:\Academic\Semester_7\CO528\Mini Project\decp-platform

echo [*] Stopping and removing old Docker PostgreSQL...
docker stop decp-postgres >nul 2>&1
docker rm decp-postgres >nul 2>&1
echo     Done.
echo.

echo [*] Starting PostgreSQL on port 5433 (to avoid Windows PostgreSQL on 5432)...
docker run -d --name decp-postgres -e POSTGRES_PASSWORD=12345 -p 5433:5432 postgres:16-alpine
docker run -d --name decp-redis -p 6379:6379 redis:7-alpine 2>nul || echo Redis already running
docker run -d --name decp-rabbitmq -p 5672:5672 -p 15672:15672 -e RABBITMQ_DEFAULT_USER=admin -e RABBITMQ_DEFAULT_PASS=admin rabbitmq:3-management-alpine 2>nul || echo RabbitMQ already running
echo     Docker containers started.
echo.

echo [*] Waiting 20 seconds for PostgreSQL to initialize...
timeout /t 20 /nobreak >nul

echo [*] Creating databases on port 5433...
docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_auth;" 2>nul
docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_users;" 2>nul
docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_feed;" 2>nul
docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_jobs;" 2>nul
docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_events;" 2>nul
docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_research;" 2>nul
docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_messaging;" 2>nul
docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_notifications;" 2>nul
docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_analytics;" 2>nul
echo     Databases created.
echo.

echo [*] Testing connection on port 5433...
docker exec decp-postgres psql postgresql://postgres:12345@localhost:5432/decp_jobs -c "SELECT 'PORT 5433 WORKS';"
echo.

echo [*] Updating all services to use port 5433...
powershell -Command "Get-ChildItem -Path '%PROJECT_ROOT%\backend' -Recurse -Filter 'database.ts' | ForEach-Object { (Get-Content $_.FullName) -replace 'port: 5432', 'port: 5433' | Set-Content $_.FullName }"
powershell -Command "Get-ChildItem -Path '%PROJECT_ROOT%\backend' -Recurse -Filter 'index.ts' -Path '*/config/*' | ForEach-Object { (Get-Content $_.FullName) -replace 'DB_PORT \|\| .5432.', 'DB_PORT || '"'"'5433'"'"' | Set-Content $_.FullName }"
echo     Services updated to use port 5433.
echo.

echo [*] Killing any running Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM npm.exe >nul 2>&1
echo     Done.
echo.

echo [*] Clearing ts-node cache...
for /d %%i in (%TEMP%\ts-node*) do @rmdir /s /q "%%i" 2>nul
echo     Done.
echo.

echo [*] Starting all services...
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
echo [*] Waiting 15 seconds for services...
timeout /t 15 /nobreak >nul

echo [*] Starting Frontend...
cd /d "%PROJECT_ROOT%\frontend"
start "Frontend (5173)" cmd /k "npm run dev"

echo.
echo ============================================================
echo   ALL STARTED on Port 5433! Opening browser...
echo ============================================================
timeout /t 5 /nobreak >nul
start http://localhost:5173

echo.
echo Press any key to stop...
pause >nul
taskkill /F /IM node.exe >nul 2>&1
docker stop decp-postgres decp-redis decp-rabbitmq >nul 2>&1
echo Done!
