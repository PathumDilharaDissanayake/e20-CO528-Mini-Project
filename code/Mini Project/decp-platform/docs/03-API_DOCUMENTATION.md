# DECP Platform - API Documentation

## Base URL
```
Production: https://api.decp.eng.pdn.ac.lk/v1
Development: http://localhost:3000/api
```

## Authentication

### JWT Token
All API requests (except login/register) require a valid JWT token in the Authorization header:
```
Authorization: Bearer <access_token>
```

### Token Refresh
When access token expires, use the refresh token to get a new one:
```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "<refresh_token>"
}
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

## Rate Limiting
- 100 requests per minute per IP
- 1000 requests per minute per authenticated user

---

## Auth Service

### POST /api/auth/register
Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student",
  "department": "Computer Engineering",
  "batch": "2020"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student",
      "isEmailVerified": false
    },
    "message": "Verification email sent"
  }
}
```

### POST /api/auth/login
Authenticate user and get tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token",
      "expiresIn": 900
    }
  }
}
```

### POST /api/auth/logout
Logout user and invalidate tokens.

**Request:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

### POST /api/auth/forgot-password
Request password reset email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

### POST /api/auth/reset-password
Reset password with token.

**Request:**
```json
{
  "token": "reset_token",
  "password": "NewPassword123!"
}
```

### POST /api/auth/verify-email
Verify email address.

**Request:**
```json
{
  "token": "verification_token"
}
```

### GET /api/auth/google
Initiate Google OAuth flow.

### GET /api/auth/google/callback
Google OAuth callback.

---

## User Service

### GET /api/users/profile
Get current user profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student",
    "avatar": "https://cdn.example.com/avatar.jpg",
    "bio": "Software engineering enthusiast",
    "department": "Computer Engineering",
    "batch": "2020",
    "skills": ["JavaScript", "Python", "React"],
    "connections": 150,
    "posts": 45
  }
}
```

### PUT /api/users/profile
Update user profile.

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "bio": "Updated bio",
  "skills": ["JavaScript", "Python", "React", "Node.js"]
}
```

### POST /api/users/avatar
Upload profile avatar.

**Request:** Multipart form data with `avatar` field

### GET /api/users/:id
Get user by ID.

### GET /api/users/search?query=:query
Search users by name, email, or skills.

### POST /api/users/:id/connect
Send connection request.

### PUT /api/users/connections/:id/accept
Accept connection request.

### GET /api/users/connections
Get user's connections.

---

## Feed Service

### GET /api/posts
Get news feed posts.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `sort` (string): Sort by (latest, popular)

**Response:**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "uuid",
        "author": {
          "id": "uuid",
          "firstName": "John",
          "lastName": "Doe",
          "avatar": "url"
        },
        "content": "Post content",
        "media": ["url1", "url2"],
        "likes": 42,
        "comments": 10,
        "shares": 5,
        "isLiked": true,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "hasMore": true
    }
  }
}
```

### POST /api/posts
Create a new post.

**Request:**
```json
{
  "content": "Post content",
  "media": ["base64_or_url"]
}
```

### GET /api/posts/:id
Get post by ID with comments.

### PUT /api/posts/:id
Update post.

### DELETE /api/posts/:id
Delete post.

### POST /api/posts/:id/like
Like/unlike post.

### POST /api/posts/:id/comments
Add comment to post.

**Request:**
```json
{
  "content": "Comment content"
}
```

### POST /api/posts/:id/share
Share post.

---

## Jobs Service

### GET /api/jobs
Get job listings.

**Query Parameters:**
- `page`, `limit`: Pagination
- `type`: Job type (full-time, part-time, internship, contract)
- `location`: Location filter
- `remote`: Remote allowed (true/false)
- `keywords`: Search keywords

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "uuid",
        "title": "Software Engineer",
        "company": "Tech Corp",
        "location": "Colombo",
        "type": "full-time",
        "remote": true,
        "description": "Job description...",
        "requirements": ["React", "Node.js"],
        "salary": { "min": 50000, "max": 100000, "currency": "LKR" },
        "postedBy": { "id": "uuid", "name": "John Doe" },
        "postedAt": "2024-01-15T10:30:00Z",
        "deadline": "2024-02-15T23:59:59Z"
      }
    ]
  }
}
```

### POST /api/jobs
Create job posting (Alumni/Admin only).

**Request:**
```json
{
  "title": "Software Engineer",
  "company": "Tech Corp",
  "location": "Colombo",
  "type": "full-time",
  "remote": true,
  "description": "Detailed description",
  "requirements": ["React", "Node.js", "3+ years experience"],
  "salary": { "min": 50000, "max": 100000, "currency": "LKR" },
  "deadline": "2024-02-15T23:59:59Z"
}
```

### GET /api/jobs/:id
Get job details.

### POST /api/jobs/:id/apply
Apply for job.

**Request:**
```json
{
  "coverLetter": "Cover letter text",
  "resume": "file_url_or_base64"
}
```

### GET /api/jobs/applications
Get user's job applications.

### GET /api/jobs/:id/applications
Get applications for a job (Poster only).

### PUT /api/jobs/applications/:id/status
Update application status.

**Request:**
```json
{
  "status": "accepted",
  "message": "Congratulations!"
}
```

---

## Events Service

### GET /api/events
Get events list.

**Query Parameters:**
- `page`, `limit`: Pagination
- `type`: Event type (workshop, seminar, networking, other)
- `upcoming`: Show only upcoming events

**Response:**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "uuid",
        "title": "Career Workshop",
        "description": "Learn about career opportunities...",
        "type": "workshop",
        "startDate": "2024-02-01T09:00:00Z",
        "endDate": "2024-02-01T17:00:00Z",
        "location": "Faculty Hall",
        "virtualLink": "https://meet.example.com/xyz",
        "capacity": 100,
        "registered": 75,
        "image": "https://cdn.example.com/event.jpg",
        "createdBy": { "id": "uuid", "name": "John Doe" },
        "isRegistered": false
      }
    ]
  }
}
```

### POST /api/events
Create event (Admin/Faculty only).

### GET /api/events/:id
Get event details.

### POST /api/events/:id/rsvp
Register for event.

**Request:**
```json
{
  "attendees": 2
}
```

### DELETE /api/events/:id/rsvp
Cancel RSVP.

---

## Research Service

### GET /api/research
Get research projects.

### POST /api/research
Create research project.

**Request:**
```json
{
  "title": "AI in Healthcare",
  "description": "Research on AI applications...",
  "field": "Artificial Intelligence",
  "status": "active",
  "collaborators": ["user_id_1", "user_id_2"]
}
```

### GET /api/research/:id
Get project details.

### POST /api/research/:id/documents
Upload document.

### POST /api/research/:id/invite
Invite collaborator.

---

## Messaging Service

### GET /api/conversations
Get user's conversations.

**Response:**
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "uuid",
        "type": "direct",
        "participants": [{ "id": "uuid", "name": "Jane Doe", "avatar": "url" }],
        "lastMessage": {
          "content": "Hello!",
          "timestamp": "2024-01-15T10:30:00Z",
          "isRead": false
        },
        "unreadCount": 3
      }
    ]
  }
}
```

### POST /api/conversations
Create new conversation.

### GET /api/conversations/:id/messages
Get messages in conversation.

### POST /api/conversations/:id/messages
Send message.

**WebSocket:** `ws://localhost:3007/socket.io`

---

## Notification Service

### GET /api/notifications
Get user notifications.

### PUT /api/notifications/:id/read
Mark notification as read.

### PUT /api/notifications/read-all
Mark all notifications as read.

### PUT /api/notifications/preferences
Update notification preferences.

---

## Analytics Service

### GET /api/analytics/dashboard
Get admin dashboard data.

**Response:**
```json
{
  "success": true,
  "data": {
    "activeUsers": {
      "daily": 450,
      "weekly": 1200,
      "monthly": 3500
    },
    "popularPosts": [...],
    "jobStats": {
      "totalJobs": 150,
      "applications": 500,
      "acceptanceRate": 25
    },
    "engagement": {
      "posts": 1200,
      "comments": 3500,
      "likes": 15000
    }
  }
}
```

### GET /api/analytics/users
Get user analytics.

### GET /api/analytics/posts
Get post analytics.

### GET /api/analytics/jobs
Get job analytics.

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 429 | Rate Limit Exceeded |
| 500 | Internal Server Error |

## HTTP Status Codes

| Status | Meaning |
|--------|---------|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Unprocessable Entity |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
