###############################################################################
# Dev Environment
###############################################################################

module "decp_dev" {
  source = "../../"

  aws_region         = var.aws_region
  project_name       = var.project_name
  environment        = "dev"
  availability_zones = var.availability_zones
  vpc_cidr           = var.vpc_cidr

  db_username       = var.db_username
  db_password       = var.db_password
  db_instance_class = "db.t3.micro"

  api_gateway_cpu           = 256
  api_gateway_memory        = 512
  api_gateway_desired_count = var.api_gateway_desired_count

  service_cpu           = 256
  service_memory        = 512
  service_desired_count = var.service_desired_count

  jwt_secret         = var.jwt_secret
  jwt_refresh_secret = var.jwt_refresh_secret
  certificate_arn    = ""

  enable_nat_gateway = var.enable_nat_gateway
}

output "alb_dns_name" {
  value = module.decp_dev.alb_dns_name
}

output "frontend_url" {
  value = module.decp_dev.frontend_website_url
}

output "ecr_urls" {
  value = module.decp_dev.ecr_repository_urls
}
