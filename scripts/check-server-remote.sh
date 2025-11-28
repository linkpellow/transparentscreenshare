#!/bin/bash
# Server diagnostic script - run this on the server after SSH

echo "=== Server Status ==="
pm2 status

echo ""
echo "=== Server Directory ==="
if [ -d "/opt/usha/server" ]; then
    ls -la /opt/usha/server/
    echo ""
    echo "=== .env file ==="
    if [ -f "/opt/usha/server/.env" ]; then
        echo "✅ .env exists"
        grep -v PASSWORD /opt/usha/server/.env | head -10
    else
        echo "❌ .env file not found"
    fi
else
    echo "❌ Directory not found: /opt/usha/server"
fi

echo ""
echo "=== Viewer Directory ==="
if [ -d "/opt/usha/viewer/dist" ]; then
    echo "✅ Viewer files exist"
    ls -la /opt/usha/viewer/dist/ | head -5
else
    echo "❌ Viewer files not found: /opt/usha/viewer/dist"
fi

echo ""
echo "=== Test Local Connection ==="
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Server responds on localhost:3000"
    curl -s http://localhost:3000/health
else
    echo "❌ Server not responding locally"
    echo "   This means the server is not running or crashed"
fi

echo ""
echo "=== PM2 Logs (last 20 lines) ==="
pm2 logs usha-server --lines 20 --nostream 2>/dev/null | tail -20 || echo "No logs available or server not running"

echo ""
echo "=== Nginx Status ==="
if command -v systemctl > /dev/null 2>&1; then
    sudo systemctl status nginx | head -10
else
    echo "systemctl not available (may not be on Linux server)"
fi

