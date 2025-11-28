#!/bin/bash
# Check server status and diagnose connection issues
# Run this on your server

set -e

echo "🔍 Checking Usha Server Status"
echo "=============================="
echo ""

# Check if server is running
echo "1. Checking if server process is running..."
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "usha-server"; then
        echo "   ✅ Server is running in PM2"
        pm2 list | grep usha-server
        echo ""
        echo "   Server status:"
        pm2 describe usha-server | grep -E "(status|uptime|restarts)" || true
    else
        echo "   ❌ Server is NOT running in PM2"
        echo "   Start it with: pm2 start /opt/usha/server/dist/index.js --name usha-server"
    fi
else
    echo "   ⚠️  PM2 not found, checking for node process..."
    if pgrep -f "node.*dist/index.js" > /dev/null; then
        echo "   ✅ Node.js process found"
        pgrep -f "node.*dist/index.js"
    else
        echo "   ❌ No server process found"
    fi
fi

echo ""
echo "2. Testing local server connection..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "   ✅ Server responds on localhost:3000"
    curl -s http://localhost:3000/health | head -1
else
    echo "   ❌ Server does NOT respond on localhost:3000"
    echo "   This means the server is not running or crashed"
fi

echo ""
echo "3. Checking Nginx configuration..."
if [ -f "/etc/nginx/sites-available/screenshare.transparentinsurance.net" ]; then
    echo "   ✅ Nginx config file exists"
    if [ -L "/etc/nginx/sites-enabled/screenshare.transparentinsurance.net" ]; then
        echo "   ✅ Nginx config is enabled"
    else
        echo "   ❌ Nginx config is NOT enabled"
        echo "   Enable with: sudo ln -s /etc/nginx/sites-available/screenshare.transparentinsurance.net /etc/nginx/sites-enabled/"
    fi
else
    echo "   ❌ Nginx config file NOT FOUND"
fi

echo ""
echo "4. Testing Nginx status..."
if systemctl is-active --quiet nginx; then
    echo "   ✅ Nginx is running"
else
    echo "   ❌ Nginx is NOT running"
    echo "   Start with: sudo systemctl start nginx"
fi

echo ""
echo "5. Testing external connection..."
if curl -s -I https://screenshare.transparentinsurance.net/health 2>&1 | grep -q "200\|OK"; then
    echo "   ✅ External HTTPS connection works"
    curl -s https://screenshare.transparentinsurance.net/health | head -1
else
    echo "   ❌ External HTTPS connection FAILED"
    echo "   Testing HTTP..."
    if curl -s -I http://screenshare.transparentinsurance.net/health 2>&1 | grep -q "200\|301\|302"; then
        echo "   ⚠️  HTTP works but HTTPS doesn't - SSL issue"
    else
        echo "   ❌ Both HTTP and HTTPS failed"
    fi
fi

echo ""
echo "6. Checking SSL certificate..."
if [ -f "/etc/letsencrypt/live/screenshare.transparentinsurance.net/fullchain.pem" ]; then
    echo "   ✅ SSL certificate exists"
    CERT_EXPIRY=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/screenshare.transparentinsurance.net/fullchain.pem 2>/dev/null | cut -d= -f2)
    if [ -n "$CERT_EXPIRY" ]; then
        echo "   Certificate expires: $CERT_EXPIRY"
    fi
else
    echo "   ❌ SSL certificate NOT FOUND"
    echo "   Set up with: sudo certbot --nginx -d screenshare.transparentinsurance.net"
fi

echo ""
echo "7. Checking server logs (last 20 lines)..."
if command -v pm2 &> /dev/null && pm2 list | grep -q "usha-server"; then
    echo "   Recent log entries:"
    pm2 logs usha-server --lines 20 --nostream 2>/dev/null | tail -20 || echo "   Could not read logs"
else
    echo "   ⚠️  Cannot read logs (PM2 not available or server not running)"
fi

echo ""
echo "8. Checking CORS configuration..."
if [ -f "/opt/usha/server/.env" ]; then
    if grep -q "ALLOWED_ORIGINS" /opt/usha/server/.env; then
        echo "   ✅ ALLOWED_ORIGINS is configured"
        grep "ALLOWED_ORIGINS" /opt/usha/server/.env
    else
        echo "   ⚠️  ALLOWED_ORIGINS not found in .env"
    fi
else
    echo "   ❌ .env file not found"
fi

echo ""
echo "=============================="
echo "Summary:"
echo ""

# Determine issue
if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "❌ MAIN ISSUE: Server is not running or not responding"
    echo "   Fix: Start the server with PM2"
elif ! curl -s -I https://screenshare.transparentinsurance.net/health 2>&1 | grep -q "200\|OK"; then
    echo "❌ MAIN ISSUE: External connection failed"
    echo "   Possible causes:"
    echo "   - Nginx not running or misconfigured"
    echo "   - SSL certificate issue"
    echo "   - Firewall blocking"
else
    echo "✅ Server appears to be working correctly"
    echo "   If extension still fails, check CORS configuration"
fi

