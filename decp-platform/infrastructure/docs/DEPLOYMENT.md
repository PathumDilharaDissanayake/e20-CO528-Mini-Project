# DECP Platform - Deployment Guide

This guide provides comprehensive instructions for deploying the DECP Platform infrastructure and applications.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Infrastructure Deployment](#infrastructure-deployment)
4. [Application Deployment](#application-deployment)
5. [Monitoring Setup](#monitoring-setup)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools

- **Docker** (v24.0+) - Container runtime
- **Docker Compose** (v2.20+) - Multi-container orchestration
- **kubectl** (v1.28+) - Kubernetes CLI
- **AWS CLI** (v2.0+) - AWS command line interface
- **Terraform** (v1.5+) - Infrastructure as code
- **Helm** (v3.12+) - Kubernetes package manager

### AWS Requirements

- AWS Account with appropriate permissions
- Configured AWS CLI with access keys
- Domain registered in Route53 (for production)
- SSL certificates in ACM

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/decp-platform.git
cd decp-platform/infrastructure
```

### 2. Configure AWS Credentials

```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Default region: us-east-1
# Default output format: json
```

### 3. Setup Terraform Backend

Create an S3 bucket and DynamoDB table for Terraform state:

```bash
# Create S3 bucket
aws s3 mb s3://decp-platform-terraform-state --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket decp-platform-terraform-state \
  --versioning-configuration Status=Enabled

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

## Infrastructure Deployment

### 1. Deploy AWS Infrastructure with Terraform

```bash
cd terraform

# Initialize Terraform
terraform init

# Select workspace
terraform workspace new production  # or use existing: terraform workspace select production

# Review changes
terraform plan -var="environment=production"

# Apply changes
terraform apply -var="environment=production"
```

### 2. Configure kubectl for EKS

```bash
aws eks update-kubeconfig --name decp-platform-cluster-production --region us-east-1

# Verify connection
kubectl get nodes
```

### 3. Deploy Kubernetes Resources

```bash
cd ../k8s

# Create namespace
kubectl apply -f namespace.yml

# Create ConfigMaps and Secrets
kubectl apply -f configmap.yml
kubectl apply -f secrets.yml

# Create RBAC resources
kubectl apply -f rbac.yml

# Create persistent volumes
kubectl apply -f pvc.yml

# Deploy services
kubectl apply -f deployment-api-gateway.yml
kubectl apply -f deployment-auth-service.yml
kubectl apply -f deployment-user-service.yml
kubectl apply -f deployment-product-service.yml
kubectl apply -f deployment-order-service.yml
kubectl apply -f deployment-payment-service.yml
kubectl apply -f deployment-notification-service.yml
kubectl apply -f deployment-frontend.yml

# Create ingress
kubectl apply -f ingress.yml
```

### 4. Install Helm Charts (Optional)

```bash
# Add required Helm repositories
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo add jetstack https://charts.jetstack.io
helm repo add external-secrets https://charts.external-secrets.io
helm repo update

# Install NGINX Ingress Controller
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.annotations."service\.beta\.kubernetes\.io/aws-load-balancer-type"=nlb

# Install Cert Manager
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set installCRDs=true

# Install External Secrets Operator
helm install external-secrets external-secrets/external-secrets \
  --namespace external-secrets \
  --create-namespace
```

## Application Deployment

### Method 1: Using the Deployment Script

```bash
cd scripts

# Deploy all services to staging
./deploy.sh staging all latest

# Deploy specific service
./deploy.sh production api-gateway v1.2.3

# Rollback a service
./deploy.sh --rollback api-gateway
```

### Method 2: Manual Deployment

```bash
# Build Docker image
docker build -t decp-platform/api-gateway:latest \
  -f docker/Dockerfile.api-gateway \
  services/api-gateway

# Tag for ECR
docker tag decp-platform/api-gateway:latest \
  ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/decp-platform/api-gateway:latest

# Push to ECR
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/decp-platform/api-gateway:latest

# Update Kubernetes deployment
kubectl set image deployment/api-gateway \
  api-gateway=${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/decp-platform/api-gateway:latest \
  -n decp-platform

# Verify rollout
kubectl rollout status deployment/api-gateway -n decp-platform
```

### Method 3: CI/CD Pipeline (GitHub Actions)

The deployment is automatically triggered when:
- Code is merged to `main` branch
- A new release is published
- Manual workflow dispatch

See `.github/workflows/cd-backend.yml` and `.github/workflows/cd-frontend.yml` for details.

## Monitoring Setup

### 1. Deploy Monitoring Stack

```bash
cd monitoring

# Create ConfigMaps
kubectl create configmap prometheus-config \
  --from-file=prometheus.yml \
  -n decp-platform

kubectl create configmap alertmanager-config \
  --from-file=alertmanager.yml \
  -n decp-platform

kubectl create configmap loki-config \
  --from-file=loki-config.yml \
  -n decp-platform

# Deploy Prometheus and Grafana
kubectl apply -f k8s/prometheus-deployment.yml
kubectl apply -f k8s/grafana-deployment.yml
kubectl apply -f k8s/loki-deployment.yml
```

### 2. Configure Grafana

1. Access Grafana at `https://grafana.decp.io`
2. Default credentials: `admin` / `admin`
3. Add Prometheus data source: `http://prometheus:9090`
4. Import dashboards from `monitoring/grafana/dashboards/`

### 3. Setup Alerts

Configure AlertManager to send notifications:

```yaml
# Edit alertmanager.yml
global:
  slack_api_url: 'YOUR_SLACK_WEBHOOK_URL'
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@decp.io'

route:
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty'
```

## Troubleshooting

### Common Issues

#### 1. Pods Stuck in Pending

```bash
# Check events
kubectl get events -n decp-platform --sort-by='.lastTimestamp'

# Check resource quotas
kubectl describe resourcequota -n decp-platform

# Check node resources
kubectl describe nodes
```

#### 2. Service Connection Issues

```bash
# Check service endpoints
kubectl get endpoints -n decp-platform

# Test connectivity from within cluster
kubectl run -it --rm debug --image=busybox:1.28 --restart=Never -- sh
wget -qO- http://api-gateway:3000/health
```

#### 3. SSL Certificate Issues

```bash
# Check certificate status
kubectl describe certificate -n decp-platform

# Check cert-manager logs
kubectl logs -n cert-manager deployment/cert-manager

# Verify DNS propagation
dig api.decp.io
```

#### 4. High Memory/CPU Usage

```bash
# Check resource usage
kubectl top pods -n decp-platform

# Check HPA status
kubectl get hpa -n decp-platform

# Describe pod for events
kubectl describe pod <pod-name> -n decp-platform
```

### Useful Commands

```bash
# View all resources
kubectl get all -n decp-platform

# View logs
kubectl logs -f deployment/api-gateway -n decp-platform

# Shell into container
kubectl exec -it deployment/api-gateway -n decp-platform -- /bin/sh

# Port forward for local testing
kubectl port-forward service/api-gateway 3000:3000 -n decp-platform

# Scale deployment
kubectl scale deployment api-gateway --replicas=5 -n decp-platform

# Rollback deployment
kubectl rollout undo deployment/api-gateway -n decp-platform

# Check rollout history
kubectl rollout history deployment/api-gateway -n decp-platform
```

### Support

For additional support:
- Check logs: `kubectl logs -n decp-platform <pod-name>`
- Review documentation: https://wiki.decp.io
- Contact: devops@decp.io
