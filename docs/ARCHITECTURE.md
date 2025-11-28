# Usha Architecture

## Overview

Usha is a production-ready screen sharing application built with a modular architecture supporting real-time sharing, recording, remote control, and engagement tracking.

## System Architecture

```
┌─────────────────┐
│ Chrome Extension │
│  (Screen Capture)│
└────────┬─────────┘
         │
         │ WebRTC + WebSocket
         │
┌────────▼─────────┐
│  Backend Server   │
│  (Signaling + API)│
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐  ┌──▼────┐
│  DB   │  │  S3   │
│(Postgres)│ │(Storage)│
└───────┘  └───────┘
         │
┌────────▼─────────┐
│   Web Viewer     │
│  (No Downloads)  │
└──────────────────┘
```

## Components

### 1. Chrome Extension (`extension/`)

**Purpose**: Screen capture and sharing interface

**Key Features**:
- Desktop/window/tab capture
- WebRTC peer connection management
- Recording (screen + webcam)
- Remote control event forwarding
- Engagement tracking

**Files**:
- `background.ts`: Service worker for screen capture requests
- `popup.ts`: UI controller for extension popup
- `content.ts`: WebRTC connection handler
- `recording.ts`: Recording service
- `screen-capture.ts`: Remote control injection

### 2. Backend Server (`server/`)

**Purpose**: Signaling server, session management, recording processing

**Key Features**:
- WebSocket signaling for WebRTC
- REST API for sessions, recordings, users
- Recording processing (compression, thumbnails, GIFs)
- Cloud storage integration
- Engagement analytics

**Technology Stack**:
- Node.js + Express
- WebSocket (ws)
- PostgreSQL
- AWS S3
- FFmpeg (for video processing)

**API Endpoints**:
- `POST /api/sessions` - Create session
- `GET /api/sessions/:id` - Get session
- `GET /api/sessions/:id/viewers` - Get viewers
- `GET /api/sessions/:id/engagement` - Get engagement data
- `GET /api/recordings/:id` - Get recording
- `POST /api/recordings/upload` - Upload recording
- `WS /ws/:sessionId` - WebSocket signaling

### 3. Web Viewer (`viewer/`)

**Purpose**: No-download viewing experience

**Key Features**:
- WebRTC peer connection (viewer side)
- Zoom controls
- Fullscreen support
- Engagement tracking
- Post-session redirect

**Technology Stack**:
- Vite + TypeScript
- WebRTC API
- Modern CSS

### 4. Shared Package (`shared/`)

**Purpose**: Common types and utilities

**Contents**:
- TypeScript type definitions
- Utility functions
- Constants

## Data Flow

### Screen Sharing Flow

1. **Host starts sharing**:
   - Extension requests screen capture
   - Creates WebRTC peer connection
   - Connects to signaling server via WebSocket
   - Creates offer and sends to server

2. **Viewer joins**:
   - Opens viewer URL
   - Connects to WebSocket signaling server
   - Receives offer from host
   - Creates answer and sends back
   - Establishes peer connection

3. **Media streaming**:
   - Host's screen stream → WebRTC → Viewer's video element
   - Low latency, peer-to-peer when possible

### Recording Flow

1. **Start recording**:
   - Extension captures screen stream
   - Optionally captures webcam
   - MediaRecorder API records combined stream
   - Chunks stored in memory

2. **Stop recording**:
   - MediaRecorder stops
   - Blob created from chunks
   - Uploaded to server

3. **Processing**:
   - Server receives recording
   - FFmpeg processes video:
     - Compression (VP9 codec)
     - Thumbnail generation
     - GIF preview creation
   - Uploads to S3
   - Stores metadata in database

### Remote Control Flow

1. **Viewer interaction**:
   - Viewer clicks/moves mouse on video
   - Event captured and sent via WebSocket
   - Server forwards to host

2. **Host receives**:
   - Content script receives remote control event
   - Simulates mouse/keyboard event on page
   - Action executed on host's screen

### Engagement Tracking Flow

1. **Viewer activity**:
   - Clicks, scrolls, zoom tracked
   - Events sent to server via WebSocket
   - Stored in database

2. **Host preview**:
   - Real-time engagement events forwarded to host
   - Displayed in preview window

## Database Schema

### Tables

- **users**: User accounts and authentication
- **teams**: Team/organization management
- **sessions**: Screen sharing sessions
- **viewers**: Viewer connections
- **engagement_events**: User interaction tracking
- **recordings**: Recording metadata and URLs

## Security Considerations

1. **WebRTC**: Uses STUN servers for NAT traversal
2. **Authentication**: JWT tokens for API access (to be implemented)
3. **CORS**: Configured for allowed origins
4. **Recording Access**: Signed URLs for private recordings
5. **Remote Control**: Only enabled when explicitly allowed by host

## Scalability

1. **Horizontal Scaling**: WebSocket server can be scaled with Redis pub/sub
2. **CDN**: Recordings served via S3 + CloudFront
3. **Database**: PostgreSQL with connection pooling
4. **Load Balancing**: Multiple server instances behind load balancer

## Deployment

### Prerequisites
- Node.js 18+
- PostgreSQL database
- AWS S3 bucket
- FFmpeg installed on server

### Environment Variables
See `server/.env.example` for required configuration.

### Build Process
```bash
npm run build  # Builds extension and viewer
cd server && npm start  # Starts backend server
```

## Future Enhancements

1. **TURN Servers**: For better NAT traversal
2. **Multi-viewer**: Support multiple simultaneous viewers
3. **Screen annotation**: Drawing tools during sharing
4. **Chat**: Text chat during sessions
5. **Mobile apps**: Native iOS/Android apps
6. **Advanced analytics**: Heatmaps, session replays

