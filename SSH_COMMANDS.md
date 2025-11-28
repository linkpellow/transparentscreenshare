# SSH Commands to Check Server

## Step 1: Connect to Server

```bash
ssh linkpellow@transparentinsurance.net
```

## Step 2: Once Connected, Run These Commands

### Check if server is running:
```bash
pm2 status
```

### Check server directory:
```bash
ls -la /opt/usha/server/
```

### Check if .env exists:
```bash
cat /opt/usha/server/.env
```

### Test local server:
```bash
curl http://localhost:3000/health
```

### Check server logs:
```bash
pm2 logs usha-server --lines 50
```

### Check viewer files:
```bash
ls -la /opt/usha/viewer/dist/
```

### Check Nginx:
```bash
sudo systemctl status nginx
```

## Or Use the Diagnostic Script

### Option A: Upload and run script
```bash
# From your local Mac
scp scripts/check-server-remote.sh linkpellow@transparentinsurance.net:/tmp/

# Then SSH and run
ssh linkpellow@transparentinsurance.net
bash /tmp/check-server-remote.sh
```

### Option B: Run commands directly
```bash
ssh linkpellow@transparentinsurance.net "pm2 status && echo '---' && ls -la /opt/usha/server/ && echo '---' && curl -s http://localhost:3000/health"
```

## If Server is Not Running

```bash
# Navigate to server directory
cd /opt/usha/server

# Check if files exist
ls -la dist/

# Start server
pm2 start dist/index.js --name usha-server
pm2 save

# Check logs
pm2 logs usha-server
```

## If Directory Doesn't Exist

The server hasn't been deployed yet. Deploy it:

```bash
# From your local Mac
cd /Users/linkpellow/Documents/usha
./scripts/deploy-same-server.sh
```

Then follow the deployment instructions in `DEPLOY_SAME_SERVER.md`.

