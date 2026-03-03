# DECP Platform - Complete Fixes and User Guide

## 🔧 Fixes Applied

### 1. API Configuration Fixes

#### Frontend Environment Variables (`.env`)
```
VITE_API_URL=http://localhost:3000/api/v1
VITE_SOCKET_URL=http://localhost:3007
```
- Fixed from `/api` to `/api/v1` to match API Gateway routes

#### Vite Configuration (`vite.config.ts`)
- Changed port from `3000` to `5173` to avoid conflict with API Gateway
- Added proxy configuration for `/api` to route to gateway

#### API Gateway Proxy Routes (`proxyRoutes.ts`)
- Added `/api/v1/posts` route to feed service with proper path rewrite
- Added `/api/v1/conversations` route for messaging
- Fixed all service routing to match frontend expectations

### 2. Authentication Flow Fixes

#### Auth API Service (`authApi.ts`)
- Updated response types to match backend format:
  - `accessToken` instead of `token`
  - `refreshToken` included
- Added proper logout mutation with refresh token

#### Auth Slice (`authSlice.ts`)
- Added `refreshToken` state and persistence
- Added `updateToken` action for token refresh

#### Login/Register Pages
- Updated to handle new token format (`accessToken`, `refreshToken`)
- Added proper error handling with user-friendly messages
- Added password strength indicator on registration

#### useAuth Hook
- Added automatic token refresh on 401 errors
- Proper logout flow with API call

### 3. UI/UX Improvements

#### App.tsx
- Added proper route structure with catch-all 404 page
- Improved protected route handling with loading states
- Added proper redirects for authenticated users

#### Login Page
- Better error handling with auto-dismiss
- Demo credentials section
- Improved form validation feedback
- Auto-focus on email field

#### Register Page
- Multi-step registration flow
- Password strength indicator
- Real-time validation
- Better error messages

#### Feed Page
- Modal-based post creation
- Better loading states
- Error handling with retry
- Empty state with CTA

#### CreatePost Component
- Modal support
- File upload with validation
- Character counter
- Better error handling

#### ErrorState Component
- New component for error display
- Consistent styling across pages

### 4. Backend Route Fixes

#### Feed Service Routes
- Routes mounted at `/` so `/api/v1/posts` maps correctly
- Supports both `/api/v1/posts` and `/api/v1/feed`

#### Auth Service Response Format
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

## 🚀 How to Start the Platform

### Prerequisites
1. Docker Desktop running
2. Node.js 20+ installed
3. All ports available: 3000-3009, 5173, 5433

### Quick Start
1. **Double-click** `START_PLATFORM.bat`
2. Wait for all services to start (2-3 minutes)
3. Browser will open automatically at http://localhost:5173

### Manual Start (if batch file fails)
```powershell
# 1. Start Docker infrastructure
docker start decp-postgres decp-redis decp-rabbitmq

# 2. Start each service in separate terminals:
cd decp-platform\backend\api-gateway && npm run dev      # Port 3000
cd decp-platform\backend\auth-service && npm run dev    # Port 3001
cd decp-platform\backend\user-service && npm run dev    # Port 3002
cd decp-platform\backend\feed-service && npm run dev    # Port 3003
cd decp-platform\backend\jobs-service && npm run dev    # Port 3004
cd decp-platform\backend\events-service && npm run dev  # Port 3005
cd decp-platform\backend\research-service && npm run dev # Port 3006
cd decp-platform\backend\messaging-service && npm run dev # Port 3007
cd decp-platform\backend\notification-service && npm run dev # Port 3008
cd decp-platform\backend\analytics-service && npm run dev # Port 3009

# 3. Start frontend
cd decp-platform\frontend && npm run dev                # Port 5173
```

## 🧪 User Stories Testing Guide

### Story 1: User Registration and Login
**As a** student/alumni, **I want to** create an account and login

#### Test Steps:
1. Navigate to http://localhost:5173
2. Click "Sign Up" link
3. Fill registration form:
   - Step 1: Email, Password, Confirm Password
   - Step 2: First Name, Last Name, Role
   - Step 3: Department, Graduation Year (if student/alumni)
4. Click "Sign Up"
5. Verify redirect to Feed page
6. Logout via profile menu
7. Login with credentials

#### Expected Result:
- ✅ Account created successfully
- ✅ Redirected to Feed page after registration
- ✅ Can login with credentials
- ✅ JWT token stored in localStorage

### Story 2: Create and View Posts
**As a** user, **I want to** create posts and view my feed

#### Test Steps:
1. Login to the platform
2. Click "What's on your mind?" on Feed page
3. Type post content
4. Optionally add images/videos
5. Click "Post"
6. Verify post appears in feed
7. Like the post
8. Add a comment

#### Expected Result:
- ✅ Post created and displayed
- ✅ Media uploads work
- ✅ Like functionality works
- ✅ Comments work

### Story 3: Jobs and Applications
**As an** alumni, **I want to** post jobs and as a student apply to them

#### Test Steps:
1. Login as alumni
2. Navigate to Jobs page
3. Click "Post Job"
4. Fill job details and submit
5. Login as student (different account)
6. Navigate to Jobs page
7. Find the posted job
8. Click "Apply"
9. Submit application

#### Expected Result:
- ✅ Alumni can post jobs
- ✅ Students can view jobs
- ✅ Application process works
- ✅ Status updates reflect correctly

### Story 4: Events and RSVP
**As a** user, **I want to** create events and RSVP to them

#### Test Steps:
1. Login as faculty/alumni
2. Navigate to Events page
3. Create new event
4. Login as student
5. Find the event
6. Click "RSVP"
7. Verify attendance count

#### Expected Result:
- ✅ Event creation works
- ✅ RSVP functionality works
- ✅ Attendee count updates

### Story 5: Research Collaboration
**As a** faculty member, **I want to** create research projects

#### Test Steps:
1. Login as faculty
2. Navigate to Research page
3. Create new research project
4. Add collaborators
5. Upload documents

#### Expected Result:
- ✅ Research project created
- ✅ Collaborators can be added
- ✅ Document upload works

### Story 6: Messaging
**As a** user, **I want to** message other users

#### Test Steps:
1. Login
2. Navigate to Messages page
3. Start new conversation
4. Send message
5. Verify real-time delivery

#### Expected Result:
- ✅ Conversations list loads
- ✅ Messages send and receive
- ✅ Real-time updates via Socket.io

### Story 7: Notifications
**As a** user, **I want to** receive notifications for activities

#### Test Steps:
1. Login as User A
2. Have User B like/comment on your post
3. Verify notification badge updates
4. Click notifications icon
5. View notification details

#### Expected Result:
- ✅ Notifications received
- ✅ Badge count updates
- ✅ Click navigates to relevant content

## 🔍 Troubleshooting

### Issue: "Cannot connect to backend"
**Solution:**
1. Check if API Gateway is running on port 3000
2. Verify Docker containers are running: `docker ps`
3. Check browser console for CORS errors

### Issue: "Authentication failed"
**Solution:**
1. Clear localStorage and cookies
2. Refresh the page
3. Try logging in again

### Issue: "Page not loading"
**Solution:**
1. Check if all services are running
2. Verify database connection: `docker logs decp-postgres`
3. Restart the service that's failing

### Issue: "Changes not reflecting"
**Solution:**
1. Clear browser cache (Ctrl+Shift+R)
2. Restart frontend dev server
3. Check ts-node cache: `rmdir /s /q %TEMP%\ts-node-*`

## 📊 Service Status Check

Run this to check all services:
```batch
START_PLATFORM.bat
```

Or manually check each:
- API Gateway: http://localhost:3000/health
- Auth Service: http://localhost:3001/health
- Feed Service: http://localhost:3003/health

## 📝 API Endpoints Reference

| Service | Base Path | Endpoint |
|---------|-----------|----------|
| Auth | `/api/v1/auth` | POST /login, POST /register |
| Users | `/api/v1/users` | GET /profile, PUT /profile |
| Posts | `/api/v1/posts` | GET /, POST /, /:id/like |
| Jobs | `/api/v1/jobs` | GET /, POST /, /:id/apply |
| Events | `/api/v1/events` | GET /, POST /, /:id/rsvp |
| Research | `/api/v1/research` | GET /, POST / |
| Messaging | `/api/v1/messaging` | GET /conversations |
| Notifications | `/api/v1/notifications` | GET /, PUT /:id/read |
| Analytics | `/api/v1/analytics` | GET /dashboard |

---

**Last Updated:** March 1, 2026
**Status:** ✅ All fixes applied and tested
