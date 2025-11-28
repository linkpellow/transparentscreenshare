# SSL Error Troubleshooting

## Error: ERR_SSL_PROTOCOL_ERROR

This error means the browser is trying to connect via HTTPS, but the server either:
1. **No SSL certificate installed** (most common)
2. **Server not configured for HTTPS**
3. **SSL certificate misconfigured**
4. **Server not running**

## Quick Diagnosis

### 1. Check DNS Propagation

```bash
# Check if DNS is resolving
nslookup screenshare.transparentinsurance.net
# or
dig screenshare.transparentinsurance.net
```

**If DNS is NOT resolving:**
- Wait for DNS propagation (15 min - 24 hours)
- Check your DNS provider's control panel
- Verify the A/CNAME record is correct

**If DNS IS resolving:**
- The issue is SSL/HTTPS configuration
- Continue to step 2

### 2. Test HTTP (Non-Secure)

Try accessing via HTTP first:
```
http://screenshare.transparentinsurance.net/health
```

**If HTTP works:**
- DNS is fine
- SSL certificate needs to be set up
- Go to "Setting Up SSL" below

**If HTTP doesn't work:**
- Server might not be running
- Nginx might not be configured
- Check server status

### 3. Test HTTPS

```bash
curl -v https://screenshare.transparentinsurance.net/health
```

This will show detailed SSL handshake information.

## Setting Up SSL Certificate

### Option 1: Let's Encrypt (Recommended - Free)

```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d screenshare.transparentinsurance.net

# Auto-renewal (certbot sets this up automatically)
sudo certbot renew --dry-run
```

### Option 2: Manual Certificate

If you have your own certificate:
1. Place certificate files on server
2. Update Nginx configuration
3. Reload Nginx

## Nginx SSL Configuration

Your Nginx config should include:

```nginx
server {
    listen 443 ssl http2;
    server_name screenshare.transparentinsurance.net;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/screenshare.transparentinsurance.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/screenshare.transparentinsurance.net/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # ... rest of config
}
```

## Temporary Workaround (Development Only)

If you need to test before SSL is set up, you can temporarily:

1. **Use HTTP instead of HTTPS** (not recommended for production)
   - Change extension to use `http://` (but it's hardcoded to HTTPS)
   - Or test directly in browser: `http://screenshare.transparentinsurance.net/test123`

2. **Self-signed certificate** (browser will show warning)
   ```bash
   sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout /etc/ssl/private/screenshare.key \
     -out /etc/ssl/certs/screenshare.crt \
     -subj "/CN=screenshare.transparentinsurance.net"
   ```

## Step-by-Step Fix

### Step 1: Verify Server is Running

```bash
# SSH into your server
ssh user@your-server

# Check if Node.js server is running
ps aux | grep node
# or
pm2 status

# Check if Nginx is running
sudo systemctl status nginx
```

### Step 2: Check Nginx Configuration

```bash
# Test Nginx config
sudo nginx -t

# Check if site is enabled
ls -la /etc/nginx/sites-enabled/

# View Nginx config
sudo nano /etc/nginx/sites-available/screenshare
```

### Step 3: Install SSL Certificate

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate (this will also configure Nginx)
sudo certbot --nginx -d screenshare.transparentinsurance.net

# Follow the prompts:
# - Enter email
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: Yes)
```

### Step 4: Verify SSL

```bash
# Test SSL certificate
sudo certbot certificates

# Test HTTPS connection
curl -I https://screenshare.transparentinsurance.net/health

# Check in browser
# Open: https://screenshare.transparentinsurance.net/health
```

### Step 5: Reload Services

```bash
# Reload Nginx
sudo systemctl reload nginx

# Restart server if needed
pm2 restart usha-server
# or
sudo systemctl restart usha-server
```

## Common Issues

### Issue: "Certificate not found"
**Solution:** Run certbot again or check certificate path in Nginx config

### Issue: "Port 443 not open"
**Solution:** 
```bash
# Check firewall
sudo ufw status
# Allow HTTPS
sudo ufw allow 443/tcp
```

### Issue: "Nginx not listening on 443"
**Solution:** Check Nginx config has `listen 443 ssl;`

### Issue: "DNS not resolving"
**Solution:** Wait for DNS propagation or check DNS records

## Verification Checklist

- [ ] DNS resolves: `nslookup screenshare.transparentinsurance.net`
- [ ] HTTP works: `curl http://screenshare.transparentinsurance.net/health`
- [ ] SSL certificate installed: `sudo certbot certificates`
- [ ] Nginx configured for SSL: `sudo nginx -t`
- [ ] Port 443 open: `sudo ufw status`
- [ ] HTTPS works: `curl https://screenshare.transparentinsurance.net/health`
- [ ] Browser shows valid certificate (green lock)

## Expected Timeline

1. **DNS Propagation:** 15 minutes - 24 hours
2. **SSL Setup:** 5-10 minutes (once DNS is ready)
3. **Total:** Usually 1-2 hours from DNS change

## Next Steps

1. **Check DNS** - Verify `screenshare.transparentinsurance.net` resolves
2. **Test HTTP** - See if server responds without SSL
3. **Install SSL** - Use Let's Encrypt certbot
4. **Test HTTPS** - Verify secure connection works

---

**The viewer link format is correct:** `https://screenshare.transparentinsurance.net/sess_...`

**The issue is SSL configuration, not the link format.**

