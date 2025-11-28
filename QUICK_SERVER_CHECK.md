# Quick Server Status Check

## You're on Your Local Mac

The commands you tried (`systemctl`) are for Linux servers, not macOS. You need to **SSH into your server** first.

## Step 1: Connect to Your Server

```bash
ssh linkpellow@transparentinsurance.net
```

After connecting, you'll be on the Linux server where `systemctl` works.

## Step 2: Check Server Status

Once connected to the server, run:

```bash
# Check if server is running
pm2 status

# Check server logs
pm2 logs usha-server --lines 50

# Test local connection
curl http://localhost:3000/health
```

## Step 3: If Server is Not Running

```bash
# Navigate to server directory
cd /opt/usha/server

# Start server
pm2 start dist/index.js --name usha-server
pm2 save

# Check logs
pm2 logs usha-server
```

## Step 4: Check Nginx (On Server)

```bash
# Check Nginx status
sudo systemctl status nginx

# If not running, start it
sudo systemctl start nginx
sudo systemctl reload nginx
```

## Step 5: Test External Connection

**From your local Mac** (after exiting SSH):

```bash
# Exit SSH first (type: exit)
# Then test from your Mac:
curl -I https://screenshare.transparentinsurance.net/health
```

## Quick One-Liner to Check Everything

SSH into server and run:

```bash
ssh linkpellow@transparentinsurance.net "pm2 status && curl -s http://localhost:3000/health && sudo systemctl status nginx | head -5"
```

## Common Commands Reference

### On Your Local Mac:
- Test external connection: `curl https://screenshare.transparentinsurance.net/health`
- SSH into server: `ssh linkpellow@transparentinsurance.net`

### On the Server (after SSH):
- Check PM2: `pm2 status`
- Check Nginx: `sudo systemctl status nginx`
- Check server logs: `pm2 logs usha-server`
- Test local server: `curl http://localhost:3000/health`

---

**Next Step:** SSH into your server and check if the server process is running!

