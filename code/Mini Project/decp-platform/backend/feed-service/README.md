# DECP Feed Service

Social feed and content microservice for the DECP Platform.

## Features

- **Post Creation**: Text, images, videos, documents
- **News Feed**: Chronological and algorithmic feeds
- **Interactions**: Like, comment, share
- **Media Upload**: File handling with size limits

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | 3003 |
| `DB_*` | Database configuration | - |
| `UPLOAD_DIR` | Upload directory | uploads |
| `MAX_FILE_SIZE` | Max upload size | 10485760 |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/feed` | Get news feed |
| POST | `/` | Create post |
| GET | `/:postId` | Get post details |
| PUT | `/:postId` | Update post |
| DELETE | `/:postId` | Delete post |
| POST | `/:postId/like` | Like/unlike post |
| POST | `/:postId/share` | Share post |
| POST | `/:postId/comments` | Add comment |
| GET | `/:postId/comments` | Get comments |

## Development

```bash
npm install
npm run dev
```
