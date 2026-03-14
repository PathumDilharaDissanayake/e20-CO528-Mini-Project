<#
.SYNOPSIS
    Stops all DECP Platform AWS resources to eliminate running costs.
.DESCRIPTION
    Scales ECS services to 0, stops RDS, and stops ElastiCache Redis.
    For maximum savings, also run Terraform with shutdown.tfvars afterwards
    to remove the NAT Gateways (~$64/month).
.PARAMETER EcsCluster
    Name of the ECS cluster (default: decp-platform-cluster)
.PARAMETER RdsIdentifier
    RDS DB instance identifier (default: decp-platform-postgres)
.PARAMETER ElastiCacheId
    ElastiCache replication group ID (default: decp-platform-redis)
.PARAMETER AwsRegion
    AWS region (default: us-east-1)
.PARAMETER SkipNatGateway
    Skip the Terraform NAT Gateway removal step (default: false)
.EXAMPLE
    .\stop-resources.ps1
    .\stop-resources.ps1 -AwsRegion "ap-southeast-1"
#>
param(
    [string]$EcsCluster    = "decp-platform-cluster",
    [string]$RdsIdentifier = "decp-platform-postgres",
    [string]$ElastiCacheId = "decp-platform-redis",
    [string]$AwsRegion     = "us-east-1",
    [switch]$SkipNatGateway
)

$ErrorActionPreference = "Stop"

function Write-Step([string]$Text) { Write-Host "`n$Text" -ForegroundColor Cyan }
function Write-Ok([string]$Text)   { Write-Host "  ✓  $Text" -ForegroundColor Green }
function Write-Skip([string]$Text) { Write-Host "  –  $Text" -ForegroundColor Yellow }
function Write-Warn([string]$Text) { Write-Host "  !  $Text" -ForegroundColor Yellow }

Write-Host ""
Write-Host "=====================================================" -ForegroundColor White
Write-Host "  DECP PLATFORM – STOPPING ALL RESOURCES" -ForegroundColor White
Write-Host "  Cluster : $EcsCluster" -ForegroundColor Yellow
Write-Host "  Region  : $AwsRegion" -ForegroundColor Yellow
Write-Host "=====================================================" -ForegroundColor White

# ── Step 1: Scale ECS services to 0 ─────────────────────────────────────────
Write-Step "[1/3] Scaling ECS services to 0 desired tasks..."

$ServiceArns = aws ecs list-services `
    --cluster $EcsCluster `
    --region  $AwsRegion `
    --query   "serviceArns[]" `
    --output  text 2>$null

if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($ServiceArns)) {
    Write-Skip "No ECS services found (cluster empty or already shut down)."
}
else {
    $Scaled = 0
    foreach ($Arn in ($ServiceArns -split "\s+")) {
        $Name    = ($Arn -split "/")[-1]
        $Current = aws ecs describe-services `
            --cluster  $EcsCluster `
            --services $Arn `
            --region   $AwsRegion `
            --query    "services[0].desiredCount" `
            --output   text 2>$null

        if ([int]$Current -gt 0) {
            aws ecs update-service `
                --cluster       $EcsCluster `
                --service       $Arn `
                --desired-count 0 `
                --region        $AwsRegion `
                --output text --query "service.serviceName" | Out-Null
            Write-Ok "$Name  ($Current → 0)"
            $Scaled++
        }
        else {
            Write-Skip "$Name  (already at 0)"
        }
    }

    if ($Scaled -gt 0) {
        Write-Host "`n  Waiting for tasks to drain (up to 5 min)..." -ForegroundColor Gray
        aws ecs wait services-stable `
            --cluster  $EcsCluster `
            --services ($ServiceArns -split "\s+") `
            --region   $AwsRegion
    }
    Write-Ok "ECS services scaled to 0."
}

# ── Step 2: Stop RDS ─────────────────────────────────────────────────────────
Write-Step "[2/3] Checking RDS instance: $RdsIdentifier"

$RdsStatus = aws rds describe-db-instances `
    --db-instance-identifier $RdsIdentifier `
    --region                 $AwsRegion `
    --query  "DBInstances[0].DBInstanceStatus" `
    --output text 2>$null

switch ($RdsStatus) {
    "available" {
        Write-Host "  Stopping RDS instance..." -ForegroundColor Gray
        aws rds stop-db-instance `
            --db-instance-identifier $RdsIdentifier `
            --region                 $AwsRegion | Out-Null
        Write-Ok "RDS stop initiated."
        Write-Warn "AWS auto-restarts stopped RDS after 7 days."
    }
    "stopped"   { Write-Skip "RDS is already stopped." }
    $null       { Write-Skip "RDS not found – skipping." }
    default     { Write-Warn "RDS status is '$RdsStatus' – cannot stop now. Try again shortly." }
}

# ── Step 3: Stop ElastiCache ─────────────────────────────────────────────────
Write-Step "[3/3] Checking ElastiCache replication group: $ElastiCacheId"

$CacheStatus = aws elasticache describe-replication-groups `
    --replication-group-id $ElastiCacheId `
    --region               $AwsRegion `
    --query  "ReplicationGroups[0].Status" `
    --output text 2>$null

# NOTE: AWS ElastiCache Classic (Redis) clusters cannot be stopped, only deleted.
# Terraform will recreate the cluster from state when start-resources is run.
switch ($CacheStatus) {
    "available" {
        Write-Host "  ElastiCache classic clusters cannot be stopped – deleting and recreating via Terraform on startup." -ForegroundColor Gray
        aws elasticache delete-replication-group `
            --replication-group-id $ElastiCacheId `
            --region               $AwsRegion `
            --no-cli-pager `
            --query "ReplicationGroup.Status" `
            --output text | Out-Null
        Write-Ok "ElastiCache delete initiated (saves ~$0.40/day)."
        Write-Warn "On startup, run: terraform apply -var-file=terraform.tfvars -var-file=startup.tfvars"
    }
    "deleting"  { Write-Skip "ElastiCache is already deleting." }
    $null       { Write-Skip "ElastiCache not found – already deleted or never created." }
    default     { Write-Warn "ElastiCache status '$CacheStatus' – skipping." }
}

# ── NAT Gateway reminder ──────────────────────────────────────────────────────
if (-not $SkipNatGateway) {
    Write-Host ""
    Write-Host "=====================================================" -ForegroundColor White
    Write-Host "  RESOURCES STOPPED" -ForegroundColor Green
    Write-Host ""
    Write-Host "  NEXT: For maximum savings (~`$2/day NAT Gateway)," -ForegroundColor Yellow
    Write-Host "  run Terraform with shutdown.tfvars:" -ForegroundColor Yellow
    Write-Host "    cd terraform\environments\dev" -ForegroundColor Cyan
    Write-Host "    terraform apply -var-file=terraform.tfvars -var-file=shutdown.tfvars" -ForegroundColor Cyan
    Write-Host "=====================================================" -ForegroundColor White
}
else {
    Write-Host ""
    Write-Host "=====================================================" -ForegroundColor White
    Write-Host "  ALL RESOURCES STOPPED" -ForegroundColor Green
    Write-Host "=====================================================" -ForegroundColor White
}
Write-Host ""
