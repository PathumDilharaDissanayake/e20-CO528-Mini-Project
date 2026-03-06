<#
.SYNOPSIS
    One-time bootstrap: creates the S3 bucket + DynamoDB table for Terraform remote state.
.DESCRIPTION
    Run this ONCE from your local machine before the first GitLab pipeline run.
    Requires: AWS CLI configured with proper credentials.
.EXAMPLE
    .\bootstrap-backend.ps1
    .\bootstrap-backend.ps1 -Region "eu-west-1" -BucketName "my-tf-state"
#>

param(
    [string]$Region     = "us-east-1",
    [string]$BucketName = "decp-platform-terraform-state",
    [string]$TableName  = "decp-platform-terraform-locks"
)

$ErrorActionPreference = "Stop"

Write-Host "`n=== DECP Platform – Terraform Backend Bootstrap ===" -ForegroundColor Cyan

# ── S3 Bucket ──────────────────────────────────────────────────────────────
Write-Host "`n[1/4] Creating S3 bucket: $BucketName ..." -ForegroundColor Green

$bucketExists = aws s3api head-bucket --bucket $BucketName 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Bucket already exists – skipping." -ForegroundColor Yellow
} else {
    if ($Region -eq "us-east-1") {
        aws s3api create-bucket --bucket $BucketName --region $Region
    } else {
        aws s3api create-bucket --bucket $BucketName --region $Region `
            --create-bucket-configuration LocationConstraint=$Region
    }
    Write-Host "  Created." -ForegroundColor Green
}

Write-Host "[2/4] Enabling versioning + encryption ..." -ForegroundColor Green
aws s3api put-bucket-versioning `
    --bucket $BucketName `
    --versioning-configuration Status=Enabled

aws s3api put-bucket-encryption `
    --bucket $BucketName `
    --server-side-encryption-configuration '{\"Rules\":[{\"ApplyServerSideEncryptionByDefault\":{\"SSEAlgorithm\":\"AES256\"}}]}'

aws s3api put-public-access-block `
    --bucket $BucketName `
    --public-access-block-configuration '{\"BlockPublicAcls\":true,\"IgnorePublicAcls\":true,\"BlockPublicPolicy\":true,\"RestrictPublicBuckets\":true}'

Write-Host "  Done." -ForegroundColor Green

# ── DynamoDB Table ─────────────────────────────────────────────────────────
Write-Host "[3/4] Creating DynamoDB lock table: $TableName ..." -ForegroundColor Green

$tableExists = aws dynamodb describe-table --table-name $TableName --region $Region 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Table already exists – skipping." -ForegroundColor Yellow
} else {
    aws dynamodb create-table `
        --table-name $TableName `
        --attribute-definitions AttributeName=LockID,AttributeType=S `
        --key-schema AttributeName=LockID,KeyType=HASH `
        --billing-mode PAY_PER_REQUEST `
        --region $Region
    Write-Host "  Created." -ForegroundColor Green
}

# ── Summary ────────────────────────────────────────────────────────────────
Write-Host "`n[4/4] Backend bootstrap complete!" -ForegroundColor Cyan
Write-Host "  S3 Bucket      : $BucketName" -ForegroundColor White
Write-Host "  DynamoDB Table  : $TableName" -ForegroundColor White
Write-Host "  Region          : $Region" -ForegroundColor White
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "  1. cd terraform" -ForegroundColor White
Write-Host "  2. terraform init" -ForegroundColor White
Write-Host "  3. terraform plan" -ForegroundColor White
Write-Host "  4. terraform apply" -ForegroundColor White
