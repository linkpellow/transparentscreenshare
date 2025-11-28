# Complete Setup Guide - Usha Screen Sharing

This guide ensures everything is set up and ready to use.

## ✅ Pre-Flight Checklist

- [x] All dependencies installed
- [x] Extension icons created
- [x] All code completed (no TODOs)
- [x] Build scripts working
- [x] Server routes complete
- [x] Viewer interface complete

## Step 1: Install All Dependencies

```bash
# Root dependencies
cd /Users/linkpellow/Documents/usha
npm install

# Shared package
cd shared
npm install
npm run build
cd ..

# Server
cd server
npm install
cd ..

# Extension
cd extension
npm install
npm run build
cd ..

# Viewer
cd viewer
npm install
cd ..
```

## Step 2: Generate Extension Icons

Icons are already generated, but if you need to regenerate:

```bash
cd extension
node generate-icons.js
```

## Step 3: Configure Environment

Create `server/.env` file:

```bash
cd server
cp .env.example .env
# Edit .env with your settings
```

Minimum required settings:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/usha
```

## Step 4: Set Up Database

```bash
# Create database
createdb usha

# Or using psql
psql -U postgres
CREATE DATABASE usha;
\q
```

The database tables will be created automatically on first server start.

## Step 5: Build Everything

```bash
# Build shared package
cd shared && npm run build && cd ..

# Build extension
cd extension && npm run build && cd ..

# Build viewer (optional, for production)
cd viewer && npm run build && cd ..
```

## Step 6: Load Extension in Chrome

1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select: `/Users/linkpellow/Documents/usha/extension/dist`

## Step 7: Start the Server

```bash
cd server
npm run dev
```

Server will start on `http://localhost:3000`

## Step 8: Test the Extension

1. Click the Usha extension icon
2. Choose a share type (Desktop/Window/Tab)
3. Select your screen
4. Copy the session link
5. Open link in another browser/device
6. Verify screen sharing works

## Verification

### Check Extension Build
```bash
cd extension/dist
ls -la
# Should see: manifest.json, background.js, popup.js, content.js, icons/, etc.
```

### Check Icons
```bash
cd extension/dist/icons
ls -la
# Should see: icon16.png, icon48.png, icon128.png
```

### Check Server
```bash
curl http://localhost:3000/health
# Should return: {"status":"ok","timestamp":"..."}
```

## Troubleshooting

### Extension won't load
- Make sure you're loading from `extension/dist`, not root
- Check `manifest.json` exists in dist folder
- Rebuild: `cd extension && npm run build`

### Server won't start
- Check database is running: `pg_isready`
- Verify `.env` file exists and has correct settings
- Check port 3000 is not in use

### Icons missing
- Run: `cd extension && node generate-icons.js`
- Rebuild: `cd extension && npm run build`

### WebRTC not connecting
- Ensure server is running
- Check firewall settings
- Verify WebSocket connection in browser console

## Production Deployment

### Extension
1. Build: `cd extension && npm run build`
2. Zip the `dist` folder
3. Submit to Chrome Web Store (or distribute privately)

### Server
1. Set `NODE_ENV=production` in `.env`
2. Build: `cd server && npm run build`
3. Start: `npm start`
4. Use PM2 or systemd for process management
5. Set up reverse proxy (nginx/Caddy)
6. Configure SSL/TLS

## File Structure

```
usha/
├── extension/
│   ├── dist/              # Built extension (load this in Chrome)
│   ├── src/               # Source code
│   ├── icons/              # Icon files
│   └── manifest.json
├── server/
│   ├── src/               # Server source
│   └── .env               # Environment config
├── viewer/
│   ├── src/               # Viewer source
│   └── dist/              # Built viewer
├── shared/
│   ├── src/               # Shared code
│   └── dist/              # Built shared
└── docs/                  # Documentation
```

## Next Steps

1. **Customize Icons**: Replace `extension/icons/*.png` with your brand icons
2. **Configure Server URL**: Set in extension storage or update default
3. **Set Up AWS S3**: For recording storage (if using cloud storage)
4. **Add Authentication**: Implement JWT auth for production
5. **Configure TURN Servers**: For better NAT traversal

## Support

- Check `docs/` folder for detailed documentation
- Review `docs/ARCHITECTURE.md` for system design
- See `docs/API.md` for API reference

---

**Status**: ✅ Complete and ready to use!

