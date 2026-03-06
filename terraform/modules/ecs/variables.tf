variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "ecs_security_group_id" {
  type = string
}

variable "api_gateway_target_group_arn" {
  type = string
}

variable "ecr_repository_urls" {
  description = "Map of service name to ECR repository URL"
  type        = map(string)
}

variable "uploads_bucket_arn" {
  type = string
}

variable "redis_endpoint" {
  description = "Redis primary endpoint address"
  type        = string
}

# ---------- Resource sizing ----------
variable "api_gateway_cpu" {
  type    = number
  default = 512
}

variable "api_gateway_memory" {
  type    = number
  default = 1024
}

variable "api_gateway_desired_count" {
  type    = number
  default = 2
}

variable "service_cpu" {
  type    = number
  default = 256
}

variable "service_memory" {
  type    = number
  default = 512
}

variable "service_desired_count" {
  type    = number
  default = 1
}

variable "enable_container_insights" {
  type    = bool
  default = true
}

variable "log_retention_days" {
  type    = number
  default = 30
}

# ---------- Environment variables ----------
variable "common_env_vars" {
  description = "Environment variables common to all services"
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}

variable "db_env_vars" {
  description = "Database-related environment variables"
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}
