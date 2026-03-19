# Product Requirements Document (PRD): DECP Platform

---

## 1. Executive Summary

* **Product Overview:** The **Department Engagement & Career Platform (DECP)** is a full-stack social networking and career development application purpose-built for university departments. It connects students and alumni within an academic community, bridging the gap between academic life and professional careers. The platform solves the problem of fragmented departmental communication by unifying social feeds, job and internship boards, event management, research collaboration, and direct messaging into a single, role-aware environment — functioning broadly as a "LinkedIn for a university department."
* **Project Status:** As-Built / Completed Codebase.
* **Academic Context:** Developed as a project for **CO528 Applied Software Architecture**, Department of Computer Engineering, University of Peradeniya.

---

## 2. Target Audience & User Personas

User roles are enforced at the API Gateway level via JWT claims (`x-user-role` header injected into every proxied request) and guarded at the frontend via `ProtectedRoute` with an optional `requireAdmin` flag.

* **Persona 1: Student** — The primary user and default role assigned at registration (`role: 'student'`). Can create posts, apply for jobs and internships, RSVP to events, join research projects as a collaborator, send and receive messages, and manage a professional profile. Can set an `openToWork` flag on their profile.

* **Persona 2: Alumni** — A graduate user (`role: 'alumni'`) with the same content and social capabilities as a student. Alumni are the natural suppliers of job postings, mentorship, and research collaboration invitations. The `graduationYear` field on the User entity distinguishes their academic journey.

* **Persona 3: Faculty** — A staff or academic user (`role: 'faculty'`) who can create and lead research projects, organize events (webinars, seminars, workshops), and post to the platform feed. Acts as a research lead (`leadResearcherId` on `ResearchProject`).

* **Persona 4: Admin** — A privileged system operator (`role: 'admin'`). Has access to the Analytics Dashboard (`GET /analytics/dashboard`), can manage users (`DELETE /users/:userId`), and is the only role that can access admin-protected frontend routes (`requireAdmin: true` in `ProtectedRoute`). [REVIEW: Confirm exact admin-exclusive capabilities beyond analytics and user deletion.]

---

## 3. Tech Stack & Architecture

The platform follows a **microservices / Service-Oriented Architecture (SOA)** pattern with 10 independent backend services communicating through an API Gateway.

### 3.1 Frontend (Web)
| Concern | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| State Management | Redux Toolkit + RTK Query (API slice pattern) |
| UI Library | Material-UI (MUI) v5 + Tailwind CSS |
| Routing | React Router v6 |
| Real-time | Socket.io-client v4 |
| Data Visualization | Recharts v2 |
| Form Handling | React Hook Form v7 + Zod v3 (schema validation) |
| File Upload | React Dropzone v14 |
| Build Tool | Vite 7 |
| Testing | Vitest + React Testing Library |

### 3.2 Mobile
| Concern | Technology |
|---|---|
| Framework | React Native 0.73 (Expo SDK ~50) |
| State Management | Redux Toolkit + `redux-persist` |
| Navigation | React Navigation v6 (Stack + Bottom Tabs) |
| Push Notifications | `expo-notifications` |
| Real-time | Socket.io-client v4 |
| UI Library | React Native Paper v5 |
| Charts | Victory Native v40 |

### 3.3 Backend (Microservices — Node.js 20+ / TypeScript / Express.js)
| Service | Port | Responsibility |
|---|---|---|
| API Gateway | 3000 | Auth enforcement, rate limiting, request proxying, correlation ID injection |
| Auth Service | 3001 | Registration, login, JWT issuance & refresh, OAuth 2.0 (Google), email verification, password reset |
| User Service | 3002 | Profile CRUD, connection/follow graph, skill endorsements, user search |
| Feed Service | 3003 | Post creation, social feed, likes, comments, shares, bookmarks, polls, file upload |
| Jobs Service | 3004 | Job/internship listings, resume upload, application tracking |
| Events Service | 3005 | Event creation, RSVP management |
| Research Service | 3006 | Research project management, document uploads, collaborator management |
| Messaging Service | 3007 | Direct and group conversations, real-time message delivery |
| Notification Service | 3008 | In-app notifications (message, connection, job, event, mention, system types) |
| Analytics Service | 3009 | Activity tracking, dashboard metrics, popular content analysis |

### 3.4 Database & Storage
| Concern | Technology |
|---|---|
| Primary Database | PostgreSQL 16 (one isolated database per service: `decp_auth`, `decp_users`, `decp_feed`, `decp_jobs`, `decp_events`, `decp_research`, `decp_messaging`, `decp_notifications`, `decp_analytics`) |
| ORM | Sequelize v6 (TypeScript models) |
| Caching / Sessions | Redis 7 |
| File Storage | [REVIEW: Local filesystem storage via Multer is used in development. Production storage destination — S3 bucket is provisioned in Terraform but explicit Multer S3 integration should be verified.] |
| Email | Nodemailer (SMTP — requires external SMTP credentials) |

### 3.5 Infrastructure & DevOps
| Concern | Technology |
|---|---|
| Containerization | Docker + Docker Compose (dev & production configurations) |
| Container Orchestration | Kubernetes (manifests for all services, Ingress, RBAC, PVC, ConfigMap, Secrets) |
| Cloud Provider | AWS (us-east-1 default) |
| IaC | Terraform — modules for VPC, ECS (Fargate), RDS, ALB, ECR, S3, Security Groups |
| CI/CD | GitHub Actions (5 workflows: `ci.yml`, `cd-backend.yml`, `cd-frontend.yml`, `cd-mobile.yml`, `security-scan.yml`) |
| Monitoring | Prometheus + Grafana + Loki + Alertmanager |
| Reverse Proxy | NGINX (frontend serving + API proxying) |
| Security Middleware | Helmet.js, CORS allowlist, per-service internal service token (`x-internal-token` / SEC-002), distributed rate limiting |

---

## 4. Core Features & Capabilities

### 4.1 User Authentication & Authorization

* **Description:** Handles all user identity concerns — registration with role selection, credential-based login, OAuth login, token lifecycle management, and email-based account verification and password recovery.
* **Key Functionalities:**
  * Local registration with `email`, `password`, `firstName`, `lastName`, `role` (student/alumni/faculty), optional `department`, and `graduationYear`.
  * Email verification flow: verification token generated on registration, confirmed via `POST /api/v1/auth/verify-email`.
  * Credential login returning a short-lived JWT access token and a 7-day rotating refresh token (stored in the `refresh_tokens` table).
  * Silent token refresh via `POST /api/v1/auth/refresh` using the stored refresh token.
  * Google OAuth 2.0 social login (`passport-google-oauth20`) — creates a new user account automatically on first sign-in with `isEmailVerified: true`.
  * Forgot-password and reset-password flow via time-limited `passwordResetToken` stored on the User record.
  * API Gateway validates every inbound JWT and injects `x-user-id`, `x-user-role`, `x-user-email`, `x-user-firstname`, `x-user-lastname` headers to all downstream microservices, eliminating per-service token re-verification.
  * Role-based access control (RBAC) enforced at both the gateway (`requireAdmin` guard) and individual service route handlers.
  * Bcrypt password hashing (via `bcryptjs`).

### 4.2 User Profiles & Professional Networking

* **Description:** Enables users to build a rich, LinkedIn-style professional profile and manage a social graph of connections.
* **Key Functionalities:**
  * Comprehensive profile: bio, headline, location, website, phone number, skills (array), interests, structured education history, work experience history, social links (LinkedIn, GitHub, Twitter), certifications, and `openToWork` toggle.
  * Avatar/profile picture upload (`PUT /users/me` with `uploadProfilePicture`).
  * Skill endorsements: any connected user can endorse a peer's skill (`POST /users/:userId/endorse`).
  * Connection/follow graph with three-state status: `pending` → `accepted` | `blocked`. Supports follow, unfollow, accept, decline, and block operations.
  * User search (`GET /users/search`) and "suggested users" recommendation (`GET /users/suggested`).
  * Pending connection request inbox (`GET /users/connections/requests`).
  * Featured post pinned to user profile (`featuredPostId` field).

### 4.3 Social Feed

* **Description:** A central activity stream where all platform members can share content, interact with posts, and follow conversations — the primary engagement surface of the application.
* **Key Functionalities:**
  * Post creation supporting five content types: `text`, `image`, `video`, `document`, and `poll`.
  * Media attachment via multi-file upload (up to 5 files per post, `memoryUpload.array('media', 5)`).
  * Dedicated file upload endpoint (`POST /feed/upload`) returning a media URL for use in rich-text editors.
  * Poll posts with time-bounded options; users can vote on active polls (`POST /feed/:postId/vote`).
  * Post sharing — creates a new `share`-type post referencing `originalPostId` and storing `sharedBy` author info.
  * Like / unlike a post (`POST`/`DELETE /feed/:postId/like`) with reaction details (`GET /feed/:postId/reactions`).
  * Threaded comments: add (`POST /feed/:postId/comments`), list (`GET`), and delete (`DELETE /feed/:postId/comments/:commentId`).
  * Bookmark / save posts (`POST /feed/:postId/bookmark`); view saved posts (`GET /feed/bookmarks/me`), surfaced in the **Saved Posts** page.
  * Visibility control: posts have an `isPublic` flag (public vs. connections-only).
  * Infinite-scroll feed served from `GET /feed`.

### 4.4 Jobs & Internships Board

* **Description:** A career marketplace where alumni, faculty, and organizations can post opportunities, and students/alumni can apply and track their application pipeline.
* **Key Functionalities:**
  * Job listing with fields: `title`, `description`, `company`, `location`, type (`full-time`, `part-time`, `contract`, `internship`, `remote`), structured `salary` (min, max, currency, period), `requirements` array, `skills` array, and expiry date.
  * Job status lifecycle: `draft` → `active` → `closed`.
  * Application submission with resume file upload (`POST /jobs/:jobId/apply` with `multipart/form-data`).
  * Optional cover letter and structured answer fields per application.
  * Application status pipeline: `pending` → `reviewing` → `interview` → `offered` | `rejected` | `withdrawn`.
  * Application status management for posting party (`PUT /jobs/applications/:applicationId/status`).
  * "My Applications" view for applicants (`GET /jobs/applications`).
  * Unique constraint prevents duplicate applications (`jobId` + `userId` composite unique index).

### 4.5 Events & Announcements

* **Description:** A department calendar and announcement system for scheduling and managing academic and professional events.
* **Key Functionalities:**
  * Event creation with type categorization: `webinar`, `workshop`, `seminar`, `networking`, `career_fair`, or `other`.
  * Support for both physical (with `location`) and virtual events (with `isVirtual: true` and `meetingLink`).
  * Capacity management (`capacity` field).
  * Event status lifecycle: `draft` → `published` → `completed` | `cancelled`.
  * Cover image and tagging support.
  * RSVP system: users can register attendance (`POST /events/:eventId/rsvp`); personal RSVP history available (`GET /events/my-rsvps`).

### 4.6 Research Collaboration

* **Description:** A workspace for managing academic research projects, enabling multi-disciplinary collaboration between faculty and students, with document management and progress tracking.
* **Key Functionalities:**
  * Research project management with `title`, `abstract`, detailed `description`, `field`, and structured `startDate`/`endDate`.
  * Project status lifecycle: `planning` → `active` → `completed` | `on_hold`.
  * Progress tracking via a numeric `progress` percentage field (0–100).
  * Visibility levels: `public` (discoverable by all), `department` (within department), or `private`.
  * Collaborator management: join (`POST /research/:projectId/collaborate`) and leave (`DELETE /research/:projectId/collaborate`) a project.
  * Document upload and management: attach research documents (`POST /research/:projectId/documents`) with file type validation (`validateAndSaveFile` middleware), and delete individual documents.
  * Tag-based categorization for discoverability.

### 4.7 Direct & Group Messaging

* **Description:** A real-time private communication layer supporting one-on-one and group conversations.
* **Key Functionalities:**
  * Conversation creation supporting `direct` (2-person) and `group` (multi-participant) types.
  * Group conversations carry an optional `title` and track the `createdBy` user.
  * Message types: `text`, `image`, and `file` attachments (via `attachmentUrl`).
  * Soft-delete of individual messages (`isDeleted: true`) without removing the record from the database.
  * Real-time message delivery via Socket.io (`socket.io-client` on both web and mobile).
  * Paginated message history per conversation (`GET /messaging/:conversationId/messages`).
  * Database indexed on `[conversationId, createdAt]` for efficient pagination and on `[senderId]` for sender history.

### 4.8 Notifications

* **Description:** An in-app notification center that surfaces relevant platform events to users in real time.
* **Key Functionalities:**
  * Notification categories: `message`, `connection`, `job`, `event`, `mention`, and `system`.
  * Read/unread state management with `isRead` flag and `readAt` timestamp.
  * Database indexed on `[userId, isRead]` for O(1) unread badge counts and `[userId, createdAt]` for paginated history.
  * Push notification support on mobile via `expo-notifications`.
  * Push subscription model (`PushSubscription` entity in notification service).

### 4.9 Analytics Dashboard

* **Description:** An administrative reporting interface providing platform-wide activity intelligence, accessible to admin-role users.
* **Key Functionalities:**
  * Time-series active user chart filtered by `week`, `month`, or `year` period.
  * Activity breakdown by entity type (`post`, `job`, `event`, `research`, `message`, `user`).
  * Popular content analysis (`GET /analytics/popular?entityType=post`).
  * Job activity statistics (total jobs posted, active listings).
  * Engagement metrics (posts created, platform-wide activity volume).
  * Summary stat cards: Total Users, Total Posts, Active Jobs, User Trends.
  * Visualized with Recharts: `AreaChart` (user activity over time), `BarChart` (activity by type), `PieChart` (content distribution).
  * Backend activity tracking: every significant user action across all services is recorded to the `activities` table via `POST /analytics/track` with IP address, user agent, entity type, entity ID, and arbitrary metadata.

### 4.10 Search

* **Description:** Cross-platform user discovery functionality.
* **Key Functionalities:**
  * Full-text user search by name, skills, department, or other profile attributes (`GET /users/search`).
  * Suggested connections surfacing (`GET /users/suggested`).

### 4.11 Settings & Personalization

* **Description:** User-controlled configuration for personal preferences, privacy, and notifications.
* **Key Functionalities:**
  * Profile editing: display name, bio, headline, profile picture upload.
  * Dark mode / light mode toggle (persisted via Redux `themeSlice`).
  * Notification preference toggles (email, push, connections, messages, jobs).
  * Privacy settings: profile visibility, email visibility, connection list visibility.

---

## 5. Data Models & Entities

| Entity | Service DB | Key Fields & Notes |
|---|---|---|
| **User** | `decp_auth` | `id` (UUIDv4), `email` (unique), `password` (bcrypt), `firstName`, `lastName`, `role` (student/alumni/faculty/admin), `department`, `graduationYear`, `isEmailVerified`, `isActive`, `googleId`, `profilePicture`, `passwordResetToken`, `passwordResetExpires` |
| **RefreshToken** | `decp_auth` | Links token string to `userId`; expires after 7 days |
| **Profile** | `decp_users` | `userId` (1:1 with User), `bio`, `headline`, `location`, `website`, `skills[]`, `interests[]`, `education[]` (JSONB), `experience[]` (JSONB), `socialLinks` (JSONB), `certifications[]` (JSONB), `endorsements` (Record<skill, userId[]>), `openToWork`, `featuredPostId` |
| **Connection** | `decp_users` | `followerId`, `followingId`, `status` (pending/accepted/blocked); composite unique on `[followerId, followingId]` |
| **Post** | `decp_feed` | `userId`, `author` (JSONB snapshot), `content`, `mediaUrls[]`, `type` (text/image/video/document/poll/share), `likes`, `comments`, `shares`, `isPublic`, `pollOptions[]`, `pollEndsAt`, `originalPostId`, `sharedBy` |
| **Comment** | `decp_feed` | Linked to `postId`; threaded discussion on posts |
| **Like** | `decp_feed` | `postId` + `userId`; prevents duplicate likes |
| **Bookmark** | `decp_feed` | `postId` + `userId`; saved post reference |
| **Share** | `decp_feed` | Tracks share events; `originalPostId` reference |
| **Job** | `decp_jobs` | `title`, `description`, `company`, `location`, `type` (full-time/part-time/contract/internship/remote), `salary` (JSONB: min/max/currency/period), `requirements[]`, `skills[]`, `postedBy`, `status` (active/closed/draft), `expiresAt` |
| **Application** | `decp_jobs` | `jobId`, `userId`, `resumeUrl`, `coverLetter`, `status` (pending/reviewing/interview/offered/rejected/withdrawn), `answers` (JSONB); unique on `[jobId, userId]` |
| **Event** | `decp_events` | `title`, `description`, `type` (webinar/workshop/seminar/networking/career_fair/other), `startDate`, `endDate`, `location`, `isVirtual`, `meetingLink`, `organizerId`, `capacity`, `coverImage`, `status` (draft/published/cancelled/completed), `tags[]` |
| **RSVP** | `decp_events` | Links `eventId` to `userId`; tracks attendance commitments |
| **ResearchProject** | `decp_research` | `title`, `abstract`, `description`, `status` (planning/active/completed/on_hold), `leadResearcherId`, `collaborators[]`, `tags[]`, `visibility` (public/private/department), `documents[]`, `progress` (0–100%), `field`, `coverImage` |
| **Conversation** | `decp_messaging` | `type` (direct/group), `title` (groups), `participants[]`, `createdBy` |
| **Message** | `decp_messaging` | `conversationId`, `senderId`, `content`, `type` (text/image/file), `attachmentUrl`, `isDeleted` (soft-delete) |
| **Notification** | `decp_notifications` | `userId`, `type` (message/connection/job/event/mention/system), `title`, `body`, `data` (JSONB), `isRead`, `readAt` |
| **PushSubscription** | `decp_notifications` | Stores mobile/web push subscription endpoints per user |
| **Activity** | `decp_analytics` | `userId`, `action`, `entityType` (user/post/job/event/research/message), `entityId`, `metadata` (JSONB), `ipAddress`, `userAgent` — append-only audit log |

---

## 6. Integrations & External Services

| Integration | Purpose | Notes |
|---|---|---|
| **Google OAuth 2.0** | Social login via `passport-google-oauth20` | Requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables. Gracefully degrades if not configured. |
| **Nodemailer (SMTP)** | Transactional emails: email verification and password reset links | Requires external SMTP credentials. Currently produces an error without valid SMTP config (known issue in `SYSTEM_CONTEXT.md`). |
| **AWS S3** | Static asset and media file storage | S3 bucket provisioned via Terraform module; CORS origin allowlist in `api-gateway/src/server.ts` includes `decp-platform-frontend-dev.s3-website-us-east-1.amazonaws.com`. |
| **AWS CloudFront** | CDN for frontend static asset delivery | Provisioned in Terraform infrastructure. |
| **AWS Elastic Container Registry (ECR)** | Docker image registry for all microservice containers | Managed via Terraform `ecr` module. |
| **AWS ECS (Fargate)** | Serverless container execution of all 10 microservices | Provisioned per-service via Terraform `ecs` module. |
| **AWS RDS (PostgreSQL)** | Managed production PostgreSQL database | `db.t3.micro` default instance; provisioned via Terraform `rds` module. |
| **AWS ALB (Application Load Balancer)** | Load balancing across ECS service instances | Provisioned via Terraform `alb` module. |
| **Prometheus + Grafana** | Infrastructure and application performance monitoring | Configuration files present in `infrastructure/monitoring/`. |
| **Loki** | Centralized log aggregation | Configuration in `infrastructure/monitoring/loki-config.yml`. |
| **GitHub Actions** | CI/CD pipeline: lint, test, build Docker images, deploy to AWS ECS | Five workflows: `ci.yml`, `cd-backend.yml`, `cd-frontend.yml`, `cd-mobile.yml`, `security-scan.yml`. |
| **Socket.io** | Real-time messaging and live feed updates | Used in both the React web frontend and React Native mobile app. |

---

