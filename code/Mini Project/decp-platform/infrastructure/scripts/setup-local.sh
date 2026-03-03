#!/bin/bash
# DECP Platform - Local Development Setup Script
# Usage: ./setup-local.sh

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_NAME="decp-platform"
COMPOSE_FILE="../docker/docker-compose.dev.yml"
OVERRIDE_FILE="../docker/docker-compose.override.yml"

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

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed."
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 20+."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        print_error "Node.js version 20+ is required. Current: $(node -v)"
        exit 1
    fi
    
    print_success "All prerequisites met"
}

# Create environment files
create_env_files() {
    print_status "Creating environment files..."
    
    # Root .env file
    if [ ! -f "../../.env" ]; then
        cat > "../../.env" << 'EOF'
# Database Configuration
POSTGRES_USER=decp_admin
POSTGRES_PASSWORD=dev_password
POSTGRES_DB=decp_platform
DATABASE_URL=postgresql://decp_admin:dev_password@localhost:5432/decp_platform

# Redis Configuration
REDIS_URL=redis://localhost:6379

# RabbitMQ Configuration
RABBITMQ_USER=decp_admin
RABBITMQ_PASSWORD=dev_password
RABBITMQ_URL=amqp://decp_admin:dev_password@localhost:5672/decp

# JWT Configuration
JWT_SECRET=your-dev-jwt-secret-key-min-32-characters
JWT_EXPIRES_IN=1d

# Stripe Configuration (test keys)
STRIPE_SECRET_KEY=sk_test_your_test_key
STRIPE_PUBLIC_KEY=pk_test_your_test_key
STRIPE_WEBHOOK_SECRET=whsec_your_test_webhook_secret

# AWS Configuration (optional for local dev)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=decp-platform-uploads-dev

# Email Configuration (use MailHog for local)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=

# Firebase Configuration (optional)
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=

# Application Settings
NODE_ENV=development
LOG_LEVEL=debug
API_PORT=3000
EOF
        print_success "Created root .env file"
    else
        print_warning "Root .env file already exists"
    fi
    
    # Frontend .env file
    if [ ! -f "../../frontend/.env.local" ]; then
        cat > "../../frontend/.env.local" << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=DECP Platform (Dev)
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_your_test_key
NEXT_TELEMETRY_DISABLED=1
EOF
        print_success "Created frontend .env.local file"
    fi
}

# Create necessary directories
create_directories() {
    print_status "Creating directories..."
    
    mkdir -p ../../services/{api-gateway,auth-service,user-service,product-service,order-service,payment-service,notification-service}
    mkdir -p ../../frontend
    mkdir -p ../../mobile
    mkdir -p ../../shared
    mkdir -p ../docker/backups
    mkdir -p ../docker/init-scripts
    
    print_success "Directories created"
}

# Start infrastructure services
start_infrastructure() {
    print_status "Starting infrastructure services..."
    
    cd "$(dirname "$0")/../docker"
    
    if [ -f "docker-compose.override.yml" ]; then
        docker-compose -f docker-compose.dev.yml -f docker-compose.override.yml up -d postgres redis rabbitmq
    else
        docker-compose -f docker-compose.dev.yml up -d postgres redis rabbitmq
    fi
    
    print_success "Infrastructure services started"
}

# Wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    # Wait for PostgreSQL
    print_status "Waiting for PostgreSQL..."
    until docker-compose -f "$(dirname "$0")/../docker/docker-compose.dev.yml" exec -T postgres pg_isready -U decp_admin; do
        sleep 1
    done
    print_success "PostgreSQL is ready"
    
    # Wait for Redis
    print_status "Waiting for Redis..."
    until docker-compose -f "$(dirname "$0")/../docker/docker-compose.dev.yml" exec -T redis redis-cli ping | grep -q PONG; do
        sleep 1
    done
    print_success "Redis is ready"
    
    # Wait for RabbitMQ
    print_status "Waiting for RabbitMQ..."
    until curl -sf http://localhost:15672 > /dev/null 2>&1; do
        sleep 1
    done
    print_success "RabbitMQ is ready"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    cd "$(dirname "$0")/../.."
    if [ -f "package.json" ]; then
        npm install
    fi
    
    # Install service dependencies
    for service in api-gateway auth-service user-service product-service order-service payment-service notification-service; do
        if [ -d "services/$service" ] && [ -f "services/$service/package.json" ]; then
            print_status "Installing dependencies for $service..."
            cd "services/$service"
            npm install
            cd ../..
        fi
    done
    
    # Install frontend dependencies
    if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
        print_status "Installing frontend dependencies..."
        cd frontend
        npm install
        cd ..
    fi
    
    print_success "Dependencies installed"
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    # Run migrations
    cd "$(dirname "$0")/../../services/api-gateway"
    if [ -f "package.json" ]; then
        npm run prisma:migrate:dev || print_warning "Migration may have already been applied"
        npm run prisma:generate
    fi
    
    print_success "Database setup complete"
}

# Setup git hooks
setup_git_hooks() {
    print_status "Setting up git hooks..."
    
    cd "$(dirname "$0")/../.."
    
    if [ -d ".git" ]; then
        # Pre-commit hook
        cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Run linting before commit
echo "Running pre-commit checks..."

# Check for secrets
if command -v gitleaks &> /dev/null; then
    gitleaks protect --staged
fi

# Run lint
npm run lint
EOF
        chmod +x .git/hooks/pre-commit
        print_success "Git hooks installed"
    fi
}

# Print next steps
print_next_steps() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Setup Complete!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "Next steps:"
    echo ""
    echo "1. Start infrastructure services:"
    echo "   cd infrastructure/docker && docker-compose -f docker-compose.dev.yml up -d"
    echo ""
    echo "2. Start the API Gateway:"
    echo "   cd services/api-gateway && npm run start:dev"
    echo ""
    echo "3. Start other services as needed:"
    echo "   cd services/auth-service && npm run start:dev"
    echo "   cd services/user-service && npm run start:dev"
    echo "   ..."
    echo ""
    echo "4. Start the frontend:"
    echo "   cd frontend && npm run dev"
    echo ""
    echo "Access URLs:"
    echo "  - API Gateway:    http://localhost:3000"
    echo "  - Frontend:       http://localhost:3007"
    echo "  - pgAdmin:        http://localhost:5050"
    echo "  - RabbitMQ Mgmt:  http://localhost:15672"
    echo "  - MailHog:        http://localhost:8025"
    echo ""
    echo "Useful commands:"
    echo "  - View logs:      docker-compose -f docker-compose.dev.yml logs -f [service]"
    echo "  - Stop all:       docker-compose -f docker-compose.dev.yml down"
    echo "  - Reset DB:       docker-compose -f docker-compose.dev.yml down -v"
    echo ""
}

# Main function
main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  DECP Platform - Local Setup${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    check_prerequisites
    create_directories
    create_env_files
    start_infrastructure
    wait_for_services
    install_dependencies
    setup_database
    setup_git_hooks
    
    print_next_steps
}

# Run main
main "$@"
