#!/bin/bash
# Complete automated deployment script
# This will deploy and start the server

set -e

SERVER_USER="linkpellow"
SERVER_HOST="transparentinsurance.net"
SERVER_PATH="/opt/usha"

echo "🚀 Starting Complete Deployment"
echo "=============================="
echo ""

# Step 1: Build if needed
echo "1. Checking build files..."
if [ ! -d "server/dist" ] || [ ! -d "viewer/dist" ]; then
    echo "   Building application..."
    npm run build
else
    echo "   ✅ Build files exist"
fi

# Step 2: Create deployment package
echo ""
echo "2. Creating deployment package..."
./scripts/deploy-same-server.sh > /dev/null 2>&1
echo "   ✅ Package created"

# Step 3: Upload to server
echo ""
echo "3. Uploading to server..."
echo "   (You may be prompted for SSH password)"
scp usha-deploy.tar.gz ${SERVER_USER}@${SERVER_HOST}:/tmp/ || {
    echo "   ❌ Upload failed. Please check SSH access."
    exit 1
}
echo "   ✅ Upload complete"

# Step 4: Deploy on server
echo ""
echo "4. Deploying on server..."
ssh ${SERVER_USER}@${SERVER_HOST} << 'DEPLOY_SCRIPT'
set -e

SERVER_PATH="/opt/usha"

echo "   Extracting files..."
mkdir -p ${SERVER_PATH}
cd ${SERVER_PATH}
tar -xzf /tmp/usha-deploy.tar.gz
mv usha-deploy/* . 2>/dev/null || true
rmdir usha-deploy 2>/dev/null || true

echo "   Installing dependencies..."
cd ${SERVER_PATH}/server
npm install --production

echo "   Setting up environment..."
if [ ! -f ".env" ]; then
    cp env.production.template .env
    echo "   ✅ Created .env from template"
    echo "   ⚠️  Please update DATABASE_URL in .env with your password"
else
    echo "   ✅ .env already exists"
fi

echo "   Starting server..."
pm2 stop usha-server 2>/dev/null || true
pm2 delete usha-server 2>/dev/null || true
pm2 start dist/index.js --name usha-server
pm2 save

echo "   ✅ Server started"
echo ""
echo "   Checking server status..."
sleep 2
if curl -s http://localhost:3000/health > /dev/null; then
    echo "   ✅ Server is responding"
else
    echo "   ⚠️  Server may need a moment to start"
    echo "   Check logs: pm2 logs usha-server"
fi

DEPLOY_SCRIPT

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "Next steps:"
echo "1. SSH into server: ssh ${SERVER_USER}@${SERVER_HOST}"
echo "2. Update .env with database password: nano /opt/usha/server/.env"
echo "3. Restart server: pm2 restart usha-server"
echo "4. Check logs: pm2 logs usha-server"
echo "5. Configure Nginx (see nginx-screenshare.conf)"
echo "6. Set up SSL: sudo certbot --nginx -d screenshare.transparentinsurance.net"

