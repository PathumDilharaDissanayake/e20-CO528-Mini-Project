# DECP Analytics Service

Analytics and metrics microservice for the DECP Platform.

## Features

- **Activity Tracking**: User action logging
- **Dashboard Metrics**: Aggregated statistics
- **Popular Content**: Most viewed items
- **User Analytics**: Individual user activity

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/track` | Track activity |
| GET | `/dashboard` | Dashboard metrics |
| GET | `/users/:id/activity` | User activity |
| GET | `/popular` | Popular content |

## Development

```bash
npm install
npm run dev
```
