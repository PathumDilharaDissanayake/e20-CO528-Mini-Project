# DECP Platform - System Context

## Project Overview
DECP (Department Engagement & Career Platform) is a microservices-based full-stack application for university departments.

## Running Services (All Active)

| Service | Port | URL | Status |
|---------|------|-----|--------|
| API Gateway | 3000 | http://localhost:3000 | ✅ Running |
| Auth Service | 3001 | http://localhost:3001 | ✅ Running |
| User Service | 3002 | http://localhost:3002 | ✅ Running |
| Feed Service | 3003 | http://localhost:3003 | ✅ Running |
| Jobs Service | 3004 | http://localhost:3004 | ✅ Running |
| Events Service | 3005 | http://localhost:3005 | ✅ Running |
| Research Service | 3006 | http://localhost:3006 | ✅ Running |
| Messaging Service | 3007 | http://localhost:3007 | ✅ Running |
| Notification Service | 3008 | http://localhost:3008 | ✅ Running |
| Analytics Service | 3009 | http://localhost:3009 | ✅ Running |
| Frontend | 5173 | http://localhost:5173 | ✅ Running |
| PostgreSQL (Docker) | 5433 | localhost:5433 | ✅ Running |
| Redis (Docker) | 6379 | localhost:6379 | ✅ Running |

## Database Configuration
- PostgreSQL running on Docker port 5433 (external), mapped to 5432 (internal)
- Redis running on Docker port 6379
- All databases created: decp_auth, decp_users, decp_feed, decp_jobs, decp_events, decp_research, decp_messaging, decp_notifications, decp_analytics
- Password: 12345

## API Endpoints Tested
- POST /api/v1/auth/register - ✅ Working
- POST /api/v1/auth/login - ✅ Working
- GET /api/v1/jobs - ✅ Working
- GET /api/v1/events - ✅ Working
- GET /api/v1/research - ✅ Working
- GET /health (all services) - ✅ Working

## Known Issues
- Email service requires SMTP credentials (Nodemailer error for PLAIN auth)
- Feed service has some multer configuration issues with file uploads

## How to Start
Run `start.bat` from the project root to initialize all services.

## Test Credentials
- Email: demo@student.edu
- Password: demo123
