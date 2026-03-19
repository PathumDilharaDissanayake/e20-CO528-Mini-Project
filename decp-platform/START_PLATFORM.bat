@echo off
chcp 65001 >nul
title DECP Platform - Complete Startup
color 0A

cls
echo ============================================
echo   🎓 DECP Platform - Complete Startup
echo ============================================
echo.

:: Check Docker
echo 🔍 Checking Docker...
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)
echo ✅ Docker is running

:: Start infrastructure
echo.
echo 🐳 Starting infrastructure containers...
docker start decp-postgres decp-redis decp-rabbitmq 2>nul
if errorlevel 1 (
    echo ⚠️  Some containers not found, they may need to be created first
    echo 📦 Running: docker-compose up -d
    cd decp-platform\backend
    docker-compose up -d postgres redis rabbitmq 2>nul
    cd ..\..
)

:: Wait for PostgreSQL
echo ⏳ Waiting for PostgreSQL to be ready...
:wait_postgres
docker exec decp-postgres pg_isready -U postgres >nul 2>&1
if errorlevel 1 (
    timeout /t 1 >nul
    goto wait_postgres
)
echo ✅ PostgreSQL is ready

:: Create databases if they don't exist
echo 📊 Ensuring databases exist...
docker exec decp-postgres psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname = 'decp_auth'" | findstr "1 row" >nul || (
    echo 🆕 Creating databases...
    docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_auth;" 2>nul
    docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_users;" 2>nul
    docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_feed;" 2>nul
    docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_jobs;" 2>nul
    docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_events;" 2>nul
    docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_research;" 2>nul
    docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_messaging;" 2>nul
    docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_notifications;" 2>nul
    docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_analytics;" 2>nul
    echo ✅ Databases created
)

:: Clear ts-node cache
echo 🧹 Clearing ts-node cache...
for /d %%i in (%TEMP%\ts-node*) do rmdir /s /q "%%i" 2>nul
echo ✅ Cache cleared

echo.
echo ============================================
echo   🚀 Starting Backend Services
echo ============================================
echo.

:: Start API Gateway
echo 🔌 Starting API Gateway (Port 3000)...
start "API Gateway :3000" cmd /k "cd decp-platform\backend\api-gateway && npm run dev"
timeout /t 3 >nul

:: Start Auth Service
echo 🔐 Starting Auth Service (Port 3001)...
start "Auth Service :3001" cmd /k "cd decp-platform\backend\auth-service && npm run dev"
timeout /t 2 >nul

:: Start User Service
echo 👤 Starting User Service (Port 3002)...
start "User Service :3002" cmd /k "cd decp-platform\backend\user-service && npm run dev"
timeout /t 2 >nul

:: Start Feed Service
echo 📰 Starting Feed Service (Port 3003)...
start "Feed Service :3003" cmd /k "cd decp-platform\backend\feed-service && npm run dev"
timeout /t 2 >nul

:: Start Jobs Service
echo 💼 Starting Jobs Service (Port 3004)...
start "Jobs Service :3004" cmd /k "cd decp-platform\backend\jobs-service && npm run dev"
timeout /t 2 >nul

:: Start Events Service
echo 📅 Starting Events Service (Port 3005)...
start "Events Service :3005" cmd /k "cd decp-platform\backend\events-service && npm run dev"
timeout /t 2 >nul

:: Start Research Service
echo 🔬 Starting Research Service (Port 3006)...
start "Research Service :3006" cmd /k "cd decp-platform\backend\research-service && npm run dev"
timeout /t 2 >nul

:: Start Messaging Service
echo 💬 Starting Messaging Service (Port 3007)...
start "Messaging Service :3007" cmd /k "cd decp-platform\backend\messaging-service && npm run dev"
timeout /t 2 >nul

:: Start Notification Service
echo 🔔 Starting Notification Service (Port 3008)...
start "Notification Service :3008" cmd /k "cd decp-platform\backend\notification-service && npm run dev"
timeout /t 2 >nul

:: Start Analytics Service
echo 📊 Starting Analytics Service (Port 3009)...
start "Analytics Service :3009" cmd /k "cd decp-platform\backend\analytics-service && npm run dev"
timeout /t 2 >nul

echo.
echo ============================================
echo   🎨 Starting Frontend Application
echo ============================================
echo.

:: Start Frontend
echo 🌐 Starting React Frontend (Port 5173)...
start "Frontend :5173" cmd /k "cd decp-platform\frontend && npm run dev"

echo.
echo ============================================
echo   ✅ All Services Started!
echo ============================================
echo.
echo 📍 Access URLs:
echo    • Web App:     http://localhost:5173
echo    • API Gateway: http://localhost:3000
echo    • PostgreSQL:  localhost:5433
echo.
echo 🧪 Test the application:
echo    1. Open http://localhost:5173 in your browser
echo    2. Click "Sign Up" to create an account
echo    3. Or use demo credentials:
echo      Email: demo@student.edu
echo      Password: password123
echo.
echo 📚 User Stories to Test:
echo    ✓ User Registration/Login
echo    ✓ Create/View Posts on Feed
echo    ✓ Post Jobs and Apply
echo    ✓ Create/RSVP to Events
echo    ✓ Research Collaboration
echo    ✓ Real-time Messaging
echo    ✓ Notifications
echo.
echo 🛑 To stop all services:
echo    Close each command window or run: taskkill /F /IM node.exe
echo.
pause
