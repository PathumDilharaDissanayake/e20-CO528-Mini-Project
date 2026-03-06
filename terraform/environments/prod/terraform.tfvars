aws_region         = "us-east-1"
project_name       = "decp-platform"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
vpc_cidr           = "10.1.0.0/16"

# Set secrets via environment variables:
#   export TF_VAR_db_username="postgres"
#   export TF_VAR_db_password="your-secure-password"
#   export TF_VAR_jwt_secret="your-jwt-secret"
#   export TF_VAR_jwt_refresh_secret="your-jwt-refresh-secret"
#   export TF_VAR_certificate_arn="arn:aws:acm:us-east-1:123456789:certificate/xxx"
