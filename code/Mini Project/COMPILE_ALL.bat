@echo off
chcp 65001 >nul
cls
echo ============================================================
echo   COMPILE ALL SERVICES (Avoid ts-node-dev issues)
echo ============================================================
echo.

set PROJECT_ROOT=E:\Academic\Semester_7\CO528\Mini Project\decp-platform

echo [*] Killing old processes...
taskkill /F /IM node.exe >nul 2>&1
echo     Done.
echo.

echo [*] Starting infrastructure...
docker start decp-postgres decp-redis decp-rabbitmq >nul 2>&1
timeout /t 5 /nobreak >nul
echo     Done.
echo.

echo [*] Compiling all services...
echo     This will take a few minutes...
echo.

for %%s in (auth-service,user-service,feed-service,jobs-service,events-service,research-service,messaging-service,notification-service,analytics-service,api-gateway) do (
    echo [%%s] Compiling...
    cd /d "%PROJECT_ROOT%\backend\%%s"
    if not exist node_modules (
        echo     Installing dependencies...
        call npm install >nul 2>&1
    )
    call npx tsc >nul 2>&1
    if exist dist\server.js (
        echo     SUCCESS - compiled to dist/server.js
    ) else (
        echo     WARNING - may have compilation errors
    )
)

echo.
echo [*] Starting compiled services...
echo.

cd /d "%PROJECT_ROOT%\backend\auth-service"
start "Auth (3001)" cmd /k "node dist/server.js"
timeout /t 2 >nul

cd /d "%PROJECT_ROOT%\backend\user-service"
start "User (3002)" cmd /k "node dist/server.js"
timeout /t 2 >nul

cd /d "%PROJECT_ROOT%\backend\feed-service"
start "Feed (3003)" cmd /k "node dist/server.js"
timeout /t 2 >nul

cd /d "%PROJECT_ROOT%\backend\jobs-service"
start "Jobs (3004)" cmd /k "node dist/server.js"
timeout /t 2 >nul

cd /d "%PROJECT_ROOT%\backend\events-service"
start "Events (3005)" cmd /k "node dist/server.js"
timeout /t 2 >nul

cd /d "%PROJECT_ROOT%\backend\research-service"
start "Research (3006)" cmd /k "node dist/server.js"
timeout /t 2 >nul

cd /d "%PROJECT_ROOT%\backend\messaging-service"
start "Messaging (3007)" cmd /k "node dist/server.js"
timeout /t 2 >nul

cd /d "%PROJECT_ROOT%\backend\api-gateway"
start "Gateway (3000)" cmd /k "node dist/server.js"

echo.
echo [*] Waiting 10 seconds...
timeout /t 10 /nobreak >nul

echo.
echo [*] Starting Frontend...
cd /d "%PROJECT_ROOT%\frontend"
start "Frontend" cmd /k "npm run dev"

echo.
echo ============================================================
echo   STARTED! Opening browser...
echo ============================================================
timeout /t 5 /nobreak >nul
start http://localhost:5173

echo.
echo Press any key to stop...
pause >nul
taskkill /F /IM node.exe >nul 2>&1
docker stop decp-postgres decp-redis decp-rabbitmq >nul 2>&1
echo Done!
