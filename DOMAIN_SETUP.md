# Domain Setup for screenshare.transparentinsurance.net

## ✅ No Code Required on transparentinsurance.net

You **do NOT need to code anything** on your main `transparentinsurance.net` website. The screen sharing service runs on a **separate subdomain** (`screenshare.transparentinsurance.net`) which is completely independent.

## What You Need to Do

### 1. DNS Configuration

Add a DNS A record or CNAME record pointing the subdomain to your server:

**Option A: A Record (Direct IP)**
```
Type: A
Name: screenshare
Value: YOUR_SERVER_IP
TTL: 3600
```

**Option B: CNAME (If using a hostname)**
```
Type: CNAME
Name: screenshare
Value: your-server-hostname.com
TTL: 3600
```

### 2. Server Configuration

The server needs to:
- Listen on port 80 (HTTP) and 443 (HTTPS)
- Serve the viewer application
- Handle WebSocket connections
- Process API requests

### 3. SSL Certificate

Set up SSL/HTTPS using Let's Encrypt:

```bash
sudo certbot --nginx -d screenshare.transparentinsurance.net
```

Or if using a different web server, follow their SSL setup instructions.

### 4. Nginx Configuration

Configure Nginx to:
- Serve the viewer app from `/opt/usha/viewer/dist`
- Proxy API requests to `http://localhost:3000`
- Handle WebSocket connections on `/ws`

See `nginx.conf.example` for the complete configuration.

## How It Works

```
User clicks link: screenshare.transparentinsurance.net/sess_123
         ↓
DNS resolves to your server IP
         ↓
Nginx receives request
         ↓
Serves viewer app (if /sess_*) or proxies API (if /api/*)
         ↓
Viewer connects via WebSocket to signaling server
         ↓
WebRTC connection established
```

## Important Notes

1. **Main website is unaffected** - `transparentinsurance.net` continues to work normally
2. **Subdomain is independent** - `screenshare.transparentinsurance.net` is a separate service
3. **No code changes needed** - Just DNS and server configuration
4. **Extension is hardcoded** - Always uses `https://screenshare.transparentinsurance.net`

## Verification

After DNS propagates and server is configured:

1. Test DNS: `nslookup screenshare.transparentinsurance.net`
2. Test HTTP: `curl http://screenshare.transparentinsurance.net/health`
3. Test HTTPS: `curl https://screenshare.transparentinsurance.net/health`
4. Test viewer: Open `https://screenshare.transparentinsurance.net/test123` in browser

## Troubleshooting

- **DNS not resolving?** Wait for propagation (15 min - 24 hours)
- **SSL errors?** Check certificate is installed and valid
- **404 errors?** Verify Nginx is serving viewer files correctly
- **WebSocket errors?** Check Nginx WebSocket proxy configuration

---

**Summary:** No coding needed on the main domain. Just DNS + server configuration for the subdomain.

