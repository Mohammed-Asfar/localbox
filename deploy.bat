@echo off
setlocal
echo 🚀 Starting LocalBox Deployment...

REM 1. Build Frontend
echo 📦 Building Frontend...
cd localbox-frontend
call npm install
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Frontend build failed!
    exit /b %errorlevel%
)
cd ..

REM 2. Prepare Backend Public Folder
echo 🧹 Cleaning old backend files...
if not exist "localbox-backend\public" mkdir "localbox-backend\public"
del /q "localbox-backend\public\*"
for /d %%x in ("localbox-backend\public\*") do @rd /s /q "%%x"

REM 3. Copy Build Files
echo 🚚 Copying build files to backend...
xcopy /s /e /y "localbox-frontend\dist\*" "localbox-backend\public\"

REM 4. Start Backend
echo 🚀 Starting Backend Server...
cd localbox-backend
call npm install
npm start
