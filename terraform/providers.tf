###############################################################################
# Terraform Configuration & Provider
###############################################################################

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Remote state in S3 (required for GitLab CI/CD)
  # The bucket/key/table are passed via -backend-config in CI.
  # For local development, run: terraform init -backend-config="bucket=decp-platform-terraform-state" ...
  backend "s3" {
    bucket         = "decp-platform-terraform-state"
    key            = "decp-platform/dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "decp-platform-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
