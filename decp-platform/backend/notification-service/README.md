# DECP Notification Service

Notifications microservice for the DECP Platform.

## Features

- **In-App Notifications**: Persistent notification storage
- **Push Notifications**: Web push support
- **Email Notifications**: SMTP integration
- **Notification Types**: Message, connection, job, event alerts

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List notifications |
| POST | `/` | Create notification |
| PUT | `/read-all` | Mark all as read |
| PUT | `/:id/read` | Mark as read |
| POST | `/push/subscribe` | Subscribe to push |
| POST | `/push/unsubscribe` | Unsubscribe push |

## Development

```bash
npm install
npm run dev
```
