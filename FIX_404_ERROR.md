# Fix 404 DEPLOYMENT_NOT_FOUND Error

## Error
```
404: NOT_FOUND
Code: DEPLOYMENT_NOT_FOUND
ID: iad1::mbmjx-1764357635680-27b3abd10a37
```

## Root Cause

This error means the **viewer files are not deployed** or **not found** at the expected location on your server.

The server is running, but it cannot find the viewer HTML/JS files needed to serve the viewer page.

## Quick Fix

### Step 1: Diagnose the Issue

Run the diagnostic script on your server:

```bash
# Option A: Run directly on server
ssh linkpellow@transparentinsurance.net
cd /opt/usha
bash <(curl -s https://raw.githubusercontent.com/your-repo/scripts/diagnose-deployment.sh)

# Option B: Upload and run locally
scp scripts/diagnose-deployment.sh linkpellow@transparentinsurance.net:/tmp/
ssh linkpellow@transparentinsurance.net "bash /tmp/diagnose-deployment.sh"
```

### Step 2: Check Viewer Files

SSH into your server and verify:

```bash
ssh linkpellow@transparentinsurance.net
ls -la /opt/usha/viewer/dist/
```

**Expected output:**
```
index.html
assets/
  main-*.js
  main-*.css
```

**If files are missing**, proceed to Step 3.

### Step 3: Deploy Viewer Files

**From your local machine:**

```bash
cd /Users/linkpellow/Documents/usha

# Ensure viewer is built
cd viewer
npm run build
cd ..

# Deploy viewer files
scp -r viewer/dist/* linkpellow@transparentinsurance.net:/opt/usha/viewer/dist/
```

**Or if the directory doesn't exist:**

```bash
# Create directory first
ssh linkpellow@transparentinsurance.net "mkdir -p /opt/usha/viewer/dist"

# Then deploy
scp -r viewer/dist/* linkpellow@transparentinsurance.net:/opt/usha/viewer/dist/
```

### Step 4: Verify Server Can Find Files

SSH into server and check:

```bash
ssh linkpellow@transparentinsurance.net
cd /opt/usha/server/dist

# Test if server can find viewer files
ls -la ../../viewer/dist/index.html
# Should show the file exists
```

### Step 5: Restart Server

```bash
# On server
pm2 restart usha-server
pm2 logs usha-server --lines 50
```

**Look for this in the logs:**
```
Viewer files found at: /opt/usha/viewer/dist
Static file serving configured
```

**If you see:**
```
Viewer dist directory not found!
```
→ The path is still wrong. See "Path Resolution" below.

### Step 6: Test

```bash
# Test health endpoint
curl https://screenshare.transparentinsurance.net/health

# Test viewer page (replace test123 with a real session ID)
curl https://screenshare.transparentinsurance.net/test123
# Should return HTML, not JSON error
```

## Path Resolution

The server tries these paths in order:

1. `../../viewer/dist` (from `/opt/usha/server/dist/`)
2. `../../../viewer/dist`
3. `viewer/dist` (from current working directory)
4. `/opt/usha/viewer/dist` (absolute)

**Expected structure:**
```
/opt/usha/
├── server/
│   └── dist/          # Server code
│       └── index.js
└── viewer/
    └── dist/          # Viewer files
        ├── index.html
        └── assets/
```

## Alternative: Use Environment Variable

If the paths don't work, set a custom path:

**1. Add to `.env` file:**
```bash
ssh linkpellow@transparentinsurance.net
cd /opt/usha/server
echo "VIEWER_PATH=/opt/usha/viewer/dist" >> .env
```

**2. Update server code to use it:**

The server code already checks `process.cwd()`, but you may need to add explicit support for `VIEWER_PATH`. For now, ensure the directory structure matches the expected paths.

## Common Issues

### Issue 1: Viewer Files Not Deployed
**Symptom:** `ls /opt/usha/viewer/dist` returns "No such file or directory"

**Fix:**
```bash
# Build and deploy viewer
cd /Users/linkpellow/Documents/usha/viewer
npm run build
scp -r dist/* linkpellow@transparentinsurance.net:/opt/usha/viewer/dist/
```

### Issue 2: Wrong Directory Structure
**Symptom:** Files exist but server can't find them

**Fix:** Ensure structure matches:
```
/opt/usha/
├── server/dist/
└── viewer/dist/
```

### Issue 3: Permissions Issue
**Symptom:** Files exist but server can't read them

**Fix:**
```bash
ssh linkpellow@transparentinsurance.net
chmod -R 755 /opt/usha/viewer/dist
chown -R linkpellow:linkpellow /opt/usha/viewer/dist
```

### Issue 4: Server Not Restarted
**Symptom:** Files deployed but still getting 404

**Fix:**
```bash
pm2 restart usha-server
pm2 logs usha-server
```

## Verification Checklist

- [ ] Viewer files exist at `/opt/usha/viewer/dist/index.html`
- [ ] Assets directory exists at `/opt/usha/viewer/dist/assets/`
- [ ] Server logs show "Viewer files found at: ..."
- [ ] Health endpoint works: `curl https://screenshare.transparentinsurance.net/health`
- [ ] Viewer page returns HTML (not JSON error)

## Still Not Working?

1. **Check server logs:**
   ```bash
   pm2 logs usha-server --lines 100
   ```

2. **Check Nginx configuration:**
   ```bash
   sudo nginx -t
   sudo cat /etc/nginx/sites-available/screenshare.transparentinsurance.net
   ```

3. **Test directly (bypass Nginx):**
   ```bash
   curl http://localhost:3000/test123
   ```

4. **Verify file permissions:**
   ```bash
   ls -la /opt/usha/viewer/dist/
   ```

---

**Most likely fix:** Deploy the viewer files to `/opt/usha/viewer/dist/` and restart the server.

