#!/bin/bash

echo "🚀 Starting LocalBox Deployment..."

# 1. Build Frontend
echo "📦 Building Frontend..."
cd localbox-frontend
npm install
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi
cd ..

# 2. Prepare Backend Public Folder
echo "🧹 Cleaning old backend files..."
mkdir -p localbox-backend/public
rm -rf localbox-backend/public/*

# 3. Copy Build Files
echo "🚚 Copying build files to backend..."
cp -r localbox-frontend/dist/* localbox-backend/public/

# 4. Start Backend
echo "🚀 Starting Backend Server..."
cd localbox-backend
npm install
npm start
