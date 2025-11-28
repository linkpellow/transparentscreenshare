# Custom Domain Setup for transparentinsurance.net

## Overview

You can use your domain `transparentinsurance.net` for viewer links instead of localhost or IP addresses. This provides a professional, branded experience for your clients.

## URL Format

With your domain, viewer links will look like:
```
https://transparentinsurance.net/screenshareid169304
https://transparentinsurance.net/sess_1234567890_abc123
```

Instead of:
```
http://localhost:3000/view/sess_1234567890_abc123
```

## Setup Steps

### 1. Configure DNS

**⚠️ IMPORTANT: Use a Subdomain!**

**DO NOT point your root domain** (`transparentinsurance.net`) to the screen sharing server - this will break your existing website!

**✅ Use a Subdomain (Recommended)**
```
screenshare.transparentinsurance.net → Your server IP
```

Or other options:
```
share.transparentinsurance.net → Your server IP
view.transparentinsurance.net → Your server IP
demo.transparentinsurance.net → Your server IP
```

This way:
- ✅ Your main website stays at `transparentinsurance.net`
- ✅ Screen sharing uses `screenshare.transparentinsurance.net`
- ✅ No conflicts!

### 2. Set Up SSL/HTTPS

Use Let's Encrypt or your SSL provider:
```bash
# Using Let's Encrypt with certbot
sudo certbot --nginx -d screenshare.transparentinsurance.net
```

### 3. Configure Server

Update your server to:
- Listen on port 443 (HTTPS) or use reverse proxy
- Serve the viewer application
- Handle WebSocket connections (WSS)

### 4. Configure Extension

1. Open extension popup
2. Enter **Viewer Domain**: `https://screenshare.transparentinsurance.net`
3. Enter **Server URL**: Your backend server
   - Can be same: `https://screenshare.transparentinsurance.net`
   - Or separate: `https://api.transparentinsurance.net`
4. Click save 💾

### 5. Start Sharing

- Extension will generate links like: `https://screenshare.transparentinsurance.net/{sessionId}`
- Share this link with clients
- They open it in any browser - no downloads!

## Server Configuration

### Nginx Reverse Proxy (Recommended)

```nginx
# Screen sharing subdomain
server {
    listen 80;
    server_name screenshare.transparentinsurance.net;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name screenshare.transparentinsurance.net;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Serve viewer application
    location / {
        root /path/to/usha/viewer/dist;
        try_files $uri $uri/ /index.html;
    }

    # WebSocket proxy for signaling
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Direct Server Setup

If running server directly on port 443:

```typescript
// server/src/index.ts
const PORT = process.env.PORT || 443;
const HOST = process.env.HOST || '0.0.0.0';

// Use HTTPS in production
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('/path/to/private.key'),
  cert: fs.readFileSync('/path/to/certificate.crt')
};

const server = https.createServer(options, app);
```

## Extension Configuration

### Viewer Domain Settings

In the extension popup:
- **Viewer Domain**: `https://screenshare.transparentinsurance.net`
  - This is what clients see and use
  - Uses subdomain so it doesn't conflict with main website

- **Server URL**: `https://screenshare.transparentinsurance.net` (or separate API subdomain)
  - Backend API and WebSocket server
  - Can be same subdomain or different

### URL Generation

The extension will generate viewer links using:
```
{viewerDomain}/{sessionId}
```

Example:
- Viewer Domain: `https://screenshare.transparentinsurance.net`
- Session ID: `screenshareid169304`
- Result: `https://screenshare.transparentinsurance.net/screenshareid169304`

## Session ID Formats

The system supports multiple session ID formats:

1. **Auto-generated**: `sess_1234567890_abc123`
2. **Custom**: `screenshareid169304` (you can customize)
3. **Any format**: As long as it's unique

## WebSocket Connection

Viewers connect to WebSocket using:
```
wss://screenshare.transparentinsurance.net/ws/{sessionId}
```

Make sure:
- SSL certificate covers WebSocket (WSS)
- Nginx/proxy supports WebSocket upgrades
- Firewall allows WebSocket connections

## CORS Configuration

The server is configured to allow requests from:
- `https://screenshare.transparentinsurance.net`
- `http://screenshare.transparentinsurance.net`
- Your configured domains

Update `server/src/index.ts` if needed:
```typescript
const allowedOrigins = [
  'https://screenshare.transparentinsurance.net',
  'http://screenshare.transparentinsurance.net',
  'https://transparentinsurance.net', // If you want to allow main site
  // Add other domains
];
```

## Testing

1. **Local Testing**:
   - Use `http://localhost:3000` for server
   - Use `https://transparentinsurance.net` for viewer domain
   - Test that links work

2. **Production Testing**:
   - Deploy server
   - Configure DNS
   - Test viewer link from different device/network
   - Verify WebSocket connection works

## Security Considerations

1. **HTTPS Required**: Always use HTTPS in production
2. **CORS**: Configure allowed origins properly
3. **Rate Limiting**: Add rate limiting to prevent abuse
4. **Authentication**: Consider adding authentication for sensitive sessions
5. **Session Expiry**: Set session expiration times

## Example Deployment

```bash
# 1. Deploy server
cd server
npm run build
npm start

# 2. Build viewer
cd viewer
npm run build

# 3. Configure Nginx (see above)

# 4. Set up SSL
sudo certbot --nginx -d screenshare.transparentinsurance.net

# 5. Configure extension
# Viewer Domain: https://transparentinsurance.net
# Server URL: https://transparentinsurance.net (or API subdomain)
```

## Troubleshooting

### "Connection refused"
- Check DNS points to correct server
- Verify server is running
- Check firewall rules

### "WebSocket connection failed"
- Ensure WSS (secure WebSocket) is configured
- Check Nginx WebSocket proxy settings
- Verify SSL certificate is valid

### "CORS error"
- Add domain to allowed origins in server
- Check CORS headers in response

---

**Result**: Professional, branded screen sharing links like `https://screenshare.transparentinsurance.net/screenshareid169304` that work seamlessly for your clients without affecting your main website!

