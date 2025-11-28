#!/bin/bash
# Diagnostic script to check deployment status on server
# Usage: Run this on your server to diagnose the 404 DEPLOYMENT_NOT_FOUND error

set -e

echo "🔍 Usha Deployment Diagnostic"
echo "=============================="
echo ""

# Check if running on server
if [ ! -d "/opt/usha" ]; then
    echo "⚠️  This script should be run on your server"
    echo "   Expected path: /opt/usha"
    echo ""
    echo "To run remotely:"
    echo "  ssh linkpellow@transparentinsurance.net 'bash -s' < scripts/diagnose-deployment.sh"
    exit 1
fi

echo "1. Checking directory structure..."
if [ -d "/opt/usha/server" ]; then
    echo "   ✅ /opt/usha/server exists"
else
    echo "   ❌ /opt/usha/server NOT FOUND"
fi

if [ -d "/opt/usha/viewer" ]; then
    echo "   ✅ /opt/usha/viewer exists"
else
    echo "   ❌ /opt/usha/viewer NOT FOUND"
fi

echo ""
echo "2. Checking server files..."
if [ -d "/opt/usha/server/dist" ]; then
    echo "   ✅ /opt/usha/server/dist exists"
    echo "   Files: $(ls /opt/usha/server/dist | wc -l | tr -d ' ') files"
    if [ -f "/opt/usha/server/dist/index.js" ]; then
        echo "   ✅ server/dist/index.js exists"
    else
        echo "   ❌ server/dist/index.js NOT FOUND"
    fi
else
    echo "   ❌ /opt/usha/server/dist NOT FOUND"
fi

echo ""
echo "3. Checking viewer files..."
if [ -d "/opt/usha/viewer/dist" ]; then
    echo "   ✅ /opt/usha/viewer/dist exists"
    if [ -f "/opt/usha/viewer/dist/index.html" ]; then
        echo "   ✅ viewer/dist/index.html exists"
    else
        echo "   ❌ viewer/dist/index.html NOT FOUND"
    fi
    
    if [ -d "/opt/usha/viewer/dist/assets" ]; then
        echo "   ✅ viewer/dist/assets exists"
        ASSET_COUNT=$(ls /opt/usha/viewer/dist/assets 2>/dev/null | wc -l | tr -d ' ')
        echo "   Assets: $ASSET_COUNT files"
    else
        echo "   ❌ viewer/dist/assets NOT FOUND"
    fi
else
    echo "   ❌ /opt/usha/viewer/dist NOT FOUND"
    echo ""
    echo "   This is likely the cause of the 404 error!"
    echo "   The viewer files need to be deployed."
fi

echo ""
echo "4. Checking environment file..."
if [ -f "/opt/usha/server/.env" ]; then
    echo "   ✅ .env file exists"
    if grep -q "DATABASE_URL" /opt/usha/server/.env; then
        echo "   ✅ DATABASE_URL is set"
    else
        echo "   ⚠️  DATABASE_URL not found in .env"
    fi
else
    echo "   ❌ .env file NOT FOUND"
    echo "   Create it from template: cp env.production.template .env"
fi

echo ""
echo "5. Checking server process..."
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "usha-server"; then
        echo "   ✅ usha-server process found in PM2"
        pm2 list | grep usha-server
    else
        echo "   ❌ usha-server NOT running in PM2"
    fi
else
    echo "   ⚠️  PM2 not found, checking for node process..."
    if pgrep -f "node.*dist/index.js" > /dev/null; then
        echo "   ✅ Node.js server process found"
        pgrep -f "node.*dist/index.js"
    else
        echo "   ❌ Server process NOT running"
    fi
fi

echo ""
echo "6. Checking server logs (if PM2)..."
if command -v pm2 &> /dev/null && pm2 list | grep -q "usha-server"; then
    echo "   Last 10 lines of server logs:"
    pm2 logs usha-server --lines 10 --nostream 2>/dev/null | tail -10 || echo "   Could not read logs"
fi

echo ""
echo "7. Testing path resolution..."
cd /opt/usha/server/dist 2>/dev/null || {
    echo "   ❌ Cannot cd to /opt/usha/server/dist"
    exit 1
}

CWD=$(pwd)
echo "   Current directory: $CWD"

# Test paths the server would try
PATHS=(
    "../../viewer/dist"
    "../../../viewer/dist"
    "../viewer/dist"
    "$(pwd)/../viewer/dist"
    "/opt/usha/viewer/dist"
)

echo ""
echo "   Testing viewer paths:"
for TEST_PATH in "${PATHS[@]}"; do
    if [ -f "$TEST_PATH/index.html" ] 2>/dev/null; then
        echo "   ✅ $TEST_PATH/index.html EXISTS"
        VIEWER_FOUND=true
    else
        echo "   ❌ $TEST_PATH/index.html NOT FOUND"
    fi
done

echo ""
echo "=============================="
echo "Summary:"
echo ""

if [ -f "/opt/usha/viewer/dist/index.html" ]; then
    echo "✅ Viewer files are deployed"
    echo ""
    echo "If you're still getting 404 errors:"
    echo "1. Check server logs: pm2 logs usha-server"
    echo "2. Restart server: pm2 restart usha-server"
    echo "3. Check Nginx configuration"
else
    echo "❌ Viewer files are NOT deployed"
    echo ""
    echo "To fix:"
    echo "1. Build viewer: cd viewer && npm run build"
    echo "2. Deploy: scp -r viewer/dist linkpellow@transparentinsurance.net:/opt/usha/viewer/"
    echo "3. Restart server: pm2 restart usha-server"
fi

