# DECP Messaging Service

Real-time messaging microservice with Socket.io support.

## Features

- **Direct Messaging**: One-on-one conversations
- **Group Chat**: Multi-user group conversations
- **Real-time**: Socket.io for instant message delivery
- **Message History**: Persistent message storage

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | 3007 |
| `DB_*` | Database configuration | - |
| `JWT_SECRET` | JWT secret | - |
| `REDIS_URL` | Redis URL | - |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List conversations |
| POST | `/` | Create conversation |
| GET | `/:id/messages` | Get messages |
| POST | `/:id/messages` | Send message |

## Socket.io Events

| Event | Description |
|-------|-------------|
| `join_conversation` | Join a conversation room |
| `send_message` | Send a real-time message |
| `typing` | Typing indicator |
| `new_message` | Receive new messages |

## Development

```bash
npm install
npm run dev
```
