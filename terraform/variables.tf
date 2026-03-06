###############################################################################
# Root Variables
###############################################################################

variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project (used in resource naming)"
  type        = string
  default     = "decp-platform"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "availability_zones" {
  description = "List of AZs to deploy into"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# ---------- Database ----------
variable "db_username" {
  description = "PostgreSQL master username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "PostgreSQL master password"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

# ---------- ECS ----------
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

# ---------- Secrets / App Config ----------
variable "jwt_secret" {
  description = "JWT signing secret"
  type        = string
  sensitive   = true
}

variable "jwt_refresh_secret" {
  description = "JWT refresh token secret"
  type        = string
  sensitive   = true
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS (leave empty for HTTP-only)"
  type        = string
  default     = ""
}
