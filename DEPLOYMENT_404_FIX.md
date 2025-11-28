# 404 Error Fix - Deployment Not Found

## Error Analysis

**Error:** `404: NOT_FOUND Code: DEPLOYMENT_NOT_FOUND`

This error indicates:
1. **Server is running** (otherwise you'd get connection refused)
2. **Viewer files not found** at expected path
3. **Path resolution issue** in production vs development

## Root Cause

The server was looking for viewer files at a fixed path:
```typescript
path.resolve(__dirname, '../../viewer/dist')
```

In production, the path structure might be different:
- Development: `server/src/` → `../../viewer/dist` ✅
- Production: `server/dist/` → `../../viewer/dist` ❌ (wrong path)
- Or files deployed separately → different structure

## Fixes Applied

### 1. Multiple Path Resolution ✅
Now tries multiple possible paths:
```typescript
const possiblePaths = [
  path.resolve(__dirname, '../../viewer/dist'), // Development
  path.resolve(__dirname, '../../../viewer/dist'), // Production
  path.resolve(process.cwd(), 'viewer/dist'), // From working directory
  path.join(process.cwd(), 'viewer', 'dist'), // Alternative
];
```

### 2. File Existence Checking ✅
Verifies files exist before serving:
```typescript
if (fs.existsSync(possiblePath) && fs.existsSync(path.join(possiblePath, 'index.html'))) {
  viewerPath = possiblePath;
  break;
}
```

### 3. Better Error Messages ✅
If files not found:
- Logs all tried paths
- Shows current working directory
- Provides helpful error message
- Returns 500 with descriptive error

### 4. Enhanced Logging ✅
- Logs when viewer files are found
- Logs the path being used
- Logs errors with context
- Helps debug deployment issues

## Deployment Checklist

### Step 1: Build Viewer
```bash
cd viewer
npm install
npm run build
```

This creates `viewer/dist/` with:
- `index.html`
- `assets/main-*.js`
- `assets/main-*.css`

### Step 2: Verify Files Exist
```bash
ls -la viewer/dist/
# Should show:
# - index.html
# - assets/
```

### Step 3: Deploy Files
Copy `viewer/dist/` to your server at one of these locations:
- `server/../viewer/dist/` (relative to server)
- `viewer/dist/` (from project root)
- Or configure path in server

### Step 4: Check Server Logs
When server starts, you should see:
```
Viewer files found at: /path/to/viewer/dist
Static file serving configured
```

If you see:
```
Viewer dist directory not found!
```
→ Files aren't in the right location

### Step 5: Test
```bash
curl http://localhost:3000/health
# Should return: {"status":"ok",...}

curl http://localhost:3000/test123
# Should return HTML (viewer page)
```

## Common Deployment Scenarios

### Scenario 1: All Files Together
```
/opt/usha/
├── server/
│   └── dist/          # Server code
└── viewer/
    └── dist/          # Viewer files
```
**Path:** `../../viewer/dist` ✅ Works

### Scenario 2: Server in dist/
```
/opt/usha/
├── dist/
│   └── server/        # Server code
└── viewer/
    └── dist/          # Viewer files
```
**Path:** `../../../viewer/dist` ✅ Works

### Scenario 3: Separate Deployments
```
/opt/usha-server/
└── dist/              # Server code

/opt/usha-viewer/
└── dist/              # Viewer files
```
**Solution:** Set `VIEWER_PATH` environment variable or copy files

## Environment Variable Option

You can also set a custom path:
```typescript
const viewerPath = process.env.VIEWER_PATH || 
  path.resolve(__dirname, '../../viewer/dist');
```

Then in production:
```bash
export VIEWER_PATH=/opt/usha-viewer/dist
```

## Verification

After deployment, check:

1. **Server logs show:**
   ```
   Viewer files found at: /path/to/viewer/dist
   Static file serving configured
   ```

2. **Health check works:**
   ```bash
   curl https://screenshare.transparentinsurance.net/health
   ```

3. **Viewer page loads:**
   ```bash
   curl https://screenshare.transparentinsurance.net/test123
   # Should return HTML
   ```

4. **Static assets load:**
   ```bash
   curl https://screenshare.transparentinsurance.net/assets/main-*.js
   # Should return JavaScript
   ```

## Next Steps

1. ✅ **Build viewer:** `cd viewer && npm run build`
2. ✅ **Deploy viewer/dist** to server
3. ✅ **Verify path** in server logs
4. ✅ **Test viewer page** loads
5. ✅ **Test static assets** load

---

**Status:** ✅ Code fixed to handle multiple path scenarios
**Action Required:** Deploy viewer/dist files to server

