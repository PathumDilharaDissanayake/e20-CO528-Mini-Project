# DECP Jobs Service

Job postings and applications microservice for the DECP Platform.

## Features

- **Job Postings**: Create and manage job listings
- **Job Search**: Filter by type, location, skills
- **Applications**: Apply for jobs with resume
- **Application Tracking**: Track application status

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | 3004 |
| `DB_*` | Database configuration | - |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List jobs |
| POST | `/` | Create job |
| GET | `/:jobId` | Get job details |
| PUT | `/:jobId` | Update job |
| DELETE | `/:jobId` | Delete job |
| POST | `/:jobId/apply` | Apply for job |
| GET | `/applications` | My applications |
| PUT | `/applications/:id/status` | Update status |

## Development

```bash
npm install
npm run dev
```
