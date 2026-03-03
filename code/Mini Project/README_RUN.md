# 🚀 How to Run DECP Platform - Fixed Version

## ✅ Fixes Applied

1. **Database Authentication** - Fixed PostgreSQL to allow connections with password "postgres"
2. **Missing Dependency** - Added `react-dropzone` to frontend package.json
3. **Service Configuration** - All services now auto-configure their .env files
4. **Simplified Startup** - One-click startup with `START.bat` or `START_HERE.bat`

---

## 🎯 Easiest Way - Just Double-Click!

### Method 1: Double-click START_HERE.bat
1. Navigate to: `E:\Academic\Semester_7\CO528\Mini Project\`
2. **Double-click** `START_HERE.bat`
3. Press `1` and Enter
4. Wait 3-5 minutes
5. Browser opens automatically at http://localhost:5173

### Method 2: Double-click START.bat
1. Navigate to: `E:\Academic\Semester_7\CO528\Mini Project\`
2. **Double-click** `START.bat`
3. Wait 3-5 minutes
4. Browser opens automatically

---

## 📋 What Happens When You Run

```
✅ Step 1: Check Docker is running
✅ Step 2: Check Node.js is installed
✅ Step 3: Start PostgreSQL in Docker
✅ Step 4: Start Redis in Docker
✅ Step 5: Start RabbitMQ in Docker
✅ Step 6: Create all databases
✅ Step 7: Start Auth Service (port 3001)
✅ Step 8: Start User Service (port 3002)
✅ Step 9: Start Feed Service (port 3003)
✅ Step 10: Start Jobs Service (port 3004)
✅ Step 11: Start Events Service (port 3005)
✅ Step 12: Start Research Service (port 3006)
✅ Step 13: Start Messaging Service (port 3007)
✅ Step 14: Start API Gateway (port 3000)
✅ Step 15: Install frontend dependencies
✅ Step 16: Start React frontend (port 5173)
✅ Step 17: Open browser
```

---

## 🌐 Access URLs

After running, you can access:

| Service | URL |
|---------|-----|
| **Web Application** | http://localhost:5173 |
| **API Gateway** | http://localhost:3000 |
| **Auth Service** | http://localhost:3001 |
| **PostgreSQL** | localhost:5432 (user: postgres, password: postgres) |
| **RabbitMQ UI** | http://localhost:15672 (admin/admin) |

---

## 🧪 Test the Application

1. **Open** http://localhost:5173
2. **Click Register** and create an account:
   - Email: test@example.com
   - Password: Password123!
   - Name: Test User
   - Role: Student
3. **Login** with your credentials
4. **Create a post** on the feed
5. **Explore** jobs, events, and other features

---

## 🛠️ If You Encounter Issues

### Issue: "Docker is not running"
**Fix:** Start Docker Desktop application first

### Issue: "Port already in use"
**Fix:** 
```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Issue: Frontend shows white screen
**Fix:** 
1. Press F12 in browser to open DevTools
2. Check Console for errors
3. Try refreshing the page (F5)

### Issue: Services won't start
**Fix:**
1. Close all command windows
2. Run `docker-compose -f docker-compose.dev.yml down`
3. Try running START.bat again

---

## 📁 File Reference

| File | Purpose |
|------|---------|
| `START_HERE.bat` | Menu to choose options |
| `START.bat` | Direct startup (runs everything) |
| `RUN_LOCAL.bat` | Original Docker-based runner |
| `RUN_SIMPLE.bat` | Alternative hybrid runner |
| `QUICK_START.md` | Detailed documentation |

---

## 🛑 To Stop Everything

1. **Close the main window** (the one running START.bat)
2. This will automatically:
   - Stop all Node.js services
   - Stop Docker containers
   - Clean up

Or manually:
```powershell
docker-compose -f docker-compose.dev.yml down
```

---

## 💡 Tips

- **First run** takes 3-5 minutes (installing dependencies)
- **Subsequent runs** take ~30 seconds
- Keep the command windows open - they show logs
- You can close individual service windows if needed
- Browser opens automatically when ready

---

## ✅ Requirements

- Docker Desktop (running)
- Node.js 20+ installed
- Ports 3000-3009 and 5173 available
- 4GB+ RAM recommended

---

**Ready? Just double-click START_HERE.bat! 🎉**
