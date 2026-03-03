# DECP Platform — Multi-Agent Development Team
**Version**: 1.0.0 | **Created**: 2026-03-03 | **Status**: Active

---

## Overview

This document defines the complete multi-agent software development team tasked with transforming the DECP platform from a functional mini-project into a fully production-ready enterprise system. Every agent has a precise charter, owns specific deliverables, follows defined inter-agent protocols, and operates within a structured workflow.

---

## Agent Registry

| ID | Agent Name | Role | Status |
|----|-----------|------|--------|
| A-00 | Communication & Synchronization Agent | Orchestrator | Active |
| A-01 | Chief Architect Agent | Architecture | Active |
| A-02 | Frontend Review & UX Architect Agent | UI/UX | Active |
| A-03 | Backend Review & API Architect Agent | Backend | Active |
| A-04 | Context Management Agent | Documentation | Active |
| A-05 | Frontend Implementation Agent | Dev | Active |
| A-06 | Backend Implementation Agent | Dev | Active |
| A-07 | Database Optimization Agent | Dev | Active |
| A-08 | Security & Authentication Agent | Dev | Active |
| A-09 | DevOps & Deployment Agent | Ops | Active |
| A-10 | QA Agent | Quality | Active |
| A-11 | Regression Testing Agent | Quality | Active |
| A-12 | Production Readiness Approval Agent | Gate | Active |

---

## Agent Charters

---

### A-00 — Communication & Synchronization Agent

**Role**: Orchestrator. Owns the master execution timeline, resolves blocking conflicts, prevents context drift, and ensures implementation consistency across all agents.

**Responsibilities**:
- Maintains the canonical inter-agent message bus (`docs/AGENT_CHANGELOG.md`)
- Issues Go/No-Go signals between workflow phases
- Reviews all agent deliverables for integration conflicts before merge
- Escalates architectural contradictions to A-01
- Produces weekly synchronization reports

**Inputs**: All agent status reports, PR descriptions, architecture decisions
**Outputs**: Synchronization reports, phase transition signals, conflict resolution directives
**Owns**: `docs/AGENT_CHANGELOG.md`, `docs/SYNC_REPORT.md`
**Escalation**: A-01 for architecture, A-08 for security, A-12 for production

---

### A-01 — Chief Architect Agent

**Role**: System architect. Owns the canonical system design — all other agents must align their work to the patterns and boundaries defined by A-01.

**Responsibilities**:
- Defines service boundaries and communication contracts
- Maintains the authoritative data flow and control flow diagrams
- Reviews all cross-service API changes before implementation
- Approves technology choices above the library level
- Identifies and documents architectural anti-patterns for remediation
- Defines scalability strategy (horizontal scaling boundaries per service)

**Architectural Decisions Log**: `docs/ARCHITECTURE_PLAN.md`
**Key Artifacts**:
- System context diagram (C4 Level 1)
- Container diagram (C4 Level 2)
- Service interaction matrix
- Data flow documentation
- API contract specifications
- Non-functional requirements baseline

**Owns**: `docs/ARCHITECTURE_PLAN.md`, `docs/ADR/` (Architecture Decision Records)
**Authority**: Veto power on all cross-service API design decisions

---

### A-02 — Frontend Review & UX Architect Agent

**Role**: UI/UX architect. Defines the design system contract and enforces it across all frontend work.

**Responsibilities**:
- Audits all React components for: layout correctness, accessibility (WCAG 2.1 AA), responsiveness, consistency
- Defines the canonical design token set (colours, typography, spacing, elevation)
- Identifies and prioritises UX issues by severity
- Reviews all new UI components before merge
- Enforces Lighthouse score targets: Performance ≥ 85, Accessibility ≥ 90, Best Practices ≥ 90, SEO ≥ 80

**Review Checklist Items**:
- Component decomposition (SRP — no component > 400 lines)
- Prop drilling depth (max 2 levels before Context or Redux)
- Loading state completeness (every async operation)
- Error state completeness (every async operation)
- Empty state completeness
- Mobile responsiveness (320px–1920px)
- Keyboard navigation support
- ARIA labels on all interactive elements
- Colour contrast ratios (WCAG AA)
- Animation performance (no layout-thrashing)

**Owns**: `docs/FRONTEND_ARCHITECTURE.md`, `frontend/src/design-tokens/`

---

### A-03 — Backend Review & API Architect Agent

**Role**: Backend architect. Owns the API contract and enforces consistent patterns across all 9 microservices.

**Responsibilities**:
- Audits all controllers for: validation, error handling, security, performance
- Defines canonical response envelope schema
- Reviews all new endpoints before implementation
- Enforces API design standards (REST, versioning, idempotency)
- Identifies N+1 queries, missing indexes, unprotected endpoints
- Defines service-to-service auth protocol

**API Design Standards**:
```
Response Envelope:
  {
    "success": boolean,
    "message": string,
    "data": T | null,         // null on error
    "meta": {                  // on paginated responses
      "page": number,
      "limit": number,
      "total": number,
      "totalPages": number,
      "hasNext": boolean,
      "hasPrev": boolean,
      "nextCursor"?: string    // for cursor-based pagination
    },
    "errors": FieldError[]     // on validation errors only
  }

HTTP Status Codes:
  200 OK           — successful GET / PUT / PATCH
  201 Created      — successful POST (creation)
  204 No Content   — successful DELETE
  400 Bad Request  — validation failure
  401 Unauthorized — missing/invalid JWT
  403 Forbidden    — valid JWT, insufficient permissions
  404 Not Found    — resource does not exist
  409 Conflict     — duplicate resource
  422 Unprocessable — business rule violation
  429 Too Many Requests — rate limit exceeded
  500 Internal Server Error — unexpected server error
  503 Service Unavailable — downstream service failure
```

**Owns**: `docs/API_STANDARDS.md`, `docs/openapi/`

---

### A-04 — Context Management Agent

**Role**: Documentation custodian. Maintains living documentation that reflects the actual implemented state of the system.

**Responsibilities**:
- Keeps `docs/` directory up to date after every implementation phase
- Generates and updates OpenAPI spec from controller changes
- Maintains the CHANGELOG with proper semantic versioning
- Updates ADR log with every architectural decision
- Ensures README accuracy
- Archives superseded decisions with rationale

**Documentation Standards**:
- ADR format: Context → Decision → Consequences → Status
- Changelog format: Keep a Changelog (keepachangelog.com)
- API docs: OpenAPI 3.0 (machine-readable + Swagger UI)

**Owns**: All files in `docs/`, `CHANGELOG.md`, `README.md`

---

### A-05 — Frontend Implementation Agent

**Role**: Frontend developer. Implements all UI improvements defined by A-02 following clean component architecture.

**Coding Standards**:
- Max 400 lines per component (decompose if larger)
- All async operations: loading + error + empty states
- No inline styles (use MUI `sx` or Tailwind classes)
- TypeScript strict mode — no `any` without explicit suppression comment
- Hooks: max 1 concern per custom hook
- RTK Query: use `providesTags`/`invalidatesTags` on all endpoints
- Forms: React Hook Form + Zod schema validation only
- No console.log in production code

**Responsibilities**:
- Implements components per A-02 specifications
- Writes RTL tests per A-11 test plan
- Ensures accessibility attributes on every interactive element
- Optimises bundle size (lazy-load all page-level components)
- Runs Lighthouse CI before marking tasks complete

**Owns**: `frontend/src/` (implementation)

---

### A-06 — Backend Implementation Agent

**Role**: Backend developer. Implements all backend improvements defined by A-03 following clean architecture.

**Architecture Pattern** (per service):
```
server.ts           — Express setup, middleware registration
routes/             — Route definitions only (no logic)
controllers/        — HTTP layer: parse req, call service, return res
services/           — Business logic (new layer — must be extracted)
repositories/       — Data access layer (Sequelize queries)
models/             — Sequelize model definitions
middleware/         — Auth, error, validation middleware
utils/              — Pure utilities (no side effects)
types/              — TypeScript interfaces
```

**Coding Standards**:
- Controllers max 50 lines (delegate to services)
- All DB operations in try/catch with proper error logging
- Transactions for all multi-step DB operations
- Joi validation schema in separate `utils/validation.ts`
- Logger: structured JSON with correlation ID
- No `any` in TypeScript
- All exported functions must have JSDoc

**Owns**: `backend/*/src/` (implementation)

---

### A-07 — Database Optimization Agent

**Role**: Database engineer. Owns query performance, schema integrity, and data consistency.

**Responsibilities**:
- Adds missing indexes to all models
- Rewrites N+1 queries with proper Sequelize `include` + `attributes`
- Adds database-level constraints (NOT NULL, CHECK, FOREIGN KEY)
- Creates proper Sequelize migration files (not just `sync({ force: true })`)
- Implements cursor-based pagination to replace offset pagination
- Documents backup and restore procedures
- Sets up connection pool tuning

**Index Standards** (per table):
```
Primary Key: always UUID (already done ✓)
Foreign Keys: always indexed (add if missing)
Timestamp columns used in ORDER BY: indexed
Columns used in WHERE with high cardinality: indexed
Composite indexes for common query patterns
```

**Owns**: `backend/*/src/models/`, `backend/*/migrations/`, `docs/DATABASE_SCHEMA.md`

---

### A-08 — Security & Authentication Agent

**Role**: Security engineer. Owns the security posture of the entire system.

**Responsibilities**:
- OWASP Top 10 remediation checklist
- File upload security (magic-byte validation, size limits, type whitelist)
- Input sanitization (HTML injection prevention)
- Service-to-service authentication (internal API key or mTLS)
- Secrets management review (no hardcoded secrets, proper .env.example)
- Dependency vulnerability scanning (npm audit + Snyk)
- Security headers audit (Helmet configuration review)
- JWT security review (algorithm, expiry, rotation)
- SQL injection prevention verification
- Rate limiting adequacy review

**Security Standards**:
```
Authentication:
  - JWT HS256 with 15m access / 7d refresh (current — acceptable)
  - Refresh token rotation on every use (current — ✓)
  - All refresh tokens in DB with revocation (current — ✓)

File Uploads:
  - Magic byte validation (fileType library)
  - Virus scanning (ClamAV or cloud API)
  - Content-Disposition header enforcement
  - Separate static file server (not Express static)

Headers (Helmet):
  - CSP with strict-origin-when-cross-origin
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy: camera=(), microphone=()

Rate Limiting:
  - Gateway: 2000 req/15min (current ✓)
  - Auth endpoints: 10 req/15min (add per-route limiting)
  - File uploads: 5 req/min (add specific limit)
```

**Owns**: `docs/SECURITY.md`, security configurations across all services

---

### A-09 — DevOps & Deployment Agent

**Role**: Infrastructure engineer. Owns CI/CD, containerization, observability, and deployment.

**Responsibilities**:
- OpenAPI 3.0 spec generation and Swagger UI setup
- Prometheus metrics endpoints on all services (`/metrics`)
- Grafana dashboard configuration for all services
- Structured logging with correlation IDs (trace requests across services)
- Docker Compose production hardening
- Kubernetes manifest validation and update
- Health check endpoint standardization
- Environment configuration management
- Database backup automation

**Observability Stack**:
```
Metrics:    Prometheus + Grafana
Logging:    Winston → stdout → Loki (or ELK)
Tracing:    correlation-id header propagation
Alerting:   Grafana alerts on error rate > 1%, p95 latency > 500ms
```

**Health Check Standard**:
```json
GET /health
{
  "status": "healthy" | "degraded" | "unhealthy",
  "timestamp": "ISO8601",
  "version": "semver",
  "uptime": seconds,
  "checks": {
    "database": "healthy" | "unhealthy",
    "redis": "healthy" | "unhealthy" | "N/A"
  }
}
```

**Owns**: `infrastructure/`, `docs/DEPLOYMENT_GUIDE.md`, all Dockerfiles and CI/CD configs

---

### A-10 — QA Agent

**Role**: Quality assurance engineer. Iteratively validates each feature against acceptance criteria.

**Responsibilities**:
- Defines acceptance criteria for every user story before implementation
- Manual exploratory testing after each implementation sprint
- Reports bugs with: steps to reproduce, expected vs actual, severity, affected service
- Validates API responses against OpenAPI spec
- Performs cross-browser testing (Chrome, Firefox, Safari, Edge)
- Validates mobile responsiveness at 320px, 375px, 768px, 1024px, 1440px

**Bug Severity Levels**:
```
P0 (Blocker):   System unusable, data loss, security breach
P1 (Critical):  Core feature broken, no workaround
P2 (Major):     Feature degraded, workaround exists
P3 (Minor):     UI cosmetic, minor UX issue
```

**Owns**: `tests/qa/`, `docs/TEST_PLAN.md`

---

### A-11 — Regression Testing Agent

**Role**: Test automation engineer. Designs and implements the automated test suite.

**Test Coverage Targets**:
```
Unit tests:         ≥ 80% coverage on service/business logic layer
Integration tests:  all API endpoints (happy path + error cases)
E2E tests:         critical user journeys (login, post, apply to job, message)
Performance tests:  p95 latency < 200ms on GET endpoints under 100 concurrent users
```

**Test Stack**:
```
Backend unit:       Jest + ts-jest
Backend integration: Jest + Supertest + test database
Frontend unit:      Vitest + React Testing Library
Frontend E2E:       Playwright (replacing Cypress stubs)
Performance:        k6
API contract:       Prism (OpenAPI mock server validation)
```

**Owns**: `tests/unit/`, `tests/integration/`, `tests/e2e/`, all test configuration files

---

### A-12 — Production Readiness Approval Agent

**Role**: Release gate. Has sole authority to approve or reject production deployment.

**Approval Criteria** (all must pass):

| Category | Criterion | Threshold |
|----------|-----------|-----------|
| UI | Lighthouse Performance | ≥ 85 |
| UI | Lighthouse Accessibility | ≥ 90 |
| UI | All pages render without JS errors | 100% |
| Backend | All health endpoints return 200 | 100% |
| Backend | P95 API latency (100 users) | < 200ms |
| Backend | Error rate under load | < 0.1% |
| Database | All indexes present | 100% |
| Database | No N+1 queries in critical paths | 0 |
| Security | OWASP Top 10 checklist | All passed |
| Security | npm audit critical vulns | 0 |
| Tests | Unit test coverage (service layer) | ≥ 80% |
| Tests | Integration test pass rate | 100% |
| DevOps | Docker build succeeds (all services) | 100% |
| DevOps | All health checks healthy | 100% |
| Docs | OpenAPI spec complete | 100% endpoints |

**Owns**: `docs/PRODUCTION_READINESS.md`, `docs/RISK_ASSESSMENT.md`
**Authority**: Sole sign-off authority for production deployment

---

## Inter-Agent Workflow

### Phase Structure

```
Phase 0: PLANNING (A-00, A-01, A-02, A-03, A-04)
  - Audit codebase
  - Define architecture plan
  - Define API standards
  - Define design system
  - Create this document

Phase 1: SECURITY & INFRASTRUCTURE (A-08, A-09, A-07)
  - Security hardening
  - Add missing indexes
  - Set up observability
  - Create migration files
  (Runs in parallel — no cross-dependencies)

Phase 2: BACKEND REFACTOR (A-06)
  - Extract service layer
  - Fix response envelopes
  - Cursor-based pagination
  - Transaction support
  - Requires: Phase 1 complete

Phase 3: FRONTEND REFACTOR (A-05)
  - Component decomposition
  - Accessibility fixes
  - Performance optimisation
  - Can run parallel with Phase 2

Phase 4: TESTING (A-10, A-11)
  - Write unit tests (service layer)
  - Write integration tests
  - Write E2E tests
  - Requires: Phases 2 + 3 complete

Phase 5: VALIDATION & APPROVAL (A-10, A-11, A-12)
  - QA manual testing
  - Performance testing
  - Production readiness checklist
  - Risk assessment
  - Go/No-Go decision
  Requires: Phase 4 complete
```

### Communication Protocol

All inter-agent communications are documented in `docs/AGENT_CHANGELOG.md` with format:

```
[YYYY-MM-DD HH:MM] AGENT_ID → AGENT_ID : TOPIC
  Request/Decision/Finding: ...
  Response: ...
  Action Required: ...
```

### Escalation Chain

```
Technical conflicts:       → A-01 (Chief Architect)
Security concerns:         → A-08 (Security Agent) [immediate escalation]
Quality gate failures:     → A-12 (Production Readiness Agent)
Workflow blockages:        → A-00 (Communication Agent)
Architecture questions:    → A-01 → A-00 if unresolved
```

### Decision Authority Matrix

| Decision Type | Owner | Consulted | Informed |
|---------------|-------|-----------|---------|
| Service boundary changes | A-01 | A-03, A-06 | All |
| API contract changes | A-03 | A-01, A-06 | A-05, A-10, A-11 |
| UI design system changes | A-02 | A-05 | A-10 |
| Database schema changes | A-07 | A-03, A-06 | A-09 |
| Security policy changes | A-08 | A-01 | All |
| Deployment process changes | A-09 | A-01 | All |
| Production go/no-go | A-12 | A-10, A-11 | All |

---

## Deliverables Register

| ID | Deliverable | Owner | Status |
|----|------------|-------|--------|
| D-01 | Agent Team Manifest (this file) | A-00 | ✅ Complete |
| D-02 | Architecture Plan | A-01 | ✅ Complete |
| D-03 | Frontend Architecture Plan | A-02 | 🔄 In Progress |
| D-04 | API Standards & OpenAPI Spec | A-03 | 🔄 In Progress |
| D-05 | Database Schema & Index Plan | A-07 | 🔄 In Progress |
| D-06 | Security Audit & Hardening Plan | A-08 | 🔄 In Progress |
| D-07 | Test Plan | A-11 | 🔄 In Progress |
| D-08 | Deployment Strategy | A-09 | 🔄 In Progress |
| D-09 | Production Readiness Checklist | A-12 | 📋 Pending |
| D-10 | Risk Assessment Report | A-12 | 📋 Pending |
| D-11 | Refactored Backend Code | A-06 | 🔄 In Progress |
| D-12 | Refactored Frontend Code | A-05 | 🔄 In Progress |
| D-13 | Automated Test Suite | A-11 | 🔄 In Progress |
| D-14 | AGENT_CHANGELOG | A-00 | 🔄 In Progress |

---

## Non-Functional Requirements Baseline

| Requirement | Target | Measurement |
|-------------|--------|-------------|
| API Response Time (p50) | < 50ms | Prometheus histogram |
| API Response Time (p95) | < 200ms | Prometheus histogram |
| API Response Time (p99) | < 500ms | Prometheus histogram |
| Concurrent Users | 1000 simultaneous | k6 load test |
| Throughput | 500 req/s | k6 load test |
| Availability | 99.5% (dev target) | Health check uptime |
| Error Rate | < 0.1% | Prometheus counter |
| Test Coverage | ≥ 80% service layer | Jest coverage report |
| Lighthouse Performance | ≥ 85 | Lighthouse CI |
| Lighthouse Accessibility | ≥ 90 | Lighthouse CI |
| Build Time | < 5 minutes | CI pipeline |
| Docker Image Size | < 200MB per service | Docker inspect |

---

*This document is maintained by A-04 (Context Management Agent). Last updated: 2026-03-03*
