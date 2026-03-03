#!/bin/bash
# DECP Platform - Database Backup Script
# Usage: ./backup-db.sh [environment] [action]

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ENVIRONMENT=${1:-staging}
ACTION=${2:-backup}
BACKUP_DIR="/backups/postgres"
S3_BUCKET="decp-platform-backups"
RETENTION_DAYS=30
AWS_REGION="us-east-1"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Database configuration (from environment variables)
DB_HOST=${DB_HOST:-}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-}
DB_PASSWORD=${DB_PASSWORD:-}
DB_NAME=${DB_NAME:-decp_platform}

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed"
        exit 1
    fi
    
    # Check pg_dump
    if ! command -v pg_dump &> /dev/null; then
        print_error "PostgreSQL client tools are not installed"
        exit 1
    fi
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    print_success "Prerequisites check passed"
}

# Function to get database credentials from AWS Secrets Manager
get_db_credentials() {
    print_status "Retrieving database credentials..."
    
    SECRET_NAME="decp-platform/${ENVIRONMENT}/database/password"
    
    if ! aws secretsmanager describe-secret --secret-id "$SECRET_NAME" &> /dev/null; then
        print_error "Secret not found: $SECRET_NAME"
        exit 1
    fi
    
    SECRET=$(aws secretsmanager get-secret-value --secret-id "$SECRET_NAME" --query SecretString --output text)
    
    DB_HOST=$(echo "$SECRET" | jq -r '.host')
    DB_USER=$(echo "$SECRET" | jq -r '.username')
    DB_PASSWORD=$(echo "$SECRET" | jq -r '.password')
    DB_NAME=$(echo "$SECRET" | jq -r '.dbname')
    
    export PGPASSWORD="$DB_PASSWORD"
    
    print_success "Credentials retrieved"
}

# Function to create backup
create_backup() {
    print_status "Creating database backup..."
    
    BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"
    
    print_status "Backing up database: $DB_NAME"
    print_status "Host: $DB_HOST"
    print_status "Output: $BACKUP_FILE"
    
    # Create backup with compression
    pg_dump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --verbose \
        --format=custom \
        --compress=9 \
        --file="${BACKUP_FILE}.dump"
    
    # Create SQL dump for readability
    pg_dump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --verbose | gzip > "$BACKUP_FILE"
    
    # Calculate checksum
    md5sum "$BACKUP_FILE" > "${BACKUP_FILE}.md5"
    md5sum "${BACKUP_FILE}.dump" > "${BACKUP_FILE}.dump.md5"
    
    print_success "Backup created: $BACKUP_FILE"
    
    # Get file size
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    print_status "Backup size: $BACKUP_SIZE"
}

# Function to upload to S3
upload_to_s3() {
    print_status "Uploading backup to S3..."
    
    S3_PATH="s3://${S3_BUCKET}/${ENVIRONMENT}/postgres/${TIMESTAMP}/"
    
    # Upload SQL backup
    aws s3 cp "$BACKUP_FILE" "$S3_PATH" --storage-class STANDARD_IA
    aws s3 cp "${BACKUP_FILE}.md5" "$S3_PATH"
    
    # Upload custom format backup
    aws s3 cp "${BACKUP_FILE}.dump" "$S3_PATH" --storage-class STANDARD_IA
    aws s3 cp "${BACKUP_FILE}.dump.md5" "$S3_PATH"
    
    print_success "Backup uploaded to: $S3_PATH"
    
    # Clean up local files
    rm -f "$BACKUP_FILE" "${BACKUP_FILE}.md5" "${BACKUP_FILE}.dump" "${BACKUP_FILE}.dump.md5"
    print_status "Local backup files cleaned up"
}

# Function to list backups
list_backups() {
    print_status "Listing backups for $ENVIRONMENT..."
    
    S3_PREFIX="s3://${S3_BUCKET}/${ENVIRONMENT}/postgres/"
    
    aws s3 ls "$S3_PREFIX" --recursive | sort -k1,2
}

# Function to restore from backup
restore_backup() {
    local backup_file=$1
    
    print_status "Restoring database from backup: $backup_file"
    
    if [ -z "$backup_file" ]; then
        print_error "Backup file not specified"
        print_status "Usage: $0 $ENVIRONMENT restore <s3-backup-path>"
        exit 1
    fi
    
    # Confirm restore
    print_warning "WARNING: This will replace the current database!"
    read -p "Are you sure you want to continue? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_status "Restore cancelled"
        exit 0
    fi
    
    # Download backup from S3
    local temp_dir=$(mktemp -d)
    print_status "Downloading backup to $temp_dir..."
    aws s3 cp "$backup_file" "$temp_dir/backup.sql.gz"
    
    # Decompress
    gunzip "$temp_dir/backup.sql.gz"
    
    # Restore database
    print_status "Restoring database..."
    psql \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --file="$temp_dir/backup.sql"
    
    # Clean up
    rm -rf "$temp_dir"
    
    print_success "Database restored successfully"
}

# Function to clean up old backups
cleanup_old_backups() {
    print_status "Cleaning up old backups (older than $RETENTION_DAYS days)..."
    
    S3_PREFIX="s3://${S3_BUCKET}/${ENVIRONMENT}/postgres/"
    
    # Get list of old backups
    OLD_BACKUPS=$(aws s3 ls "$S3_PREFIX" | awk '{print $2}' | while read -r dir; do
        dir_date=$(echo "$dir" | tr -d '/')
        dir_timestamp=$(date -d "${dir_date:0:8} ${dir_date:9:2}:${dir_date:11:2}:${dir_date:13:2}" +%s 2>/dev/null || echo 0)
        current_timestamp=$(date +%s)
        age_days=$(( (current_timestamp - dir_timestamp) / 86400 ))
        
        if [ $age_days -gt $RETENTION_DAYS ]; then
            echo "$dir"
        fi
    done)
    
    if [ -z "$OLD_BACKUPS" ]; then
        print_status "No old backups to clean up"
        return 0
    fi
    
    # Delete old backups
    for backup_dir in $OLD_BACKUPS; do
        print_status "Deleting old backup: $backup_dir"
        aws s3 rm "${S3_PREFIX}${backup_dir}" --recursive
    done
    
    print_success "Old backups cleaned up"
}

# Function to verify backup
verify_backup() {
    local backup_file=$1
    
    print_status "Verifying backup: $backup_file"
    
    # Download MD5
    local temp_dir=$(mktemp -d)
    aws s3 cp "${backup_file}.md5" "$temp_dir/"
    aws s3 cp "$backup_file" "$temp_dir/backup.sql.gz"
    
    # Verify checksum
    cd "$temp_dir"
    if md5sum -c "$(basename ${backup_file}).md5"; then
        print_success "Backup verification passed"
    else
        print_error "Backup verification failed!"
        exit 1
    fi
    
    # Clean up
    rm -rf "$temp_dir"
}

# Function to display help
show_help() {
    cat << EOF
DECP Platform Database Backup Script

Usage: $0 [ENVIRONMENT] [ACTION] [OPTIONS]

Arguments:
  ENVIRONMENT   Target environment (development, staging, production)
  ACTION        Action to perform (backup, restore, list, cleanup, verify)

Examples:
  $0 staging backup              # Create a backup
  $0 production backup           # Create production backup
  $0 staging list                # List available backups
  $0 staging restore <s3-path>   # Restore from backup
  $0 staging cleanup             # Remove old backups
  $0 staging verify <s3-path>    # Verify backup integrity

Environment Variables:
  DB_HOST       Database host (optional, auto-retrieved from Secrets Manager)
  DB_USER       Database username (optional)
  DB_PASSWORD   Database password (optional)
  DB_NAME       Database name (default: decp_platform)
  S3_BUCKET     S3 bucket for backups (default: decp-platform-backups)
  RETENTION_DAYS Days to keep backups (default: 30)

EOF
}

# Main execution
main() {
    if [ $# -lt 1 ] || [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
        show_help
        exit 0
    fi
    
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  DECP Platform Database Backup${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Environment: $ENVIRONMENT${NC}"
    echo -e "${BLUE}Action: $ACTION${NC}"
    echo -e "${BLUE}========================================${NC}"
    
    check_prerequisites
    
    # Get database credentials if not provided
    if [ -z "$DB_HOST" ]; then
        get_db_credentials
    fi
    
    case "$ACTION" in
        backup)
            create_backup
            upload_to_s3
            cleanup_old_backups
            ;;
        restore)
            restore_backup "${3:-}"
            ;;
        list)
            list_backups
            ;;
        cleanup)
            cleanup_old_backups
            ;;
        verify)
            verify_backup "${3:-}"
            ;;
        *)
            print_error "Unknown action: $ACTION"
            show_help
            exit 1
            ;;
    esac
    
    print_success "Operation completed successfully!"
}

# Run main
main "$@"
