###############################################################################
# Root main.tf – Wires all modules together
###############################################################################

locals {
  service_names = [
    "api-gateway",
    "auth-service",
    "user-service",
    "feed-service",
    "jobs-service",
    "events-service",
    "research-service",
    "messaging-service",
    "notification-service",
    "analytics-service",
  ]

  # All service-specific databases that must exist in PostgreSQL.
  # RDS only creates the initial database (decp_auth); the rest are created
  # by the db_init Fargate task below.
  service_databases = [
    "decp_users",
    "decp_feed",
    "decp_jobs",
    "decp_events",
    "decp_research",
    "decp_messaging",
    "decp_notifications",
    "decp_analytics",
  ]

  # Shell script executed by the db-init container.
  # Uses env vars DB_HOST / DB_PORT / DB_USER / PGPASSWORD set on the container.
  db_init_script = <<-SCRIPT
    set -e
    CONN="host=$DB_HOST port=$DB_PORT user=$DB_USER dbname=decp_auth sslmode=require"
    for db in decp_users decp_feed decp_jobs decp_events decp_research decp_messaging decp_notifications decp_analytics; do
      RESULT=$(psql "$CONN" -tAc "SELECT datname FROM pg_database WHERE datname = '$db'")
      if [ -z "$RESULT" ]; then
        psql "$CONN" -c "CREATE DATABASE $db"
        echo "Created: $db"
      else
        echo "Exists:  $db"
      fi
    done
    echo "All databases initialized successfully!"
  SCRIPT
}

# ======================== VPC ========================
module "vpc" {
  source = "./modules/vpc"

  project_name       = var.project_name
  environment        = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  enable_nat_gateway = true
}

# ======================== Security Groups ========================
module "security_groups" {
  source = "./modules/security-groups"

  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.vpc.vpc_id
}

# ======================== ECR ========================
module "ecr" {
  source = "./modules/ecr"

  project_name  = var.project_name
  environment   = var.environment
  service_names = local.service_names
}

# ======================== RDS + Redis ========================
module "rds" {
  source = "./modules/rds"

  project_name       = var.project_name
  environment        = var.environment
  private_subnet_ids = module.vpc.private_subnet_ids

  db_instance_class    = var.db_instance_class
  db_username          = var.db_username
  db_password          = var.db_password
  db_security_group_id = module.security_groups.database_security_group_id

  redis_security_group_id = module.security_groups.redis_security_group_id
}

# ======================== S3 ========================
module "s3" {
  source = "./modules/s3"

  project_name = var.project_name
  environment  = var.environment
}

# ======================== ALB ========================
module "alb" {
  source = "./modules/alb"

  project_name          = var.project_name
  environment           = var.environment
  vpc_id                = module.vpc.vpc_id
  public_subnet_ids     = module.vpc.public_subnet_ids
  alb_security_group_id = module.security_groups.alb_security_group_id
  certificate_arn       = var.certificate_arn
}

# ======================== ECS (Fargate) ========================
module "ecs" {
  source = "./modules/ecs"

  project_name       = var.project_name
  environment        = var.environment
  aws_region         = var.aws_region
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids

  ecs_security_group_id        = module.security_groups.ecs_tasks_security_group_id
  api_gateway_target_group_arn = module.alb.api_gateway_target_group_arn
  ecr_repository_urls          = module.ecr.repository_urls
  uploads_bucket_arn           = module.s3.uploads_bucket_arn
  redis_endpoint               = module.rds.redis_endpoint

  api_gateway_cpu           = var.api_gateway_cpu
  api_gateway_memory        = var.api_gateway_memory
  api_gateway_desired_count = var.api_gateway_desired_count
  service_cpu               = var.service_cpu
  service_memory            = var.service_memory
  service_desired_count     = var.service_desired_count

  common_env_vars = [
    { name = "NODE_ENV", value = "production" },
    { name = "JWT_SECRET", value = var.jwt_secret },
    { name = "JWT_REFRESH_SECRET", value = var.jwt_refresh_secret },
  ]

  db_env_vars = [
    { name = "DB_HOST", value = module.rds.postgres_address },
    { name = "DB_PORT", value = tostring(module.rds.postgres_port) },
    { name = "DB_USER", value = var.db_username },
    { name = "DB_PASSWORD", value = var.db_password },
    { name = "PGSSLMODE", value = "require" },
    { name = "DB_SSL", value = "true" },
    { name = "DB_SSL_REJECT_UNAUTHORIZED", value = "false" },
  ]
}

# ======================== DB Initialisation ========================
# Runs a one-off Fargate task (postgres:16-alpine) that creates every
# service database that is not the initial "decp_auth" database.
# The task runs inside the private subnets so it can reach RDS without
# making the instance publicly accessible.

resource "aws_ecs_task_definition" "db_init" {
  family                   = "${var.project_name}-db-init"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = module.ecs.task_execution_role_arn

  container_definitions = jsonencode([{
    name      = "db-init"
    image     = "postgres:16-alpine"
    essential = true

    environment = [
      { name = "PGPASSWORD", value = var.db_password },
      { name = "DB_HOST", value = module.rds.postgres_address },
      { name = "DB_PORT", value = tostring(module.rds.postgres_port) },
      { name = "DB_USER", value = var.db_username },
    ]

    command = ["sh", "-c", local.db_init_script]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/${var.project_name}"
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "db-init"
      }
    }
  }])

  depends_on = [module.ecs]

  tags = {
    Name        = "${var.project_name}-db-init"
    Environment = var.environment
  }
}

# Trigger: re-runs whenever the RDS endpoint changes (new cluster) or
# the init script is updated.
resource "null_resource" "run_db_init" {
  triggers = {
    task_definition_arn = aws_ecs_task_definition.db_init.arn
    rds_address         = module.rds.postgres_address
  }

  provisioner "local-exec" {
    # Requires aws-cli to be available in the execution environment.
    # The CI terraform-apply job installs it via apk before calling terraform.
    interpreter = ["/bin/sh", "-c"]
    command     = <<-CMD
      set -e
      echo "=== Starting DB initialisation task ==="

      TASK_ARN=$(aws ecs run-task \
        --region "${var.aws_region}" \
        --cluster "${module.ecs.cluster_name}" \
        --task-definition "${aws_ecs_task_definition.db_init.arn}" \
        --launch-type FARGATE \
        --network-configuration "awsvpcConfiguration={subnets=[${join(",", module.vpc.private_subnet_ids)}],securityGroups=[${module.security_groups.ecs_tasks_security_group_id}],assignPublicIp=DISABLED}" \
        --query "tasks[0].taskArn" \
        --output text)

      echo "Task ARN: $TASK_ARN"

      echo "Waiting for task to finish (up to 10 min)..."
      aws ecs wait tasks-stopped \
        --region "${var.aws_region}" \
        --cluster "${module.ecs.cluster_name}" \
        --tasks "$TASK_ARN"

      EXIT_CODE=$(aws ecs describe-tasks \
        --region "${var.aws_region}" \
        --cluster "${module.ecs.cluster_name}" \
        --tasks "$TASK_ARN" \
        --query "tasks[0].containers[0].exitCode" \
        --output text)

      echo "DB init task exited with code: $EXIT_CODE"

      if [ "$EXIT_CODE" != "0" ]; then
        echo "ERROR: database initialisation failed. Check CloudWatch log group /ecs/${var.project_name} (stream prefix: db-init) for details."
        exit 1
      fi

      echo "=== All service databases are ready ==="
    CMD
  }

  depends_on = [aws_ecs_task_definition.db_init, module.rds, module.ecs]
}
