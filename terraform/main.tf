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
    { name = "DB_SSL", value = "true" },
    { name = "DB_SSL_REJECT_UNAUTHORIZED", value = "false" },
  ]
}
