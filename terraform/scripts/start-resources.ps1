<#
.SYNOPSIS
    Starts all DECP Platform AWS resources after a planned shutdown.
.DESCRIPTION
    Starts RDS, starts ElastiCache Redis, then scales all ECS services back up.
    If NAT Gateways were removed via shutdown.tfvars, you MUST first run:
        terraform apply -var-file=terraform.tfvars -var-file=startup.tfvars
    before running this script, otherwise ECS tasks (in private subnets)
    cannot reach the internet (ECR, Secrets Manager, etc.).
.PARAMETER EcsCluster
    Name of the ECS cluster (default: decp-platform-cluster)
.PARAMETER RdsIdentifier
    RDS DB instance identifier (default: decp-platform-postgres)
.PARAMETER ElastiCacheId
    ElastiCache replication group ID (default: decp-platform-redis)
.PARAMETER AwsRegion
    AWS region (default: us-east-1)
.PARAMETER ApiGatewayDesired
    Desired task count for the API Gateway service (default: 1)
.PARAMETER ServiceDesired
    Desired task count for each microservice (default: 1)
.PARAMETER SkipNatCheck
    Skip the NAT Gateway confirmation prompt (use in CI/CD)
.EXAMPLE
    .\start-resources.ps1
    .\start-resources.ps1 -ApiGatewayDesired 2 -ServiceDesired 1
#>
param(
    [string]$EcsCluster         = "decp-platform-cluster",
    [string]$RdsIdentifier      = "decp-platform-postgres",
    [string]$ElastiCacheId      = "decp-platform-redis",
    [string]$AwsRegion          = "us-east-1",
    [int]   $ApiGatewayDesired  = 1,
    [int]   $ServiceDesired     = 1,
    [switch]$SkipNatCheck
)

$ErrorActionPreference = "Stop"

$EcsServices = @(
    "decp-platform-api-gateway",
    "decp-platform-auth-service",
    "decp-platform-user-service",
    "decp-platform-feed-service",
    "decp-platform-jobs-service",
    "decp-platform-events-service",
    "decp-platform-research-service",
    "decp-platform-messaging-service",
    "decp-platform-notification-service",
    "decp-platform-analytics-service"
)

function Write-Step([string]$Text) { Write-Host "`n$Text" -ForegroundColor Cyan }
function Write-Ok([string]$Text)   { Write-Host "  ✓  $Text" -ForegroundColor Green }
function Write-Skip([string]$Text) { Write-Host "  –  $Text" -ForegroundColor Yellow }
function Write-Warn([string]$Text) { Write-Host "  !  $Text" -ForegroundColor Yellow }

Write-Host ""
Write-Host "=====================================================" -ForegroundColor White
Write-Host "  DECP PLATFORM – STARTING ALL RESOURCES" -ForegroundColor White
Write-Host "  Cluster : $EcsCluster" -ForegroundColor Yellow
Write-Host "  Region  : $AwsRegion" -ForegroundColor Yellow
Write-Host "=====================================================" -ForegroundColor White

# ── NAT Gateway check ────────────────────────────────────────────────────────
if (-not $SkipNatCheck) {
    Write-Host ""
    Write-Host "IMPORTANT: If you previously removed NAT Gateways via shutdown.tfvars," -ForegroundColor Yellow
    Write-Host "restore them FIRST with Terraform before continuing:" -ForegroundColor Yellow
    Write-Host "  cd terraform\environments\dev" -ForegroundColor Cyan
    Write-Host "  terraform apply -var-file=terraform.tfvars -var-file=startup.tfvars" -ForegroundColor Cyan
    Write-Host ""
    $Confirm = Read-Host "Have NAT Gateways been restored (or were never removed)? [y/N]"
    if ($Confirm -notmatch '^[Yy]$') {
        Write-Host "Aborting. Please restore NAT Gateways first." -ForegroundColor Red
        exit 1
    }
}

# ── Step 1: (Re)create ElastiCache via Terraform ────────────────────────────
Write-Step "[1/3] ElastiCache replication group: $ElastiCacheId"

$CacheStatus = aws elasticache describe-replication-groups `
    --replication-group-id $ElastiCacheId `
    --region               $AwsRegion `
    --query  "ReplicationGroups[0].Status" `
    --output text 2>$null

if ($CacheStatus -eq "available") {
    Write-Ok "ElastiCache is already running."
}
elseif ([string]::IsNullOrWhiteSpace($CacheStatus) -or $CacheStatus -eq $null) {
    Write-Warn "ElastiCache not found. It will be recreated by Terraform."
    Write-Host "  Run: terraform apply -var-file=terraform.tfvars -var-file=startup.tfvars" -ForegroundColor Cyan
    Write-Host "  (This step is handled by Terraform in the startup.tfvars apply step above)" -ForegroundColor Gray
}
else {
    Write-Warn "ElastiCache status is '$CacheStatus'. It will be ready after Terraform apply."
}

# ── Step 2: Start RDS ─────────────────────────────────────────────────────────
Write-Step "[2/3] Starting RDS instance: $RdsIdentifier"

$RdsStatus = aws rds describe-db-instances `
    --db-instance-identifier $RdsIdentifier `
    --region                 $AwsRegion `
    --query  "DBInstances[0].DBInstanceStatus" `
    --output text 2>$null

switch ($RdsStatus) {
    "stopped" {
        Write-Host "  Starting RDS instance..." -ForegroundColor Gray
        aws rds start-db-instance `
            --db-instance-identifier $RdsIdentifier `
            --region                 $AwsRegion | Out-Null
        Write-Host "  Waiting for RDS to become available (usually 2-5 min)..." -ForegroundColor Gray
        aws rds wait db-instance-available `
            --db-instance-identifier $RdsIdentifier `
            --region                 $AwsRegion
        Write-Ok "RDS is now available."
    }
    "available" { Write-Ok "RDS is already running." }
    $null       { Write-Skip "RDS not found – skipping." }
    default {
        Write-Host "  RDS status: '$RdsStatus'. Waiting for it to become available..." -ForegroundColor Gray
        aws rds wait db-instance-available `
            --db-instance-identifier $RdsIdentifier `
            --region                 $AwsRegion
        Write-Ok "RDS is now available."
    }
}

# ── Step 3: Scale ECS services up ─────────────────────────────────────────────
Write-Step "[3/3] Scaling ECS services up..."

foreach ($Service in $EcsServices) {
    $Target = if ($Service -eq "decp-platform-api-gateway") { $ApiGatewayDesired } else { $ServiceDesired }

    $Exists = aws ecs describe-services `
        --cluster  $EcsCluster `
        --services $Service `
        --region   $AwsRegion `
        --query    "services[?status=='ACTIVE'].serviceName" `
        --output   text 2>$null

    if (![string]::IsNullOrWhiteSpace($Exists)) {
        aws ecs update-service `
            --cluster       $EcsCluster `
            --service       $Service `
            --desired-count $Target `
            --region        $AwsRegion | Out-Null
        Write-Ok "$Service → $Target"
    }
    else {
        Write-Skip "$Service not found in cluster."
    }
}

Write-Host "`n  Waiting for services to stabilize..." -ForegroundColor Gray
$AllArns = aws ecs list-services `
    --cluster $EcsCluster `
    --region  $AwsRegion `
    --query   "serviceArns[]" `
    --output  text 2>$null

if (![string]::IsNullOrWhiteSpace($AllArns)) {
    aws ecs wait services-stable `
        --cluster  $EcsCluster `
        --services ($AllArns -split "\s+") `
        --region   $AwsRegion
}

Write-Ok "All ECS services are running."

# ── Summary ───────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "=====================================================" -ForegroundColor White
Write-Host "  PLATFORM IS UP AND RUNNING" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor White
Write-Host ""
