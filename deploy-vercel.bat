@echo off
REM Vercel Deployment Script for Collaborative Coding Platform Frontend (Windows)
REM This script helps you deploy your frontend to Vercel

echo ⚡ Starting Vercel Deployment Process...

REM Check if we're in the client directory
if not exist "package.json" (
    echo ❌ Please run this script from the client directory
    pause
    exit /b 1
)

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if errorlevel 1 (
    echo 📦 Installing Vercel CLI...
    npm install -g vercel
)

echo ✅ Vercel CLI is ready

REM Check for required files
echo 🔍 Checking for required configuration files...

if not exist "package.json" (
    echo ❌ Required file missing: package.json
    pause
    exit /b 1
)

if not exist "vercel.json" (
    echo ❌ Required file missing: vercel.json
    pause
    exit /b 1
)

echo ✅ All required files found

REM Create production environment file
echo REACT_APP_API_URL=https://your-backend.onrender.com > .env.production
echo REACT_APP_SOCKET_URL=https://your-backend.onrender.com >> .env.production

echo ✅ Environment file created (please update with your actual values)

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Build the project
echo 🔨 Building the project...
npm run build

if errorlevel 1 (
    echo ❌ Build failed. Please check for errors.
    pause
    exit /b 1
)

echo ✅ Build successful

REM Deploy to Vercel
echo 🚀 Deploying to Vercel...
vercel --prod

echo.
echo 🎉 Vercel deployment complete!
echo.
echo Next steps:
echo 1. Update environment variables in Vercel dashboard:
echo    - Go to your project settings in Vercel
echo    - Add REACT_APP_API_URL and REACT_APP_SOCKET_URL
echo 2. Update your backend CORS settings to include your Vercel domain
echo 3. Test your deployed application
echo.
echo 📚 For detailed instructions, see DEPLOYMENT_GUIDE.md
pause
