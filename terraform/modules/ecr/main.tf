###############################################################################
# ECR Module – Creates container registries for each microservice
###############################################################################

resource "aws_ecr_repository" "services" {
  for_each = toset(var.service_names)

  name                 = "${var.project_name}/${each.value}"
  image_tag_mutability = "MUTABLE"
  force_delete         = var.force_delete

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name        = "${var.project_name}-${each.value}"
    Environment = var.environment
  }
}

# Lifecycle policy – keep only the last N images
resource "aws_ecr_lifecycle_policy" "services" {
  for_each   = toset(var.service_names)
  repository = aws_ecr_repository.services[each.key].name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last ${var.image_retention_count} images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = var.image_retention_count
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
