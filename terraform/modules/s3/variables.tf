variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "force_destroy" {
  description = "Allow force destroy of buckets with objects"
  type        = bool
  default     = false
}

variable "cors_allowed_origins" {
  description = "Origins allowed for CORS on the uploads bucket"
  type        = list(string)
  default     = ["*"]
}
