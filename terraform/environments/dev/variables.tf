variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "project_name" {
  type    = string
  default = "decp-platform"
}

variable "availability_zones" {
  type    = list(string)
  default = ["us-east-1a", "us-east-1b"]
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "db_username" {
  type      = string
  sensitive = true
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "jwt_secret" {
  type      = string
  sensitive = true
}

variable "jwt_refresh_secret" {
  type      = string
  sensitive = true
}

variable "enable_nat_gateway" {
  description = "Create NAT Gateways. Set false during planned shutdown to save ~$64/month."
  type        = bool
  default     = true
}

variable "api_gateway_desired_count" {
  description = "Desired task count for API Gateway. Set 0 to stop Fargate billing."
  type        = number
  default     = 1
}

variable "service_desired_count" {
  description = "Desired task count for each microservice. Set 0 to stop Fargate billing."
  type        = number
  default     = 1
}
