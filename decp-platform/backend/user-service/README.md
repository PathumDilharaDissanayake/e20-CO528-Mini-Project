# DECP User Service

User profile and connections microservice for the DECP Platform.

## Features

- **User Profiles**: Extended profile information
- **Education & Experience**: Academic and work history
- **Skills & Interests**: User expertise and interests
- **Connections**: Follow/following system
- **Social Links**: External profile links

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | 3002 |
| `DB_*` | Database configuration | - |

## API Endpoints

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/search` | Search users |
| GET | `/` | List users |
| GET | `/me` | Get current user profile |
| GET | `/:userId` | Get user by ID |
| PUT | `/me` | Update profile |
| DELETE | `/:userId` | Delete user |

### Connections
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/connections` | Get connections |
| GET | `/connections/:userId/status` | Check connection status |
| POST | `/connections/:userId/follow` | Follow user |
| DELETE | `/connections/:userId/unfollow` | Unfollow user |

## Development

```bash
npm install
npm run dev
```
