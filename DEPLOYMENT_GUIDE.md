# Complete Deployment Guide: Render & Vercel

This guide provides step-by-step instructions for deploying your collaborative coding platform on both Render and Vercel.

## Table of Contents
1. [Project Overview](#project-overview)
2. [Prerequisites](#prerequisites)
3. [Deploying to Render](#deploying-to-render)
4. [Deploying to Vercel](#deploying-to-vercel)
5. [Environment Configuration](#environment-configuration)
6. [Database Setup](#database-setup)
7. [Troubleshooting](#troubleshooting)

## Project Overview

Your project consists of:
- **Frontend**: React/TypeScript application (`client/`)
- **Backend**: Node.js/Express API server (`server/`)
- **Code Executor**: Docker-based service (`executor/`)
- **Database**: MongoDB
- **Additional Services**: Redis, Nginx

## Prerequisites

Before deploying, ensure you have:
- [ ] Git repository with your code
- [ ] GitHub/GitLab account
- [ ] Render account (free tier available)
- [ ] Vercel account (free tier available)
- [ ] MongoDB Atlas account (for cloud database)
- [ ] Firebase project (for authentication)
- [ ] Docker Hub account (for container images)

---

# 🚀 DEPLOYING TO RENDER

Render is excellent for full-stack applications with backend services.

## Step 1: Prepare Your Repository

### 1.1 Create Production Configuration Files

Create these files in your project root:

#### `render.yaml` (Render Blueprint)
```yaml
services:
  - type: web
    name: collab-backend
    env: node
    buildCommand: cd server && npm install
    startCommand: cd server && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: MONGODB_URI
        fromDatabase:
          name: collab-mongodb
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: FIREBASE_PROJECT_ID
        sync: false
      - key: FIREBASE_PRIVATE_KEY
        sync: false
      - key: FIREBASE_CLIENT_EMAIL
        sync: false
      - key: CLIENT_URL
        value: https://your-frontend.onrender.com

  - type: web
    name: collab-frontend
    env: static
    buildCommand: cd client && npm install && npm run build
    staticPublishPath: ./client/build
    envVars:
      - key: REACT_APP_API_URL
        value: https://your-backend.onrender.com
      - key: REACT_APP_SOCKET_URL
        value: https://your-backend.onrender.com

databases:
  - name: collab-mongodb
    databaseName: collaborative_coding
    user: admin
```

#### `server/Dockerfile` (if not exists)
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p uploads temp

# Expose port
EXPOSE 5001

# Start the application
CMD ["npm", "start"]
```

#### `client/Dockerfile` (if not exists)
```dockerfile
# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built app
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

## Step 2: Set Up MongoDB Atlas

### 2.1 Create MongoDB Atlas Cluster
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster (choose M0 free tier)
4. Create a database user
5. Whitelist your IP addresses (use 0.0.0.0/0 for Render)

### 2.2 Get Connection String
1. In Atlas, click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string (replace `<password>` with your actual password)

## Step 3: Configure Firebase

### 3.1 Set Up Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable Authentication
4. Go to Project Settings > Service Accounts
5. Generate a new private key (download JSON file)

### 3.2 Get Firebase Configuration
Extract these values from your Firebase config:
- Project ID
- Private Key
- Client Email

## Step 4: Deploy to Render

### 4.1 Deploy Backend Service
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `collab-backend`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/collaborative_coding?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
   CLIENT_URL=https://your-frontend.onrender.com
   ```
6. Click "Create Web Service"

### 4.2 Deploy Frontend Service
1. Click "New +" → "Static Site"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `collab-frontend`
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
4. Add Environment Variables:
   ```
   REACT_APP_API_URL=https://your-backend.onrender.com
   REACT_APP_SOCKET_URL=https://your-backend.onrender.com
   ```
5. Click "Create Static Site"

### 4.3 Deploy Database (Optional)
1. Click "New +" → "PostgreSQL" (or use MongoDB Atlas)
2. Configure your database
3. Update your backend environment variables with the new connection string

## Step 5: Update CORS Settings

Update your server CORS configuration to allow your frontend domain:

```javascript
// In server.js or app.js
const corsOptions = {
  origin: [
    'https://your-frontend.onrender.com',
    'http://localhost:3000' // for development
  ],
  credentials: true
};
```

---

# ⚡ DEPLOYING TO VERCEL

Vercel is excellent for frontend applications and serverless functions.

## Step 1: Prepare Frontend for Vercel

### 1.1 Create Vercel Configuration

#### `vercel.json` (in project root)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/client/$1"
    }
  ],
  "env": {
    "REACT_APP_API_URL": "@react_app_api_url",
    "REACT_APP_SOCKET_URL": "@react_app_socket_url"
  }
}
```

#### `client/vercel.json`
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "framework": "create-react-app",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 1.2 Update Package.json Scripts

Add to `client/package.json`:
```json
{
  "scripts": {
    "build": "react-scripts build",
    "vercel-build": "npm run build"
  }
}
```

## Step 2: Deploy Frontend to Vercel

### 2.1 Install Vercel CLI
```bash
npm i -g vercel
```

### 2.2 Deploy from Client Directory
```bash
cd client
vercel
```

### 2.3 Configure Environment Variables
1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add:
   ```
   REACT_APP_API_URL=https://your-backend.onrender.com
   REACT_APP_SOCKET_URL=https://your-backend.onrender.com
   ```

## Step 3: Deploy Backend to Vercel (Serverless)

### 3.1 Create Serverless Functions

Create `api/` directory in your project root:

#### `api/[...path].js` (catch-all API route)
```javascript
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

module.exports = async (req, res) => {
  const parsedUrl = parse(req.url, true);
  await handle(req, res, parsedUrl);
};
```

### 3.2 Alternative: Use Vercel Functions

Create individual API endpoints in `api/` directory:

#### `api/auth.js`
```javascript
export default function handler(req, res) {
  // Your authentication logic here
  res.status(200).json({ message: 'Auth endpoint' });
}
```

---

# 🔧 ENVIRONMENT CONFIGURATION

## Required Environment Variables

### Backend (Server)
```bash
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_SECRET=your-super-secret-jwt-key
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@project.iam.gserviceaccount.com
CLIENT_URL=https://your-frontend-domain.com
DOCKER_ENABLED=false  # Set to false for cloud deployment
```

### Frontend (Client)
```bash
REACT_APP_API_URL=https://your-backend-domain.com
REACT_APP_SOCKET_URL=https://your-backend-domain.com
```

## Database Configuration

### MongoDB Atlas Setup
1. Create cluster in MongoDB Atlas
2. Configure network access (whitelist IPs)
3. Create database user
4. Get connection string
5. Update MONGODB_URI in your environment variables

### Connection String Format
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/database_name?retryWrites=true&w=majority
```

---

# 🛠️ TROUBLESHOOTING

## Common Issues

### 1. CORS Errors
**Problem**: Frontend can't connect to backend
**Solution**: Update CORS configuration in your server:
```javascript
app.use(cors({
  origin: ['https://your-frontend.vercel.app', 'https://your-frontend.onrender.com'],
  credentials: true
}));
```

### 2. Socket.IO Connection Issues
**Problem**: WebSocket connections failing
**Solution**: Configure Socket.IO for production:
```javascript
const io = require('socket.io')(server, {
  cors: {
    origin: ['https://your-frontend.vercel.app', 'https://your-frontend.onrender.com'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});
```

### 3. Environment Variables Not Loading
**Problem**: Environment variables not available in production
**Solution**: 
- Check variable names (case-sensitive)
- Ensure variables are set in deployment platform
- Use platform-specific variable setting methods

### 4. Build Failures
**Problem**: Build process failing
**Solution**:
- Check Node.js version compatibility
- Ensure all dependencies are in package.json
- Check for TypeScript errors
- Verify file paths and imports

### 5. Docker Issues on Render
**Problem**: Docker services not working on Render
**Solution**: 
- Render doesn't support Docker-in-Docker
- Use external code execution services
- Consider using Render's built-in services

## Performance Optimization

### 1. Frontend Optimization
- Enable gzip compression
- Optimize images
- Use CDN for static assets
- Implement lazy loading

### 2. Backend Optimization
- Enable compression middleware
- Implement caching
- Optimize database queries
- Use connection pooling

### 3. Database Optimization
- Create proper indexes
- Use MongoDB Atlas monitoring
- Implement query optimization
- Set up database backups

---

# 📋 DEPLOYMENT CHECKLIST

## Pre-Deployment
- [ ] Code is committed to Git repository
- [ ] Environment variables documented
- [ ] Database schema is ready
- [ ] Firebase project configured
- [ ] All dependencies listed in package.json
- [ ] Build process tested locally

## Render Deployment
- [ ] MongoDB Atlas cluster created
- [ ] Backend service deployed
- [ ] Frontend static site deployed
- [ ] Environment variables configured
- [ ] CORS settings updated
- [ ] SSL certificates active

## Vercel Deployment
- [ ] Frontend deployed successfully
- [ ] Environment variables set
- [ ] Custom domain configured (optional)
- [ ] API routes working (if using serverless functions)

## Post-Deployment
- [ ] Test all major features
- [ ] Verify authentication works
- [ ] Check real-time features (Socket.IO)
- [ ] Test code execution (if applicable)
- [ ] Monitor error logs
- [ ] Set up monitoring and alerts

---

# 🔗 USEFUL LINKS

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Socket.IO Documentation](https://socket.io/docs/)

---

**Note**: This guide assumes you're deploying a collaborative coding platform. Adjust the configuration based on your specific requirements and services.
