###############################################################################
# Prod Environment
###############################################################################

module "decp_prod" {
  source = "../../"

  aws_region         = var.aws_region
  project_name       = var.project_name
  environment        = "prod"
  availability_zones = var.availability_zones
  vpc_cidr           = var.vpc_cidr

  db_username       = var.db_username
  db_password       = var.db_password
  db_instance_class = "db.t3.small"

  api_gateway_cpu           = 512
  api_gateway_memory        = 1024
  api_gateway_desired_count = 2

  service_cpu           = 256
  service_memory        = 512
  service_desired_count = 2

  jwt_secret         = var.jwt_secret
  jwt_refresh_secret = var.jwt_refresh_secret
  certificate_arn    = var.certificate_arn
}

output "alb_dns_name" {
  value = module.decp_prod.alb_dns_name
}

output "frontend_url" {
  value = module.decp_prod.frontend_website_url
}

output "ecr_urls" {
  value = module.decp_prod.ecr_repository_urls
}
