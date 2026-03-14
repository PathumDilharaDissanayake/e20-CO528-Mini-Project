###############################################################################
# ECS Module – Fargate cluster running all DECP microservices
###############################################################################

# ---------- ECS Cluster ----------
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"

  setting {
    name  = "containerInsights"
    value = var.enable_container_insights ? "enabled" : "disabled"
  }

  tags = {
    Name        = "${var.project_name}-cluster"
    Environment = var.environment
  }
}

# ---------- CloudWatch Log Group ----------
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/${var.project_name}"
  retention_in_days = var.log_retention_days

  tags = {
    Environment = var.environment
  }
}

# ---------- ECS Task Execution Role ----------
resource "aws_iam_role" "ecs_task_execution" {
  name = "${var.project_name}-ecs-task-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ---------- ECS Task Role (for application-level permissions) ----------
resource "aws_iam_role" "ecs_task" {
  name = "${var.project_name}-ecs-task"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

# S3 access for upload services
resource "aws_iam_role_policy" "ecs_task_s3" {
  name = "${var.project_name}-ecs-s3-access"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          var.uploads_bucket_arn,
          "${var.uploads_bucket_arn}/*"
        ]
      }
    ]
  })
}

###############################################################################
# Service definitions – one task definition + ECS service per microservice
###############################################################################

locals {
  # Define all services and their configuration
  services = {
    api-gateway = {
      port        = 3000
      cpu         = var.api_gateway_cpu
      memory      = var.api_gateway_memory
      desired     = var.api_gateway_desired_count
      health_path = "/health"
      environment = concat(var.common_env_vars, [
        { name = "PORT", value = "3000" },
        { name = "AUTH_SERVICE_URL", value = "http://auth-service.${var.project_name}.local:3001" },
        { name = "USER_SERVICE_URL", value = "http://user-service.${var.project_name}.local:3002" },
        { name = "FEED_SERVICE_URL", value = "http://feed-service.${var.project_name}.local:3003" },
        { name = "JOBS_SERVICE_URL", value = "http://jobs-service.${var.project_name}.local:3004" },
        { name = "EVENTS_SERVICE_URL", value = "http://events-service.${var.project_name}.local:3005" },
        { name = "RESEARCH_SERVICE_URL", value = "http://research-service.${var.project_name}.local:3006" },
        { name = "MESSAGING_SERVICE_URL", value = "http://messaging-service.${var.project_name}.local:3007" },
        { name = "NOTIFICATION_SERVICE_URL", value = "http://notification-service.${var.project_name}.local:3008" },
        { name = "ANALYTICS_SERVICE_URL", value = "http://analytics-service.${var.project_name}.local:3009" },
      ])
    }
    auth-service = {
      port        = 3001
      cpu         = var.service_cpu
      memory      = var.service_memory
      desired     = var.service_desired_count
      health_path = "/health"
      environment = concat(var.common_env_vars, var.db_env_vars, [
        { name = "PORT", value = "3001" },
        { name = "DB_NAME", value = "decp_auth" },
      ])
    }
    user-service = {
      port        = 3002
      cpu         = var.service_cpu
      memory      = var.service_memory
      desired     = var.service_desired_count
      health_path = "/health"
      environment = concat(var.common_env_vars, var.db_env_vars, [
        { name = "PORT", value = "3002" },
        { name = "DB_NAME", value = "decp_users" },
      ])
    }
    feed-service = {
      port        = 3003
      cpu         = var.service_cpu
      memory      = var.service_memory
      desired     = var.service_desired_count
      health_path = "/health"
      environment = concat(var.common_env_vars, var.db_env_vars, [
        { name = "PORT", value = "3003" },
        { name = "DB_NAME", value = "decp_feed" },
        { name = "UPLOADS_BUCKET_NAME", value = trimprefix(var.uploads_bucket_arn, "arn:aws:s3:::") },
      ])
    }
    jobs-service = {
      port        = 3004
      cpu         = var.service_cpu
      memory      = var.service_memory
      desired     = var.service_desired_count
      health_path = "/health"
      environment = concat(var.common_env_vars, var.db_env_vars, [
        { name = "PORT", value = "3004" },
        { name = "DB_NAME", value = "decp_jobs" },
      ])
    }
    events-service = {
      port        = 3005
      cpu         = var.service_cpu
      memory      = var.service_memory
      desired     = var.service_desired_count
      health_path = "/health"
      environment = concat(var.common_env_vars, var.db_env_vars, [
        { name = "PORT", value = "3005" },
        { name = "DB_NAME", value = "decp_events" },
      ])
    }
    research-service = {
      port        = 3006
      cpu         = var.service_cpu
      memory      = var.service_memory
      desired     = var.service_desired_count
      health_path = "/health"
      environment = concat(var.common_env_vars, var.db_env_vars, [
        { name = "PORT", value = "3006" },
        { name = "DB_NAME", value = "decp_research" },
      ])
    }
    messaging-service = {
      port        = 3007
      cpu         = var.service_cpu
      memory      = var.service_memory
      desired     = var.service_desired_count
      health_path = "/health"
      environment = concat(var.common_env_vars, var.db_env_vars, [
        { name = "PORT", value = "3007" },
        { name = "DB_NAME", value = "decp_messaging" },
        { name = "REDIS_URL", value = "redis://${var.redis_endpoint}:6379" },
      ])
    }
    notification-service = {
      port        = 3008
      cpu         = var.service_cpu
      memory      = var.service_memory
      desired     = var.service_desired_count
      health_path = "/health"
      environment = concat(var.common_env_vars, var.db_env_vars, [
        { name = "PORT", value = "3008" },
        { name = "DB_NAME", value = "decp_notifications" },
      ])
    }
    analytics-service = {
      port        = 3009
      cpu         = var.service_cpu
      memory      = var.service_memory
      desired     = var.service_desired_count
      health_path = "/health"
      environment = concat(var.common_env_vars, var.db_env_vars, [
        { name = "PORT", value = "3009" },
        { name = "DB_NAME", value = "decp_analytics" },
      ])
    }
  }
}

# ---------- Task Definitions ----------
resource "aws_ecs_task_definition" "services" {
  for_each = local.services

  family                   = "${var.project_name}-${each.key}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = each.value.cpu
  memory                   = each.value.memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = each.key
      image     = "${var.ecr_repository_urls[each.key]}:latest"
      essential = true

      portMappings = [
        {
          containerPort = each.value.port
          hostPort      = each.value.port
          protocol      = "tcp"
        }
      ]

      environment = each.value.environment

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = each.key
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:${each.value.port}${each.value.health_path} || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name        = "${var.project_name}-${each.key}"
    Environment = var.environment
  }
}

# ---------- ECS Services ----------
resource "aws_ecs_service" "services" {
  for_each = local.services

  name            = each.key
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.services[each.key].arn
  desired_count   = each.value.desired
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [var.ecs_security_group_id]
    subnets          = var.private_subnet_ids
    assign_public_ip = false
  }

  # Only api-gateway gets the ALB target group
  dynamic "load_balancer" {
    for_each = each.key == "api-gateway" ? [1] : []
    content {
      target_group_arn = var.api_gateway_target_group_arn
      container_name   = each.key
      container_port   = each.value.port
    }
  }

  # Enable service discovery for inter-service communication
  dynamic "service_registries" {
    for_each = each.key != "api-gateway" ? [1] : []
    content {
      registry_arn = aws_service_discovery_service.services[each.key].arn
    }
  }

  depends_on = [aws_ecs_task_definition.services]

  tags = {
    Name        = "${var.project_name}-${each.key}"
    Environment = var.environment
  }
}

# ---------- Service Discovery (Cloud Map) ----------
resource "aws_service_discovery_private_dns_namespace" "main" {
  name        = "${var.project_name}.local"
  description = "Service discovery namespace for ${var.project_name}"
  vpc         = var.vpc_id
}

resource "aws_service_discovery_service" "services" {
  for_each = { for k, v in local.services : k => v if k != "api-gateway" }

  name = each.key

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main.id

    dns_records {
      ttl  = 10
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}
