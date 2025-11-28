# Files to Deploy - Complete Guide

## What Files to Deploy

You need to deploy **2 things** to your server:

1. **Server code** (Node.js backend)
2. **Viewer files** (HTML/CSS/JS for the web viewer)

## File Structure on Server

Your server should have this structure:

```
/opt/usha/                    (or wherever you deploy)
├── server/
│   ├── dist/                 # Server code (compiled)
│   │   ├── index.js
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── ...
│   ├── package.json
│   └── .env                   # Environment variables
└── viewer/
    └── dist/                  # Viewer files
        ├── index.html
        └── assets/
            ├── main-*.js
            └── main-*.css
```

## Step-by-Step Deployment

### Step 1: Build Everything (Already Done ✅)

```bash
cd /Users/linkpellow/Documents/usha
npm run build:all
```

This creates:
- `server/dist/` - Server code
- `viewer/dist/` - Viewer files

### Step 2: Copy Files to Server

#### Option A: Using SCP (Secure Copy)

```bash
# From your local machine, copy to server:

# 1. Copy server code
scp -r server/dist user@your-server:/opt/usha/server/
scp server/package.json user@your-server:/opt/usha/server/

# 2. Copy viewer files
scp -r viewer/dist user@your-server:/opt/usha/viewer/

# 3. Create .env file on server (or copy if you have one)
# ssh into server and create .env file
```

#### Option B: Using Deployment Script

```bash
# Set environment variables
export USHA_SERVER_USER=your-username
export USHA_SERVER_HOST=your-server.com
export USHA_SERVER_PATH=/opt/usha

# Run deployment
./scripts/deploy.sh
```

#### Option C: Manual Upload

1. **Server files:**
   - Upload `server/dist/` folder → `/opt/usha/server/dist/`
   - Upload `server/package.json` → `/opt/usha/server/package.json`

2. **Viewer files:**
   - Upload `viewer/dist/` folder → `/opt/usha/viewer/dist/`

### Step 3: On Your Server

SSH into your server and run:

```bash
# Navigate to server directory
cd /opt/usha/server

# Install production dependencies
npm install --production

# Create .env file (if not exists)
nano .env
```

**Required .env variables:**
```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
DATABASE_URL=postgresql://user:password@localhost:5432/usha
ALLOWED_ORIGINS=https://screenshare.transparentinsurance.net
```

### Step 4: Verify Files Are in Place

```bash
# Check server files
ls -la /opt/usha/server/dist/
# Should show: index.js, routes/, middleware/, etc.

# Check viewer files
ls -la /opt/usha/viewer/dist/
# Should show: index.html, assets/

# Verify index.html exists
test -f /opt/usha/viewer/dist/index.html && echo "✅ Viewer files OK" || echo "❌ Missing viewer files"
```

### Step 5: Start the Server

```bash
cd /opt/usha/server
npm start
# Or use PM2:
pm2 start dist/index.js --name usha-server
```

## Quick Checklist

- [ ] `server/dist/` copied to server
- [ ] `server/package.json` copied to server
- [ ] `viewer/dist/` copied to server
- [ ] `.env` file created on server
- [ ] Dependencies installed (`npm install --production`)
- [ ] Server started
- [ ] Test: `curl http://localhost:3000/health`

## File Locations Summary

| File/Folder | Local Path | Server Path |
|------------|------------|-------------|
| Server code | `server/dist/` | `/opt/usha/server/dist/` |
| Server package.json | `server/package.json` | `/opt/usha/server/package.json` |
| Viewer files | `viewer/dist/` | `/opt/usha/viewer/dist/` |
| Environment config | (create new) | `/opt/usha/server/.env` |

## Important Notes

1. **Server looks for viewer at:** `../../viewer/dist` (relative to `server/dist/`)
   - So if server is at `/opt/usha/server/dist/`
   - Viewer should be at `/opt/usha/viewer/dist/` ✅

2. **Don't deploy:**
   - `node_modules/` (install on server)
   - `src/` (only need `dist/`)
   - `.git/` (not needed)
   - Development files

3. **Do deploy:**
   - `server/dist/` (compiled server code)
   - `server/package.json` (for dependencies)
   - `viewer/dist/` (compiled viewer files)

## Testing After Deployment

```bash
# 1. Test server is running
curl http://localhost:3000/health
# Should return: {"status":"ok",...}

# 2. Test viewer page loads
curl http://localhost:3000/test123
# Should return HTML (viewer page)

# 3. Check server logs
# Should see: "Viewer files found at: /opt/usha/viewer/dist"
```

---

**That's it!** Just copy those 3 things (server/dist, server/package.json, viewer/dist) to your server and you're done.

