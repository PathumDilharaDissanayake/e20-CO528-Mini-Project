# DECP Auth Service

Authentication and authorization microservice for the DECP Platform.

## Features

- **User Registration/Login**: Email/password authentication
- **JWT Tokens**: Access and refresh token mechanism
- **OAuth Integration**: Google OAuth 2.0
- **Email Verification**: Verify email addresses
- **Password Reset**: Secure password reset flow
- **Role-based Access**: Student, Alumni, Admin roles

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | 3001 |
| `DB_*` | Database configuration | - |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_REFRESH_SECRET` | Refresh token secret | - |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | - |
| `SMTP_*` | Email SMTP configuration | - |

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Register new user | No |
| POST | `/login` | Login user | No |
| POST | `/refresh` | Refresh access token | No |
| POST | `/logout` | Logout user | No |
| POST | `/verify-email` | Verify email | No |
| POST | `/forgot-password` | Request password reset | No |
| POST | `/reset-password` | Reset password | No |
| GET | `/me` | Get current user | Yes |
| GET | `/google` | Google OAuth | No |
| GET | `/google/callback` | Google OAuth callback | No |

## Development

```bash
npm install
npm run dev
```

## Database Setup

```bash
npm run db:sync
```
