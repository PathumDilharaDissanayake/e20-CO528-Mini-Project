# DECP API Gateway

The API Gateway serves as the single entry point for all client requests to the DECP microservices backend.

## Features

- **Request Routing**: Routes requests to appropriate microservices
- **Authentication**: JWT token validation
- **Rate Limiting**: Prevents abuse with configurable limits
- **CORS**: Cross-origin resource sharing configuration
- **Security**: Helmet.js for security headers
- **Health Checks**: Service health monitoring endpoints

## Architecture

```
Client -> API Gateway -> Microservices
              |
              v
        Authentication
        Rate Limiting
        Request Routing
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Gateway port | 3000 |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_REFRESH_SECRET` | JWT refresh secret | - |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 900000 |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |
| `*_SERVICE_URL` | Microservice URLs | - |

## Routes

| Route | Service | Auth Required |
|-------|---------|---------------|
| `/api/v1/auth/*` | Auth Service | No |
| `/api/v1/users/*` | User Service | Yes |
| `/api/v1/feed/*` | Feed Service | Optional |
| `/api/v1/jobs/*` | Jobs Service | Optional |
| `/api/v1/events/*` | Events Service | Optional |
| `/api/v1/research/*` | Research Service | Optional |
| `/api/v1/messaging/*` | Messaging Service | Yes |
| `/api/v1/notifications/*` | Notification Service | Yes |
| `/api/v1/analytics/*` | Analytics Service | Yes |

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm start
```

## Docker

```bash
docker build -t decp-api-gateway .
docker run -p 3000:3000 decp-api-gateway
```
