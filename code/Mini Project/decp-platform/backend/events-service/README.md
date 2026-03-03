# DECP Events Service

Events management microservice for the DECP Platform.

## Features

- **Event Management**: Create and manage events
- **RSVP System**: Track attendance
- **Event Types**: Webinars, workshops, networking, career fairs
- **Capacity Management**: Limited seating support

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List events |
| POST | `/` | Create event |
| GET | `/my-rsvps` | My RSVPs |
| GET | `/:eventId` | Get event |
| PUT | `/:eventId` | Update event |
| DELETE | `/:eventId` | Delete event |
| POST | `/:eventId/rsvp` | RSVP to event |

## Development

```bash
npm install
npm run dev
```
