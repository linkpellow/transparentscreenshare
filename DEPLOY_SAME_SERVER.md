# Same Server Deployment Guide

Complete step-by-step guide for deploying Usha to the same server hosting `transparentinsurance.net`.

## Prerequisites

- SSH access to your server
- Node.js 18+ installed
- PostgreSQL database (or access to one)
- Nginx installed and configured
- PM2 installed (for process management)
- Certbot installed (for SSL certificates)

## Quick Start

### Option 1: Automated Deployment Script

```bash
# From your local machine
cd /Users/linkpellow/Documents/usha
chmod +x scripts/deploy-same-server.sh
./scripts/deploy-same-server.sh

# Upload to server
scp usha-deploy.tar.gz user@your-server:/tmp/

# SSH into server and extract
ssh user@your-server
mkdir -p /opt/usha
cd /opt/usha
tar -xzf /tmp/usha-deploy.tar.gz
```

### Option 2: Manual Deployment

Follow the steps below.

## Step-by-Step Deployment

### Step 1: Build Application (Local Machine)

```bash
cd /Users/linkpellow/Documents/usha
npm run build
```

This creates:
- `server/dist/` - Server code
- `viewer/dist/` - Viewer files

### Step 2: Prepare Database

On your server, create the database:

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE usha;
CREATE USER usha_user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE usha TO usha_user;
\q
```

### Step 3: Upload Files to Server

From your local machine:

```bash
# Create directories on server
ssh user@your-server "mkdir -p /opt/usha/server /opt/usha/viewer"

# Copy server files
scp -r server/dist user@your-server:/opt/usha/server/
scp server/package.json user@your-server:/opt/usha/server/

# Copy viewer files
scp -r viewer/dist user@your-server:/opt/usha/viewer/
```

### Step 4: Install Dependencies

SSH into your server:

```bash
cd /opt/usha/server
npm install --production
```

### Step 5: Configure Environment

Create `.env` file:

```bash
cd /opt/usha/server
nano .env
```

Copy the production template and update with your database password:

```bash
cp .env.production .env
nano .env
```

Update the `DATABASE_URL` with your actual database password:

```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
DATABASE_URL=postgresql://usha_user:your-secure-password@localhost:5432/usha
ALLOWED_ORIGINS=https://screenshare.transparentinsurance.net,https://transparentinsurance.net
APP_URL=https://screenshare.transparentinsurance.net
RECORDING_STORAGE_PATH=./recordings
```

**Important:** Replace `your-secure-password` with the actual password you set in Step 2.

### Step 6: Configure Nginx

Create Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/screenshare.transparentinsurance.net
```

Copy the contents from `nginx.conf.example` or use this:

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

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/screenshare.transparentinsurance.net /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
```

**Note:** Don't reload Nginx yet - we need SSL first.

### Step 7: Set Up DNS

Ensure your DNS has an A record pointing to your server:

```
screenshare.transparentinsurance.net  A  your-server-ip
```

Verify DNS:

```bash
nslookup screenshare.transparentinsurance.net
```

### Step 8: Start Server (Temporary, for SSL setup)

Start the server temporarily to allow certbot to verify:

```bash
cd /opt/usha/server
npm start
```

Or with PM2:

```bash
cd /opt/usha/server
pm2 start dist/index.js --name usha-server
```

### Step 9: Set Up SSL Certificate

```bash
# Install certbot if not already installed
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Get certificate for the subdomain
sudo certbot --nginx -d screenshare.transparentinsurance.net --email linkpellow@transparentinsurance.net --agree-tos --non-interactive
```

This will:
- Get SSL certificate
- Update Nginx config automatically
- Set up auto-renewal

### Step 10: Reload Nginx

```bash
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

### Step 11: Start Server with PM2 (Production)

If you started the server manually in Step 8, stop it first:

```bash
pm2 stop usha-server
pm2 delete usha-server
```

Then start it properly:

```bash
cd /opt/usha/server
pm2 start dist/index.js --name usha-server
pm2 save
pm2 startup  # Follow instructions to enable on boot
```

## Verification

### Test 1: Health Check (Local)

```bash
curl http://localhost:3000/health
# Should return: {"status":"ok",...}
```

### Test 2: Viewer Page (Local)

```bash
curl http://localhost:3000/test123
# Should return HTML (viewer page)
```

### Test 3: From Browser

```
https://screenshare.transparentinsurance.net/health
# Should return: {"status":"ok",...}
```

### Test 4: Check Server Logs

```bash
pm2 logs usha-server
# Should show: "Viewer files found at: /opt/usha/viewer/dist"
```

## Troubleshooting

### Port 3000 Already in Use?

Change the port in `.env`:

```env
PORT=3001
```

Then update Nginx `proxy_pass` to `http://localhost:3001` and reload.

### Database Connection Error?

1. Check database is running: `sudo systemctl status postgresql`
2. Verify credentials in `.env`
3. Test connection: `psql -U usha_user -d usha -h localhost`
4. Check firewall: `sudo ufw status`

### Viewer Files Not Found?

Check server logs:

```bash
pm2 logs usha-server | grep viewer
```

Verify files exist:

```bash
ls -la /opt/usha/viewer/dist/
# Should show: index.html, assets/
```

The server looks for viewer files at:
- `/opt/usha/viewer/dist/` (relative to `/opt/usha/server/dist/`)

### Nginx 502 Bad Gateway?

1. Check server is running: `pm2 status`
2. Check server logs: `pm2 logs usha-server`
3. Verify port in `.env` matches Nginx config
4. Check firewall: `sudo ufw allow 3000`

### SSL Certificate Issues?

1. Check certificate: `sudo certbot certificates`
2. Test renewal: `sudo certbot renew --dry-run`
3. Check Nginx config: `sudo nginx -t`

## Maintenance

### Update Application

```bash
# On local machine: build
npm run build

# Upload new files
scp -r server/dist user@your-server:/opt/usha/server/
scp -r viewer/dist user@your-server:/opt/usha/viewer/

# On server: restart
pm2 restart usha-server
```

### View Logs

```bash
pm2 logs usha-server
pm2 logs usha-server --lines 100  # Last 100 lines
```

### Monitor Server

```bash
pm2 status
pm2 monit
```

## File Structure Summary

```
/opt/usha/
├── server/
│   ├── dist/              # Server code (compiled)
│   ├── package.json
│   ├── .env               # Environment variables
│   └── node_modules/      # Dependencies
└── viewer/
    └── dist/              # Viewer files
        ├── index.html
        └── assets/
```

## Important Notes

✅ **Main website unchanged** - `transparentinsurance.net` continues working normally  
✅ **Separate directories** - Screen sharing files in `/opt/usha/`, your website elsewhere  
✅ **Different ports** - Node.js on 3000, your website on 80/443 (via Nginx)  
✅ **Nginx routes** - Subdomain → Node.js, main domain → your website  
✅ **No conflicts** - They run independently

---

**Your main website codebase stays completely untouched!**

