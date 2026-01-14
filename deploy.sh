#!/bin/bash
set -e

echo "🚀 Starting LocalBox Deployment..."

BASE_DIR="$HOME/localbox"
FRONTEND_DIR="$BASE_DIR/localbox-frontend"
BACKEND_DIR="$BASE_DIR/localbox-backend"

# 1. Build Frontend
echo "📦 Building Frontend..."
cd "$FRONTEND_DIR"
npm install
npm run build

# 2. Prepare Backend Public Folder
echo "🧹 Cleaning old backend files..."
mkdir -p "$BACKEND_DIR/public"
rm -rf "$BACKEND_DIR/public"/*

# 3. Copy Build Files
echo "🚚 Copying build files to backend..."
cp -r "$FRONTEND_DIR/dist/"* "$BACKEND_DIR/public/"

# 4. Install backend dependencies
echo "📦 Installing backend dependencies..."
cd "$BACKEND_DIR"
npm install --production

# 5. Restart services (IMPORTANT)
echo "🔁 Restarting LocalBox services..."
sudo systemctl restart localbox
sudo systemctl restart localbox-tusd

echo "✅ LocalBox deployment completed successfully!"
