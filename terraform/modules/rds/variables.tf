variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for the DB subnet group"
  type        = list(string)
}

# ----- PostgreSQL -----
variable "postgres_engine_version" {
  type    = string
  default = "16.1"
}

variable "db_instance_class" {
  type    = string
  default = "db.t3.micro"
}

variable "db_allocated_storage" {
  type    = number
  default = 20
}

variable "db_max_allocated_storage" {
  type    = number
  default = 100
}

variable "db_name" {
  description = "Default database name (additional databases created via init script)"
  type        = string
  default     = "decp_auth"
}

variable "db_username" {
  type      = string
  sensitive = true
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "db_security_group_id" {
  type = string
}

variable "multi_az" {
  type    = bool
  default = false
}

variable "skip_final_snapshot" {
  type    = bool
  default = true
}

variable "backup_retention_period" {
  type    = number
  default = 7
}

# ----- Redis -----
variable "redis_node_type" {
  type    = string
  default = "cache.t3.micro"
}

variable "redis_num_cache_clusters" {
  type    = number
  default = 1
}

variable "redis_engine_version" {
  type    = string
  default = "7.0"
}

variable "redis_security_group_id" {
  type = string
}
