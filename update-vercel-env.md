# Update Vercel Environment Variables

## Current URLs:
- **Frontend (Vercel)**: https://collab-quest-lmws4f0eh-prathamesh-pawars-projects-de2689ea.vercel.app
- **Backend (Render)**: https://collabquest.onrender.com

## Steps to Update:

### 1. Go to Vercel Dashboard
Visit: https://vercel.com/prathamesh-pawars-projects-de2689ea/collab-quest

### 2. Navigate to Settings → Environment Variables

### 3. Add/Update these variables:
```
REACT_APP_API_URL=https://collabquest.onrender.com
REACT_APP_SOCKET_URL=https://collabquest.onrender.com
```

### 4. Redeploy
After updating environment variables, trigger a new deployment.

## Alternative: Update via CLI
```bash
cd client
vercel env add REACT_APP_API_URL production
# Enter: https://collabquest.onrender.com

vercel env add REACT_APP_SOCKET_URL production  
# Enter: https://collabquest.onrender.com

vercel --prod
```
