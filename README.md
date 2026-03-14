# DECP Platform — Department Engagement & Career Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![AWS](https://img.shields.io/badge/AWS-ECS%20%7C%20RDS%20%7C%20S3-orange.svg)](https://aws.amazon.com/)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitLab-orange.svg)](https://gitlab.com/)

> A production-ready, full-stack microservices platform that connects university students with alumni, enabling career development, research collaboration, event management, and community engagement — built for the Department of Computer Engineering, University of Peradeniya.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
3. [Architecture](#architecture)
4. [Technology Stack](#technology-stack)
5. [Repository Structure](#repository-structure)
6. [Microservices Reference](#microservices-reference)
7. [Quick Start](#quick-start)
8. [Environment Configuration](#environment-configuration)
9. [Running in Development](#running-in-development)
10. [Running in Production (AWS)](#running-in-production-aws)
11. [CI/CD Pipeline](#cicd-pipeline)
12. [API Reference](#api-reference)
13. [Database Design](#database-design)
14. [Testing](#testing)
15. [Security](#security)
16. [Performance Targets](#performance-targets)
17. [Documentation](#documentation)
18. [Team](#team)
19. [Acknowledgements](#acknowledgements)

---

## Project Overview

The **DECP Platform** (Department Engagement & Career Platform) is a comprehensive social networking and career development system designed for university departments. It bridges the gap between current students and alumni by providing tools for:

- Building and managing professional profiles
- Posting and discovering job and internship opportunities
- Creating, sharing, and engaging with a community feed
- Organizing department events with RSVP and calendar integration
- Collaborating on research projects and sharing academic documents
- Real-time direct and group messaging
- Smart notifications and analytics dashboards

The platform is built as a **production-ready microservices application** deployed on **AWS ECS Fargate**, with a **React web frontend**, a **React Native mobile app**, and a full **Terraform-managed cloud infrastructure**.

---

## Key Features

### User Management
- Secure registration with email verification
- Role-based access control: Student, Alumni, Admin
- Rich profile management — skills, education, work experience
- Connection/follower graph

### Social Feed
- Text, image, and video posts
- Like, comment, and share interactions
- Infinite-scroll feed with real-time updates
- Media stored in AWS S3 / MinIO

### Jobs & Internships
- Job and internship posting by alumni and department
- Resume upload and application tracking
- AI-assisted job recommendations

### Events
- Create and manage department events
- RSVP system with automated reminders
- Calendar integration

### Research Collaboration
- Research project management with collaborator invitations
- Document sharing with version control
- Publication tracking

### Messaging
- Direct messaging and group chat
- Real-time delivery via Socket.io
- File sharing in conversations

### Notifications
- In-app, push, and email notifications
- Granular per-category notification preferences

### Analytics
- User activity and engagement metrics
- Popular content analysis
- Job application statistics
- Admin dashboard

---

## Architecture

DECP Platform is built on a **microservices architecture** with an **API Gateway** as the single entry point.

```
┌──────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                            │
│    Web App (React/Vite)    Mobile App (React Native/Expo)            │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ HTTPS / WSS
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│             API GATEWAY  —  Port 3000                                │
│     JWT Verification  |  Rate Limiting  |  Request Routing           │
└──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┘
       │      │      │      │      │      │      │      │      │
       ▼      ▼      ▼      ▼      ▼      ▼      ▼      ▼      ▼
   [Auth]  [User]  [Feed] [Jobs] [Events][Research][Msg][Notif][Analytics]
   :3001   :3002   :3003  :3004  :3005   :3006   :3007 :3008   :3009
       │      │      │      │      │      │      │      │      │
       └──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘
                                │
┌───────────────────────────────▼──────────────────────────────────────┐
│                          DATA LAYER                                   │
│  PostgreSQL (9 databases)  |  Redis  |  AWS S3  |  RabbitMQ          │
└──────────────────────────────────────────────────────────────────────┘
```

**Cloud Deployment (AWS):**

```
Internet → ALB → ECS Fargate (API Gateway) → ECS Fargate (microservices)
                                           → RDS PostgreSQL
                                           → ElastiCache Redis
                                           → S3 (media + frontend static)
```

Refer to [`diagrams/`](code/Mini%20Project/decp-platform/diagrams/) for C4 model, data-flow, deployment, and security architecture diagrams.

---

## Technology Stack

### Backend (all microservices)
| Category | Technology |
|---|---|
| Runtime | Node.js 20+ |
| Language | TypeScript 5.3+ |
| Framework | Express.js |
| ORM | Sequelize 6.35+ |
| Authentication | JWT (access + refresh tokens), Passport.js, Google OAuth 2.0 |
| Real-time | Socket.io 4.7+ |
| Validation | Joi, Zod |
| Logging | Winston 3.11+ |
| Rate Limiting | express-rate-limit, rate-limiter-flexible |
| Security | Helmet, bcryptjs, CORS |
| Email | Nodemailer 6.9+ |

### Databases & Infrastructure
| Category | Technology |
|---|---|
| Primary DB | PostgreSQL 16 (one database per service) |
| Cache | Redis 7 |
| Message Queue | RabbitMQ |
| Object Storage | AWS S3 / MinIO (local dev) |

### Frontend (Web)
| Category | Technology |
|---|---|
| Framework | React 18.2+ |
| Language | TypeScript 5.2+ |
| Build Tool | Vite 7.3+ |
| State | Redux Toolkit 2.0+ |
| UI | Material-UI v5.14+, Tailwind CSS 3.3+ |
| Forms | React Hook Form 7.49+, Zod |
| Charts | Recharts 2.10+ |
| HTTP | Axios 1.6+ |
| Real-time | Socket.io-client 4.7+ |
| Router | React Router v6.21+ |
| Testing | Vitest 4.0+, React Testing Library |

### Mobile
| Category | Technology |
|---|---|
| Framework | React Native 0.73+ |
| Platform | Expo 50.0+ |
| State | Redux Toolkit 2.0+, Redux Persist |
| Navigation | React Navigation v6+ |
| UI | React Native Paper, Vector Icons |
| Storage | AsyncStorage, Expo SecureStore |
| Notifications | Expo Notifications |
| Testing | Jest, Detox |

### DevOps & Cloud
| Category | Technology |
|---|---|
| Containerization | Docker, Docker Compose |
| Orchestration | AWS ECS Fargate, Kubernetes (manifests included) |
| IaC | Terraform |
| Cloud | AWS (EC2, RDS, S3, CloudFront, ALB, ECS, ECR) |
| CI/CD | GitLab CI/CD |
| Container Registry | AWS ECR |
| Monitoring | Prometheus + Grafana |

---

## Repository Structure

```
e20-CO528-Mini-Project/
├── README.md                          # This file
├── .gitlab-ci.yml                     # GitLab CI/CD pipeline
│
├── terraform/                         # AWS Infrastructure as Code
│   ├── main.tf                        # Root Terraform config
│   ├── variables.tf                   # Input variables
│   ├── outputs.tf                     # Output values
│   ├── providers.tf                   # AWS provider config
│   └── modules/
│       ├── vpc/                       # VPC, subnets, NAT gateway
│       ├── security-groups/           # Security groups
│       ├── ecr/                       # AWS ECR repositories
│       ├── ecs/                       # ECS Fargate cluster & services
│       ├── rds/                       # PostgreSQL RDS & Redis
│       ├── alb/                       # Application Load Balancer
│       └── s3/                        # S3 buckets
│
├── docs/                              # GitHub Pages site
│   ├── README.md                      # GitHub Pages landing page
│   └── data/index.json                # Project metadata (team, tags)
│
└── code/Mini Project/decp-platform/
    ├── backend/                       # All microservices
    │   ├── api-gateway/               # API Gateway (Port 3000)
    │   ├── auth-service/              # Authentication (Port 3001)
    │   ├── user-service/              # User Management (Port 3002)
    │   ├── feed-service/              # Social Feed (Port 3003)
    │   ├── jobs-service/              # Job Board (Port 3004)
    │   ├── events-service/            # Events (Port 3005)
    │   ├── research-service/          # Research Projects (Port 3006)
    │   ├── messaging-service/         # Chat / Messaging (Port 3007)
    │   ├── notification-service/      # Notifications (Port 3008)
    │   ├── analytics-service/         # Analytics (Port 3009)
    │   ├── shared/                    # Shared utilities & types
    │   ├── docker-compose.yml         # Full stack local dev
    │   ├── docker-compose.dev.yml     # Dev overrides
    │   ├── .env.example               # Environment template
    │   └── init-multiple-databases.sh # DB initialization script
    │
    ├── frontend/                      # React Web App
    │   ├── src/
    │   │   ├── pages/                 # 11+ pages
    │   │   ├── components/            # 28+ components
    │   │   ├── features/              # Redux feature slices
    │   │   ├── store/                 # Redux store
    │   │   ├── services/              # API service layer
    │   │   ├── hooks/                 # Custom React hooks
    │   │   ├── types/                 # TypeScript types
    │   │   └── utils/                 # Utilities
    │   ├── vite.config.ts
    │   ├── tailwind.config.js
    │   ├── Dockerfile
    │   └── .env.example
    │
    ├── mobile/                        # React Native / Expo App
    │   ├── src/                       # 26+ screens
    │   ├── package.json
    │   └── app.json
    │
    ├── infrastructure/                # Additional infra configs
    │   ├── k8s/                       # Kubernetes manifests
    │   ├── nginx/                     # NGINX configuration
    │   ├── monitoring/                # Prometheus & Grafana configs
    │   └── scripts/                   # Deployment helper scripts
    │
    ├── tests/                         # Test suite
    │   ├── unit/
    │   ├── integration/
    │   ├── e2e/                       # Cypress (web), Detox (mobile)
    │   ├── performance/               # k6 load tests
    │   └── security/                  # OWASP tests
    │
    ├── docs/                          # Comprehensive documentation (14+ docs)
    ├── diagrams/                      # Architecture diagrams (C4, DFD, etc.)
    ├── seed.js                        # Database seeding script
    ├── reset-db.js                    # Database reset script
    ├── start.bat                      # Windows one-click launcher
    ├── stop.bat                       # Windows service stopper
    └── CONTRIBUTING.md
```

---

## Microservices Reference

| Service | Port | Database | Key Responsibilities |
|---|---|---|---|
| **API Gateway** | 3000 | — | JWT auth middleware, rate limiting, reverse proxy to all services |
| **Auth Service** | 3001 | decp_auth | Registration, login, JWT tokens, Google OAuth, email verification, password reset |
| **User Service** | 3002 | decp_users | Profiles, connections, education, experience, skills, user search |
| **Feed Service** | 3003 | decp_feed | Posts (text/image/video), likes, comments, shares, infinite scroll |
| **Jobs Service** | 3004 | decp_jobs | Job postings, applications, resume management, recommendations |
| **Events Service** | 3005 | decp_events | Event creation, RSVP, calendar, automated reminders |
| **Research Service** | 3006 | decp_research | Research projects, documents, version control, collaborators |
| **Messaging Service** | 3007 | decp_messaging + Redis | Direct & group chat, real-time Socket.io, message history |
| **Notification Service** | 3008 | decp_notifications | Push, email, in-app notifications; user preference management |
| **Analytics Service** | 3009 | decp_analytics + Redis | Activity tracking, engagement metrics, admin dashboards |

---

## Quick Start

### Prerequisites

- **Node.js** 20+
- **Docker & Docker Compose**
- **Git**

> PostgreSQL and Redis do not need to be installed locally — Docker Compose starts them automatically.

### Clone the repository

```bash
git clone https://github.com/cepdnaclk/e20-CO528-Mini-Project.git
cd e20-CO528-Mini-Project
```

### Start everything with Docker Compose (recommended)

```bash
cd "code/Mini Project/decp-platform/backend"

# Copy and edit environment variables
cp .env.example .env

# Build and start all 10 services + PostgreSQL + Redis
docker-compose up -d

# Start the frontend (separate terminal)
cd ../frontend
npm install
npm run dev
```

| Service | URL |
|---|---|
| Web App | http://localhost:5173 |
| API Gateway | http://localhost:3000 |
| Swagger / API Docs | http://localhost:3000/api/docs |

### Windows one-click launcher

```bat
cd "code\Mini Project\decp-platform"
start.bat
```

This script: checks prerequisites, creates databases, frees ports 3000–3009 and 5173, installs all dependencies, builds all services, opens 11 terminal windows, runs health checks, and launches the browser.

---

## Environment Configuration

Copy the template and fill in your values:

```bash
cp "code/Mini Project/decp-platform/backend/.env.example" \
   "code/Mini Project/decp-platform/backend/.env"
```

### Required variables

| Variable | Description | Example |
|---|---|---|
| `JWT_SECRET` | Access token signing secret | `your-secret-key` |
| `JWT_REFRESH_SECRET` | Refresh token signing secret | `your-refresh-key` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USER` | PostgreSQL user | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `12345` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | *(from Google Console)* |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | *(from Google Console)* |
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP user/email | `you@gmail.com` |
| `SMTP_PASS` | SMTP password / app password | *(Gmail app password)* |
| `VAPID_PUBLIC_KEY` | Web Push public key | *(generated)* |
| `VAPID_PRIVATE_KEY` | Web Push private key | *(generated)* |
| `FRONTEND_URL` | Frontend origin for CORS | `http://localhost:5173` |

### Frontend environment

```bash
cp "code/Mini Project/decp-platform/frontend/.env.example" \
   "code/Mini Project/decp-platform/frontend/.env"
```

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | API Gateway base URL | `http://localhost:3000/api/v1` |

---

## Running in Development

### All services via Docker Compose

```bash
cd "code/Mini Project/decp-platform/backend"
docker-compose up -d          # start
docker-compose logs -f        # follow logs
docker-compose down           # stop
```

### Individual service (TypeScript hot-reload)

```bash
cd "code/Mini Project/decp-platform/backend/auth-service"
npm install
npm run dev       # ts-node-dev with auto-reload
```

Available npm scripts per service:

| Script | Action |
|---|---|
| `npm run dev` | Start with TypeScript hot-reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production build |
| `npm test` | Run Jest unit tests |
| `npm run lint` | ESLint check |

### Frontend

```bash
cd "code/Mini Project/decp-platform/frontend"
npm install
npm run dev       # Vite dev server → http://localhost:5173
npm run build     # Production build
npm run preview   # Preview production build
```

### Mobile

```bash
cd "code/Mini Project/decp-platform/mobile"
npm install
npm start         # Start Expo Metro bundler
npm run android   # Run on Android emulator
npm run ios       # Run on iOS simulator
npm run web       # Run in browser
```

### Database seeding & reset

```bash
cd "code/Mini Project/decp-platform"
node seed.js      # Populate with demo data
node reset-db.js  # Reset to empty state
```

---

## Running in Production (AWS)

### Infrastructure provisioning with Terraform

```bash
cd terraform

# Initialize (uses S3 remote state + DynamoDB lock)
terraform init \
  -backend-config="bucket=${TF_STATE_BUCKET}" \
  -backend-config="key=decp-platform/terraform.tfstate" \
  -backend-config="region=us-east-1" \
  -backend-config="dynamodb_table=${TF_LOCK_TABLE}"

# Plan
terraform plan \
  -var="project_name=decp-platform" \
  -var="environment=prod" \
  -var="db_username=${DB_USERNAME}" \
  -var="db_password=${DB_PASSWORD}" \
  -var="jwt_secret=${JWT_SECRET}" \
  -var="jwt_refresh_secret=${JWT_REFRESH_SECRET}" \
  -out=tfplan

# Apply
terraform apply tfplan
```

### Resources created by Terraform

| Resource | Details |
|---|---|
| VPC | Public + private subnets across 2 AZs, NAT gateway |
| RDS | PostgreSQL 16 on db.t3.micro (configurable) |
| ElastiCache | Redis 7 |
| ECR | 10 container repositories (one per service) |
| ECS Cluster | Fargate — one task per microservice |
| ALB | Application Load Balancer (HTTP/HTTPS) |
| S3 | Media bucket + frontend static hosting |
| CloudWatch | Log groups for all services |
| IAM | ECS task roles and execution roles |

### Key Terraform variables

| Variable | Default | Description |
|---|---|---|
| `aws_region` | `us-east-1` | AWS region |
| `project_name` | `decp-platform` | Used as prefix for all resources |
| `environment` | `dev` | `dev` / `staging` / `prod` |
| `db_instance_class` | `db.t3.micro` | RDS instance type |
| `certificate_arn` | — | ACM certificate ARN for HTTPS |

---

## CI/CD Pipeline

The project uses **GitLab CI/CD** (`.gitlab-ci.yml` in the root).

### Pipeline stages

| Stage | Jobs | Trigger |
|---|---|---|
| `validate` | Terraform fmt + validate | All pushes |
| `build` | Build & push Docker images to ECR (one job per service) | Changed files or `DEPLOY_ALL=true` |
| `deploy-infra` | `terraform plan` (auto) → `terraform apply` (manual) | `deploy` branch |
| `deploy-services` | Force-redeploy ECS services | After infra deploy |
| `deploy-frontend` | Vite build → `aws s3 sync` | After infra deploy |

### Image tagging

```
{AWS_ACCOUNT_ID}.dkr.ecr.{REGION}.amazonaws.com/{PROJECT_NAME}/{SERVICE_NAME}:{COMMIT_SHA}
{AWS_ACCOUNT_ID}.dkr.ecr.{REGION}.amazonaws.com/{PROJECT_NAME}/{SERVICE_NAME}:latest
```

### Required GitLab CI/CD variables

| Variable | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | AWS credentials |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials |
| `AWS_DEFAULT_REGION` | Deployment region |
| `AWS_ACCOUNT_ID` | AWS account number |
| `TF_STATE_BUCKET` | S3 bucket for Terraform state |
| `TF_LOCK_TABLE` | DynamoDB table for state locking |
| `DB_USERNAME` | RDS master username |
| `DB_PASSWORD` | RDS master password |
| `JWT_SECRET` | JWT signing secret |
| `JWT_REFRESH_SECRET` | JWT refresh signing secret |

---

## API Reference

**Base URL (development):** `http://localhost:3000/api/v1`
**Base URL (production):** `https://api.decp.eng.pdn.ac.lk/api/v1`
**Interactive docs:** `http://localhost:3000/api/docs` (Swagger UI)

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register new user |
| `POST` | `/auth/login` | Login, receive JWT tokens |
| `POST` | `/auth/logout` | Invalidate refresh token |
| `POST` | `/auth/refresh-token` | Get new access token |
| `POST` | `/auth/forgot-password` | Send password reset email |
| `POST` | `/auth/reset-password` | Reset with token |
| `POST` | `/auth/verify-email` | Verify email address |
| `POST` | `/auth/google` | Google OAuth login |

### Users

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/users/{id}` | Get user profile |
| `PUT` | `/users/{id}` | Update own profile |
| `GET` | `/users/{id}/connections` | List connections |
| `POST` | `/users/{id}/connect` | Send connection request |
| `GET` | `/users/search` | Search users |

### Feed

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/feed` | Get paginated news feed |
| `POST` | `/feed/posts` | Create post |
| `GET` | `/feed/posts/{id}` | Get single post |
| `POST` | `/feed/posts/{id}/like` | Like / unlike post |
| `POST` | `/feed/posts/{id}/comment` | Add comment |

### Jobs

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/jobs` | List job postings |
| `POST` | `/jobs` | Create job posting |
| `GET` | `/jobs/{id}` | Get job details |
| `POST` | `/jobs/{id}/apply` | Submit application |
| `GET` | `/jobs/recommendations` | Personalized recommendations |

### Events

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/events` | List events |
| `POST` | `/events` | Create event |
| `GET` | `/events/{id}` | Get event details |
| `POST` | `/events/{id}/rsvp` | RSVP to event |

### Research

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/research` | List research projects |
| `POST` | `/research` | Create project |
| `GET` | `/research/{id}` | Get project |
| `POST` | `/research/{id}/invite` | Invite collaborator |

### Messaging (REST + WebSocket)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/messaging/conversations` | List conversations |
| `POST` | `/messaging/conversations` | Create conversation |
| `GET` | `/messaging/conversations/{id}/messages` | Message history |
| WS | `socket.io` | Real-time message delivery |

### Notifications

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/notifications` | List notifications |
| `PUT` | `/notifications/{id}` | Mark as read |
| `POST` | `/notifications/preferences` | Update preferences |

### Analytics

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/analytics/dashboard` | Admin dashboard data |
| `GET` | `/analytics/popular-posts` | Trending content |
| `GET` | `/analytics/job-stats` | Job market statistics |
| `GET` | `/analytics/user-activity` | User activity metrics |

### Health checks

| Endpoint | Description |
|---|---|
| `GET /health` | Per-service health check |
| `GET /api/v1/health` | API Gateway health |

---

## Database Design

The platform uses **9 isolated PostgreSQL databases** — one per service — following the database-per-service microservices pattern.

| Database | Service | Key Tables |
|---|---|---|
| `decp_auth` | Auth Service | `users`, `refresh_tokens` |
| `decp_users` | User Service | `profiles`, `connections`, `education`, `experience`, `skills` |
| `decp_feed` | Feed Service | `posts`, `comments`, `likes`, `shares` |
| `decp_jobs` | Jobs Service | `jobs`, `applications`, `job_recommendations` |
| `decp_events` | Events Service | `events`, `rsvps`, `event_reminders` |
| `decp_research` | Research Service | `research_projects`, `documents`, `collaborators` |
| `decp_messaging` | Messaging Service | `conversations`, `messages`, `participants` |
| `decp_notifications` | Notification Service | `notifications`, `notification_preferences` |
| `decp_analytics` | Analytics Service | `activity_logs`, `user_metrics`, `engagement_stats` |

**Connection details (local Docker):**

| Setting | Value |
|---|---|
| Host | `localhost` |
| Port | `5433` (external) / `5432` (internal) |
| User | `postgres` |
| Password | `12345` |

Databases are initialized automatically by `init-multiple-databases.sh` on first Docker Compose start. On AWS, a dedicated ECS `db_init` task runs the initialization SQL on deploy.

Full schema is documented in [`docs/04-DATABASE_SCHEMA.md`](code/Mini%20Project/decp-platform/docs/04-DATABASE_SCHEMA.md).

---

## Testing

### Test structure

```
tests/
├── unit/          # Jest unit tests (services, controllers, utilities)
├── integration/   # API integration tests
├── e2e/           # Cypress (web), Detox (mobile)
├── performance/   # k6 load & stress tests
└── security/      # OWASP Top 10 tests
```

### Running tests

```bash
# Backend — individual service
cd "code/Mini Project/decp-platform/backend/auth-service"
npm test

# Frontend
cd "code/Mini Project/decp-platform/frontend"
npm run test            # Vitest
npm run test:watch      # Watch mode
npm run test:ui         # Vitest UI
npm run coverage        # Coverage report

# Mobile
cd "code/Mini Project/decp-platform/mobile"
npm test

# Windows — run all backend tests
cd "code/Mini Project/decp-platform"
test.bat
```

### Coverage targets

| Layer | Target |
|---|---|
| Unit tests | 85%+ |
| Integration tests | 20+ scenarios |
| E2E tests | 15+ critical user flows |
| Performance | < 200ms p95 response time under 1,000 concurrent users |

---

## Security

| Mechanism | Implementation |
|---|---|
| Authentication | JWT access tokens (15 min) + refresh tokens (7 days) |
| Authorization | Role-based access control (RBAC) |
| Transport | HTTPS/TLS on all production endpoints |
| Secrets | AWS Secrets Manager / environment variables |
| SQL Injection | Sequelize parameterized queries |
| XSS | Helmet CSP headers, output encoding |
| CSRF | SameSite cookies, token validation |
| Rate Limiting | express-rate-limit per IP and per user |
| Dependency scanning | npm audit in CI pipeline |
| OWASP Top 10 | Dedicated security test suite |

Full security documentation: [`docs/07-SECURITY.md`](code/Mini%20Project/decp-platform/docs/07-SECURITY.md)

---

## Performance Targets

| Metric | Target |
|---|---|
| API response time (p95) | < 200 ms |
| Page load time | < 2 s |
| Concurrent users | 10,000+ |
| Availability | 99.9% uptime |
| Database query time | < 50 ms |

---

## Documentation

Comprehensive documentation lives in [`code/Mini Project/decp-platform/docs/`](code/Mini%20Project/decp-platform/docs/).

| Document | Description |
|---|---|
| [01-PROJECT_OVERVIEW.md](code/Mini%20Project/decp-platform/docs/01-PROJECT_OVERVIEW.md) | Executive summary, goals, stakeholders |
| [02-ARCHITECTURE.md](code/Mini%20Project/decp-platform/docs/02-ARCHITECTURE.md) | Architecture patterns, service design decisions |
| [03-API_DOCUMENTATION.md](code/Mini%20Project/decp-platform/docs/03-API_DOCUMENTATION.md) | Complete API reference with request/response examples |
| [04-DATABASE_SCHEMA.md](code/Mini%20Project/decp-platform/docs/04-DATABASE_SCHEMA.md) | Entity-relationship diagrams and table definitions |
| [05-DEVELOPMENT_GUIDE.md](code/Mini%20Project/decp-platform/docs/05-DEVELOPMENT_GUIDE.md) | Local development setup and workflow |
| [06-DEPLOYMENT_GUIDE.md](code/Mini%20Project/decp-platform/docs/06-DEPLOYMENT_GUIDE.md) | Step-by-step production deployment |
| [07-SECURITY.md](code/Mini%20Project/decp-platform/docs/07-SECURITY.md) | Security architecture and controls |
| [10-RESEARCH_FINDINGS.md](code/Mini%20Project/decp-platform/docs/10-RESEARCH_FINDINGS.md) | Platform research and analysis |
| [openapi/](code/Mini%20Project/decp-platform/docs/openapi/) | OpenAPI 3.0 / Swagger spec files |

Architecture diagrams (C4 model, DFD, deployment, security) are in [`diagrams/`](code/Mini%20Project/decp-platform/diagrams/).

---

## Team

> Update this section with actual team member details.

| Name | E-Number | Email |
|---|---|---|
| Team Member 1 | E/20/xxx | email@eng.pdn.ac.lk |
| Team Member 2 | E/20/xxx | email@eng.pdn.ac.lk |
| Team Member 3 | E/20/xxx | email@eng.pdn.ac.lk |

**Supervisors:**

| Name | Email |
|---|---|
| Dr. Supervisor 1 | email@eng.pdn.ac.lk |
| Supervisor 2 | email@eng.pdn.ac.lk |

---

## Acknowledgements

- Department of Computer Engineering, University of Peradeniya
- CO528 Applied Software Architecture course
- All contributors, reviewers, and testers

---

## License


---

*Department of Computer Engineering — University of Peradeniya — CO528 Mini Project*
