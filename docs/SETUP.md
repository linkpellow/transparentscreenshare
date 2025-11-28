# Setup Guide

## Prerequisites

- **Node.js** 18.0.0 or higher
- **PostgreSQL** 12.0 or higher
- **Chrome/Chromium** browser (for extension)
- **FFmpeg** (for video processing)
- **AWS Account** (for S3 storage) - Optional for development

## Installation

### 1. Clone and Install Dependencies

```bash
# Install root dependencies
npm install

# Install workspace dependencies
cd shared && npm install && cd ..
cd server && npm install && cd ..
cd extension && npm install && cd ..
cd viewer && npm install && cd ..
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb usha

# Or using psql
psql -U postgres
CREATE DATABASE usha;
```

### 3. Environment Configuration

Create `.env` file in `server/` directory:

```bash
cp server/.env.example server/.env
```

Edit `server/.env` with your configuration:

```env
PORT=3000
NODE_ENV=development

DATABASE_URL=postgresql://user:password@localhost:5432/usha

JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=usha-recordings

ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 4. Install FFmpeg

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

**Windows:**
Download from https://ffmpeg.org/download.html and add to PATH

### 5. Build Projects

```bash
# Build shared package
cd shared && npm run build && cd ..

# Build extension
cd extension && npm run build && cd ..

# Build viewer
cd viewer && npm run build && cd ..
```

## Running the Application

### Development Mode

**Terminal 1 - Backend Server:**
```bash
cd server
npm run dev
```

**Terminal 2 - Viewer (optional, for development):**
```bash
cd viewer
npm run dev
```

### Load Chrome Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension/dist` directory
5. Extension icon should appear in toolbar

## Usage

### Starting a Screen Share Session

1. Click the Usha extension icon
2. Choose share type:
   - **Entire Screen**: Share your full desktop
   - **Application Window**: Share a specific application
   - **Browser Tab**: Share a specific browser tab
3. Select the source from Chrome's picker
4. Copy the session link and share with viewers

### Viewing a Session

1. Open the shared link in any browser (no downloads required)
2. Wait for connection to establish
3. View the shared screen in real-time
4. Use zoom controls if needed

### Recording

1. Start a screen share session
2. Check "Record Session" in the extension popup
3. Optionally check "Include Webcam"
4. Stop sharing when done
5. Recording will be processed and uploaded automatically

### Remote Control

1. Host enables "Enable Remote Control" in extension
2. Viewers can click and interact with the shared screen
3. Mouse movements and clicks are forwarded to host

## Troubleshooting

### Extension Not Loading

- Ensure you're loading from `extension/dist` directory
- Check browser console for errors
- Verify manifest.json is valid

### WebRTC Connection Issues

- Check firewall settings
- Ensure STUN servers are accessible
- For production, configure TURN servers

### Database Connection Errors

- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure database exists and user has permissions

### Recording Upload Fails

- Verify AWS credentials in .env
- Check S3 bucket exists and is accessible
- Verify network connectivity

## Production Deployment

### Server Deployment

1. Set `NODE_ENV=production` in environment
2. Build server: `cd server && npm run build`
3. Start with process manager (PM2, systemd, etc.)
4. Configure reverse proxy (nginx, Caddy)
5. Set up SSL/TLS certificates

### Extension Distribution

1. Build extension: `cd extension && npm run build`
2. Create extension package (zip dist folder)
3. Submit to Chrome Web Store (if public)
4. Or distribute privately via enterprise policy

### Database Migration

Database tables are created automatically on first run. For production:

1. Run migrations manually if needed
2. Set up database backups
3. Configure connection pooling

### Monitoring

- Set up application monitoring (Sentry, DataDog, etc.)
- Configure logging (Winston, Pino)
- Set up health check endpoints
- Monitor WebSocket connections

## Security Checklist

- [ ] Change JWT_SECRET to strong random value
- [ ] Configure CORS with specific allowed origins
- [ ] Set up rate limiting
- [ ] Enable HTTPS/TLS
- [ ] Configure S3 bucket with proper IAM policies
- [ ] Set up database connection encryption
- [ ] Implement authentication/authorization
- [ ] Configure firewall rules
- [ ] Set up regular security updates

