@echo off
chcp 65001 >nul
cls
echo ============================================================
echo   Creating All Databases
echo ============================================================
echo.

echo [*] Starting PostgreSQL if not running...
docker start decp-postgres >nul 2>&1
timeout /t 5 /nobreak >nul

echo [*] Creating all databases...
docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_auth;" 2>nul
docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_users;" 2>nul
docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_feed;" 2>nul
docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_jobs;" 2>nul
docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_events;" 2>nul
docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_research;" 2>nul
docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_messaging;" 2>nul
docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_notifications;" 2>nul
docker exec decp-postgres psql -U postgres -c "CREATE DATABASE decp_analytics;" 2>nul

echo [*] Verifying databases created:
docker exec decp-postgres psql -U postgres -c "\l" | findstr "decp_"

echo.
echo Done! Now run: FINAL_WORKING.bat
pause
