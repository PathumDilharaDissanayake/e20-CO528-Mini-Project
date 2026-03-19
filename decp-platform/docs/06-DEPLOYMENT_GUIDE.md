# DECP Platform - Deployment Guide

## Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [Environment Setup](#environment-setup)
3. [Docker Deployment](#docker-deployment)
4. [Kubernetes Deployment](#kubernetes-deployment)
5. [AWS Deployment with Terraform](#aws-deployment-with-terraform)
6. [Monitoring Setup](#monitoring-setup)
7. [Rollback Procedures](#rollback-procedures)

---

## Deployment Overview

The DECP Platform supports multiple deployment strategies:

| Environment | Strategy | Purpose |
|-------------|----------|---------|
| Local | Docker Compose | Development & Testing |
| Staging | Kubernetes | Pre-production validation |
| Production | Kubernetes + Terraform | Live environment |

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Deployment Pipeline                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Developer Push                                                         │
│       │                                                                 │
│       ▼                                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      CI/CD Pipeline                              │   │
│  │  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐      │   │
│  │  │  Build  │───▶│  Test   │───▶│ Package │───▶│ Deploy  │      │   │
│  │  └─────────┘    └─────────┘    └─────────┘    └─────────┘      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│       │                                                                 │
│       ├──────────────────┬──────────────────┐                          │
│       ▼                  ▼                  ▼                          │
│  ┌─────────┐       ┌─────────┐       ┌─────────┐                       │
│  │  Local  │       │ Staging │       │Production│                       │
│  │ Docker  │       │   EKS   │       │   EKS    │                       │
│  └─────────┘       └─────────┘       └─────────┘                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Environment Setup

### Environment Variables

Create environment-specific `.env` files:

#### Production Environment (.env.production)

```env
# Application
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Database
DATABASE_URL="postgresql://<user>:<pass>@<host>:5432/decp?schema=public&connection_limit=20"
DATABASE_POOL_SIZE=20

# Redis
REDIS_URL="redis://<user>:<pass>@<host>:6379"
REDIS_CLUSTER_ENABLED=true

# JWT
JWT_SECRET="<secure-random-string-32-chars>"
JWT_REFRESH_SECRET="<secure-random-string-32-chars>"
JWT_ACCESS_EXPIRY=900
JWT_REFRESH_EXPIRY=604800

# AWS
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID="<access-key>"
AWS_SECRET_ACCESS_KEY="<secret-key>"

# S3
S3_BUCKET_NAME=decp-production-media
S3_CLOUDFRONT_DOMAIN=media.decp.eng.pdn.ac.lk

# Email (AWS SES)
SES_FROM_EMAIL=noreply@decp.eng.pdn.ac.lk
SES_REGION=ap-south-1

# RabbitMQ
RABBITMQ_URL="amqps://<user>:<pass>@<host>:5671"
RABBITMQ_VHOST=/

# Monitoring
SENTRY_DSN="https://<key>@sentry.io/<project>"
DATADOG_API_KEY="<api-key>"

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_PUSH_NOTIFICATIONS=true
```

### Secrets Management

Use Kubernetes Secrets or AWS Secrets Manager:

```bash
# Create Kubernetes secret
kubectl create secret generic decp-secrets \
  --from-literal=database-url="postgresql://..." \
  --from-literal=jwt-secret="..." \
  --from-literal=aws-access-key="..." \
  -n decp-production
```

---

## Docker Deployment

### Building Images

```bash
# Build all services
docker-compose -f docker-compose.yml build

# Build specific service
docker build -t decp-platform/auth-service:latest -f backend/auth-service/Dockerfile backend/auth-service

# Tag with version
docker tag decp-platform/auth-service:latest decp-platform/auth-service:v1.2.0
```

### Multi-Stage Dockerfile Example

```dockerfile
# backend/auth-service/Dockerfile

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy dependencies and build
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

USER nodejs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/index.js"]
```

### Docker Compose for Production

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  # API Gateway
  api-gateway:
    image: decp-platform/api-gateway:${VERSION:-latest}
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - AUTH_SERVICE_URL=http://auth-service:3001
      - USER_SERVICE_URL=http://user-service:3002
      # ... other service URLs
    depends_on:
      - auth-service
      - user-service
    networks:
      - decp-network
    restart: unless-stopped

  # Auth Service
  auth-service:
    image: decp-platform/auth-service:${VERSION:-latest}
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DATABASE_URL=${AUTH_DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
    secrets:
      - jwt_secret
    networks:
      - decp-network
    restart: unless-stopped
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M

  # User Service
  user-service:
    image: decp-platform/user-service:${VERSION:-latest}
    environment:
      - NODE_ENV=production
      - PORT=3002
      - DATABASE_URL=${USER_DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    networks:
      - decp-network
    restart: unless-stopped
    deploy:
      replicas: 2

  # Frontend
  frontend:
    image: decp-platform/frontend:${VERSION:-latest}
    ports:
      - "80:80"
      - "443:443"
    environment:
      - NGINX_ENVSUBST_OUTPUT_FORMAT=js
      - API_URL=http://api-gateway:3000
    volumes:
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - api-gateway
    networks:
      - decp-network
    restart: unless-stopped

  # Databases
  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD_FILE=/run/secrets/db_password
      - POSTGRES_DB=decp
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    secrets:
      - db_password
    networks:
      - decp-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - decp-network
    restart: unless-stopped

networks:
  decp-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:

secrets:
  db_password:
    file: ./secrets/db_password.txt
  jwt_secret:
    file: ./secrets/jwt_secret.txt
```

### Deploy with Docker Compose

```bash
# Deploy production stack
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Scale a service
docker-compose -f docker-compose.prod.yml up -d --scale user-service=3

# Update deployment
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# Rollback
docker-compose -f docker-compose.prod.yml down
VERSION=1.1.0 docker-compose -f docker-compose.prod.yml up -d
```

---

## Kubernetes Deployment

### Namespace Configuration

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: decp-production
  labels:
    name: decp-production
    environment: production
```

### ConfigMap

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: decp-config
  namespace: decp-production
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  API_GATEWAY_PORT: "3000"
  AUTH_SERVICE_PORT: "3001"
  USER_SERVICE_PORT: "3002"
  # ... other service ports
  REDIS_CLUSTER_ENABLED: "true"
  ENABLE_ANALYTICS: "true"
```

### Secrets

```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: decp-secrets
  namespace: decp-production
type: Opaque
stringData:
  DATABASE_URL: "postgresql://..."
  JWT_SECRET: "..."
  JWT_REFRESH_SECRET: "..."
  REDIS_PASSWORD: "..."
  AWS_ACCESS_KEY_ID: "..."
  AWS_SECRET_ACCESS_KEY: "..."
```

### Service Deployment

```yaml
# k8s/auth-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  namespace: decp-production
  labels:
    app: auth-service
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
    spec:
      containers:
        - name: auth-service
          image: decp-platform/auth-service:v1.2.0
          ports:
            - containerPort: 3001
              name: http
          env:
            - name: PORT
              value: "3001"
            - name: NODE_ENV
              valueFrom:
                configMapKeyRef:
                  name: decp-config
                  key: NODE_ENV
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: decp-secrets
                  key: DATABASE_URL
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: decp-secrets
                  key: JWT_SECRET
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3001
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /ready
              port: 3001
            initialDelaySeconds: 5
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3
          lifecycle:
            preStop:
              exec:
                command: ["/bin/sh", "-c", "sleep 15"]
      terminationGracePeriodSeconds: 60
---
apiVersion: v1
kind: Service
metadata:
  name: auth-service
  namespace: decp-production
spec:
  selector:
    app: auth-service
  ports:
    - port: 3001
      targetPort: 3001
      name: http
  type: ClusterIP
```

### Horizontal Pod Autoscaler

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: auth-service-hpa
  namespace: decp-production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: auth-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 50
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
        - type: Pods
          value: 4
          periodSeconds: 15
      selectPolicy: Max
```

### Ingress Configuration

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: decp-ingress
  namespace: decp-production
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
spec:
  tls:
    - hosts:
        - api.decp.eng.pdn.ac.lk
        - decp.eng.pdn.ac.lk
      secretName: decp-tls
  rules:
    - host: api.decp.eng.pdn.ac.lk
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api-gateway
                port:
                  number: 3000
    - host: decp.eng.pdn.ac.lk
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 80
```

### Apply Kubernetes Manifests

```bash
# Apply all manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/

# Check deployment status
kubectl get deployments -n decp-production
kubectl get pods -n decp-production
kubectl get services -n decp-production
kubectl get ingress -n decp-production

# View logs
kubectl logs -f deployment/auth-service -n decp-production

# Scale deployment
kubectl scale deployment auth-service --replicas=5 -n decp-production

# Rolling restart
kubectl rollout restart deployment/auth-service -n decp-production

# Check rollout status
kubectl rollout status deployment/auth-service -n decp-production

# Rollback
kubectl rollout undo deployment/auth-service -n decp-production
```

---

## AWS Deployment with Terraform

### Terraform Structure

```
infrastructure/terraform/
├── modules/
│   ├── vpc/
│   ├── eks/
│   ├── rds/
│   ├── elasticache/
│   ├── s3/
│   └── iam/
├── environments/
│   ├── production/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── terraform.tfvars
│   └── staging/
└── backend.tf
```

### VPC Configuration

```hcl
# infrastructure/terraform/modules/vpc/main.tf
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.project_name}-vpc"
    Environment = var.environment
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-igw"
  }
}

resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-${count.index + 1}"
    Type = "Public"
  }
}

resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "${var.project_name}-private-${count.index + 1}"
    Type = "Private"
  }
}
```

### EKS Cluster

```hcl
# infrastructure/terraform/modules/eks/main.tf
resource "aws_eks_cluster" "main" {
  name     = "${var.project_name}-${var.environment}"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = var.kubernetes_version

  vpc_config {
    subnet_ids              = var.private_subnet_ids
    endpoint_private_access = true
    endpoint_public_access  = true
    public_access_cidrs     = var.allowed_cidr_blocks
  }

  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy,
    aws_cloudwatch_log_group.eks,
  ]
}

resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${var.project_name}-nodes"
  node_role_arn   = aws_iam_role.eks_node.arn
  subnet_ids      = var.private_subnet_ids

  capacity_type  = "ON_DEMAND"
  instance_types = var.node_instance_types
  disk_size      = 50

  scaling_config {
    desired_size = var.node_desired_size
    max_size     = var.node_max_size
    min_size     = var.node_min_size
  }

  update_config {
    max_unavailable_percentage = 25
  }

  labels = {
    role = "general"
  }

  tags = {
    Name = "${var.project_name}-node"
  }
}
```

### RDS PostgreSQL

```hcl
# infrastructure/terraform/modules/rds/main.tf
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name = "${var.project_name}-db-subnet-group"
  }
}

resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-${var.environment}"

  engine         = "postgres"
  engine_version = "16.1"
  instance_class = var.instance_class

  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = var.database_name
  username = var.master_username
  password = var.master_password

  multi_az               = var.environment == "production"
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  backup_retention_period = 30
  backup_window          = "03:00-04:00"
  maintenance_window     = "Mon:04:00-Mon:05:00"

  deletion_protection = var.environment == "production"
  skip_final_snapshot = var.environment != "production"

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  tags = {
    Name = "${var.project_name}-postgres"
  }
}

# Read replica for production
resource "aws_db_instance" "replica" {
  count = var.environment == "production" ? 1 : 0

  identifier = "${var.project_name}-${var.environment}-replica"

  replicate_source_db = aws_db_instance.main.arn
  instance_class      = var.instance_class

  storage_encrypted = true

  vpc_security_group_ids = [aws_security_group.rds.id]

  tags = {
    Name = "${var.project_name}-postgres-replica"
  }
}
```

### Deploy with Terraform

```bash
# Initialize Terraform
cd infrastructure/terraform/environments/production
terraform init

# Plan changes
terraform plan -out=tfplan

# Apply changes
terraform apply tfplan

# Get outputs
terraform output

# Update kubeconfig
aws eks update-kubeconfig --region ap-south-1 --name decp-production

# Verify cluster
kubectl get nodes
```

---

## Monitoring Setup

### Prometheus Configuration

```yaml
# k8s/monitoring/prometheus-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
    
    alerting:
      alertmanagers:
        - static_configs:
            - targets: ['alertmanager:9093']
    
    rule_files:
      - /etc/prometheus/rules/*.yml
    
    scrape_configs:
      - job_name: 'kubernetes-apiservers'
        kubernetes_sd_configs:
          - role: endpoints
        scheme: https
        tls_config:
          ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
        relabel_configs:
          - source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_service_name, __meta_kubernetes_endpoint_port_name]
            action: keep
            regex: default;kubernetes;https
      
      - job_name: 'kubernetes-pods'
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
            action: replace
            target_label: __metrics_path__
            regex: (.+)
          - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
            action: replace
            regex: ([^:]+)(?::\d+)?;(\d+)
            replacement: $1:$2
            target_label: __address__
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "DECP Platform Overview",
    "tags": ["decp", "overview"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{service}}"
          }
        ]
      },
      {
        "id": 2,
        "title": "Response Time (p95)",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "{{service}}"
          }
        ]
      },
      {
        "id": 3,
        "title": "Error Rate",
        "type": "singlestat",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m]) / rate(http_requests_total[5m])"
          }
        ]
      }
    ]
  }
}
```

### Alerting Rules

```yaml
# k8s/monitoring/alert-rules.yaml
groups:
  - name: decp-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is above 5% for {{ $labels.service }}"
      
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High response time"
          description: "95th percentile response time > 500ms for {{ $labels.service }}"
      
      - alert: PodCrashLooping
        expr: rate(kube_pod_container_status_restarts_total[15m]) > 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Pod crash looping"
          description: "Pod {{ $labels.pod }} is crash looping"
      
      - alert: DatabaseConnectionsHigh
        expr: pg_stat_activity_count > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High database connections"
          description: "Database connections > 80"
```

---

## Rollback Procedures

### Kubernetes Rollback

```bash
# Check rollout history
kubectl rollout history deployment/auth-service -n decp-production

# Rollback to previous version
kubectl rollout undo deployment/auth-service -n decp-production

# Rollback to specific revision
kubectl rollout undo deployment/auth-service -n decp-production --to-revision=3

# Verify rollback
kubectl get pods -n decp-production
kubectl describe deployment auth-service -n decp-production
```

### Database Rollback

```bash
# Restore from backup (PostgreSQL)
# 1. Stop application
kubectl scale deployment auth-service --replicas=0 -n decp-production

# 2. Restore database
pg_restore --clean --if-exists --dbname=decp backup.sql

# 3. Restart application
kubectl scale deployment auth-service --replicas=3 -n decp-production
```

### Emergency Procedures

```bash
# Scale to zero (emergency stop)
kubectl scale deployment --all --replicas=0 -n decp-production

# Restore from known good state
git checkout v1.1.0
kubectl apply -f k8s/

# Drain node for maintenance
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data

# Uncordon node after maintenance
kubectl uncordon <node-name>
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Run linting
        run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [api-gateway, auth-service, user-service, feed-service]
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-south-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2
      
      - name: Build and push image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/decp-${{ matrix.service }}:$IMAGE_TAG -f backend/${{ matrix.service }}/Dockerfile backend/${{ matrix.service }}
          docker push $ECR_REGISTRY/decp-${{ matrix.service }}:$IMAGE_TAG

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-south-1
      
      - name: Update kubeconfig
        run: aws eks update-kubeconfig --name decp-production
      
      - name: Deploy to EKS
        env:
          IMAGE_TAG: ${{ github.sha }}
        run: |
          kubectl set image deployment/auth-service auth-service=$ECR_REGISTRY/decp-auth-service:$IMAGE_TAG -n decp-production
          kubectl rollout status deployment/auth-service -n decp-production
```

---

*Last Updated: March 2026*
