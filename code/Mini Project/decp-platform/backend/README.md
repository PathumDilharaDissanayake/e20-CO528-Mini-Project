# DECP Platform Backend

Microservices backend for the Department Engagement & Career Platform (DECP).

## Architecture

```
┌─────────────────┐     ┌─────────────────────────────────────────────────────┐
│   API Gateway   │────▶│  Auth  │  User  │  Feed  │  Jobs  │  Events  │ ... │
│    (Port 3000)  │     │ (3001) │ (3002) │ (3003) │ (3004) │  (3005)  │     │
└─────────────────┘     └─────────────────────────────────────────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │    PostgreSQL   │
                        └─────────────────┘
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| API Gateway | 3000 | Entry point, routing, auth middleware |
| Auth Service | 3001 | Authentication, JWT, OAuth |
| User Service | 3002 | Profiles, connections |
| Feed Service | 3003 | Posts, likes, comments |
| Jobs Service | 3004 | Job postings, applications |
| Events Service | 3005 | Events, RSVPs |
| Research Service | 3006 | Research projects |
| Messaging Service | 3007 | Real-time chat |
| Notification Service | 3008 | Push, email, in-app |
| Analytics Service | 3009 | Metrics, tracking |

## Quick Start

### Using Docker Compose

1. Copy environment file:
```bash
cp .env.example .env
# Edit .env with your values
```

2. Start all services:
```bash
docker-compose up -d
```

3. Access API at `http://localhost:3000`

### Development

```bash
# Install dependencies and run each service
cd <service-name>
npm install
npm run dev
```

## API Endpoints

All endpoints are prefixed with `/api/v1/` through the gateway:

| Endpoint | Service | Auth Required |
|----------|---------|---------------|
| `/api/v1/auth/*` | Auth | No |
| `/api/v1/users/*` | User | Yes |
| `/api/v1/feed/*` | Feed | Optional |
| `/api/v1/jobs/*` | Jobs | Optional |
| `/api/v1/events/*` | Events | Optional |
| `/api/v1/research/*` | Research | Optional |
| `/api/v1/messaging/*` | Messaging | Yes |
| `/api/v1/notifications/*` | Notification | Yes |
| `/api/v1/analytics/*` | Analytics | Yes |

## Database

Each service has its own database:
- `decp_auth` - Authentication data
- `decp_users` - User profiles
- `decp_feed` - Posts and interactions
- `decp_jobs` - Job listings
- `decp_events` - Events and RSVPs
- `decp_research` - Research projects
- `decp_messaging` - Messages
- `decp_notifications` - Notifications
- `decp_analytics` - Activity logs

## Health Checks

Each service exposes a `/health` endpoint for health monitoring.

## Environment Variables

See `.env.example` for required environment variables.
