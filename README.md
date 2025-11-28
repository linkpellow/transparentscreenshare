# Usha - Screen Sharing Application

A production-ready screen sharing application with real-time sharing, recording, remote control, and engagement tracking capabilities.

## Architecture

- **Chrome Extension**: Screen capture and sharing interface
- **Backend Server**: WebRTC signaling, session management, recording processing
- **Web Viewer**: No-download viewing experience for recipients
- **Cloud Storage**: Recording storage and delivery

## Features

- ✅ Real-time screen sharing (desktop, window, tab)
- ✅ No downloads for viewers
- ✅ Cross-platform compatibility
- ✅ Remote control for viewers
- ✅ Screen and webcam recording
- ✅ Video sharing/projector mode
- ✅ Shareable recordings with cloud storage
- ✅ Engagement tracking & viewer preview
- ✅ Post-session redirect
- ✅ Team/multi-user support
- ✅ API & integrations

## Project Structure

```
usha/
├── extension/          # Chrome extension
├── server/            # Backend Node.js server
├── viewer/            # Web viewer interface
├── shared/            # Shared types and utilities
└── docs/              # Documentation
```

## Development

### Prerequisites
- Node.js 18+
- Chrome/Chromium browser
- AWS S3 (or compatible) for cloud storage
- PostgreSQL database

### Setup
```bash
npm install
cd server && npm install
cd ../extension && npm install
cd ../viewer && npm install
```

### Running
```bash
# Start backend server
cd server && npm run dev

# Load extension in Chrome
# 1. Open chrome://extensions/
# 2. Enable Developer mode
# 3. Click "Load unpacked"
# 4. Select the extension/ directory
```

## License

MIT

