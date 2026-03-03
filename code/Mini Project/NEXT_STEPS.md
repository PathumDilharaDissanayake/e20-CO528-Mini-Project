# DECP Platform - Next Steps Guide

## Current Status

**Registration:** ✅ Working  
**Login:** ❌ Not working (token/refresh issues)  
**Feed/Posts:** ❌ Not working (404 errors)  
**Other services:** ❌ Not working (404 errors)

---

## What Was Fixed

### 1. Registration Issues (FIXED)
- Added `department` and `graduationYear` fields to User model
- Updated validation schema to accept 'faculty' role
- Fixed the auth controller to extract and save these fields
- Made validation more lenient

**Files modified:**
- `decp-platform/backend/auth-service/src/models/User.ts` - Added department and graduationYear columns
- `decp-platform/backend/auth-service/src/utils/validation.ts` - Added faculty role, lenient validation
- `decp-platform/backend/auth-service/src/controllers/authController.ts` - Extract new fields

### 2. API Gateway Routing (PARTIALLY FIXED)
- Fixed path rewrites in proxyRoutes.ts
- Changed from `'^/posts': ''` to `'^/api/v1/posts': ''`
- Applied to all services

**Files modified:**
- `decp-platform/backend/api-gateway/src/routes/proxyRoutes.ts`

---

## Issues to Fix Next

### Issue 1: Token Refresh Returns 500 Error
**Symptom:** After registration, the app tries to fetch user data (`GET /me`) and gets 401, then tries to refresh token (`POST /refresh`) and gets 500 Internal Server Error.

**Likely cause:** The refresh token endpoint has a bug or the database schema doesn't match the code.

**Next steps:**
1. Check auth service logs for the 500 error details
2. Verify the RefreshToken model is properly synced
3. Check if the refresh token is being saved correctly during registration

### Issue 2: API Gateway Returns 404 for All Services
**Symptom:** Calls to `/api/v1/feed`, `/api/v1/notifications`, etc. return 404.

**Likely cause:** The path rewriting might not be working correctly.

**Next steps:**
1. Verify the feed service is running on port 3003
2. Check the proxyRoutes.ts configuration
3. Test direct calls to services (bypass gateway) to confirm they work

### Issue 3: Frontend Calling Auth Service Directly
**Current state:** The frontend's authApi.ts calls `http://localhost:3001` directly instead of going through the API Gateway. This works for registration but bypasses gateway auth.

**Next steps:**
- Keep auth calls direct (port 3001) for now as it's working
- Fix other services to go through gateway (port 3000)

---

## How to Test

1. **Start services:**
   ```bash
   Correct_Launching_method.bat
   ```

2. **Clear browser localStorage:**
   - DevTools → Application → Local Storage
   - Clear all items

3. **Test registration:**
   - Go to http://localhost:5173/register
   - Fill form and submit
   - Should redirect to home page

4. **Check console errors:**
   - F12 → Console
   - Look for 401, 404, 500 errors

---

## Key Files

### Backend (Auth Service)
- `decp-platform/backend/auth-service/src/models/User.ts` - User model
- `decp-platform/backend/auth-service/src/models/RefreshToken.ts` - Refresh token model
- `decp-platform/backend/auth-service/src/controllers/authController.ts` - Auth endpoints
- `decp-platform/backend/auth-service/src/utils/validation.ts` - Joi validation
- `decp-platform/backend/auth-service/src/utils/jwt.ts` - Token generation

### Backend (API Gateway)
- `decp-platform/backend/api-gateway/src/routes/proxyRoutes.ts` - Service routing
- `decp-platform/backend/api-gateway/src/middleware/auth.ts` - JWT verification

### Frontend
- `decp-platform/frontend/src/services/authApi.ts` - Auth API calls (uses port 3001)
- `decp-platform/frontend/src/services/api.ts` - Other API calls (uses port 3000)
- `decp-platform/frontend/src/hooks/useAuth.ts` - Auth hook with token refresh

---

## Running Services Manually

If you need to restart individual services:

```bash
# Auth Service (port 3001)
cd decp-platform/backend/auth-service
npm run dev

# API Gateway (port 3000)
cd decp-platform/backend/api-gateway
npm run dev

# Feed Service (port 3003)
cd decp-platform/backend/feed-service
npm run dev

# Frontend (port 5173)
cd decp-platform/frontend
npm run dev
```

---

## Testing with curl

```bash
# Test registration
curl -X POST http://localhost:3001/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@test.com\",\"password\":\"password123\",\"firstName\":\"Test\",\"lastName\":\"User\",\"role\":\"student\"}"

# Test login
curl -X POST http://localhost:3001/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@test.com\",\"password\":\"password123\"}"
```

---

## Last Updated
2026-03-01
