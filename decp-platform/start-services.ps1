# DECP Platform - Start all services
$ErrorActionPreference = "Continue"

Write-Host "Starting DECP Platform services..." -ForegroundColor Green

# Start infrastructure
Write-Host "Starting Docker containers..." -ForegroundColor Cyan
docker start decp-postgres decp-redis

# Wait for PostgreSQL
Write-Host "Waiting for PostgreSQL..." -ForegroundColor Cyan
$maxAttempts = 30
$attempt = 0
do {
    $result = docker exec decp-postgres pg_isready -U postgres 2>$null
    if ($LASTEXITCODE -eq 0) { break }
    Start-Sleep -Seconds 1
    $attempt++
} while ($attempt -lt $maxAttempts)

# Start backend services
Write-Host "Starting backend services..." -ForegroundColor Cyan

$services = @(
    @{Name="API Gateway"; Path="backend\api-gateway"; Port=3000},
    @{Name="Auth Service"; Path="backend\auth-service"; Port=3001},
    @{Name="User Service"; Path="backend\user-service"; Port=3002},
    @{Name="Feed Service"; Path="backend\feed-service"; Port=3003},
    @{Name="Jobs Service"; Path="backend\jobs-service"; Port=3004},
    @{Name="Events Service"; Path="backend\events-service"; Port=3005},
    @{Name="Research Service"; Path="backend\research-service"; Port=3006},
    @{Name="Messaging Service"; Path="backend\messaging-service"; Port=3007},
    @{Name="Notification Service"; Path="backend\notification-service"; Port=3008},
    @{Name="Analytics Service"; Path="backend\analytics-service"; Port=3009}
)

foreach ($service in $services) {
    $cmd = "start `"$($service.Name) :$($service.Port)`" cmd /k `"cd /d `"$PWD\$($service.Path)`" && npm run dev`""
    Invoke-Expression $cmd
    Start-Sleep -Seconds 2
}

# Start frontend
Write-Host "Starting frontend..." -ForegroundColor Cyan
Start-Process "cmd" -ArgumentList "/k", "cd /d `"$PWD\frontend`" && npm run dev"

Write-Host ""
Write-Host "All services started!" -ForegroundColor Green
Write-Host "Access: http://localhost:5173" -ForegroundColor Yellow
