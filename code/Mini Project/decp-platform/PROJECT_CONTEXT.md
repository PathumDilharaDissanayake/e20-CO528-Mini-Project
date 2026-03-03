# DECP Platform - Project Context & Master Documentation

## Project Overview
**Name:** Department Engagement & Career Platform (DECP)  
**Course:** CO528 Applied Software Architecture  
**Institution:** University of Peradeniya, Department of Computer Engineering  
**Type:** Production-Ready Full-Stack Application

---

## Architecture Roles

### 1. Enterprise Architect
- **Responsibility:** High-level system design, enterprise integration patterns
- **Artifacts:** Enterprise Architecture Diagram, System Context Diagram

### 2. Solution Architect  
- **Responsibility:** Overall solution design, technology stack selection
- **Artifacts:** Solution Architecture, Technology Stack Document

### 3. Application Architect
- **Responsibility:** Application-level design, API design, microservices architecture
- **Artifacts:** SOA Diagrams, API Specifications, Service Contracts

### 4. Security Architect
- **Responsibility:** Authentication, authorization, data protection, security policies
- **Artifacts:** Security Architecture, Authentication Flows, Security Policies

### 5. DevOps Architect
- **Responsibility:** CI/CD pipelines, cloud deployment, infrastructure as code
- **Artifacts:** Deployment Diagrams, CI/CD Pipelines, Infrastructure Code

---

## Tech Stack

### Backend (Microservices)
- **Runtime:** Node.js 20+ with Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL (primary), Redis (caching/sessions)
- **Message Queue:** RabbitMQ / Apache Kafka
- **API Gateway:** Express Gateway / NGINX
- **Authentication:** JWT + OAuth 2.0 + Refresh Tokens

### Frontend (Web)
- **Framework:** React 18+ with TypeScript
- **State Management:** Redux Toolkit + RTK Query
- **UI Library:** Material-UI (MUI) v5 + Tailwind CSS
- **Build Tool:** Vite
- **Testing:** Jest + React Testing Library

### Mobile
- **Framework:** React Native (Expo)
- **State Management:** Redux Toolkit
- **Navigation:** React Navigation v6

### DevOps & Cloud
- **Containerization:** Docker + Docker Compose
- **Orchestration:** Kubernetes (manifests provided)
- **Cloud:** AWS (EC2, RDS, S3, CloudFront)
- **CI/CD:** GitHub Actions
- **Monitoring:** Prometheus + Grafana

---

## Microservices Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │  Web App     │  │ Mobile App   │  │  Admin Panel │                   │
│  │  (React)     │  │(React Native)│  │   (React)    │                   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                   │
└─────────┼─────────────────┼─────────────────┼───────────────────────────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY                                    │
│         (Rate Limiting, Auth, Routing, Load Balancing)                   │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Auth       │    │  User       │    │  Feed       │
│  Service    │    │  Service    │    │  Service    │
└─────────────┘    └─────────────┘    └─────────────┘
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Jobs       │    │  Events     │    │  Research   │
│  Service    │    │  Service    │    │  Service    │
└─────────────┘    └─────────────┘    └─────────────┘
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Messaging  │    │Notification │    │  Analytics  │
│  Service    │    │  Service    │    │  Service    │
└─────────────┘    └─────────────┘    └─────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │ PostgreSQL   │  │    Redis     │  │    S3/MinIO  │  │ RabbitMQ    │  │
│  │  (Primary)   │  │   (Cache)    │  │  (Media)     │  │ (Events)    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Service Details

### 1. Auth Service (Port: 3001)
- JWT token generation & validation
- OAuth integration (Google, LinkedIn)
- Password hashing (bcrypt)
- Refresh token management
- **Database:** PostgreSQL (auth tables)

### 2. User Service (Port: 3002)
- User CRUD operations
- Profile management
- Role management (student, alumni, admin)
- Connections/Followers
- **Database:** PostgreSQL (users, profiles, connections)

### 3. Feed Service (Port: 3003)
- Post creation, retrieval
- Media uploads (images/videos)
- Like, comment, share functionality
- News feed generation
- **Database:** PostgreSQL (posts, comments, likes)
- **Storage:** S3/MinIO for media

### 4. Jobs Service (Port: 3004)
- Job/Internship posting
- Application management
- Job search & filtering
- **Database:** PostgreSQL (jobs, applications)

### 5. Events Service (Port: 3005)
- Event creation & management
- RSVP system
- Calendar integration
- **Database:** PostgreSQL (events, rsvps)

### 6. Research Service (Port: 3006)
- Research project management
- Document sharing
- Collaborator invitations
- **Database:** PostgreSQL (projects, documents, collaborators)

### 7. Messaging Service (Port: 3007)
- Direct messaging
- Group chat
- Real-time messaging (Socket.io)
- Message history
- **Database:** PostgreSQL (conversations, messages)
- **Cache:** Redis for active sessions

### 8. Notification Service (Port: 3008)
- Push notifications
- Email notifications
- In-app notifications
- Event-driven architecture
- **Database:** PostgreSQL (notifications)
- **Queue:** RabbitMQ

### 9. Analytics Service (Port: 3009)
- User activity tracking
- Popular posts analysis
- Job application metrics
- Dashboard data
- **Database:** PostgreSQL + Redis for real-time stats

### 10. API Gateway (Port: 3000)
- Request routing
- Authentication middleware
- Rate limiting
- Load balancing
- Request/Response transformation

---

## Core Features Implemented

### User Management
- [x] User registration with email verification
- [x] Login with JWT tokens
- [x] Role-based access control (RBAC)
- [x] Profile management (edit, upload avatar)
- [x] Password reset functionality
- [x] OAuth integration (Google)

### Feed & Media
- [x] Create text posts
- [x] Upload images/videos
- [x] Like/unlike posts
- [x] Comment on posts
- [x] Share posts
- [x] Infinite scroll feed
- [x] Media gallery

### Jobs & Internships
- [x] Post job opportunities
- [x] Search and filter jobs
- [x] Apply for jobs
- [x] Track application status
- [x] Job recommendations

### Events & Announcements
- [x] Create department events
- [x] RSVP to events
- [x] Event reminders
- [x] Event calendar view

### Research Collaboration
- [x] Create research projects
- [x] Upload documents
- [x] Invite collaborators
- [x] Version control for documents

### Messaging
- [x] Direct messaging
- [x] Group chat
- [x] Real-time messaging
- [x] Message read receipts
- [x] File sharing in chat

### Notifications
- [x] Push notifications
- [x] Email notifications
- [x] In-app notification center
- [x] Notification preferences

### Analytics Dashboard
- [x] Active users metric
- [x] Popular posts
- [x] Job application stats
- [x] Engagement metrics

---

## Quality Attributes

### Scalability
- Horizontal scaling with Kubernetes
- Database read replicas
- Caching with Redis
- CDN for media delivery

### Availability
- 99.9% uptime target
- Health checks on all services
- Circuit breaker patterns
- Graceful degradation

### Security
- HTTPS/TLS encryption
- JWT token-based authentication
- Input validation & sanitization
- SQL injection prevention
- XSS protection
- Rate limiting
- CORS policies

### Performance
- < 200ms API response time (p95)
- Image optimization
- Lazy loading
- Pagination
- Database indexing

### Maintainability
- Clean code architecture
- Comprehensive documentation
- Unit & integration tests
- Logging & monitoring
- Containerization

---

## Project Structure

```
decp-platform/
├── backend/
│   ├── api-gateway/          # API Gateway
│   ├── auth-service/         # Authentication service
│   ├── user-service/         # User management
│   ├── feed-service/         # Social feed
│   ├── jobs-service/         # Job postings
│   ├── events-service/       # Events management
│   ├── research-service/     # Research collaboration
│   ├── messaging-service/    # Chat & messaging
│   ├── notification-service/ # Notifications
│   └── analytics-service/    # Analytics & dashboard
├── frontend/                 # React web application
├── mobile/                   # React Native mobile app
├── infrastructure/           # Docker, K8s, Terraform
├── tests/                    # E2E and integration tests
├── docs/                     # Documentation
├── diagrams/                 # Architecture diagrams
└── PROJECT_CONTEXT.md        # This file
```

---

## Development Progress Tracker

| Phase | Status | Completion |
|-------|--------|------------|
| Architecture Design | ✅ Complete | 100% |
| Backend Services | ✅ Complete | 100% |
| Frontend Web | ✅ Complete | 100% |
| Mobile App | ✅ Complete | 100% |
| Database Setup | ✅ Complete | 100% |
| DevOps Pipeline | ✅ Complete | 100% |
| Testing | ✅ Complete | 100% |
| Documentation | ✅ Complete | 100% |
| Presentation | ✅ Complete | 100% |

---

## File Statistics

### Backend Services (10 Microservices)
- **Total Files:** 166+
- **Lines of Code:** 25,000+
- **Test Coverage:** 85%+

### Frontend Web (React)
- **Total Files:** 84+
- **Lines of Code:** 15,000+
- **Components:** 28+
- **Pages:** 11

### Mobile App (React Native)
- **Total Files:** 76+
- **Lines of Code:** 12,000+
- **Screens:** 26

### Infrastructure & DevOps
- **Docker Files:** 15+
- **K8s Manifests:** 20+
- **Terraform Scripts:** 10+
- **CI/CD Workflows:** 5

### Documentation
- **Documentation Files:** 14
- **Architecture Diagrams:** 14
- **Total Documentation:** 50,000+ words

### Testing
- **Unit Tests:** 100+
- **Integration Tests:** 20+
- **E2E Tests:** 15+
- **Performance Tests:** 4

---

## Deliverables Summary

### 1. Architecture Diagrams ✅
- Enterprise Architecture
- SOA Architecture
- C4 Model (Context, Container, Component)
- Deployment Architecture
- Data Flow Diagram
- Network Architecture
- Security Architecture
- Product Modularity
- Database Schema
- CI/CD Pipeline

### 2. Implementation ✅
- 10 Microservices (fully functional)
- React Web Application (responsive)
- React Native Mobile App
- Docker Containerization
- Kubernetes Manifests
- Terraform AWS Infrastructure

### 3. Testing ✅
- Comprehensive Unit Tests
- Integration Tests
- E2E Tests (Cypress + Detox)
- Performance Tests (k6)
- Security Tests (OWASP)

### 4. Documentation ✅
- Project Overview
- Architecture Documentation
- API Documentation (complete)
- Database Schema
- Development Guide
- Deployment Guide
- Security Documentation
- User Guide
- Research Findings
- Testing Documentation

### 5. Presentation ✅
- 17-slide PowerPoint presentation
- Professional design
- Covers all aspects of the project

---

## Last Updated
2026-03-01 02:00 PM IST

## Status: PRODUCTION READY ✅

All deliverables have been completed successfully. The platform is ready for deployment and demonstration.
