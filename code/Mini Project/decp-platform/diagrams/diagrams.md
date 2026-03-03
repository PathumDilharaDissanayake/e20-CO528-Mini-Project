# DECP Platform - Architecture Diagrams Index

This directory contains comprehensive architecture diagrams for the **Department Engagement & Career Platform (DECP)** created using Mermaid syntax.

## Overview

The DECP Platform is a comprehensive web and mobile application designed for university departments to facilitate engagement between current students and alumni. The platform supports features like social networking, job postings, event management, research collaboration, and real-time messaging.

---

## Diagram List

### 1. Enterprise Architecture Diagram
**File:** `enterprise-architecture.mmd`

**Description:** High-level view of the enterprise showing business processes, department workflows, user roles (students, alumni, admin, faculty), system boundaries, and external integrations.

**Key Elements:**
- Business processes (User Onboarding, Content Moderation, Job Matching, Event Management, Research Collaboration)
- Department workflows (Student Registration, Alumni Engagement, Career Services, Research Project)
- User personas and roles
- External system integrations (Email, Push notifications, Cloud storage, LinkedIn, GitHub)

---

### 2. Service-Oriented Architecture (SOA) Diagram
**File:** `soa-architecture.mmd`

**Description:** Complete microservices architecture showing all 10 services, API Gateway, service interactions, message flow, and API endpoints.

**Key Elements:**
- **10 Microservices:**
  - User Service (Port 8001) - User Management & Auth
  - Feed Service (Port 8002) - Posts & Media
  - Job Service (Port 8003) - Jobs & Internships
  - Event Service (Port 8004) - Events & RSVP
  - Research Service (Port 8005) - Projects & Documents
  - Message Service (Port 8006) - Chat & Notifications
  - Notification Service (Port 8007) - Email & Push
  - Analytics Service (Port 8008) - Metrics & Reports
  - Media Service (Port 8009) - File Upload & Storage
  - Search Service (Port 8010) - Full-text Search
- API Gateway with routing
- Message Queue (RabbitMQ/AWS SQS)
- Databases (PostgreSQL, MongoDB, Redis, Elasticsearch)
- External service integrations

---

### 3. System Context Diagram (C4 Level 1)
**File:** `c4-context.mmd`

**Description:** C4 Model Level 1 diagram showing the system as a central box surrounded by users and external systems. Provides a high-level view of system scope and responsibilities.

**Key Elements:**
- **Users:** Students, Alumni, Administrators, Faculty Members
- **System:** DECP Platform
- **External Systems:**
  - Email System (SendGrid/AWS SES)
  - Push Notification System (Firebase)
  - Cloud Storage (AWS S3)
  - LinkedIn API
  - Calendar System (Google/Outlook)

---

### 4. Container Diagram (C4 Level 2)
**File:** `c4-container.mmd`

**Description:** C4 Model Level 2 diagram showing the high-level technology choices and containers (applications, databases, etc.) within the system.

**Key Elements:**
- Web Application (React.js)
- Mobile Application (React Native)
- Admin Dashboard (React.js)
- API Gateway (Kong/AWS API Gateway)
- WebSocket Server (Node.js/Socket.io)
- All 10 microservices with technology stacks
- Message Broker (RabbitMQ)
- Data Layer (PostgreSQL, MongoDB, Redis, Elasticsearch, S3)

---

### 5. Component Diagram (C4 Level 3) - API Gateway
**File:** `c4-component-gateway.mmd`

**Description:** C4 Model Level 3 diagram showing the internal components of the API Gateway.

**Key Elements:**
- Request Entry Point (Nginx/HAProxy)
- **Middleware Pipeline:**
  - Authentication Middleware (JWT/OAuth)
  - Rate Limiter (Token bucket algorithm)
  - CORS Middleware
  - Request Validator
- **Routing Layer:**
  - API Router
  - Service Registry (Consul/Eureka)
  - Load Balancer (Round Robin with circuit breaker)
- **Response Processing:**
  - Response Transformer
  - Response Cache (Redis)
  - Response Compressor (Gzip/Brotli)
- **Observability:**
  - Request Logger
  - Metrics Collector (Prometheus)
  - Distributed Tracer (Jaeger/Zipkin)

---

### 6. Deployment Architecture
**File:** `deployment-architecture.mmd`

**Description:** AWS Cloud infrastructure diagram showing the complete deployment architecture including Kubernetes cluster, databases, and AWS services.

**Key Elements:**
- **AWS CloudFront (CDN)** with WAF
- **VPC Structure:**
  - Public Subnets (ALB, NAT Gateway, Bastion)
  - Private App Subnets (EKS Cluster with 3 node groups)
  - Private Data Subnets (RDS, ElastiCache, DocumentDB, MQ)
- **Amazon EKS Cluster** with Kubernetes
- **Data Layer:**
  - Amazon RDS (PostgreSQL) with Multi-AZ
  - Amazon DocumentDB (MongoDB)
  - Amazon ElastiCache (Redis)
  - Amazon OpenSearch (Elasticsearch)
  - Amazon MQ (RabbitMQ)
- **Storage:** S3 Buckets (Media, Logs, Backups)
- **AWS Services:** Cognito, SES, SNS, CloudWatch, X-Ray

---

### 7. Data Flow Diagram
**File:** `data-flow.mmd`

**Description:** Shows the flow of data through the system for key user scenarios including registration, post creation, job application, and real-time messaging.

**Key Flows:**
1. **User Registration Flow:**
   - Submit registration → Validate → Hash password → Create record → Generate JWT → Send welcome email

2. **Post Creation Flow:**
   - Create post → Auth check → Upload media → Save post → Update cache → Publish event → Notify followers

3. **Job Application Flow:**
   - View job → Submit application → Validate profile → Upload resume → Create application → Update stats → Notify employer

4. **Real-time Messaging Flow:**
   - Connect WebSocket → Authenticate → Join room → Send message → Validate & save → Broadcast → Push to offline users

---

### 8. Network Architecture
**File:** `network-architecture.mmd`

**Description:** AWS VPC network topology showing subnets, security groups, gateways, and traffic flow.

**Key Elements:**
- **VPC:** decp-production-vpc (10.0.0.0/16)
- **Subnets:**
  - Public Subnets (AZ A & B) - 10.0.1.0/24, 10.0.2.0/24
  - Private App Subnets (AZ A & B) - 10.0.10.0/24, 10.0.11.0/24
  - Private Data Subnets (AZ A & B) - 10.0.20.0/24, 10.0.21.0/24
- **Security Groups:**
  - ALB Security Group (Ports 80, 443)
  - App Security Group (Port 8080)
  - Database Security Group (Ports 5432, 27017, 6379)
  - Bastion Security Group (Port 22)
- **Network Components:**
  - Internet Gateway
  - NAT Gateways (AZ A & B)
  - Application Load Balancer
  - Bastion Hosts

---

### 9. Security Architecture
**File:** `security-architecture.mmd`

**Description:** Comprehensive security architecture showing authentication flow, authorization, encryption, and security controls.

**Key Elements:**
- **Client Security:** HTTPS/TLS 1.3, Secure Storage, Input Validation
- **Edge Security:** AWS WAF, AWS Shield (DDoS), CloudFront with signed URLs
- **API Security:** Rate Limiting, RBAC, Request Signing, JWT Validation
- **Authentication Flow:** OAuth 2.0/OIDC, JWT Service, Refresh Tokens, MFA
- **Service-to-Service Security:** mTLS (Istio), Service Tokens, Network Policies
- **Data Security:**
  - Encryption at Rest (AES-256 for DB, SSE-S3/SSE-KMS for S3)
  - Encryption in Transit (TLS 1.3)
  - AWS Secrets Manager
- **RBAC:** Student, Alumni, Admin, Faculty roles with permissions
- **Audit & Compliance:** CloudTrail, Config, Security Hub, GuardDuty

---

### 10. Product Modularity Diagram
**File:** `product-modularity.mmd`

**Description:** Shows the modular architecture with core modules (must-have) and optional modules (nice-to-have), including dependencies and extension points.

**Key Elements:**
- **Core Modules (Required):**
  - User Management
  - Feed & Posts
  - Jobs
  - Notifications

- **Optional Modules (Plug-in):**
  - Events
  - Research Collaboration
  - Messaging
  - Analytics Dashboard
  - Advanced Media
  - AI Features (Beta)

- **Extension Points:**
  - Custom Auth Provider
  - Third-party Integrations
  - Custom Notification Channels
  - Analytics Export Plugins
  - Custom Feed Algorithms
  - External Storage Adapters

- **Shared Libraries:**
  - Common Utils
  - Database Models
  - API Contracts
  - Authentication SDK
  - Logging & Monitoring

---

### 11. Database Schema Diagram
**File:** `database-schema.mmd`

**Description:** Entity-Relationship Diagram (ERD) showing all database tables, their fields, and relationships.

**Key Entities:**
- **User Module:** users, user_profiles, user_roles, sessions, password_resets
- **Feed Module:** posts, post_likes, post_comments, post_shares, user_connections
- **Job Module:** jobs, job_applications, saved_jobs
- **Event Module:** events, event_attendees
- **Research Module:** research_projects, research_collaborators, research_documents
- **Messaging Module:** conversations, conversation_participants, messages
- **Notification Module:** notifications, notification_preferences
- **Analytics Module:** user_activities, daily_metrics

---

### 12. CI/CD Pipeline Diagram
**File:** `cicd-pipeline.mmd`

**Description:** GitHub Actions workflow showing the complete CI/CD pipeline with build, test, and deployment stages.

**Key Elements:**
- **Branch Strategy:** main, develop, feature/*, hotfix/*, release/*
- **CI Pipeline:**
  - Build Stage (Checkout, Setup, Dependencies, Lint, Type Check)
  - Test Stage (Unit Tests, Integration Tests, Code Coverage, Security Scan)
  - Artifact Stage (Build App, Build Docker, Scan Images, Push Registry)
- **CD Pipeline:**
  - Development Deployment (Dev K8s, Smoke Tests)
  - Staging Deployment (Staging K8s, E2E Tests, Performance Tests)
  - Production Deployment (Manual Approval, Blue-Green Deployment, Monitoring)
- **Environments:** Dev, Staging, Production
- **Observability:** Monitoring (Prometheus/Grafana), Logging (ELK/CloudWatch), Alerting (PagerDuty/Slack)

---

## File Summary

| # | Diagram | File | Lines |
|---|---------|------|-------|
| 1 | Enterprise Architecture | `enterprise-architecture.mmd` | ~130 |
| 2 | SOA Architecture | `soa-architecture.mmd` | ~180 |
| 3 | C4 Context (Level 1) | `c4-context.mmd` | ~100 |
| 4 | C4 Container (Level 2) | `c4-container.mmd` | ~250 |
| 5 | C4 Component - Gateway (Level 3) | `c4-component-gateway.mmd` | ~180 |
| 6 | Deployment Architecture | `deployment-architecture.mmd` | ~200 |
| 7 | Data Flow Diagram | `data-flow.mmd` | ~200 |
| 8 | Network Architecture | `network-architecture.mmd` | ~190 |
| 9 | Security Architecture | `security-architecture.mmd` | ~180 |
| 10 | Product Modularity | `product-modularity.mmd` | ~170 |
| 11 | Database Schema | `database-schema.mmd` | ~350 |
| 12 | CI/CD Pipeline | `cicd-pipeline.mmd` | ~220 |

**Total:** 12 diagrams, ~2,350 lines of Mermaid syntax

---

## Standards Used

- **C4 Model** for system architecture (Levels 1-3)
- **UML** notation for class diagrams and relationships
- **Flowcharts** for process flows and data flows
- **ER Diagrams** for database schema
- **AWS Architecture Icons** for cloud deployment diagrams
- **Mermaid.js** syntax for all diagrams

---

## Usage Notes

These diagrams are designed to be viewed using:
1. **Mermaid Live Editor:** https://mermaid.live
2. **GitHub/GitLab:** Native Mermaid rendering
3. **VS Code:** With Mermaid extension
4. **Documentation tools:** MkDocs, Docusaurus, etc.

For PNG/SVG export, use the Mermaid CLI or online editors.
