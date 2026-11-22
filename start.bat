@echo off
echo ========================================
echo Lab Attendance Management System
echo ========================================
echo.

echo Checking if dependencies are installed...
if not exist "node_modules" (
    echo Installing root dependencies...
    npm install
)

if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    npm install
    cd ..
)

if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    npm install
    cd ..
)

echo.
echo ========================================
echo Starting Lab Attendance System...
echo ========================================
echo.
echo Frontend will be available at: http://localhost:5173
echo Backend API will be available at: http://localhost:5000
echo.
echo Press Ctrl+C to stop the servers
echo.

npm run dev

pause
