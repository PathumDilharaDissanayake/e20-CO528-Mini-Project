###############################################################################
# Root Outputs
###############################################################################

# ---------- Networking ----------
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

# ---------- ALB ----------
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer (API endpoint)"
  value       = module.alb.alb_dns_name
}

# ---------- Frontend ----------
output "frontend_website_url" {
  description = "S3-hosted frontend website URL"
  value       = "http://${module.s3.frontend_website_endpoint}"
}

output "frontend_bucket_name" {
  description = "S3 bucket name for frontend deployment"
  value       = module.s3.frontend_bucket_name
}

# ---------- ECR ----------
output "ecr_repository_urls" {
  description = "ECR repository URLs for each service"
  value       = module.ecr.repository_urls
}

# ---------- Database ----------
output "postgres_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = module.rds.postgres_endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = module.rds.redis_endpoint
  sensitive   = true
}

# ---------- ECS ----------
output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}
