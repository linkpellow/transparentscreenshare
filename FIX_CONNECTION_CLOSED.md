# Fix ERR_CONNECTION_CLOSED Error

## Error
```
GET https://screenshare.transparentinsurance.net/api/sessions/... 
net::ERR_CONNECTION_CLOSED
```

## Problem

The extension is now correctly connecting to the production server, but the connection is being closed. This typically means:

1. **Server is not running** on the server
2. **Nginx is not running** or misconfigured
3. **SSL certificate issue**
4. **Server crashed** or closed the connection
5. **CORS configuration** issue

## Quick Diagnosis

### Step 1: Check Server Status

SSH into your server and run:

```bash
ssh linkpellow@transparentinsurance.net

# Check if server is running
pm2 status

# Check server logs
pm2 logs usha-server --lines 50

# Test local connection
curl http://localhost:3000/health
```

**Expected:** Should return `{"status":"ok",...}`

**If it fails:** Server is not running. Start it:
```bash
cd /opt/usha/server
pm2 start dist/index.js --name usha-server
pm2 save
```

### Step 2: Check Nginx

```bash
# Check Nginx status
sudo systemctl status nginx

# Test Nginx config
sudo nginx -t

# Check if site is enabled
ls -la /etc/nginx/sites-enabled/ | grep screenshare
```

**If Nginx is not running:**
```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 3: Test External Connection

```bash
# Test HTTPS from server
curl -I https://screenshare.transparentinsurance.net/health

# Test from your local machine
curl -I https://screenshare.transparentinsurance.net/health
```

**Expected:** Should return `200 OK`

**If it fails:** Check SSL certificate and Nginx configuration.

### Step 4: Check Server Logs

```bash
# View recent logs
pm2 logs usha-server --lines 100

# Look for errors like:
# - "Database connection failed"
# - "Viewer files not found"
# - "Port already in use"
# - "CORS error"
```

## Common Fixes

### Fix 1: Server Not Running

**Symptoms:** `curl http://localhost:3000/health` fails

**Solution:**
```bash
cd /opt/usha/server
pm2 start dist/index.js --name usha-server
pm2 save
pm2 logs usha-server
```

### Fix 2: Database Connection Failed

**Symptoms:** Server starts but crashes immediately, logs show database error

**Solution:**
```bash
# Check database is running
sudo systemctl status postgresql

# Verify .env has correct DATABASE_URL
cd /opt/usha/server
cat .env | grep DATABASE_URL

# Test database connection
psql -U usha_user -d usha -h localhost
```

### Fix 3: Port Already in Use

**Symptoms:** Server fails to start, "EADDRINUSE" error

**Solution:**
```bash
# Find what's using port 3000
sudo lsof -i :3000

# Kill the process or change port in .env
nano /opt/usha/server/.env
# Change PORT=3000 to PORT=3001
# Then update Nginx proxy_pass to http://localhost:3001
```

### Fix 4: Nginx Not Running

**Symptoms:** External connection fails, local connection works

**Solution:**
```bash
sudo systemctl start nginx
sudo systemctl enable nginx
sudo nginx -t
sudo systemctl reload nginx
```

### Fix 5: SSL Certificate Issue

**Symptoms:** HTTPS fails, HTTP redirects

**Solution:**
```bash
# Check certificate
sudo certbot certificates

# Renew if needed
sudo certbot renew

# Reconfigure Nginx
sudo certbot --nginx -d screenshare.transparentinsurance.net
```

### Fix 6: CORS Configuration

**Symptoms:** Server responds but browser blocks request

**Solution:**
```bash
# Check .env file
cd /opt/usha/server
cat .env | grep ALLOWED_ORIGINS

# Should include:
# ALLOWED_ORIGINS=https://screenshare.transparentinsurance.net,https://transparentinsurance.net

# If missing, add it:
nano .env
# Add: ALLOWED_ORIGINS=https://screenshare.transparentinsurance.net,https://transparentinsurance.net

# Restart server
pm2 restart usha-server
```

## Automated Diagnosis

Run the diagnostic script on your server:

```bash
# Upload script
scp scripts/check-server-status.sh linkpellow@transparentinsurance.net:/tmp/

# Run on server
ssh linkpellow@transparentinsurance.net "bash /tmp/check-server-status.sh"
```

Or run directly:
```bash
ssh linkpellow@transparentinsurance.net 'bash -s' < scripts/check-server-status.sh
```

## Step-by-Step Recovery

If the server is completely down:

```bash
# 1. SSH into server
ssh linkpellow@transparentinsurance.net

# 2. Check server directory
cd /opt/usha/server
ls -la

# 3. Check .env file
cat .env

# 4. Start server
pm2 start dist/index.js --name usha-server
pm2 save

# 5. Check logs
pm2 logs usha-server

# 6. Test local connection
curl http://localhost:3000/health

# 7. Check Nginx
sudo systemctl status nginx
sudo nginx -t

# 8. Test external
curl -I https://screenshare.transparentinsurance.net/health
```

## Verification Checklist

After fixing, verify:

- [ ] Server process is running (`pm2 status`)
- [ ] Local connection works (`curl http://localhost:3000/health`)
- [ ] Nginx is running (`sudo systemctl status nginx`)
- [ ] External HTTPS works (`curl https://screenshare.transparentinsurance.net/health`)
- [ ] Server logs show no errors (`pm2 logs usha-server`)
- [ ] CORS is configured correctly (check `.env`)

## Still Not Working?

1. **Check firewall:**
   ```bash
   sudo ufw status
   sudo ufw allow 3000/tcp
   ```

2. **Check server resources:**
   ```bash
   free -h
   df -h
   ```

3. **Check for errors in system logs:**
   ```bash
   sudo journalctl -u nginx -n 50
   sudo journalctl -u postgresql -n 50
   ```

---

**Most likely fix:** Start the server with `pm2 start` or check Nginx is running.

