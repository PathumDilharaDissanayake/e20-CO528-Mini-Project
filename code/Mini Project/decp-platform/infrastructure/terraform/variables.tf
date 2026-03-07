# DECP Platform - Terraform Variables

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "decp-platform"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be development, staging, or production."
  }
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
  default     = "decp-platform-cluster"
}

variable "kubernetes_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.29"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "az_count" {
  description = "Number of availability zones"
  type        = number
  default     = 3
}

variable "node_instance_types" {
  description = "EC2 instance types for EKS nodes"
  type        = list(string)
  default     = ["t3.large", "t3a.large"]
}

variable "node_desired_size" {
  description = "Desired number of nodes"
  type        = number
  default     = 3
}

variable "node_min_size" {
  description = "Minimum number of nodes"
  type        = number
  default     = 2
}

variable "node_max_size" {
  description = "Maximum number of nodes"
  type        = number
  default     = 10
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage (GB)"
  type        = number
  default     = 100
}

variable "db_max_allocated_storage" {
  description = "RDS max allocated storage (GB)"
  type        = number
  default     = 500
}

variable "db_name" {
  description = "Default database created by the RDS instance"
  type        = string
  default     = "decp_auth"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "decp_admin"
}

variable "db_multi_az" {
  description = "Enable Multi-AZ for RDS"
  type        = bool
  default     = true
}

variable "db_force_ssl" {
  description = "Whether to enforce SSL-only PostgreSQL connections (rds.force_ssl)"
  type        = bool
  default     = false
}

variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t3.medium"
}

variable "redis_num_cache_nodes" {
  description = "Number of Redis cache nodes"
  type        = number
  default     = 2
}

variable "domain_name" {
  description = "Primary domain name"
  type        = string
  default     = "decp.io"
}

variable "subdomain_prefix" {
  description = "Subdomain prefix"
  type        = string
  default     = ""
}

variable "enable_waf" {
  description = "Enable AWS WAF"
  type        = bool
  default     = true
}

variable "enable_guardduty" {
  description = "Enable AWS GuardDuty"
  type        = bool
  default     = true
}

variable "enable_cloudtrail" {
  description = "Enable AWS CloudTrail"
  type        = bool
  default     = true
}

variable "enable_config" {
  description = "Enable AWS Config"
  type        = bool
  default     = true
}

variable "enable_shield_advanced" {
  description = "Enable AWS Shield Advanced"
  type        = bool
  default     = false
}

variable "backup_retention_period" {
  description = "Backup retention period (days)"
  type        = number
  default     = 30
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection for resources"
  type        = bool
  default     = true
}

variable "allowed_cidr_blocks" {
  description = "Allowed CIDR blocks for access"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}
