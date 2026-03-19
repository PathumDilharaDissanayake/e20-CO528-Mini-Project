@echo off
chcp 65001 >nul
cls
echo ============================================================
echo   RUNNING ON PORT 5433 (No Windows PostgreSQL Conflict)
echo ============================================================
echo.

set PROJECT_ROOT=E:\Academic\Semester_7\CO528\Mini Project\decp-platform

echo [*] Killing old Node processes...
taskkill /F /IM node.exe >nul 2>&1
for /d %%i in (%TEMP%\ts-node*) do @rmdir /s /q "%%i" 2>nul
echo     Done.
echo.

echo [*] Starting infrastructure (if not already running)...
docker start decp-postgres decp-redis decp-rabbitmq >nul 2>&1
echo     Done.
echo.

echo [*] Testing connection on port 5433...
docker exec decp-postgres psql postgresql://postgres:12345@localhost:5432/decp_jobs -c "SELECT 'PORT 5433 READY';"
echo.

echo [*] Starting ALL services on port 5433...
echo.

cd /d "%PROJECT_ROOT%\backend\auth-service"
start "Auth 3001" cmd /k "npm run dev"
timeout /t 3 >nul

cd /d "%PROJECT_ROOT%\backend\user-service"
start "User 3002" cmd /k "npm run dev"
timeout /t 3 >nul

cd /d "%PROJECT_ROOT%\backend\feed-service"
start "Feed 3003" cmd /k "npm run dev"
timeout /t 3 >nul

cd /d "%PROJECT_ROOT%\backend\jobs-service"
start "Jobs 3004" cmd /k "npm run dev"
timeout /t 3 >nul

cd /d "%PROJECT_ROOT%\backend\events-service"
start "Events 3005" cmd /k "npm run dev"
timeout /t 3 >nul

cd /d "%PROJECT_ROOT%\backend\research-service"
start "Research 3006" cmd /k "npm run dev"
timeout /t 3 >nul

cd /d "%PROJECT_ROOT%\backend\messaging-service"
start "Messaging 3007" cmd /k "npm run dev"
timeout /t 3 >nul

cd /d "%PROJECT_ROOT%\backend\api-gateway"
start "Gateway 3000" cmd /k "npm run dev"

echo.
echo   All 8 service windows opened.
echo [*] Waiting 15 seconds...
timeout /t 15 /nobreak >nul

echo [*] Starting Frontend...
cd /d "%PROJECT_ROOT%\frontend"
start "Frontend 5173" cmd /k "npm run dev"

echo.
echo ============================================================
echo   STARTED! Opening http://localhost:5173
echo ============================================================
timeout /t 5 /nobreak >nul
start http://localhost:5173

echo.
echo Press any key to stop...
pause >nul
taskkill /F /IM node.exe >nul 2>&1
echo Done!
