@echo off
REM Render Deployment Script for Collaborative Coding Platform (Windows)
REM This script helps you deploy your project to Render

echo 🚀 Starting Render Deployment Process...

REM Check if git is initialized
if not exist ".git" (
    echo ❌ Git repository not found. Please initialize git first:
    echo    git init
    echo    git add .
    echo    git commit -m "Initial commit"
    pause
    exit /b 1
)

REM Check if remote origin is set
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo ❌ Git remote origin not set. Please add your GitHub repository:
    echo    git remote add origin https://github.com/yourusername/your-repo.git
    pause
    exit /b 1
)

echo ✅ Git repository is ready

REM Check for required files
echo 🔍 Checking for required configuration files...

if not exist "render.yaml" (
    echo ❌ Required file missing: render.yaml
    pause
    exit /b 1
)

if not exist "server\package.json" (
    echo ❌ Required file missing: server\package.json
    pause
    exit /b 1
)

if not exist "client\package.json" (
    echo ❌ Required file missing: client\package.json
    pause
    exit /b 1
)

echo ✅ All required files found

REM Create environment files
echo 🔍 Creating environment files...

echo NODE_ENV=production > server\.env.production
echo PORT=10000 >> server\.env.production
echo MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/collaborative_coding?retryWrites=true^&w=majority >> server\.env.production
echo JWT_SECRET=your-super-secret-jwt-key-change-this >> server\.env.production
echo FIREBASE_PROJECT_ID=your-firebase-project-id >> server\.env.production
echo FIREBASE_PRIVATE_KEY=your-firebase-private-key >> server\.env.production
echo FIREBASE_CLIENT_EMAIL=your-firebase-client-email >> server\.env.production
echo CLIENT_URL=https://your-frontend.onrender.com >> server\.env.production
echo DOCKER_ENABLED=false >> server\.env.production

echo REACT_APP_API_URL=https://your-backend.onrender.com > client\.env.production
echo REACT_APP_SOCKET_URL=https://your-backend.onrender.com >> client\.env.production

echo ✅ Environment files created (please update with your actual values)

REM Push to GitHub
echo 📤 Pushing code to GitHub...
git add .
git commit -m "Prepare for Render deployment" 2>nul || echo No changes to commit
git push origin main 2>nul || git push origin master

echo ✅ Code pushed to GitHub

echo.
echo 🎉 Deployment preparation complete!
echo.
echo Next steps:
echo 1. Go to https://dashboard.render.com
echo 2. Click "New +" → "Blueprint"
echo 3. Connect your GitHub repository
echo 4. Render will automatically detect render.yaml and create services
echo 5. Update environment variables in Render dashboard with your actual values:
echo    - MongoDB Atlas connection string
echo    - Firebase credentials
echo    - JWT secret
echo 6. Update CLIENT_URL and REACT_APP_API_URL with your actual Render URLs
echo.
echo 📚 For detailed instructions, see DEPLOYMENT_GUIDE.md
pause
