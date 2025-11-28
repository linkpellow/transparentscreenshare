# Production Deployment Guide

## Complete Deployment Steps

### Prerequisites

- Server with Node.js 18+
- Domain DNS configured (subdomain)
- SSH access to server
- Root/sudo access on server

## Step 1: Build Everything

```bash
# On your local machine
cd /Users/linkpellow/Documents/usha
./scripts/build-all.sh
```

This builds:
- ✅ Shared package
- ✅ Viewer application
- ✅ Server application
- ✅ Extension (for distribution)

## Step 2: Deploy to Server

### Option A: Manual Deployment

```bash
# Copy files to server
scp -r server/dist user@server:/opt/usha/server/
scp -r viewer/dist user@server:/opt/usha/viewer/
scp server/package.json user@server:/opt/usha/server/

# SSH into server
ssh user@server

# Install production dependencies
cd /opt/usha/server
npm install --production
```

### Option B: Using Deployment Script

```bash
# Set environment variables
export USHA_SERVER_USER=ubuntu
export USHA_SERVER_HOST=your-server.com
export USHA_SERVER_PATH=/opt/usha

# Run deployment
./scripts/deploy.sh
```

### Option C: Using Docker

```bash
# Build and deploy with Docker
docker-compose up -d
```

## Step 3: Configure Environment

On your server, create `.env` file:

```bash
cd /opt/usha/server
cp .env.example .env
nano .env
```

**Required settings:**
```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

DATABASE_URL=postgresql://user:password@localhost:5432/usha

JWT_SECRET=your-strong-secret-key-here
JWT_EXPIRES_IN=7d

AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
S3_BUCKET_NAME=usha-recordings

ALLOWED_ORIGINS=https://screenshare.transparentinsurance.net
```

## Step 4: Set Up Database

```bash
# On server
sudo -u postgres psql
CREATE DATABASE usha;
CREATE USER usha_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE usha TO usha_user;
\q
```

The server will create tables automatically on first run.

## Step 5: Set Up SSL Certificate

```bash
# Install certbot (if not installed)
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d screenshare.transparentinsurance.net

# Auto-renewal (certbot sets this up automatically)
```

## Step 6: Configure Nginx

```bash
# Copy example config
sudo cp nginx.conf.example /etc/nginx/sites-available/screenshare

# Edit for your paths
sudo nano /etc/nginx/sites-available/screenshare
# Update paths: /opt/usha/viewer/dist

# Enable site
sudo ln -s /etc/nginx/sites-available/screenshare /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## Step 7: Start Server

### Option A: Using PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start server
cd /opt/usha/server
pm2 start dist/index.js --name usha-server

# Save PM2 configuration
pm2 save
pm2 startup  # Follow instructions to enable on boot
```

### Option B: Using systemd

```bash
# Copy service file
sudo cp scripts/setup-server.sh /tmp/
# Edit and run setup script, or manually create service

# Start service
sudo systemctl start usha-server
sudo systemctl enable usha-server
```

### Option C: Using Docker

```bash
docker-compose up -d
```

## Step 8: Configure Extension

1. Open Chrome extension popup
2. **Viewer Domain**: `https://screenshare.transparentinsurance.net`
3. **Server URL**: `https://screenshare.transparentinsurance.net`
4. Click save 💾

## Step 9: Test Everything

### Test 1: Server Health
```bash
curl https://screenshare.transparentinsurance.net/health
# Should return: {"status":"ok","timestamp":"..."}
```

### Test 2: Viewer Page
Open in browser:
```
https://screenshare.transparentinsurance.net/test123
```
Should load viewer page (even with fake session ID).

### Test 3: WebSocket
Open browser console on viewer page, check for WebSocket connection.

### Test 4: Full Flow
1. Start screen share from extension
2. Copy viewer link
3. Open link on another device
4. Should see screen share!

## Monitoring

### Check Server Status

**PM2:**
```bash
pm2 status
pm2 logs usha-server
```

**systemd:**
```bash
sudo systemctl status usha-server
sudo journalctl -u usha-server -f
```

**Docker:**
```bash
docker-compose ps
docker-compose logs -f
```

### Check Nginx
```bash
sudo systemctl status nginx
sudo nginx -t
```

## Maintenance

### Update Application

```bash
# On local machine
./scripts/build-all.sh

# Copy new files
scp -r server/dist user@server:/opt/usha/server/
scp -r viewer/dist user@server:/opt/usha/viewer/

# On server
cd /opt/usha/server
pm2 restart usha-server
# Or
sudo systemctl restart usha-server
```

### Backup Database

```bash
# Backup
pg_dump -U usha_user usha > backup_$(date +%Y%m%d).sql

# Restore
psql -U usha_user usha < backup_20240101.sql
```

### View Logs

```bash
# PM2
pm2 logs usha-server

# systemd
sudo journalctl -u usha-server -n 100

# Docker
docker-compose logs -f usha-server
```

## Security Checklist

- [ ] SSL certificate installed and auto-renewing
- [ ] Firewall configured (allow 80, 443, 3000)
- [ ] Database password is strong
- [ ] JWT_SECRET is strong and unique
- [ ] AWS credentials secured
- [ ] Server running as non-root user
- [ ] Regular backups configured
- [ ] Monitoring set up
- [ ] Rate limiting configured (optional)

## Troubleshooting

### Server won't start
- Check logs: `pm2 logs` or `journalctl -u usha-server`
- Verify .env file exists and is correct
- Check database connection
- Verify port 3000 is available

### Viewer page not loading
- Check Nginx configuration
- Verify viewer/dist files exist
- Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`
- Test: `curl https://screenshare.transparentinsurance.net`

### WebSocket not connecting
- Verify Nginx WebSocket proxy configuration
- Check firewall allows WebSocket
- Verify SSL certificate is valid
- Check server logs for WebSocket errors

### Database errors
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check connection string in .env
- Verify database exists: `psql -U usha_user -d usha -c "SELECT 1"`

## Quick Reference

### Server Paths
- Application: `/opt/usha/`
- Server: `/opt/usha/server/`
- Viewer: `/opt/usha/viewer/dist/`
- Logs: PM2 or `/var/log/`

### Important Commands
```bash
# Restart server
pm2 restart usha-server

# View logs
pm2 logs usha-server

# Check status
pm2 status

# Reload Nginx
sudo systemctl reload nginx

# Check SSL
sudo certbot certificates
```

---

**Once deployed and configured, the viewer links will work automatically!** 🎉

