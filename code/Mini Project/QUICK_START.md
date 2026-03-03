# DECP Platform - Quick Start Guide

## Easiest Way to Run Locally

### Option 1: Double-Click to Run (Windows)

1. **Double-click** this file: `RUN_LOCAL.bat`
2. Wait 2-3 minutes for setup
3. Browser will open automatically at http://localhost:5173

That's it!

---

### Option 2: PowerShell Script

1. Right-click on `RUN_LOCAL.ps1`
2. Select "Run with PowerShell"
3. Wait 2-3 minutes for setup
4. Browser will open automatically at http://localhost:5173

---

### Option 3: Manual Step-by-Step

If you prefer to run each step manually, follow these instructions:

#### Prerequisites
- Docker Desktop installed and running
- Node.js 20+ installed

#### Step 1: Start Backend Services

Open PowerShell and run:

```powershell
cd "E:\Academic\Semester_7\CO528\Mini Project\decp-platform\backend"

# Create environment file (first time only)
@"
JWT_SECRET=decp-super-secret-jwt-key-for-development-only
JWT_REFRESH_SECRET=decp-refresh-secret-key-for-development-only
"@ | Out-File -FilePath ".env" -Encoding utf8

# Start all services
docker-compose up -d
```

Wait 2-3 minutes for services to start.

**Verify services are running:**
```powershell
docker ps
```

You should see 10+ containers running.

#### Step 2: Start Frontend

Open a NEW PowerShell window and run:

```powershell
cd "E:\Academic\Semester_7\CO528\Mini Project\decp-platform\frontend"

# Install dependencies (first time only)
npm install

# Create environment file (first time only)
@"
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3007
"@ | Out-File -FilePath ".env" -Encoding utf8

# Start development server
npm run dev
```

The web app will open at http://localhost:5173

---

## Access URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Web App** | http://localhost:5173 | Main application |
| **API Gateway** | http://localhost:3000 | Backend API |
| **Auth Service** | http://localhost:3001 | Authentication |
| **User Service** | http://localhost:3002 | User management |
| **Feed Service** | http://localhost:3003 | Social feed |
| **PostgreSQL** | localhost:5432 | Database |
| **Redis** | localhost:6379 | Cache |

---

## Test the Application

### 1. Register a New Account
1. Go to http://localhost:5173
2. Click "Register" or "Sign Up"
3. Fill in:
   - Email: test@example.com
   - Password: Password123!
   - Name: Your name
   - Role: Student or Alumni

### 2. Login
1. Go to http://localhost:5173/login
2. Enter your email and password
3. Click "Login"

### 3. Create Your First Post
1. On the Feed page, click "What's on your mind?"
2. Type some text
3. Click "Post"
4. See your post appear in the feed!

---

## Troubleshooting

### Docker not running
```powershell
# Check if Docker is running
docker info

# If error, start Docker Desktop application
```

### Port already in use
```powershell
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <PID> /F
```

### Database connection error
```powershell
# Check if PostgreSQL container is running
docker ps | findstr postgres

# View PostgreSQL logs
docker logs decp-postgres
```

### Frontend won't start
```powershell
# Clear node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install
npm run dev
```

---

## Start Mobile App (Optional)

Open a third PowerShell window:

```powershell
cd "E:\Academic\Semester_7\CO528\Mini Project\decp-platform\mobile"

# Install dependencies (first time only)
npm install

# Start Expo
npx expo start
```

Then:
- Press 'i' for iOS simulator (Mac only)
- Press 'a' for Android emulator
- Or scan QR code with Expo Go app on your phone

---

## Stop Everything

### Stop Frontend
Press Ctrl+C in the frontend terminal window

### Stop Backend
```powershell
cd "E:\Academic\Semester_7\CO528\Mini Project\decp-platform\backend"
docker-compose down
```

Or simply close all PowerShell windows and Docker Desktop will stop the containers.

---

## Useful Commands

### Check running containers
```powershell
docker ps
```

### View logs
```powershell
# API Gateway logs
docker logs decp-api-gateway -f

# Auth service logs
docker logs decp-auth-service -f

# All services
docker-compose logs -f
```

### Restart a service
```powershell
docker-compose restart auth-service
```

### Access database
```powershell
docker exec -it decp-postgres psql -U postgres -d decp_auth
```

---

## Verification Checklist

After running, verify:

- [ ] Docker containers are running (docker ps)
- [ ] Web app loads at http://localhost:5173
- [ ] Can register a new account
- [ ] Can login
- [ ] Can create a post
- [ ] API responds at http://localhost:3000/health

---

## Need Help?

If you encounter issues:

1. Check Docker Desktop is running
2. Ensure ports 3000-3010 and 5173 are free
3. Check the logs: docker-compose logs
4. Restart: docker-compose down then docker-compose up -d

---

**Enjoy using DECP Platform!**
