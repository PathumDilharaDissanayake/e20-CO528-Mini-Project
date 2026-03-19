# DECP Research Service

Research projects and collaboration microservice for the DECP Platform.

## Features

- **Project Management**: Research project tracking
- **Document Sharing**: Upload and share research documents
- **Collaborators**: Multi-user research teams
- **Visibility Control**: Public, private, or department-only

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List projects |
| POST | `/` | Create project |
| GET | `/:projectId` | Get project |
| PUT | `/:projectId` | Update project |
| DELETE | `/:projectId` | Delete project |
| POST | `/:projectId/documents` | Add document |

## Development

```bash
npm install
npm run dev
```
