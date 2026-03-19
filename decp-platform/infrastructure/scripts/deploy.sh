#!/bin/bash
# DECP Platform - Deployment Script
# Usage: ./deploy.sh [environment] [service] [version]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
SERVICE=${2:-all}
VERSION=${3:-latest}
NAMESPACE="decp-platform"
AWS_REGION="us-east-1"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    echo -e "${RED}Error: Invalid environment. Use: development, staging, or production${NC}"
    exit 1
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  DECP Platform Deployment Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Service: ${SERVICE}${NC}"
echo -e "${BLUE}Version: ${VERSION}${NC}"
echo -e "${BLUE}========================================${NC}"

# Function to print status
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed"
        exit 1
    fi
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed"
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    # Verify AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials are not configured"
        exit 1
    fi
    
    print_success "All prerequisites met"
}

# Function to update kubeconfig
update_kubeconfig() {
    print_status "Updating kubeconfig..."
    
    CLUSTER_NAME="decp-platform-cluster-${ENVIRONMENT}"
    aws eks update-kubeconfig --name "$CLUSTER_NAME" --region "$AWS_REGION"
    
    # Verify connection
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Failed to connect to cluster"
        exit 1
    fi
    
    print_success "Connected to cluster: $CLUSTER_NAME"
}

# Function to build and push Docker image
build_and_push() {
    local service=$1
    local version=$2
    
    print_status "Building Docker image for $service..."
    
    ECR_REPO="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/decp-platform/${service}"
    
    # Login to ECR
    aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REPO"
    
    # Build image
    docker build -t "${service}:${version}" \
        -f "../docker/Dockerfile.${service}" \
        "../../services/${service}"
    
    # Tag image
    docker tag "${service}:${version}" "${ECR_REPO}:${version}"
    docker tag "${service}:${version}" "${ECR_REPO}:latest"
    
    # Push image
    print_status "Pushing image to ECR..."
    docker push "${ECR_REPO}:${version}"
    docker push "${ECR_REPO}:latest"
    
    print_success "Image pushed: ${ECR_REPO}:${version}"
}

# Function to deploy a service
deploy_service() {
    local service=$1
    local version=$2
    
    print_status "Deploying $service (version: $version)..."
    
    # Update image
    kubectl set image deployment/${service} \
        ${service}="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/decp-platform/${service}:${version}" \
        -n "$NAMESPACE"
    
    # Wait for rollout
    kubectl rollout status deployment/${service} -n "$NAMESPACE" --timeout=600s
    
    print_success "$service deployed successfully"
}

# Function to deploy all services
deploy_all() {
    local version=$1
    
    services=(
        "api-gateway"
        "auth-service"
        "user-service"
        "product-service"
        "order-service"
        "payment-service"
        "notification-service"
        "frontend"
    )
    
    for service in "${services[@]}"; do
        deploy_service "$service" "$version"
    done
}

# Function to run smoke tests
run_smoke_tests() {
    print_status "Running smoke tests..."
    
    API_URL=$(kubectl get svc api-gateway -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    
    if [ -z "$API_URL" ]; then
        API_URL="api-${ENVIRONMENT}.decp.io"
    fi
    
    # Test health endpoint
    if curl -sf "https://${API_URL}/health" > /dev/null; then
        print_success "Health check passed"
    else
        print_error "Health check failed"
        return 1
    fi
    
    # Test ready endpoint
    if curl -sf "https://${API_URL}/ready" > /dev/null; then
        print_success "Readiness check passed"
    else
        print_warning "Readiness check failed (may be temporary)"
    fi
    
    print_success "Smoke tests completed"
}

# Function to rollback deployment
rollback() {
    local service=$1
    
    print_warning "Rolling back $service..."
    kubectl rollout undo deployment/${service} -n "$NAMESPACE"
    kubectl rollout status deployment/${service} -n "$NAMESPACE" --timeout=300s
    print_success "Rollback completed for $service"
}

# Function to display help
show_help() {
    cat << EOF
DECP Platform Deployment Script

Usage: $0 [ENVIRONMENT] [SERVICE] [VERSION]

Arguments:
  ENVIRONMENT   Target environment (development, staging, production)
  SERVICE       Service to deploy (all, api-gateway, auth-service, etc.)
  VERSION       Docker image version/tag

Examples:
  $0 staging all v1.2.3
  $0 production api-gateway latest
  $0 staging auth-service abc123

Options:
  -h, --help    Show this help message
  --rollback    Rollback to previous version

EOF
}

# Main execution
main() {
    # Parse arguments
    if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
        show_help
        exit 0
    fi
    
    if [ "$1" = "--rollback" ]; then
        rollback "$2"
        exit 0
    fi
    
    # Get AWS Account ID
    export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    
    # Check prerequisites
    check_prerequisites
    
    # Update kubeconfig
    update_kubeconfig
    
    # Build and deploy
    if [ "$SERVICE" = "all" ]; then
        print_status "Deploying all services..."
        
        # Build images
        for svc in api-gateway auth-service user-service product-service order-service payment-service notification-service; do
            build_and_push "$svc" "$VERSION"
        done
        
        # Deploy all
        deploy_all "$VERSION"
    else
        # Build and deploy specific service
        build_and_push "$SERVICE" "$VERSION"
        deploy_service "$SERVICE" "$VERSION"
    fi
    
    # Run smoke tests
    if [ "$ENVIRONMENT" != "development" ]; then
        run_smoke_tests
    fi
    
    print_success "Deployment completed successfully!"
    print_status "Environment: $ENVIRONMENT"
    print_status "Service: $SERVICE"
    print_status "Version: $VERSION"
}

# Run main function
main "$@"
