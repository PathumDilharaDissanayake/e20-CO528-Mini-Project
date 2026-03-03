# White Screen Fix Guide

## 🔴 Problem: White Screen at localhost:5173

This is usually caused by JavaScript errors preventing React from rendering.

---

## 🚀 Quick Fix (Try this first!)

### Option 1: Run the Fix Script
```batch
FIX_WHITESCREEN.bat
```
This will:
1. Clear all caches
2. Remove node_modules
3. Reinstall dependencies
4. Start the dev server

### Option 2: Run Diagnostics
```batch
DIAGNOSE_FRONTEND.bat
```

---

## 🔍 Manual Fix Steps

### Step 1: Check Browser Console
1. Open browser to `http://localhost:5173`
2. Press **F12** to open Developer Tools
3. Click **Console** tab
4. Look for **RED error messages**
5. Screenshot or copy the errors

### Step 2: Common Errors & Fixes

#### Error: "Typography is not defined"
**Fix:** Already fixed in the code. Run:
```batch
FIX_WHITESCREEN.bat
```

#### Error: "Cannot find module"
**Fix:** Reinstall dependencies
```powershell
cd decp-platform\frontend
Remove-Item -Recurse -Force node_modules
npm install
npm run dev
```

#### Error: "Failed to fetch" or "Network error"
**Fix:** Backend services not running
```batch
START_PLATFORM.bat
```

### Step 3: Clear Everything

```powershell
# Stop all node processes
taskkill /F /IM node.exe

# Go to frontend
cd decp-platform\frontend

# Clear caches
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue

# Clear browser localStorage
# (Open browser console and type: localStorage.clear())

# Reinstall
npm install

# Start
npm run dev
```

---

## 🧪 Test if Server is Working

Open this URL in browser:
```
http://localhost:5173/test.html
```

If this page loads, the server is working but React has an error.

---

## 📝 Specific Issues Fixed

### Issue #1: Typography Import at Bottom of File
**File:** `src/components/feed/CreatePost.tsx`
**Problem:** Had `import { Typography } from '@mui/material';` at line 282 (bottom of file)
**Fix:** Moved import to top of file

### Issue #2: Missing node_modules
**Symptom:** White screen, console shows "Cannot resolve"
**Fix:** Run `npm install`

### Issue #3: Vite Cache Corruption
**Symptom:** Changes not reflecting, weird behavior
**Fix:** Clear `.vite` cache folder

---

## 🎯 Still Not Working?

### Check These URLs:

| URL | Expected Result |
|-----|-----------------|
| http://localhost:5173/test.html | Should show diagnostic page |
| http://localhost:5173 | Main app (might be white) |
| http://localhost:3000/health | Should show API Gateway health |

### If test.html works but main app is white:

1. Open `http://localhost:5173`
2. Press F12
3. Look for errors like:
   - `SyntaxError`
   - `ReferenceError`
   - `TypeError`
   - `Cannot read property`

### Common Console Errors:

```
✅ No errors shown → Backend issue
❌ "Unexpected token" → Syntax error in code
❌ "X is not defined" → Missing import
❌ "Cannot read properties of undefined" → Null reference
❌ "Failed to fetch" → Backend not running
```

---

## 🔧 Emergency Reset

If nothing works, do a complete reset:

```powershell
# 1. Stop everything
taskkill /F /IM node.exe

# 2. Clean frontend
cd decp-platform\frontend
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force package-lock.json
npm cache clean --force

# 3. Reinstall
npm install

# 4. Start
npm run dev
```

---

## 📞 Need Help?

If still having issues:

1. Open browser to `http://localhost:5173`
2. Press F12
3. Go to Console tab
4. Copy ALL red error messages
5. Share those errors

---

**Last Updated:** March 1, 2026
