# Render Deployment Guide

## Two Deployment Options

### Option 1: Using render.yaml (Recommended)
A `render.yaml` file exists in the project root with infrastructure-as-code configuration.

1. Go to Render Dashboard → **Blueprints**
2. Click **New Blueprint Instance**
3. Connect your GitHub repository
4. Render will detect `render.yaml` and show the configuration
5. Review and click **Apply**
6. **Still required**: Manually add environment variables (see below)

### Option 2: Manual Service Creation
Follow the steps in this guide to create the service manually.

---

## Current Issue: 502 Bad Gateway

Your backend builds successfully but crashes at runtime. This is **almost certainly** because environment variables are not set in Render.

## ✅ Fix: Set Environment Variables in Render

### Step 1: Go to Render Dashboard
1. Open https://dashboard.render.com
2. Select your backend service (school-management-system-backend or similar)

### Step 2: Add Environment Variables
1. Click **Environment** in the left sidebar
2. Click **Add Environment Variable** for each of these:

| Key | Value | Notes |
|-----|-------|-------|
| `MONGODB_URI` | `mongodb+srv://administrator:Admin%40123@cluster0.jx3bb3x.mongodb.net/school-erp` | **CRITICAL** - From your [.env](../.env) file |
| `JWT_SECRET` | `your-super-secret-jwt-key-change-in-production` | **CRITICAL** - Generate a strong one |
| `NODE_ENV` | `production` | **CRITICAL** - Server runs in development mode without this |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` | Your deployed frontend URL |
| `ALLOWED_ORIGINS` | `https://your-frontend.vercel.app` | Same as FRONTEND_URL |
| `PORT` | (leave blank) | Render auto-assigns this (usually 10000) |

3. Click **Save Changes**

### Step 3: MongoDB Atlas - Allow Render IPs
Your MongoDB Atlas might be blocking Render's servers:

1. Go to **MongoDB Atlas Dashboard**
2. Click **Network Access** (left sidebar)
3. Click **Add IP Address**
4. Select **Allow Access from Anywhere** → `0.0.0.0/0`
5. Click **Confirm**

⚠️ **This is required** because Render uses dynamic IP addresses

### Step 4: Trigger Redeploy
After adding environment variables:

**Option A - Manual Redeploy:**
1. In Render Dashboard, click **Manual Deploy**
2. Select **Deploy latest commit**

**Option B - Git Push:**
```bash
git commit --allow-empty -m "Trigger Render redeploy"
git push
```

### Step 5: Check Logs
After redeployment starts:

1. In Render Dashboard → **Logs** tab
2. Watch for these success messages:
   ```
   Connecting to MongoDB...
   MongoDB Connected: cluster0.jx3bb3x.mongodb.net
   🚀 Server running on 0.0.0.0:5000 in production mode
   ```

3. If you see errors about `MONGODB_URI`, double-check Step 2

### Step 6: Test Deployment
After successful deployment:

```bash
# Should return health status
curl https://school-management-system-tarb.onrender.com/health

# Should return 404 with error message (expected - route list)
curl https://school-management-system-tarb.onrender.com/

# Should return login response
curl -X POST https://school-management-system-tarb.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

## Recent Changes Made

### Fixed Server Binding
- Changed from `app.listen(PORT)` to `app.listen(PORT, '0.0.0.0')`
- This allows Render/Docker to accept external connections
- Required for cloud platforms (Render, Railway, Fly.io, etc.)

## Common Render Issues & Solutions

### Issue: 502 Bad Gateway after "Your service is live"
**Cause**: Server crashes during startup (usually MongoDB connection failure)

**Solution**:
- Set `MONGODB_URI` environment variable in Render
- Check Render logs for actual error message
- Verify MongoDB Atlas network access allows `0.0.0.0/0`

### Issue: Application failed to respond
**Cause**: Server not listening on `0.0.0.0` or wrong PORT

**Solution**:
- Already fixed! Server now listens on `0.0.0.0`
- Render automatically sets `PORT` environment variable
- Code uses: `const PORT = process.env.PORT || 5000;`

### Issue: MongoDB connection timeout
**Cause**: MongoDB Atlas blocking Render IPs

**Solution**:
- In MongoDB Atlas → Network Access
- Add IP: `0.0.0.0/0` (allow from anywhere)

### Issue: CORS errors from frontend
**Cause**: Backend not allowing frontend origin

**Solution**:
- Set `FRONTEND_URL` in Render env vars
- Set `ALLOWED_ORIGINS` to match frontend domain
- Code automatically handles CORS via `corsOptions` middleware

## Render-Specific Configuration

### Auto-Deploy Setup
Render can auto-deploy when you push to GitHub:

1. In Render Dashboard → **Settings**
2. Under **Build & Deploy**
3. Enable **Auto-Deploy** for `main` branch
4. Every `git push` will trigger deployment

### Health Checks
Render automatically monitors your app:

1. In Render Dashboard → **Settings**  
2. Under **Health & Alerts**
3. Set **Health Check Path**: `/alive` (not `/health`)
   - `/alive` returns 200 OK immediately (for port detection)
   - `/health` checks database and returns full health status
4. Render will ping this every 30s to ensure app is running

### Scaling
Free tier limitations:
- Service spins down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds (cold start)
- Upgrade to paid tier for always-on service

## Troubleshooting Checklist

If still getting 502:

- [ ] `MONGODB_URI` is set in Render environment variables
- [ ] `JWT_SECRET` is set in Render environment variables  
- [ ] MongoDB Atlas allows connections from `0.0.0.0/0`
- [ ] Checked Render logs for error messages
- [ ] Redeployed after adding environment variables
- [ ] Health endpoint works: `curl https://your-app.onrender.com/health`

## Verifying MongoDB Connection

Test your MongoDB connection string locally:

```bash
# In backend directory
cd backend

# Test connection
node -e "const mongoose = require('mongoose'); mongoose.connect('mongodb+srv://administrator:Admin%40123@cluster0.jx3bb3x.mongodb.net/school-erp').then(() => console.log('Connected!')).catch(e => console.error('Failed:', e));"
```

If this fails locally, your connection string has issues.

## Next Steps After Successful Deployment

1. **Update Frontend `.env`** (already done):
   ```env
   NEXT_PUBLIC_API_URL=https://school-management-system-tarb.onrender.com/api/v1
   ```

2. **Set in Vercel** (for frontend):
   - Go to Vercel Dashboard → Frontend Project
   - Settings → Environment Variables
   - Add `NEXT_PUBLIC_API_URL` with Render backend URL
   - Redeploy frontend

3. **Test Full Flow**:
   - Visit deployed frontend
   - Try logging in
   - Check Network tab shows requests to Render backend

## Support

If you're still having issues after following this guide:

1. Check Render logs (real-time): Dashboard → Logs tab
2. Check application logs for specific error messages
3. Verify environment variables are actually set: Dashboard → Environment tab
4. Test health endpoint to verify server is running

## Useful Commands

```bash
# Commit and push to trigger redeploy
git commit --allow-empty -m "Trigger redeploy"
git push

# Test health endpoint
curl https://school-management-system-tarb.onrender.com/health

# Test API endpoint
curl https://school-management-system-tarb.onrender.com/api/v1/auth/me
```
