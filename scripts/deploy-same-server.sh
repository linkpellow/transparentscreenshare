#!/bin/bash
# Deployment script for same-server setup (transparentinsurance.net)
# This script prepares files for deployment to the same server hosting transparentinsurance.net

set -e

# Configuration
SERVER_USER="linkpellow"
SERVER_EMAIL="linkpellow@transparentinsurance.net"
SERVER_HOST="transparentinsurance.net"

echo "🚀 Preparing Usha deployment for same-server setup..."
echo "   Server: ${SERVER_USER}@${SERVER_HOST}"
echo "   Email: ${SERVER_EMAIL}"
echo ""

# Check if build is needed
if [ ! -d "server/dist" ] || [ ! -d "viewer/dist" ]; then
    echo "⚠️  Build files not found. Building application..."
    ./scripts/build-all.sh
else
    echo "✅ Build files found"
fi

# Create deployment package
echo ""
echo "📦 Creating deployment package..."
TEMP_DIR=$(mktemp -d)
DEPLOY_DIR="${TEMP_DIR}/usha-deploy"

mkdir -p "${DEPLOY_DIR}"

# Copy server files
echo "  Copying server files..."
mkdir -p "${DEPLOY_DIR}/server"
cp -r server/dist "${DEPLOY_DIR}/server/"
cp server/package.json "${DEPLOY_DIR}/server/"

# Copy viewer files
echo "  Copying viewer files..."
mkdir -p "${DEPLOY_DIR}/viewer"
cp -r viewer/dist "${DEPLOY_DIR}/viewer/"

# Copy configuration files
echo "  Copying configuration files..."
cp nginx.conf.example "${DEPLOY_DIR}/nginx-screenshare.conf"
cp server/env.production.template "${DEPLOY_DIR}/env.production.template"
cp server/env.development.template "${DEPLOY_DIR}/env.development.template"

# Create deployment instructions
cat > "${DEPLOY_DIR}/DEPLOY_INSTRUCTIONS.md" << 'EOF'
# Deployment Instructions

## Quick Deploy

1. Upload files to server:
   ```bash
   scp -r usha-deploy/* user@your-server:/opt/usha/
   ```

2. SSH into server and run:
   ```bash
   cd /opt/usha/server
   npm install --production
   cp env.production.template .env
   nano .env  # Edit with your database password and settings
   ```

3. Configure Nginx (see nginx-screenshare.conf)

4. Start server:
   ```bash
   pm2 start dist/index.js --name usha-server
   pm2 save
   ```

5. Set up SSL:
   ```bash
   sudo certbot --nginx -d screenshare.transparentinsurance.net --email linkpellow@transparentinsurance.net --agree-tos --non-interactive
   ```

6. Reload Nginx:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```
EOF

# Create archive
echo "  Creating archive..."
cd "${TEMP_DIR}"
tar -czf usha-deploy.tar.gz usha-deploy/

# Move to project root
mv usha-deploy.tar.gz "${OLDPWD}/"

echo ""
echo "✅ Deployment package created: usha-deploy.tar.gz"
echo ""
echo "📤 Next steps:"
echo "  1. Upload to server:"
echo "     scp usha-deploy.tar.gz user@your-server:/tmp/"
echo ""
echo "  2. SSH into server and extract:"
echo "     mkdir -p /opt/usha"
echo "     cd /opt/usha"
echo "     tar -xzf /tmp/usha-deploy.tar.gz"
echo ""
echo "  3. Follow instructions in DEPLOY_INSTRUCTIONS.md"
echo ""
echo "📋 Files included:"
echo "  - server/dist/ (server code)"
echo "  - server/package.json"
echo "  - viewer/dist/ (viewer files)"
echo "  - nginx-screenshare.conf (Nginx config)"
echo "  - env.production.template (production environment template)"
echo "  - env.development.template (development environment template)"
echo "  - DEPLOY_INSTRUCTIONS.md (deployment guide)"

