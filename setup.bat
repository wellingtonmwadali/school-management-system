@echo off
REM School ERP Production Setup Script for Windows

echo.
echo ========================================
echo  School ERP - Production Setup
echo ========================================
echo.

REM Check Node.js version
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed
    exit /b 1
)

for /f "tokens=1 delims=v." %%i in ('node --version') do set NODE_MAJOR=%%i
if %NODE_MAJOR:~1% LSS 18 (
    echo [ERROR] Node.js 18+ required
    exit /b 1
)
echo [OK] Node.js version: 
node --version

REM Install backend dependencies
echo.
echo Installing backend dependencies...
cd backend
call npm install
if errorlevel 1 (
    echo [ERROR] Backend installation failed
    exit /b 1
)
echo [OK] Backend dependencies installed

REM Build backend
echo.
echo Building backend...
call npm run build
if errorlevel 1 (
    echo [ERROR] Backend build failed
    exit /b 1
)
echo [OK] Backend built successfully

REM Install frontend dependencies
echo.
echo Installing frontend dependencies...
cd ..\frontend
call npm install
if errorlevel 1 (
    echo [ERROR] Frontend installation failed
    exit /b 1
)
echo [OK] Frontend dependencies installed

cd ..

echo.
echo ========================================
echo  Setup Complete!
echo ========================================
echo.
echo Next steps:
echo   1. Configure backend\.env with your settings
echo   2. Run 'npm run seed' in backend\ to create demo data
echo   3. Production deployment:
echo      - Docker: docker-compose up -d
echo      - PM2: cd backend ^&^& pm2 start ecosystem.config.js --env production
echo.
echo Documentation:
echo   - Production guide: backend\PRODUCTION.md
echo   - Summary: PRODUCTION_SUMMARY.md
echo   - Main README: README.md
echo.
echo Ready to deploy!
echo.

pause
