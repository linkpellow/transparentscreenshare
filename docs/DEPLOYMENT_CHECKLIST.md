# Deployment Checklist - What You Need to Do

## ⚠️ Important: DNS Propagation Alone Isn't Enough!

After DNS propagates, you still need to set up the server. Here's what's required:

## Required Steps After DNS Propagation

### 1. ✅ Build the Viewer Application

The viewer needs to be built before deployment:

```bash
cd viewer
npm install
npm run build
```

This creates the `viewer/dist/` folder with the viewer app.

### 2. ✅ Deploy Server Code

Your server needs to:
- Be running on your server
- Have access to the built viewer files
- Be configured to serve them

**Option A: Deploy Everything Together**
```bash
# On your server
git clone [your-repo]
cd usha
npm install
cd viewer && npm install && npm run build
cd ../server && npm install && npm run build
```

**Option B: Copy Built Files**
```bash
# Build locally, then copy
cd viewer && npm run build
# Copy viewer/dist to server
scp -r viewer/dist user@server:/path/to/usha/viewer/dist
```

### 3. ✅ Set Up SSL/HTTPS

**Required for WebRTC!** WebRTC requires HTTPS (or localhost).

**Using Let's Encrypt:**
```bash
sudo certbot --nginx -d screenshare.transparentinsurance.net
```

Or configure your reverse proxy (Nginx/Caddy) with SSL.

### 4. ✅ Configure Server to Serve Viewer

The server needs to serve the viewer app. Check:

**File**: `server/src/middleware/staticFiles.ts`
- Should point to `viewer/dist` folder
- Should serve `index.html` for viewer routes

**File**: `server/src/routes/index.ts`
- Should have routes for `/:sessionId` and `/view/:sessionId`

### 5. ✅ Start the Server

```bash
cd server
npm start
# Or with PM2:
pm2 start dist/index.js --name usha-server
```

### 6. ✅ Configure Reverse Proxy (If Using)

If using Nginx/Caddy, configure it to:
- Serve viewer app from `/`
- Proxy `/api/*` to backend
- Proxy `/ws/*` to WebSocket server

### 7. ✅ Test the Setup

1. **Test DNS:**
   ```bash
   curl -I https://screenshare.transparentinsurance.net
   # Should return 200 OK
   ```

2. **Test Viewer Page:**
   - Open: `https://screenshare.transparentinsurance.net/test123`
   - Should load viewer page (even with fake session ID)

3. **Test WebSocket:**
   - Check browser console for WebSocket connection
   - Should connect to `wss://screenshare.transparentinsurance.net/ws/...`

## What Happens Automatically vs. What You Need to Do

### ✅ Automatic (After Setup)
- DNS resolution (after propagation)
- Viewer page loading
- WebSocket connections
- WebRTC connections
- Session management

### ❌ Manual (You Must Do)
- [ ] Build viewer application
- [ ] Deploy server code
- [ ] Set up SSL certificate
- [ ] Configure server/reverse proxy
- [ ] Start server process
- [ ] Configure extension with domain
- [ ] Test everything

## Quick Deployment Guide

### Step 1: Build Everything
```bash
# Build shared package
cd shared && npm install && npm run build

# Build viewer
cd ../viewer && npm install && npm run build

# Build server
cd ../server && npm install && npm run build
```

### Step 2: Deploy to Server
```bash
# Copy files to server (adjust paths)
scp -r server/dist user@server:/path/to/usha/server/dist
scp -r viewer/dist user@server:/path/to/usha/viewer/dist
scp server/package.json user@server:/path/to/usha/server/
```

### Step 3: Set Up SSL
```bash
# On server
sudo certbot --nginx -d screenshare.transparentinsurance.net
```

### Step 4: Configure Nginx
```nginx
server {
    listen 443 ssl;
    server_name screenshare.transparentinsurance.net;
    
    ssl_certificate /etc/letsencrypt/live/screenshare.transparentinsurance.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/screenshare.transparentinsurance.net/privkey.pem;
    
    # Viewer app
    location / {
        root /path/to/usha/viewer/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # WebSocket
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # API
    location /api {
        proxy_pass http://localhost:3000;
    }
}
```

### Step 5: Start Server
```bash
cd /path/to/usha/server
npm install --production
npm start
# Or use PM2 for process management
```

### Step 6: Configure Extension
1. Open extension popup
2. Viewer Domain: `https://screenshare.transparentinsurance.net`
3. Server URL: `https://screenshare.transparentinsurance.net`
4. Save

### Step 7: Test
1. Start a screen share session
2. Copy the viewer link
3. Open in another browser/device
4. Should work!

## Troubleshooting

### "This site can't be reached"
- DNS not propagated yet (wait)
- Server not running (start it)
- Firewall blocking (check ports)
- Wrong IP in DNS (verify)

### "Connection refused"
- Server not running
- Wrong port
- Firewall issue

### "SSL certificate error"
- SSL not set up
- Certificate not valid
- Wrong domain in certificate

### "404 Not Found"
- Viewer not built
- Wrong path in server config
- Files not deployed

## Summary

**After DNS propagation, you need to:**
1. ✅ Build and deploy viewer app
2. ✅ Set up SSL/HTTPS
3. ✅ Configure and start server
4. ✅ Configure extension
5. ✅ Test

**Then it will work automatically!** The link will function once all these pieces are in place.

---

**TL;DR**: DNS propagation makes the domain point to your server, but you still need to actually set up and run the server with SSL, the viewer app, and proper configuration. Then it works automatically! 🚀

