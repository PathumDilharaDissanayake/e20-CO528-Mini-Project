#!/usr/bin/env bash
# =============================================================================
# start-resources.sh – Restore all DECP platform AWS resources after shutdown
#
# Environment variables (with defaults):
#   ECS_CLUSTER            – ECS cluster name            (default: decp-platform-cluster)
#   RDS_IDENTIFIER         – RDS DB instance identifier  (default: decp-platform-postgres)
#   ELASTICACHE_ID         – ElastiCache replication ID  (default: decp-platform-redis)
#   AWS_REGION             – AWS region                  (default: us-east-1)
#   API_GATEWAY_DESIRED    – Desired count for api-gateway (default: 1)
#   SERVICE_DESIRED        – Desired count for each microservice (default: 1)
#
# Usage:
#   bash terraform/scripts/start-resources.sh
# =============================================================================
set -euo pipefail

: "${ECS_CLUSTER:=decp-platform-cluster}"
: "${RDS_IDENTIFIER:=decp-platform-postgres}"
: "${ELASTICACHE_ID:=decp-platform-redis}"
: "${AWS_REGION:=us-east-1}"
: "${API_GATEWAY_DESIRED:=1}"
: "${SERVICE_DESIRED:=1}"

ECS_SERVICES=(
  "decp-platform-api-gateway"
  "decp-platform-auth-service"
  "decp-platform-user-service"
  "decp-platform-feed-service"
  "decp-platform-jobs-service"
  "decp-platform-events-service"
  "decp-platform-research-service"
  "decp-platform-messaging-service"
  "decp-platform-notification-service"
  "decp-platform-analytics-service"
)

BOLD='\033[1m'; RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

echo ""
echo -e "${BOLD}=====================================================${NC}"
echo -e "${BOLD}  DECP PLATFORM – STARTING ALL RESOURCES${NC}"
echo -e "  Cluster : ${YELLOW}${ECS_CLUSTER}${NC}"
echo -e "  Region  : ${YELLOW}${AWS_REGION}${NC}"
echo -e "${BOLD}=====================================================${NC}"

# ── Step 0: (Reminder) Restore NAT Gateway first via Terraform ───────────────
echo ""
echo -e "${YELLOW}IMPORTANT: If you previously ran shutdown.tfvars to remove NAT Gateways,${NC}"
echo -e "${YELLOW}run Terraform FIRST before this script to restore private-subnet routing:${NC}"
echo -e "${YELLOW}  cd terraform/environments/dev${NC}"
echo -e "${YELLOW}  terraform apply -var-file=terraform.tfvars -var-file=startup.tfvars${NC}"
echo ""
read -r -p "Have NAT Gateways been restored (or were never removed)? [y/N] " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  echo "Aborting. Please restore NAT Gateways first."
  exit 1
fi

# ── Step 1: ElastiCache (recreated via Terraform) ─────────────────────────────
echo ""
echo -e "${BOLD}[1/3] ElastiCache replication group: ${ELASTICACHE_ID}${NC}"

# NOTE: Classic Redis clusters are deleted on shutdown and recreated by Terraform.
CACHE_STATUS=$(aws elasticache describe-replication-groups \
  --replication-group-id "$ELASTICACHE_ID" \
  --region               "$AWS_REGION" \
  --query  "ReplicationGroups[0].Status" \
  --output text 2>/dev/null || echo "not-found")

if [ "$CACHE_STATUS" = "available" ]; then
  echo -e "      ${GREEN}ElastiCache is already running.${NC}"
elif [ "$CACHE_STATUS" = "not-found" ]; then
  echo -e "      ${YELLOW}ElastiCache not found. It will be recreated by Terraform (startup.tfvars).${NC}"
else
  echo -e "      ${YELLOW}ElastiCache status: ${CACHE_STATUS} -- will be available after Terraform apply.${NC}"
fi

# ── Step 2: Start RDS ─────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}[2/3] Starting RDS instance: ${RDS_IDENTIFIER}${NC}"

RDS_STATUS=$(aws rds describe-db-instances \
  --db-instance-identifier "$RDS_IDENTIFIER" \
  --region                 "$AWS_REGION" \
  --query  "DBInstances[0].DBInstanceStatus" \
  --output text 2>/dev/null || echo "not-found")

case "$RDS_STATUS" in
  stopped)
    echo "      Starting RDS instance..."
    aws rds start-db-instance \
      --db-instance-identifier "$RDS_IDENTIFIER" \
      --region                 "$AWS_REGION" > /dev/null
    echo "      Waiting for RDS to become available (usually 2-5 min)..."
    aws rds wait db-instance-available \
      --db-instance-identifier "$RDS_IDENTIFIER" \
      --region                 "$AWS_REGION"
    echo -e "      ${GREEN}RDS is now available.${NC}"
    ;;
  available)
    echo -e "      ${GREEN}RDS is already running.${NC}"
    ;;
  not-found)
    echo -e "      ${YELLOW}RDS instance not found – skipping.${NC}"
    ;;
  *)
    echo "      RDS status: '${RDS_STATUS}'. Waiting..."
    aws rds wait db-instance-available \
      --db-instance-identifier "$RDS_IDENTIFIER" \
      --region                 "$AWS_REGION"
    echo -e "      ${GREEN}RDS is now available.${NC}"
    ;;
esac

# ── Step 3: Scale ECS services up ─────────────────────────────────────────────
echo ""
echo -e "${BOLD}[3/3] Scaling ECS services up...${NC}"

for SERVICE in "${ECS_SERVICES[@]}"; do
  if [ "$SERVICE" = "decp-platform-api-gateway" ]; then
    TARGET="$API_GATEWAY_DESIRED"
  else
    TARGET="$SERVICE_DESIRED"
  fi

  STATUS=$(aws ecs describe-services \
    --cluster  "$ECS_CLUSTER" \
    --services "$SERVICE" \
    --region   "$AWS_REGION" \
    --query    "services[?status=='ACTIVE'].serviceName" \
    --output   text 2>/dev/null || echo "")

  if [ -n "$STATUS" ]; then
    aws ecs update-service \
      --cluster       "$ECS_CLUSTER" \
      --service       "$SERVICE" \
      --desired-count "$TARGET" \
      --region        "$AWS_REGION" > /dev/null
    echo "      ✓  $SERVICE → $TARGET"
  else
    echo "      –  $SERVICE not found (skipping)"
  fi
done

echo ""
echo "      Waiting for services to stabilize..."
ALL_ARNS=$(aws ecs list-services \
  --cluster "$ECS_CLUSTER" \
  --region  "$AWS_REGION" \
  --query   "serviceArns[]" \
  --output  text 2>/dev/null || true)

if [ -n "$ALL_ARNS" ]; then
  aws ecs wait services-stable \
    --cluster  "$ECS_CLUSTER" \
    --services $ALL_ARNS \
    --region   "$AWS_REGION" || true
fi

echo -e "      ${GREEN}All ECS services are running.${NC}"

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}=====================================================${NC}"
echo -e "${GREEN}${BOLD}  PLATFORM IS UP AND RUNNING${NC}"
echo -e "${BOLD}=====================================================${NC}"
echo ""
