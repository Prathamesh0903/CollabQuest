# Quick Deployment Setup Guide

This guide provides the fastest way to deploy your collaborative coding platform.

## 🚀 Quick Start Options

### Option 1: Full Stack on Render (Recommended)

**For Windows:**
```cmd
REM 1. Run the deployment script
deploy-render.bat

REM 2. Follow the prompts and visit Render dashboard
```

**For Linux/Mac:**
```bash
# 1. Make deployment script executable
chmod +x deploy-render.sh

# 2. Run the deployment script
./deploy-render.sh

# 3. Follow the prompts and visit Render dashboard
```

### Option 2: Frontend on Vercel + Backend on Render

**For Windows:**
```cmd
REM 1. Deploy backend to Render
deploy-render.bat

REM 2. Deploy frontend to Vercel
cd client
deploy-vercel.bat
```

**For Linux/Mac:**
```bash
# 1. Deploy backend to Render
chmod +x deploy-render.sh
./deploy-render.sh

# 2. Deploy frontend to Vercel
cd client
chmod +x deploy-vercel.sh
./deploy-vercel.sh
```

## 📋 Pre-Deployment Checklist

Before running deployment scripts, ensure you have:

- [ ] **GitHub Repository**: Code pushed to GitHub
- [ ] **MongoDB Atlas**: Database cluster created
- [ ] **Firebase Project**: Authentication configured
- [ ] **Accounts**: Render and/or Vercel accounts

## 🔧 Required Services Setup

### 1. MongoDB Atlas (Database)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create free cluster
3. Create database user
4. Whitelist IP addresses (0.0.0.0/0 for cloud)
5. Get connection string

### 2. Firebase (Authentication)
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create project
3. Enable Authentication
4. Generate service account key
5. Get Project ID, Private Key, Client Email

### 3. Render Account
1. Go to [Render](https://render.com)
2. Sign up with GitHub
3. Connect your repository

### 4. Vercel Account (Optional)
1. Go to [Vercel](https://vercel.com)
2. Sign up with GitHub
3. Install Vercel CLI: `npm i -g vercel`

## ⚡ One-Command Deployment

### For Render (Full Stack)

**Windows:**
```cmd
deploy-render.bat
```

**Linux/Mac:**
```bash
./deploy-render.sh
```

### For Vercel (Frontend Only)

**Windows:**
```cmd
cd client && deploy-vercel.bat
```

**Linux/Mac:**
```bash
cd client && ./deploy-vercel.sh
```

## 🔗 Post-Deployment Steps

After deployment:

1. **Update Environment Variables** in your platform dashboard
2. **Test the Application** - verify all features work
3. **Update CORS Settings** - ensure frontend can connect to backend
4. **Configure Custom Domain** (optional)

## 🆘 Need Help?

- **Detailed Guide**: See `DEPLOYMENT_GUIDE.md`
- **Troubleshooting**: Check the troubleshooting section
- **Common Issues**: CORS errors, environment variables, build failures

## 📞 Support

If you encounter issues:
1. Check the logs in your deployment platform
2. Verify environment variables are set correctly
3. Ensure all services (MongoDB, Firebase) are configured
4. Check CORS settings for cross-origin requests

---

**Time to Deploy**: ~15-30 minutes (depending on your setup)
