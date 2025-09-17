# Update Render Environment Variables

## Current URLs:
- **Frontend (Vercel)**: https://collab-quest-lmws4f0eh-prathamesh-pawars-projects-de2689ea.vercel.app
- **Backend (Render)**: https://collabquest.onrender.com

## Steps to Update:

### 1. Go to Render Dashboard
Visit: https://dashboard.render.com

### 2. Find your backend service (collab-backend)

### 3. Go to Environment tab

### 4. Add/Update these variables:
```
CLIENT_URL=https://collab-quest-lmws4f0eh-prathamesh-pawars-projects-de2689ea.vercel.app
```

### 5. Also ensure these are set:
```
NODE_ENV=production
PORT=10000
MONGODB_URI=your-mongodb-atlas-connection-string
JWT_SECRET=your-super-secret-jwt-key
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
DOCKER_ENABLED=false
```

### 6. Restart the service
After updating environment variables, restart your Render service.
