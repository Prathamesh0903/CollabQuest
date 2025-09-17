@echo off
REM Setup script for local development environment

echo 🔧 Setting up local development environment...

REM Create server .env file
echo # Server Environment Configuration > server\.env
echo NODE_ENV=development >> server\.env
echo PORT=5001 >> server\.env
echo. >> server\.env
echo # Database Configuration >> server\.env
echo MONGODB_URI=mongodb://localhost:27017/collaborative_coding >> server\.env
echo. >> server\.env
echo # JWT Configuration >> server\.env
echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production >> server\.env
echo. >> server\.env
echo # Firebase Configuration >> server\.env
echo FIREBASE_PROJECT_ID=your-firebase-project-id >> server\.env
echo FIREBASE_PRIVATE_KEY=your-firebase-private-key >> server\.env
echo FIREBASE_CLIENT_EMAIL=your-firebase-client-email >> server\.env
echo. >> server\.env
echo # Client Configuration >> server\.env
echo CLIENT_URL=http://localhost:3000 >> server\.env
echo. >> server\.env
echo # Docker Configuration >> server\.env
echo DOCKER_ENABLED=false >> server\.env
echo. >> server\.env
echo # Redis Configuration >> server\.env
echo REDIS_URL=redis://localhost:6379 >> server\.env
echo. >> server\.env
echo # Code Execution Configuration >> server\.env
echo EXECUTOR_URL=http://localhost:5002 >> server\.env

echo ✅ Server .env file created

REM Create client .env file
echo REACT_APP_API_URL=http://localhost:5001 > client\.env.local
echo REACT_APP_SOCKET_URL=http://localhost:5001 >> client\.env.local

echo ✅ Client .env.local file created

echo.
echo 📝 Environment setup complete!
echo.
echo ⚠️  IMPORTANT: Update the following in server\.env:
echo    - FIREBASE_PROJECT_ID: Your Firebase project ID
echo    - FIREBASE_PRIVATE_KEY: Your Firebase private key
echo    - FIREBASE_CLIENT_EMAIL: Your Firebase client email
echo    - JWT_SECRET: Change to a secure random string
echo.
echo 🚀 You can now start your server with:
echo    cd server
echo    npm start
echo.
echo 🌐 And your client with:
echo    cd client
echo    npm start
echo.
pause
