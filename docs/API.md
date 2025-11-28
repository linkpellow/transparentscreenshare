# API Documentation

## Base URL

Development: `http://localhost:3000`
Production: `https://api.usha.app`

## Authentication

Most endpoints require authentication (to be implemented). Include JWT token in Authorization header:

```
Authorization: Bearer <token>
```

## Sessions

### Create Session

```http
POST /api/sessions
Content-Type: application/json

{
  "hostId": "user_123",
  "shareType": "desktop",
  "remoteControlEnabled": false,
  "maxViewers": 10,
  "redirectUrl": "https://example.com/thanks"
}
```

**Response:**
```json
{
  "id": "sess_1234567890_abc123",
  "hostId": "user_123",
  "shareType": "desktop",
  "status": "active",
  "createdAt": "2025-01-01T00:00:00Z",
  "remoteControlEnabled": false,
  "maxViewers": 10,
  "redirectUrl": "https://example.com/thanks"
}
```

### Get Session

```http
GET /api/sessions/:sessionId
```

### Update Session

```http
PATCH /api/sessions/:sessionId
Content-Type: application/json

{
  "status": "ended",
  "remoteControlEnabled": true
}
```

### Get Session Viewers

```http
GET /api/sessions/:sessionId/viewers
```

**Response:**
```json
[
  {
    "id": "viewer_123",
    "sessionId": "sess_123",
    "userAgent": "Mozilla/5.0...",
    "joinedAt": "2025-01-01T00:00:00Z",
    "lastActivity": "2025-01-01T00:05:00Z"
  }
]
```

### Get Session Engagement

```http
GET /api/sessions/:sessionId/engagement?limit=100
```

**Response:**
```json
[
  {
    "id": "evt_123",
    "viewerId": "viewer_123",
    "sessionId": "sess_123",
    "eventType": "click",
    "eventData": {
      "x": 100,
      "y": 200
    },
    "timestamp": "2025-01-01T00:01:00Z"
  }
]
```

## Recordings

### Get Recording

```http
GET /api/recordings/:recordingId
```

**Response:**
```json
{
  "id": "rec_123",
  "sessionId": "sess_123",
  "type": "both",
  "url": "https://s3.amazonaws.com/...",
  "signedUrl": "https://s3.amazonaws.com/...?signature=...",
  "thumbnailUrl": "https://s3.amazonaws.com/...",
  "gifPreviewUrl": "https://s3.amazonaws.com/...",
  "duration": 3600,
  "size": 104857600,
  "createdAt": "2025-01-01T00:00:00Z"
}
```

### List Session Recordings

```http
GET /api/recordings/session/:sessionId
```

### Upload Recording

```http
POST /api/recordings/upload
Content-Type: multipart/form-data

recording: <file>
sessionId: sess_123
recordingId: rec_123
type: both
duration: 3600
size: 104857600
```

### Share Recording

```http
POST /api/recordings/:recordingId/share
Content-Type: application/json

{
  "expiresIn": 24
}
```

**Response:**
```json
{
  "shareUrl": "https://usha.app/recording/rec_123",
  "expiresAt": "2025-01-02T00:00:00Z"
}
```

### Delete Recording

```http
DELETE /api/recordings/:recordingId
```

## Viewers

### Register Viewer

```http
POST /api/viewers
Content-Type: application/json

{
  "sessionId": "sess_123",
  "userAgent": "Mozilla/5.0...",
  "remoteControlEnabled": false
}
```

### Update Viewer Activity

```http
PATCH /api/viewers/:viewerId/activity
```

### Get Viewer

```http
GET /api/viewers/:viewerId
```

## Users

### Create User

```http
POST /api/users
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "teamId": "team_123"
}
```

### Get User

```http
GET /api/users/:userId
```

### Get User Sessions

```http
GET /api/users/:userId/sessions?limit=50
```

## Projector Mode

### Upload Video

```http
POST /api/projector/upload
Content-Type: multipart/form-data

video: <file>
```

**Response:**
```json
{
  "videoId": "video_123",
  "videoUrl": "/api/projector/videos/video_123",
  "size": 52428800
}
```

### Get Video

```http
GET /api/projector/videos/:videoId
```

### List Videos

```http
GET /api/projector/videos?userId=user_123
```

## WebSocket API

### Connection

```
ws://localhost:3000/ws/:sessionId?host=true
```

### Message Types

**Offer:**
```json
{
  "type": "offer",
  "from": "host",
  "data": { ...RTCSessionDescription... }
}
```

**Answer:**
```json
{
  "type": "answer",
  "from": "viewer_123",
  "data": { ...RTCSessionDescription... }
}
```

**ICE Candidate:**
```json
{
  "type": "ice-candidate",
  "from": "viewer_123",
  "data": { ...RTCIceCandidate... }
}
```

**Remote Control:**
```json
{
  "type": "remote-control",
  "from": "viewer_123",
  "data": {
    "type": "click",
    "x": 100,
    "y": 200,
    "button": 0
  }
}
```

**Engagement:**
```json
{
  "type": "engagement",
  "from": "viewer_123",
  "data": {
    "id": "evt_123",
    "viewerId": "viewer_123",
    "sessionId": "sess_123",
    "type": "click",
    "timestamp": "2025-01-01T00:00:00Z",
    "data": {
      "x": 100,
      "y": 200
    }
  }
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "stack": "Stack trace (development only)"
}
```

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

