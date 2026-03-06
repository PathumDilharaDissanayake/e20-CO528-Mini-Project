variable "project_name" {
  description = "Project name used as ECR repository prefix"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "service_names" {
  description = "List of microservice names to create ECR repositories for"
  type        = list(string)
}

variable "image_retention_count" {
  description = "Number of images to keep per repository"
  type        = number
  default     = 10
}

variable "force_delete" {
  description = "Force delete repository even if it contains images"
  type        = bool
  default     = false
}
