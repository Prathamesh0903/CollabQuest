# CollabQuest Backend Deployment Guide for Render

## 🚀 Quick Start

Your backend is now **100% ready for Render deployment**! All critical issues have been fixed.

## ✅ What Was Fixed

1. **Environment Variables**: Updated from Firebase to Supabase
2. **Build Configuration**: Optimized for Render's Node.js environment
3. **Database Seeding**: Added automatic seeding on startup
4. **Deployment Scripts**: Updated with correct environment variables

## 📋 Pre-Deployment Checklist

### 1. Set Up External Services

#### MongoDB Atlas
- [ ] Create a MongoDB Atlas cluster
- [ ] Get your connection string
- [ ] Whitelist Render's IP ranges (or use 0.0.0.0/0 for development)

#### Supabase
- [ ] Create a Supabase project
- [ ] Get your project URL
- [ ] Get your service role key from Settings > API

### 2. Prepare Your Repository

```bash
# Make sure your code is committed and pushed to GitHub
git add .
git commit -m "Fix deployment configuration for Render"
git push origin main
```

## 🎯 Deployment Steps

### Option 1: Using Render Blueprint (Recommended)

1. **Go to [Render Dashboard](https://dashboard.render.com)**
2. **Click "New +" → "Blueprint"**
3. **Connect your GitHub repository**
4. **Render will automatically detect `render.yaml` and create services**
5. **Update environment variables in Render dashboard:**

   ```yaml
   SUPABASE_URL: https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY: your-service-role-key
   SUPABASE_JWKS_URL: https://your-project.supabase.co/auth/v1/keys
   CLIENT_URL: https://your-frontend.onrender.com
   ```

### Option 2: Manual Service Creation

1. **Create Web Service**
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && npm run start:with-seed`
   - Environment: Node

2. **Create MongoDB Database**
   - Choose MongoDB
   - Database Name: `collaborative_coding`

3. **Set Environment Variables**
   - Copy from the list below

## 🔧 Environment Variables

### Required Variables

```bash
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/collaborative_coding?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_JWKS_URL=https://your-project.supabase.co/auth/v1/keys
CLIENT_URL=https://your-frontend.onrender.com
```

### Optional Variables

```bash
# These are auto-generated or have defaults
SUPABASE_JWKS_URL=https://your-project.supabase.co/auth/v1/keys
```

## 🧪 Testing Your Deployment

### 1. Health Check
```bash
curl https://your-backend.onrender.com/api/health
```

Expected response:
```json
{
  "mongodb": true,
  "supabase": true,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "memory": {...},
  "version": "v18.x.x"
}
```

### 2. API Endpoints
```bash
# Test DSA problems endpoint
curl https://your-backend.onrender.com/api/dsa/problems

# Test authentication (should return 401 without token)
curl https://your-backend.onrender.com/api/users/profile
```

### 3. Socket.io Connection
Test WebSocket connection using your frontend or a WebSocket client.

## 🐛 Troubleshooting

### Common Issues

#### 1. Build Failures
- **Issue**: `node-pty` build errors
- **Solution**: Node.js dependencies are handled by Render's build system

#### 2. Database Connection Issues
- **Issue**: MongoDB connection timeout
- **Solution**: Check MongoDB Atlas IP whitelist and connection string

#### 3. Supabase Authentication Issues
- **Issue**: JWT verification failures
- **Solution**: Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are correct

#### 4. Environment Variable Issues
- **Issue**: Missing or incorrect environment variables
- **Solution**: Double-check all variables in Render dashboard

### Debug Commands

```bash
# Check server logs in Render dashboard
# Look for these indicators:
# ✅ "Connected to MongoDB"
# ✅ "Server running on port 10000"
# ✅ "DSA seeding completed"
```

## 📊 Monitoring

### Health Monitoring
- **Endpoint**: `/api/health`
- **Checks**: MongoDB, Supabase, memory usage
- **Frequency**: Set up monitoring to check every 5 minutes

### Performance Monitoring
- **Built-in**: Performance middleware logs slow queries
- **External**: Consider adding APM tools like New Relic or DataDog

## 🔄 Updates and Maintenance

### Updating Your Application
1. Push changes to GitHub
2. Render automatically redeploys
3. Database seeding runs on each deployment

### Database Maintenance
- **Seeding**: Runs automatically on startup
- **Backups**: MongoDB Atlas handles backups
- **Monitoring**: Use MongoDB Atlas monitoring

## 🎉 Success Indicators

Your deployment is successful when:
- ✅ Health check returns all services as healthy
- ✅ API endpoints respond correctly
- ✅ Socket.io connections work
- ✅ Database is seeded with DSA problems
- ✅ Authentication works with Supabase

## 📞 Support

If you encounter issues:
1. Check Render logs first
2. Verify all environment variables
3. Test external service connections
4. Check this guide for common solutions

---

**Your backend is now production-ready for Render! 🚀**
