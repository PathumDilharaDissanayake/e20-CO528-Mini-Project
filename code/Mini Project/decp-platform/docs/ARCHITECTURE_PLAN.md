# DECP Platform — Architecture Plan
**Agent**: A-01 (Chief Architect Agent)
**Version**: 1.0.0 | **Date**: 2026-03-03 | **Status**: Approved

---

## Executive Summary

The DECP platform is a **microservices-based** social and career platform for university departments. The current implementation is structurally sound but contains several production-blocking issues. This document catalogues all architectural findings and defines the target-state architecture.

**Overall Assessment**: Production-readiness score **68/100** (pre-remediation)

---

## C4 Level 1 — System Context

```
┌─────────────────────────────────────────────────────────────────┐
│                        DECP Platform                            │
│                                                                 │
│  ┌─────────────┐     HTTPS/REST      ┌──────────────────────┐  │
│  │   Student   │◄───────────────────►│                      │  │
│  │   Faculty   │                     │    API Gateway       │  │
│  │   Alumni    │    WebSocket        │    (Port 3000)       │  │
│  │   Admin     │◄───────────────────►│                      │  │
│  └─────────────┘                     └──────────┬───────────┘  │
│  ┌─────────────┐                                │              │
│  │   Browser   │        Internal Network        │              │
│  │  (React SPA)│                     ┌──────────▼───────────┐  │
│  └─────────────┘                     │  9 Microservices     │  │
│                                      │  (Ports 3001–3009)   │  │
│  ┌─────────────┐                     └──────────┬───────────┘  │
│  │Google OAuth │◄────────────────────────────── │              │
│  │   SMTP      │                     ┌──────────▼───────────┐  │
│  │  (External) │                     │ PostgreSQL + Redis    │  │
│  └─────────────┘                     └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## C4 Level 2 — Container Diagram

```
Browser (React 18 SPA)
  │ HTTPS :443 → :3000 (prod) / :5173 (dev)
  ▼
┌─────────────────────────────────────────────────────┐
│  API Gateway (Express, Port 3000)                   │
│  - JWT verification (authMiddleware)                │
│  - x-user-id/role/email header injection            │
│  - Rate limiting: 2000 req/15min                    │
│  - Proxy via axios (JSON) or http (multipart)       │
│  - CORS, Helmet, compression                        │
└──────┬──────────────────────────────────────────────┘
       │ Internal HTTP (Docker network)
       ├──► Auth Service       :3001  (PostgreSQL: decp_auth)
       ├──► User Service       :3002  (PostgreSQL: decp_users)
       ├──► Feed Service       :3003  (PostgreSQL: decp_feed)
       ├──► Jobs Service       :3004  (PostgreSQL: decp_jobs)
       ├──► Events Service     :3005  (PostgreSQL: decp_events)
       ├──► Research Service   :3006  (PostgreSQL: decp_research)
       ├──► Messaging Service  :3007  (PostgreSQL: decp_messaging + Redis)
       ├──► Notification Svc   :3008  (PostgreSQL: decp_notifications)
       └──► Analytics Service  :3009  (PostgreSQL: decp_analytics)

Browser (WebSocket)
  │ ws://:3007 (dev) / wss://:443/socket (prod)
  ▼
  Messaging Service (Socket.IO with Redis adapter)
```

---

## Current Architecture: Strengths

1. **Database-per-service** ✅ — Each service owns its PostgreSQL database. No shared schema.
2. **Gateway JWT verification** ✅ — Services receive pre-verified user identity via trusted headers.
3. **Refresh token rotation** ✅ — Old tokens are revoked on refresh, preventing replay attacks.
4. **TypeScript throughout** ✅ — Type safety reduces runtime errors.
5. **Validation at entry points** ✅ — Joi schemas on all controller inputs.
6. **Structured logging** ✅ — Winston logger in every service.
7. **File type whitelisting** ✅ — MIME type validation on uploads.
8. **Docker-ready** ✅ — Dockerfiles and docker-compose for all services.

---

## Current Architecture: Identified Flaws

### Critical (P0 — Production Blocking)

#### FLAW-001: Missing Service Layer
**Affected**: All 9 backend services
**Problem**: Business logic lives directly in controllers. Controllers are 200–500 lines. This makes:
- Unit testing nearly impossible (must mock HTTP layer)
- Business rules scattered across HTTP handlers
- Code reuse between controllers impossible
**Fix**: Extract `services/` directory per service with pure business logic classes
**Assigned to**: A-06 (Backend Implementation Agent)

#### FLAW-002: Zero Automated Tests
**Affected**: All services, frontend
**Problem**: Test files exist in `tests/unit/` but are shell-only stubs. `npm test` would fail or produce 0 coverage. CI/CD pipeline references tests that don't exist.
**Fix**: Implement comprehensive test suite per A-11 test plan
**Assigned to**: A-11 (Regression Testing Agent)

#### FLAW-003: Race Condition in Like/Share Counters
**Affected**: feed-service `postController.ts`
**Problem**: `post.increment('likes')` and `like.destroy()` + `post.decrement('likes')` are not atomic. Under concurrent traffic, like count can become negative or incorrect.
**Fix**: Use database-level atomic operations with Sequelize transactions
**Assigned to**: A-06, A-07

#### FLAW-004: Share Endpoint Has No Idempotency
**Affected**: feed-service `sharePost()`
**Problem**: `POST /posts/:id/share` just increments the counter — no tracking of who shared. A user can increment shares unlimited times.
**Fix**: Add `Share` model, use `findOrCreate` pattern same as `Like`
**Assigned to**: A-06

#### FLAW-005: Auth Token Payload Lost on Refresh
**Affected**: auth-service `refreshToken()`
**Problem**: Line 244 calls `generateTokens({ userId, email, role })` — `firstName` and `lastName` are NOT included in the new tokens because they're not stored in the refresh token payload. The new access token will be missing user name data.
**Fix**: Store firstName/lastName in the refresh token payload or fetch from DB on refresh
**Assigned to**: A-06

### High (P1 — Production Degrading)

#### FLAW-006: Offset-Based Pagination
**Affected**: All services (getFeed, getJobs, getEvents, etc.)
**Problem**: `OFFSET (page-1)*limit` performs full table scan up to the offset. At 10,000 posts, page 100 scans 1,000 rows to discard before returning 10. Performance degrades O(n).
**Fix**: Implement cursor-based pagination using `createdAt + id` composite cursor
**Assigned to**: A-07

#### FLAW-007: No Database Migrations
**Affected**: All services
**Problem**: Services use `sequelize.sync({ force: false })` or `alter: true` in development. In production, schema changes must be tracked and applied surgically without data loss.
**Fix**: Create Sequelize migration files for each service's initial schema + all future changes
**Assigned to**: A-07

#### FLAW-008: No Composite Database Indexes
**Affected**: All services (critical: feed-service, jobs-service, messaging-service)
**Problem**: `getFeed` queries `WHERE isPublic = true ORDER BY createdAt DESC` — no composite index on `(isPublic, createdAt)` means full table scan on large datasets.
**Fix**: Add strategic composite indexes on all high-frequency query patterns
**Assigned to**: A-07

#### FLAW-009: File Upload Magic Byte Validation Missing
**Affected**: feed-service, research-service
**Problem**: File type validation is MIME-type only (from request header). Attackers can upload malicious files (e.g., PHP webshell) with a spoofed `image/jpeg` content-type.
**Fix**: Read first 4–8 bytes of uploaded file and validate against known magic bytes
**Assigned to**: A-08

#### FLAW-010: No Service-to-Service Authentication
**Affected**: All inter-service communication
**Problem**: Downstream services trust the `x-user-id` header entirely. A request that bypasses the API gateway (e.g., internal network access) can spoof any user identity.
**Fix**: Add `x-internal-service-token` header validated on each service
**Assigned to**: A-08

#### FLAW-011: Inconsistent Response Envelope
**Affected**: Multiple services
**Problem**:
- `getFeed` returns `data: posts[]` (array at top level)
- `createPost` returns `data: { post: {...} }` (nested object)
- `getFeed` has `meta` on the response root; others don't
- Frontend must handle multiple shapes inconsistently
**Fix**: Enforce canonical response envelope (defined in A-03 standards)
**Assigned to**: A-06

#### FLAW-012: No Transaction Support for Multi-Step Operations
**Affected**: auth-service (register), feed-service (addComment), messaging-service
**Problem**:
- `register()` creates a User, then creates a RefreshToken. If RefreshToken creation fails, the User exists without any token — partially created state.
- `addComment()` creates Comment then increments post.comments. If increment fails, comment exists but count is wrong.
**Fix**: Wrap multi-step DB operations in Sequelize transactions
**Assigned to**: A-06

### Medium (P2 — Technical Debt)

#### FLAW-013: No API Documentation
**Affected**: All endpoints
**Problem**: No OpenAPI spec, no Swagger UI. Frontend and external consumers must read source code.
**Fix**: Generate OpenAPI 3.0 spec, serve Swagger UI at `/api/docs`
**Assigned to**: A-09

#### FLAW-014: No Distributed Request Tracing
**Affected**: All services
**Problem**: A failed request shows logs in gateway + downstream service but no correlation ID to link them.
**Fix**: Generate UUID correlation ID at gateway, propagate via `x-correlation-id` header, include in all log entries
**Assigned to**: A-09

#### FLAW-015: No Input Sanitization Against HTML Injection
**Affected**: feed-service (post content), messaging-service (messages)
**Problem**: Post content and messages are stored raw. If displayed with dangerouslySetInnerHTML or in email notifications, stored XSS becomes possible.
**Fix**: Sanitize user-provided text server-side using DOMPurify (in Node via jsdom) or strip-tags
**Assigned to**: A-08

#### FLAW-016: Polling-Based Real-Time (Non-Messaging Features)
**Affected**: Feed (30s), Notifications (15s), Message list (10s)
**Problem**: Polling creates constant database load proportional to connected users. At 500 concurrent users, notifications alone generate ~33 DB queries/second from polling alone.
**Fix**: Extend Socket.IO to handle feed and notification events (emit on mutation), keeping polling as fallback only
**Assigned to**: A-06

---

## Service Interaction Matrix

| Consumer → Provider | auth | user | feed | jobs | events | research | messaging | notify | analytics |
|--------------------|------|------|------|------|--------|----------|-----------|--------|-----------|
| **api-gateway** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **feed-service** | — | 🔲 needed | — | — | — | — | — | 🔲 needed | 🔲 track |
| **jobs-service** | — | — | — | — | — | — | — | 🔲 needed | 🔲 track |
| **events-service** | — | — | — | — | — | — | — | 🔲 needed | 🔲 track |
| **messaging-svc** | — | — | — | — | — | — | — | 🔲 needed | 🔲 track |

🔲 = cross-service calls not yet implemented (services duplicate data instead of calling each other)

**Decision (ADR-001)**: For Phase 1, services remain decoupled via header-injected user data. Cross-service notifications to be implemented via event queue (RabbitMQ or Redis Pub/Sub) in Phase 2.

---

## Data Flow: Authentication

```
Browser → POST /api/v1/auth/login
  → Gateway (no auth check, pass-through)
  → Auth Service: validate credentials → generate JWT (15m) + refresh (7d)
  → Store refresh token in decp_auth.refresh_tokens
  → Return { user, accessToken, refreshToken }
Browser stores:
  - accessToken: localStorage (15m TTL)
  - refreshToken: localStorage (7d TTL — KNOWN WEAKNESS: should be httpOnly cookie)
Browser → GET /api/v1/users/me (with Bearer accessToken)
  → Gateway: verify JWT → inject x-user-id, x-user-role, x-user-email, x-user-firstname, x-user-lastname
  → User Service: read x-user-id → look up Profile → return data
  ✓ Auth service NOT called for every request (efficient)
Browser token expiry:
  → POST /api/v1/auth/refresh (with refreshToken)
  → Auth Service: verify refresh, revoke old, issue new pair
  → Return new { accessToken, refreshToken }
```

**Known Risk**: Access tokens stored in localStorage are vulnerable to XSS. Recommend migration to httpOnly cookies for refresh token in production.

---

## Data Flow: Post Creation with File Upload

```
Browser → POST /api/v1/posts (multipart/form-data)
  → Gateway: verify JWT → inject user headers
  → Gateway: detect multipart → use http.request stream (not axios)
  → Feed Service: Multer processes files → saves to ./uploads/{uuid}.ext
  → Feed Service: Create Post record with mediaUrls=['/uploads/{uuid}.ext']
  → Return { success: true, data: { post: {...} } }
  ⚠ Files stored on local disk — not replicated across instances
  ⚠ No CDN — all image requests go through Express static serving
```

**Recommended Fix (Phase 2)**: Replace local disk storage with cloud object storage (AWS S3 or MinIO for self-hosted).

---

## Scalability Plan

### Horizontal Scaling Boundaries (per service)

| Service | Stateless? | Session Data | Scale Notes |
|---------|-----------|--------------|-------------|
| api-gateway | ✅ | None | Scale freely behind load balancer |
| auth-service | ✅ | Refresh tokens in DB | Scale freely (DB is source of truth) |
| user-service | ✅ | None | Scale freely |
| feed-service | ⚠ | Local file uploads | Cannot scale until file storage externalised |
| jobs-service | ✅ | None | Scale freely |
| events-service | ✅ | None | Scale freely |
| research-service | ⚠ | Local file uploads | Cannot scale until file storage externalised |
| messaging-service | ⚠ | Socket.IO rooms | Requires Redis adapter (already present ✅) |
| notification-service | ✅ | None | Scale freely |
| analytics-service | ✅ | None | Scale freely |

### Database Scaling Boundaries

| Database | Current | Recommended at Scale |
|----------|---------|---------------------|
| decp_auth | Single PostgreSQL | Read replica for getMe queries |
| decp_feed | Single PostgreSQL | Partition posts by createdAt month |
| decp_messaging | Single PostgreSQL + Redis | Read replica + message archival |
| All others | Single PostgreSQL | Read replica sufficient |

---

## Technology Decisions (ADR Log)

### ADR-001: Retain Offset Pagination for Phase 1
**Context**: Offset pagination is simpler but O(n) at high offsets.
**Decision**: Implement cursor-based pagination alongside offset for all new endpoints. Migrate existing endpoints in Phase 2.
**Consequences**: Feed and other list endpoints can use cursor from day 1.

### ADR-002: Local File Storage for Phase 1
**Context**: MinIO/S3 requires infrastructure setup outside scope of this sprint.
**Decision**: Retain local disk storage. Add magic-byte validation and file type limits.
**Consequences**: feed-service and research-service cannot be horizontally scaled in Phase 1.

### ADR-003: JWT in localStorage (Phase 1 Accepted Risk)
**Context**: Moving to httpOnly cookies requires backend changes to all auth flows and CSRF handling.
**Decision**: Document as known risk, implement httpOnly cookie migration as Phase 2 item.
**Consequences**: XSS vulnerability window for access token persists.

### ADR-004: Event Notifications via Direct API Calls (Phase 1)
**Context**: Setting up RabbitMQ or Redis Pub/Sub event queue requires significant infrastructure work.
**Decision**: For Phase 1, services can call notification-service directly via internal API. Use async fire-and-forget pattern.
**Consequences**: Tight coupling between services; failure in notification-service can affect primary operations if not handled carefully.

---

## Production-Readiness Gap Analysis

| Category | Current State | Target State | Gap |
|----------|--------------|--------------|-----|
| Architecture | Monolithic controllers | Service layer + repository pattern | High |
| Testing | 0 tests | ≥ 80% unit coverage | Critical |
| Pagination | Offset-based | Cursor-based | Medium |
| Database | No migrations | Full migration files | High |
| Security | MIME-type upload validation | Magic-byte + ClamAV | High |
| Tracing | No correlation IDs | Full request tracing | Medium |
| API Docs | None | OpenAPI 3.0 + Swagger UI | High |
| Monitoring | Winston logs only | Prometheus + Grafana | Medium |
| Indexes | Partial | Full composite index strategy | High |
| Transactions | None | All multi-step operations wrapped | Critical |

---

*Maintained by A-04 (Context Management Agent). All architectural changes require A-01 approval.*
