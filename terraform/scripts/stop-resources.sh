#!/usr/bin/env bash
# =============================================================================
# stop-resources.sh – Scale down all DECP platform AWS resources to save cost
#
# Environment variables (with defaults):
#   ECS_CLUSTER      – ECS cluster name            (default: decp-platform-cluster)
#   RDS_IDENTIFIER   – RDS DB instance identifier  (default: decp-platform-postgres)
#   ELASTICACHE_ID   – ElastiCache replication ID  (default: decp-platform-redis)
#   AWS_REGION       – AWS region                  (default: us-east-1)
#
# Usage:
#   bash terraform/scripts/stop-resources.sh
#   ECS_CLUSTER=my-cluster bash terraform/scripts/stop-resources.sh
# =============================================================================
set -euo pipefail

: "${ECS_CLUSTER:=decp-platform-cluster}"
: "${RDS_IDENTIFIER:=decp-platform-postgres}"
: "${ELASTICACHE_ID:=decp-platform-redis}"
: "${AWS_REGION:=us-east-1}"

BOLD='\033[1m'; RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

echo ""
echo -e "${BOLD}=====================================================${NC}"
echo -e "${BOLD}  DECP PLATFORM – STOPPING ALL RESOURCES${NC}"
echo -e "  Cluster : ${YELLOW}${ECS_CLUSTER}${NC}"
echo -e "  Region  : ${YELLOW}${AWS_REGION}${NC}"
echo -e "${BOLD}=====================================================${NC}"

# ── Step 1: Scale all ECS services to 0 ─────────────────────────────────────
echo ""
echo -e "${BOLD}[1/3] Scaling ECS services to 0 desired tasks...${NC}"

SERVICE_ARNS=$(aws ecs list-services \
  --cluster "$ECS_CLUSTER" \
  --region  "$AWS_REGION" \
  --query   "serviceArns[]" \
  --output  text 2>/dev/null || true)

if [ -z "$SERVICE_ARNS" ]; then
  echo "      No services found (cluster may be empty or already shut down)."
else
  SCALED=0
  for ARN in $SERVICE_ARNS; do
    NAME=$(basename "$ARN")
    CURRENT=$(aws ecs describe-services \
      --cluster  "$ECS_CLUSTER" \
      --services "$ARN" \
      --region   "$AWS_REGION" \
      --query    "services[0].desiredCount" \
      --output   text 2>/dev/null || echo "0")

    if [ "$CURRENT" -gt "0" ]; then
      aws ecs update-service \
        --cluster      "$ECS_CLUSTER" \
        --service      "$ARN" \
        --desired-count 0 \
        --region       "$AWS_REGION" \
        --output text --query "service.serviceName" > /dev/null
      echo "      ✓  $NAME  ($CURRENT → 0)"
      SCALED=$((SCALED + 1))
    else
      echo "      –  $NAME  (already at 0)"
    fi
  done

  if [ "$SCALED" -gt "0" ]; then
    echo ""
    echo "      Waiting for all running tasks to drain (up to 5 min)..."
    aws ecs wait services-stable \
      --cluster  "$ECS_CLUSTER" \
      --services $SERVICE_ARNS \
      --region   "$AWS_REGION" || true
  fi
  echo -e "      ${GREEN}ECS services scaled to 0.${NC}"
fi

# ── Step 2: Stop RDS instance ────────────────────────────────────────────────
echo ""
echo -e "${BOLD}[2/3] Checking RDS instance: ${RDS_IDENTIFIER}${NC}"

RDS_STATUS=$(aws rds describe-db-instances \
  --db-instance-identifier "$RDS_IDENTIFIER" \
  --region                 "$AWS_REGION" \
  --query  "DBInstances[0].DBInstanceStatus" \
  --output text 2>/dev/null || echo "not-found")

case "$RDS_STATUS" in
  available)
    echo "      Stopping RDS instance..."
    aws rds stop-db-instance \
      --db-instance-identifier "$RDS_IDENTIFIER" \
      --region                 "$AWS_REGION" > /dev/null
    echo -e "      ${GREEN}RDS stop initiated.${NC}"
    echo -e "      ${YELLOW}NOTE: AWS auto-restarts stopped RDS after 7 days.${NC}"
    ;;
  stopped)
    echo "      RDS is already stopped."
    ;;
  not-found)
    echo -e "      ${YELLOW}RDS instance not found – skipping.${NC}"
    ;;
  *)
    echo -e "      ${YELLOW}RDS status is '${RDS_STATUS}' – cannot stop now. Try again shortly.${NC}"
    ;;
esac

# ── Step 3: Delete ElastiCache replication group ───────────────────────────────
echo ""
echo -e "${BOLD}[3/3] Checking ElastiCache replication group: ${ELASTICACHE_ID}${NC}"

# NOTE: AWS ElastiCache Classic (Redis) clusters cannot be stopped, only deleted.
# Terraform will recreate the cluster from state when start-resources is called.
CACHE_STATUS=$(aws elasticache describe-replication-groups \
  --replication-group-id "$ELASTICACHE_ID" \
  --region               "$AWS_REGION" \
  --query  "ReplicationGroups[0].Status" \
  --output text 2>/dev/null || echo "not-found")

case "$CACHE_STATUS" in
  available)
    echo "      ElastiCache classic clusters cannot be stopped -- deleting to save cost..."
    aws elasticache delete-replication-group \
      --replication-group-id "$ELASTICACHE_ID" \
      --region               "$AWS_REGION" > /dev/null
    echo -e "      ${GREEN}ElastiCache delete initiated (saves ~\$0.40/day).${NC}"
    echo -e "      ${YELLOW}On startup: terraform apply -var-file=terraform.tfvars -var-file=startup.tfvars${NC}"
    ;;
  deleting)
    echo "      ElastiCache is already deleting."
    ;;
  not-found)
    echo -e "      ${YELLOW}ElastiCache group not found -- already deleted.${NC}"
    ;;
  *)
    echo -e "      ${YELLOW}ElastiCache status is '${CACHE_STATUS}' -- skipping.${NC}"
    ;;
esac

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}=====================================================${NC}"
echo -e "${GREEN}${BOLD}  RESOURCES STOPPED${NC}"
echo ""
echo -e "  Fargate tasks   : stopped (saves ~\$5-20/day)"
echo -e "  RDS instance    : stopping (saves ~\$0.40/day)"
echo -e "  ElastiCache     : stopping (saves ~\$0.40/day)"
echo ""
echo -e "  ${YELLOW}NEXT: For maximum savings (~\$2/day NAT GW cost),${NC}"
echo -e "  ${YELLOW}run Terraform with shutdown.tfvars:${NC}"
echo -e "  ${YELLOW}  cd terraform/environments/dev${NC}"
echo -e "  ${YELLOW}  terraform apply -var-file=terraform.tfvars -var-file=shutdown.tfvars${NC}"
echo -e "${BOLD}=====================================================${NC}"
echo ""
