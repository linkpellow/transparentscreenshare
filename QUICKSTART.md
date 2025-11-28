# Quick Start Guide

Get Usha up and running in 5 minutes!

## Prerequisites Check

- [ ] Node.js 18+ installed (`node --version`)
- [ ] PostgreSQL installed and running
- [ ] Chrome browser installed
- [ ] FFmpeg installed (optional for development)

## Installation

```bash
# 1. Install all dependencies
npm install
cd shared && npm install && cd ..
cd server && npm install && cd ..
cd extension && npm install && cd ..
cd viewer && npm install && cd ..

# 2. Set up database
createdb usha

# 3. Configure environment
cp server/.env.example server/.env
# Edit server/.env with your database credentials

# 4. Build shared package
cd shared && npm run build && cd ..
```

## Running

### Terminal 1: Backend Server
```bash
cd server
npm run dev
```
Server will start on `http://localhost:3000`

### Terminal 2: Viewer (Development)
```bash
cd viewer
npm run dev
```
Viewer will start on `http://localhost:5173`

### Load Extension

1. Build extension:
```bash
cd extension
npm run build
```

2. Open Chrome → `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select `extension/dist` folder

## First Screen Share

1. Click Usha extension icon
2. Choose "Entire Screen"
3. Select your screen from the picker
4. Copy the session link
5. Open link in another browser/device
6. View your screen in real-time!

## Troubleshooting

**Extension not loading?**
- Make sure you built it: `cd extension && npm run build`
- Check browser console for errors

**Database connection error?**
- Verify PostgreSQL is running: `pg_isready`
- Check `server/.env` has correct credentials

**WebRTC not connecting?**
- Check firewall settings
- Verify server is running
- Check browser console for errors

## Next Steps

- Read `docs/SETUP.md` for detailed setup
- Check `docs/API.md` for API documentation
- Review `docs/ARCHITECTURE.md` for system design

Happy sharing! 🚀

