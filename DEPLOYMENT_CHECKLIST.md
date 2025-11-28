# Same Server Deployment Checklist

Quick reference checklist for deploying to `screenshare.transparentinsurance.net`.

## Pre-Deployment

- [ ] Application built (`npm run build`)
- [ ] Server files exist (`server/dist/`)
- [ ] Viewer files exist (`viewer/dist/`)
- [ ] Database created and accessible
- [ ] DNS A record configured for `screenshare.transparentinsurance.net`
- [ ] SSH access to server verified

## Deployment Steps

### 1. Upload Files
- [ ] Server code uploaded to `/opt/usha/server/dist/`
- [ ] `server/package.json` uploaded to `/opt/usha/server/`
- [ ] Viewer files uploaded to `/opt/usha/viewer/dist/`

### 2. Server Setup
- [ ] Dependencies installed (`npm install --production`)
- [ ] `.env` file created with correct values
- [ ] Database connection tested
- [ ] Server starts successfully (`npm start`)

### 3. Nginx Configuration
- [ ] Configuration file created at `/etc/nginx/sites-available/screenshare.transparentinsurance.net`
- [ ] Symlink created in `/etc/nginx/sites-enabled/`
- [ ] Nginx config tested (`sudo nginx -t`)
- [ ] Nginx reloaded (`sudo systemctl reload nginx`)

### 4. SSL Certificate
- [ ] Certbot installed
- [ ] SSL certificate obtained (`sudo certbot --nginx -d screenshare.transparentinsurance.net`)
- [ ] Auto-renewal configured
- [ ] Certificate verified

### 5. Process Management
- [ ] PM2 installed
- [ ] Server started with PM2 (`pm2 start dist/index.js --name usha-server`)
- [ ] PM2 save configured (`pm2 save`)
- [ ] PM2 startup configured (`pm2 startup`)

## Verification

- [ ] Health check works: `curl http://localhost:3000/health`
- [ ] Viewer page loads: `curl http://localhost:3000/test123`
- [ ] HTTPS works: `https://screenshare.transparentinsurance.net/health`
- [ ] WebSocket connection works (test from extension)
- [ ] Server logs show viewer files found
- [ ] No errors in PM2 logs

## Post-Deployment

- [ ] Monitor server for 24 hours
- [ ] Check PM2 logs for errors
- [ ] Verify SSL auto-renewal works
- [ ] Document any custom configurations
- [ ] Update team on deployment status

## Quick Commands Reference

```bash
# Build application
npm run build

# Upload files
scp -r server/dist user@server:/opt/usha/server/
scp server/package.json user@server:/opt/usha/server/
scp -r viewer/dist user@server:/opt/usha/viewer/

# On server: Install and start
cd /opt/usha/server
npm install --production
pm2 start dist/index.js --name usha-server
pm2 save

# SSL setup
sudo certbot --nginx -d screenshare.transparentinsurance.net

# Nginx
sudo nginx -t
sudo systemctl reload nginx

# Monitor
pm2 status
pm2 logs usha-server
```

## Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| Port 3000 in use | Change PORT in `.env` and update Nginx |
| Database error | Check credentials, verify PostgreSQL running |
| Viewer 404 | Verify `/opt/usha/viewer/dist/` exists |
| Nginx 502 | Check server running, verify port |
| SSL error | Check certificate, verify DNS |

---

**For detailed instructions, see `DEPLOY_SAME_SERVER.md`**

