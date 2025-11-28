#!/bin/bash
# Quick server check - can be run from local Mac
# Tests if the server is accessible

echo "🔍 Checking Usha Server Status"
echo "=============================="
echo ""

echo "1. Testing external connection..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://screenshare.transparentinsurance.net/health 2>/dev/null)

if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Server is accessible (HTTP $HTTP_CODE)"
    echo "   Response:"
    curl -s https://screenshare.transparentinsurance.net/health | head -1
elif [ "$HTTP_CODE" = "000" ]; then
    echo "   ❌ Connection failed or timeout"
    echo "   Server may be down or unreachable"
elif [ "$HTTP_CODE" = "502" ]; then
    echo "   ⚠️  Bad Gateway (502)"
    echo "   Nginx is running but can't reach Node.js server"
elif [ "$HTTP_CODE" = "503" ]; then
    echo "   ⚠️  Service Unavailable (503)"
    echo "   Server is overloaded or not ready"
else
    echo "   ⚠️  Unexpected response (HTTP $HTTP_CODE)"
fi

echo ""
echo "2. Testing DNS resolution..."
if nslookup screenshare.transparentinsurance.net > /dev/null 2>&1; then
    echo "   ✅ DNS resolves correctly"
    nslookup screenshare.transparentinsurance.net | grep -A 1 "Name:" | head -2
else
    echo "   ❌ DNS resolution failed"
fi

echo ""
echo "3. Testing SSL certificate..."
if echo | openssl s_client -connect screenshare.transparentinsurance.net:443 -servername screenshare.transparentinsurance.net 2>/dev/null | grep -q "Verify return code: 0"; then
    echo "   ✅ SSL certificate is valid"
else
    echo "   ⚠️  SSL certificate issue (or connection failed)"
fi

echo ""
echo "=============================="
echo "Next Steps:"
echo ""

if [ "$HTTP_CODE" != "200" ]; then
    echo "❌ Server is not responding correctly"
    echo ""
    echo "SSH into server and check:"
    echo "  ssh linkpellow@transparentinsurance.net"
    echo "  pm2 status"
    echo "  pm2 logs usha-server"
    echo "  curl http://localhost:3000/health"
else
    echo "✅ Server appears to be working!"
    echo "   If extension still fails, check CORS configuration"
fi

