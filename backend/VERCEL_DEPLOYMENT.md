# Backend Deployment Guide for Vercel

## Overview
The backend has been configured to run as a serverless function on Vercel with optimized database connection pooling and error handling.

## Recent Changes Made
1. **Lazy Database Connection**: Database now connects on-demand in serverless environment
2. **Connection Caching**: MongoDB connection is cached between function invocations
3. **Improved Error Handling**: Better error messages for database connection failures
4. **Optimized Settings**: Reduced pool size and timeouts for serverless environment
5. **Increased Function Timeout**: Set to 60 seconds with 1024MB memory
6. **Fixed Winston Logger**: Disabled file-based logging in serverless (uses console only)
   - Vercel has read-only filesystem except `/tmp`
   - File logging only works in traditional server deployments

## Required Environment Variables

### Critical (Must be set for deployment to work):
- `MONGODB_URI` - Your MongoDB connection string (e.g., mongodb+srv://...)
- `JWT_SECRET` - Secret key for JWT tokens (use a strong random string)
- `FRONTEND_URL` - Your frontend URL (e.g., https://yourapp.vercel.app)

### Important:
- `NODE_ENV` - Set to "production"
- `JWT_EXPIRE` - Token expiration (e.g., "7d")
- `ALLOWED_ORIGINS` - Comma-separated list of allowed origins

### Optional (Can be added later):
- `REDIS_URL` - For distributed rate limiting
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD` - For email notifications
- `MPESA_*` - For M-Pesa payment integration
- `AWS_*` - For S3 file uploads

## Setting Environment Variables in Vercel

### Method 1: Via Vercel Dashboard
1. Go to your project in Vercel Dashboard
2. Click on "Settings"
3. Click on "Environment Variables"
4. Add each variable:
   - Variable Name: `MONGODB_URI`
   - Value: Your MongoDB connection string
   - Select environment: Production, Preview, Development (or as needed)
5. Click "Save"
6. Repeat for all required variables

### Method 2: Via Vercel CLI
```bash
vercel env add MONGODB_URI
vercel env add JWT_SECRET
vercel env add FRONTEND_URL
```

## Deploying to Vercel

### First Time Deployment
```bash
cd backend
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N** (first time)
- Project name? **school-erp-backend**
- Directory? **.**
- Override build command? **N**
- Override output directory? **N**

### Subsequent Deployments
```bash
cd backend
vercel --prod
```

## Troubleshooting Common Issues

### 1. ENOENT: no such file or directory, mkdir 'logs'
**Cause**: Winston trying to create log files in read-only filesystem

**Solution**:
- Already fixed! Winston now uses Console logging in serverless
- File logging only happens in traditional server environments
- If you see this error, make sure you've pulled latest changes

### 2. FUNCTION_INVOCATION_FAILED Error
**Cause**: Missing environment variables or database connection failure

**Solution**:
- Verify `MONGODB_URI` is set in Vercel
- Check MongoDB Atlas allows connections from anywhere (IP: 0.0.0.0/0)
- Check Vercel function logs: `vercel logs [deployment-url]`

### 3. Database Connection Timeout
**Cause**: MongoDB Atlas network restrictions or slow connection

**Solution**:
- In MongoDB Atlas, go to Network Access
- Add IP Address: `0.0.0.0/0` (allow from anywhere)
- Or use Vercel's IP ranges (check Vercel docs)

### 4. 504 Gateway Timeout
**Cause**: Function execution exceeds timeout

**Solution**:
- Already increased to 60s in vercel.json
- If still timing out, optimize database queries
- Consider using MongoDB indexes

### 5. Module Not Found Errors
**Cause**: Dependencies not installed or build failed

**Solution**:
- Ensure all dependencies are in `dependencies` (not `devDependencies`)
- Run `npm run build` locally to test
- Check build logs in Vercel dashboard

## Checking Deployment Status

### View Logs
```bash
vercel logs [deployment-url] --follow
```

### View Latest Deployment
```bash
vercel ls
```

### Check Function Health
After deployment, test these endpoints:
- `https://your-backend.vercel.app/health` - Should return health status
- `https://your-backend.vercel.app/ready` - Should return readiness status
- `https://your-backend.vercel.app/api/v1/auth/login` - Should accept POST requests

## MongoDB Atlas Configuration

### Required Settings:
1. **Network Access**:
   - IP Whitelist: `0.0.0.0/0` (Allow from anywhere)
   - Or add Vercel's IP ranges

2. **Database User**:
   - Ensure user has read/write permissions
   - Password doesn't contain special characters that need URL encoding

3. **Connection String**:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/school-erp?retryWrites=true&w=majority
   ```
   - Replace `username` and `password`
   - Replace `cluster` with your cluster name
   - Keep `school-erp` as database name

## Performance Optimization

### Connection Pooling
- Serverless: 5 connections (configured automatically)
- Traditional: 10 connections
- Connections are cached between invocations

### Timeouts
- Server selection: 5s (serverless) / 10s (traditional)
- Socket: 45s
- Connection: 5s (serverless) / 10s (traditional)

## Security Notes

1. **Never commit `.env` file** - Already in .gitignore
2. **Use strong JWT_SECRET** - Generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
3. **Restrict CORS** - Set ALLOWED_ORIGINS to your exact frontend domains
4. **Keep dependencies updated** - Run `npm audit` regularly

## Next Steps After Deployment

1. **Test all endpoints** - Use Postman or similar
2. **Monitor function logs** - Check for errors
3. **Set up monitoring** - Consider Vercel Analytics
4. **Enable Redis** - For better rate limiting (optional)
5. **Configure email** - For user notifications (optional)

## Getting Help

If deployment fails:
1. Check Vercel function logs
2. Verify environment variables are set
3. Test MongoDB connection from your local machine
4. Check this file for troubleshooting steps
5. Review Vercel deployment logs in dashboard

## Useful Commands

```bash
# Deploy to production
vercel --prod

# View logs
vercel logs --follow

# List deployments
vercel ls

# Remove deployment
vercel remove [deployment-name]

# View environment variables
vercel env ls

# Pull environment variables locally
vercel env pull
```
