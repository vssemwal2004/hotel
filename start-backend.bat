@echo off
echo ========================================
echo Starting Hotel Backend Server
echo ========================================
echo.

cd backend\src

echo Checking MongoDB connection...
echo Make sure MongoDB is running!
echo.

echo Starting server on port 5000...
node server.js

pause
