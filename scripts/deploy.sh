#!/bin/bash
# Deployment script for Usha server

set -e

SERVER_USER="${USHA_SERVER_USER:-ubuntu}"
SERVER_HOST="${USHA_SERVER_HOST:-your-server.com}"
SERVER_PATH="${USHA_SERVER_PATH:-/opt/usha}"
DEPLOY_ENV="${1:-production}"

echo "🚀 Deploying Usha to ${SERVER_HOST}..."

# Build everything first
echo "Building application..."
./scripts/build-all.sh

# Create deployment package
echo "📦 Creating deployment package..."
TEMP_DIR=$(mktemp -d)
DEPLOY_DIR="${TEMP_DIR}/usha-deploy"

mkdir -p "${DEPLOY_DIR}"

# Copy server files
echo "Copying server files..."
mkdir -p "${DEPLOY_DIR}/server"
cp -r server/dist "${DEPLOY_DIR}/server/"
cp server/package.json "${DEPLOY_DIR}/server/"
cp server/.env.example "${DEPLOY_DIR}/server/.env.example"

# Copy viewer files
echo "Copying viewer files..."
mkdir -p "${DEPLOY_DIR}/viewer"
cp -r viewer/dist "${DEPLOY_DIR}/viewer/"

# Copy deployment files
echo "Copying deployment files..."
cp -r scripts "${DEPLOY_DIR}/"
cp docker-compose.yml "${DEPLOY_DIR}/" 2>/dev/null || true
cp Dockerfile "${DEPLOY_DIR}/" 2>/dev/null || true

# Create deployment archive
echo "Creating archive..."
cd "${TEMP_DIR}"
tar -czf usha-deploy.tar.gz usha-deploy/

echo "📤 Uploading to server..."
scp usha-deploy.tar.gz ${SERVER_USER}@${SERVER_HOST}:/tmp/

echo "🔧 Installing on server..."
ssh ${SERVER_USER}@${SERVER_HOST} << EOF
  mkdir -p ${SERVER_PATH}
  cd ${SERVER_PATH}
  tar -xzf /tmp/usha-deploy.tar.gz
  cd usha-deploy/server
  npm install --production
  echo "✅ Deployment complete!"
EOF

echo "✅ Deployment finished!"
echo ""
echo "Next steps on server:"
echo "1. Configure .env file in ${SERVER_PATH}/usha-deploy/server/"
echo "2. Set up SSL certificate"
echo "3. Configure Nginx"
echo "4. Start server: cd ${SERVER_PATH}/usha-deploy/server && npm start"

