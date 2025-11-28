# Same Server Setup - transparentinsurance.net

## Overview

You're using the **same server** that hosts `transparentinsurance.net` to also host the screen sharing service on `screenshare.transparentinsurance.net`. This is totally fine and common!

## How It Works

```
Your Server
├── Main Website (transparentinsurance.net)
│   └── Your existing codebase (unchanged)
│
└── Screen Sharing Service (screenshare.transparentinsurance.net)
    ├── Node.js server (runs on port 3000)
    └── Viewer files (served by Node.js)
```

## File Structure on Your Server

```
/opt/usha/                    (or wherever you want)
├── server/
│   ├── dist/                 # Server code
│   └── package.json
└── viewer/
    └── dist/                 # Viewer files
```

**Important:** These files are **separate** from your main website codebase. They don't interfere with each other.

## Step-by-Step Setup

### Step 1: Deploy Files to Your Server

SSH into your server and create the directory structure:

```bash
# Create directory for screen sharing service
mkdir -p /opt/usha/server
mkdir -p /opt/usha/viewer

# Copy files from your local machine:
# (Run these from your local machine)
scp -r server/dist user@your-server:/opt/usha/server/
scp server/package.json user@your-server:/opt/usha/server/
scp -r viewer/dist user@your-server:/opt/usha/viewer/
```

### Step 2: Install Dependencies

On your server:

```bash
cd /opt/usha/server
npm install --production
```

### Step 3: Create Environment File

```bash
cd /opt/usha/server
nano .env
```

Add:
```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
DATABASE_URL=postgresql://user:password@localhost:5432/usha
ALLOWED_ORIGINS=https://screenshare.transparentinsurance.net
```

### Step 4: Configure Nginx (or Your Web Server)

You need to configure your web server to:
1. Keep serving `transparentinsurance.net` normally (unchanged)
2. Route `screenshare.transparentinsurance.net` to the Node.js app

#### Nginx Configuration

Add this to your Nginx config (usually `/etc/nginx/sites-available/`):

```nginx
# Screen sharing subdomain
server {
    listen 80;
    server_name screenshare.transparentinsurance.net;
    
    # Redirect HTTP to HTTPS (after SSL is set up)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name screenshare.transparentinsurance.net;

    # SSL certificates (set up with certbot)
    ssl_certificate /etc/letsencrypt/live/screenshare.transparentinsurance.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/screenshare.transparentinsurance.net/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Proxy to Node.js server
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
```

**Important:** Your existing `transparentinsurance.net` configuration stays **completely unchanged**.

### Step 5: Start the Node.js Server

```bash
cd /opt/usha/server

# Option 1: Direct start (for testing)
npm start

# Option 2: Using PM2 (recommended for production)
pm2 start dist/index.js --name usha-server
pm2 save
pm2 startup  # Follow instructions to enable on boot
```

### Step 6: Set Up SSL Certificate

```bash
# Install certbot if not already installed
sudo apt-get install certbot python3-certbot-nginx

# Get certificate for the subdomain
sudo certbot --nginx -d screenshare.transparentinsurance.net
```

This will:
- Get SSL certificate
- Update Nginx config automatically
- Set up auto-renewal

### Step 7: Reload Nginx

```bash
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

## Verification

### Test 1: Health Check
```bash
curl http://localhost:3000/health
# Should return: {"status":"ok",...}
```

### Test 2: Viewer Page
```bash
curl http://localhost:3000/test123
# Should return HTML (viewer page)
```

### Test 3: From Browser
```
https://screenshare.transparentinsurance.net/health
# Should return: {"status":"ok",...}
```

## Important Points

✅ **Main website unchanged** - transparentinsurance.net continues working normally  
✅ **Separate directories** - Screen sharing files in `/opt/usha/`, your website elsewhere  
✅ **Different ports** - Node.js on 3000, your website on 80/443 (via Nginx)  
✅ **Nginx routes** - Subdomain → Node.js, main domain → your website  
✅ **No conflicts** - They run independently  

## Directory Structure Example

```
/var/www/transparentinsurance.net/    ← Your main website (unchanged)
├── index.html
├── css/
└── js/

/opt/usha/                            ← Screen sharing service (new)
├── server/
│   ├── dist/
│   └── package.json
└── viewer/
    └── dist/
```

## Troubleshooting

### Port 3000 Already in Use?
Change the port in `.env`:
```env
PORT=3001
```
Then update Nginx `proxy_pass` to `http://localhost:3001`

### Main Website Still Works?
✅ Yes! Nginx routes based on `server_name`:
- `transparentinsurance.net` → Your existing config
- `screenshare.transparentinsurance.net` → New Node.js config

### Can't Access Subdomain?
1. Check DNS: `nslookup screenshare.transparentinsurance.net`
2. Check Nginx: `sudo nginx -t`
3. Check Node.js: `pm2 status` or `ps aux | grep node`
4. Check firewall: `sudo ufw status`

## Quick Reference

### Files to Deploy
1. `server/dist/` → `/opt/usha/server/dist/`
2. `server/package.json` → `/opt/usha/server/package.json`
3. `viewer/dist/` → `/opt/usha/viewer/dist/`

### Commands to Run
```bash
# On server
cd /opt/usha/server
npm install --production
pm2 start dist/index.js --name usha-server
sudo certbot --nginx -d screenshare.transparentinsurance.net
sudo systemctl reload nginx
```

## Summary

- ✅ Same server, different services
- ✅ Main website: No changes
- ✅ Screen sharing: New Node.js app in `/opt/usha/`
- ✅ Nginx routes subdomain to Node.js
- ✅ Both work independently

---

**Your main website codebase stays completely untouched!**

