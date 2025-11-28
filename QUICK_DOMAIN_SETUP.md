# Quick Setup: transparentinsurance.net

## ⚠️ Important: Use a Subdomain!

**DO NOT** point your root domain to the screen sharing server - it will break your main website!

**✅ Use a subdomain instead:**
- `screenshare.transparentinsurance.net`
- `share.transparentinsurance.net`
- Or any other subdomain you prefer

This way your main website at `transparentinsurance.net` stays untouched!

## Quick Configuration

### 1. Set Up DNS

Create a DNS A record:
```
Type: A
Name: screenshare
Value: [Your Server IP]
```

This creates: `screenshare.transparentinsurance.net`

### 2. Configure Extension

1. Open extension popup
2. In **Viewer Domain** field, enter:
   ```
   https://screenshare.transparentinsurance.net
   ```
3. In **Server URL** field, enter your backend:
   ```
   https://screenshare.transparentinsurance.net
   ```
   (Or use separate API subdomain if preferred)
4. Click save 💾

### 2. Deploy Server

Your server needs to:
- Serve the viewer app at the root
- Handle routes like `/screenshareid169304`
- Support WebSocket at `/ws/:sessionId`

### 3. URL Format

After setup, links will be:
```
https://screenshare.transparentinsurance.net/screenshareid169304
https://screenshare.transparentinsurance.net/sess_1234567890_abc123
```

**No `/view/` prefix needed!** The server supports both formats.

**Your main website** at `transparentinsurance.net` remains completely unaffected! ✅

## Server Deployment Options

### Option A: Subdomain (Recommended) ✅
- Viewer: `https://screenshare.transparentinsurance.net`
- Server: `https://screenshare.transparentinsurance.net`
- Main site: `https://transparentinsurance.net` (unchanged!)
- Clean separation, no conflicts

### Option B: Separate API Subdomain
- API: `https://api.transparentinsurance.net`
- Viewer: `https://screenshare.transparentinsurance.net`
- Main site: `https://transparentinsurance.net` (unchanged!)
- Even cleaner separation

## Nginx Configuration

```nginx
# Screen sharing subdomain
server {
    listen 443 ssl;
    server_name screenshare.transparentinsurance.net;

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

## Testing

1. Set up DNS for subdomain
2. Configure extension with subdomain: `https://screenshare.transparentinsurance.net`
3. Start sharing
4. Copy viewer link
5. Should be: `https://screenshare.transparentinsurance.net/{sessionId}`
6. Open on another device - works!
7. Verify main website still works at `transparentinsurance.net` ✅

---

**That's it!** Your clients will get clean, branded links like `screenshare.transparentinsurance.net/screenshareid169304` and your main website stays safe! 🎉

