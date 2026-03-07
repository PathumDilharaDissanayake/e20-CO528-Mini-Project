###############################################################################
# RDS Module – PostgreSQL + ElastiCache Redis
###############################################################################

# ---------- DB Subnet Group ----------
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name        = "${var.project_name}-db-subnet-group"
    Environment = var.environment
  }
}

# ---------- RDS PostgreSQL ----------
resource "aws_db_instance" "postgres" {
  identifier     = "${var.project_name}-postgres"
  engine         = "postgres"
  engine_version = var.postgres_engine_version

  instance_class        = var.db_instance_class
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_encrypted     = true

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.db_security_group_id]

  multi_az            = var.multi_az
  publicly_accessible = false
  skip_final_snapshot = var.skip_final_snapshot

  backup_retention_period = var.backup_retention_period
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  tags = {
    Name        = "${var.project_name}-postgres"
    Environment = var.environment
  }
}

# ---------- ElastiCache Redis ----------
resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.project_name}-redis-subnet-group"
  subnet_ids = var.private_subnet_ids
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id = "${var.project_name}-redis"
  description          = "Redis cluster for ${var.project_name}"
  node_type            = var.redis_node_type
  num_cache_clusters   = var.redis_num_cache_clusters
  engine_version       = var.redis_engine_version
  port                 = 6379

  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [var.redis_security_group_id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  automatic_failover_enabled = var.redis_num_cache_clusters > 1 ? true : false

  tags = {
    Name        = "${var.project_name}-redis"
    Environment = var.environment
  }
}
