@echo off
echo 🔧 Restarting server with fixes applied...

echo.
echo 📋 Issues that will be resolved:
echo ✅ Room cleanup error - Fixed null checks
echo ✅ Circular dependency warning - Fixed exports structure  
echo ✅ Redis connection issues - Added graceful fallback
echo.

echo 🛑 Stopping any running server processes...
taskkill /f /im node.exe 2>nul || echo No Node.js processes found

echo.
echo 🚀 Starting server with fixes...
cd server
npm start

echo.
echo ✅ Server should now start without errors!
echo 📝 If you still see issues, make sure your .env file is configured properly.
pause
