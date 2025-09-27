@echo off
REM Setup script for local development environment (Updated for Supabase)

echo 🔧 Setting up CollabQuest local development environment...
echo.

REM Create server .env file
echo # Server Environment Configuration > server\.env
echo NODE_ENV=development >> server\.env
echo PORT=5000 >> server\.env
echo. >> server\.env
echo # Database Configuration >> server\.env
echo MONGODB_URI=mongodb://localhost:27017/collabquest >> server\.env
echo. >> server\.env
echo # JWT Configuration >> server\.env
echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production >> server\.env
echo. >> server\.env
echo # Supabase Configuration >> server\.env
echo SUPABASE_URL=https://your-project.supabase.co >> server\.env
echo SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key >> server\.env
echo SUPABASE_JWKS_URL=https://your-project.supabase.co/auth/v1/keys >> server\.env
echo. >> server\.env
echo # Client Configuration >> server\.env
echo CLIENT_URL=http://localhost:3000 >> server\.env
echo. >> server\.env
echo # Code Execution Configuration >> server\.env
echo EXECUTOR_URL=http://localhost:5001 >> server\.env

echo ✅ Server .env file created

REM Create client .env file
echo REACT_APP_SUPABASE_URL=https://your-project.supabase.co > client\.env.local
echo REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key >> client\.env.local
echo REACT_APP_API_URL=http://localhost:5000 >> client\.env.local
echo REACT_APP_SOCKET_URL=http://localhost:5000 >> client\.env.local

echo ✅ Client .env.local file created

echo.
echo 📝 Environment setup complete!
echo.
echo ⚠️  IMPORTANT: Update the following values:
echo.
echo    In server\.env:
echo    - SUPABASE_URL: Your Supabase project URL
echo    - SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key
echo    - JWT_SECRET: Change to a secure random string
echo    - MONGODB_URI: Your MongoDB connection string
echo.
echo    In client\.env.local:
echo    - REACT_APP_SUPABASE_URL: Your Supabase project URL
echo    - REACT_APP_SUPABASE_ANON_KEY: Your Supabase anon key
echo.
echo 🚀 To start development:
echo    1. Start MongoDB (if running locally)
echo    2. Run: cd server ^&^& npm install ^&^& npm run dev
echo    3. Run: cd client ^&^& npm install ^&^& npm start
echo.
echo 📚 For detailed setup instructions, see docs/deployment/
echo.
pause
