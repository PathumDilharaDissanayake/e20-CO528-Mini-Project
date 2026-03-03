@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title DECP Platform - Test Runner
color 0B

cls
echo.
echo  ============================================================
echo    DECP Platform - Test Suite Runner
echo  ============================================================
echo.

set "BASE=%~dp0"
set "TESTS=%BASE%tests"
set "FRONTEND=%BASE%frontend"

:: ----------------------------------------------------------------
:: Check Jest is available
:: ----------------------------------------------------------------
where npx >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] npx not found. Make sure Node.js is installed.
    pause
    exit /b 1
)

:: ----------------------------------------------------------------
:: Menu
:: ----------------------------------------------------------------
echo  What would you like to test?
echo.
echo    [1] All unit tests  (jest tests/unit/)
echo    [2] authService     (30 cases)
echo    [3] postService     (32 cases)
echo    [4] userService     (18 cases)
echo    [5] jobService      (19 cases)
echo    [6] eventService    (18 cases)
echo    [7] researchService (20 cases)
echo    [8] conversationService  (16 cases)
echo    [9] notificationService  (14 cases)
echo    [0] analyticsService     (12 cases)
echo    [i] Integration tests Phase 1  (auth + feed, 35 cases)
echo    [j] Integration tests Phase 2  (all 7 services, ~58 cases)
echo    [f] Frontend unit tests        (Vitest — PostCard, Header, SearchPage)
echo    [fc] Frontend coverage report  (Vitest coverage in frontend/coverage/)
echo    [a] ALL tests (unit + integration)
echo    [m] Metrics check  (curl /metrics on all 9 services directly)
echo.
set /p "CHOICE=  Enter choice: "

echo.

if "%CHOICE%"=="1" goto run_unit_all
if "%CHOICE%"=="2" goto run_auth
if "%CHOICE%"=="3" goto run_post
if "%CHOICE%"=="4" goto run_user
if "%CHOICE%"=="5" goto run_job
if "%CHOICE%"=="6" goto run_event
if "%CHOICE%"=="7" goto run_research
if "%CHOICE%"=="8" goto run_conversation
if "%CHOICE%"=="9" goto run_notification
if "%CHOICE%"=="0" goto run_analytics
if /i "%CHOICE%"=="i" goto run_integration_p1
if /i "%CHOICE%"=="j" goto run_integration_p2
if /i "%CHOICE%"=="f" goto run_frontend
if /i "%CHOICE%"=="fc" goto run_frontend_coverage
if /i "%CHOICE%"=="a" goto run_all
if /i "%CHOICE%"=="m" goto run_metrics
goto invalid

:: ----------------------------------------------------------------
:: Test targets
:: ----------------------------------------------------------------

:run_unit_all
echo  Running all unit tests...
echo.
cd /d "%BASE%"
npx jest tests/unit/ --no-coverage --verbose 2>&1
goto done

:run_auth
cd /d "%BASE%"
npx jest tests/unit/authService.test.js --no-coverage --verbose 2>&1
goto done

:run_post
cd /d "%BASE%"
npx jest tests/unit/postService.test.js --no-coverage --verbose 2>&1
goto done

:run_user
cd /d "%BASE%"
npx jest tests/unit/userService.test.js --no-coverage --verbose 2>&1
goto done

:run_job
cd /d "%BASE%"
npx jest tests/unit/jobService.test.js --no-coverage --verbose 2>&1
goto done

:run_event
cd /d "%BASE%"
npx jest tests/unit/eventService.test.js --no-coverage --verbose 2>&1
goto done

:run_research
cd /d "%BASE%"
npx jest tests/unit/researchService.test.js --no-coverage --verbose 2>&1
goto done

:run_conversation
cd /d "%BASE%"
npx jest tests/unit/conversationService.test.js --no-coverage --verbose 2>&1
goto done

:run_notification
cd /d "%BASE%"
npx jest tests/unit/notificationService.test.js --no-coverage --verbose 2>&1
goto done

:run_analytics
cd /d "%BASE%"
npx jest tests/unit/analyticsService.test.js --no-coverage --verbose 2>&1
goto done

:run_integration_p1
echo  NOTE: Integration tests require all services to be running (start.bat first).
echo.
cd /d "%BASE%"
npx jest tests/integration/api.integration.test.js --no-coverage --verbose --testTimeout=15000 2>&1
goto done

:run_integration_p2
echo  NOTE: Integration tests require all services to be running (start.bat first).
echo.
cd /d "%BASE%"
npx jest tests/integration/services.integration.test.js --no-coverage --verbose --testTimeout=15000 2>&1
goto done

:run_frontend
echo  Running frontend unit tests (Vitest)...
echo  Tests: PostCard (~17), Header (~10), SearchPage (~7)
echo.
if not exist "%FRONTEND%\node_modules" (
    echo  [WARN] frontend\node_modules not found — running npm install first...
    pushd "%FRONTEND%"
    call npm install --prefer-offline
    popd
    echo.
)
pushd "%FRONTEND%"
call npx vitest run --reporter=verbose 2>&1
set "EXIT_CODE=!errorlevel!"
popd
if !EXIT_CODE! neq 0 (
    echo.
    echo  [HINT] If you see module resolution errors, check that frontend\node_modules exists.
    echo         Run: cd frontend ^&^& npm install
)
goto done

:run_frontend_coverage
echo  Running frontend tests with coverage report...
echo.
if not exist "%FRONTEND%\node_modules" (
    echo  [WARN] frontend\node_modules not found — running npm install first...
    pushd "%FRONTEND%"
    call npm install --prefer-offline
    popd
    echo.
)
pushd "%FRONTEND%"
call npx vitest run --coverage --reporter=verbose 2>&1
popd
echo.
echo  Coverage report written to: frontend\coverage\index.html
goto done

:run_metrics
echo  Checking /metrics endpoint on each service (services must be running)...
echo  Ports: auth=3001 user=3002 feed=3003 jobs=3004 events=3005
echo         research=3006 messaging=3007 notification=3008 analytics=3009
echo.
set "PORTS=3001 3002 3003 3004 3005 3006 3007 3008 3009"
set "NAMES=auth     user     feed     jobs     events   research messaging notif    analytics"
set PASS=0
set FAIL=0
for %%P in (%PORTS%) do (
    curl -sf --max-time 3 "http://localhost:%%P/metrics" >nul 2>&1
    if !errorlevel! == 0 (
        echo  [OK]   http://localhost:%%P/metrics
        set /a PASS+=1
    ) else (
        echo  [FAIL] http://localhost:%%P/metrics  ^(service not running?^)
        set /a FAIL+=1
    )
)
echo.
echo  Passed: !PASS!/9   Failed: !FAIL!/9
goto done

:run_all
echo  Running ALL tests (unit + integration + frontend)...
echo  NOTE: Integration tests require services to be running.
echo.
echo  ── Backend unit + integration tests ───────────────────────────
cd /d "%BASE%"
npx jest --no-coverage --verbose --testTimeout=15000 2>&1
echo.
echo  ── Frontend unit tests (Vitest) ────────────────────────────────
if not exist "%FRONTEND%\node_modules" (
    echo  [WARN] frontend\node_modules not found — running npm install first...
    pushd "%FRONTEND%"
    call npm install --prefer-offline
    popd
)
pushd "%FRONTEND%"
call npx vitest run --reporter=verbose 2>&1
popd
goto done

:invalid
echo  Invalid choice. Please run test.bat again.
goto end

:done
echo.
echo  ============================================================
echo   Test run complete.
echo  ============================================================

:end
echo.
pause
