# How Viewers Access Screen Share

## Overview

Viewers can access the screen share through a simple web link - **no downloads or installations required**. The connection uses WebRTC for peer-to-peer video streaming.

## Connection Flow

### Step 1: Host Starts Sharing

1. Host clicks the Usha extension icon
2. Chooses share type (Desktop/Window/Tab)
3. Selects screen/window/tab from picker
4. Extension generates a **session ID** (e.g., `sess_1234567890_abc123`)
5. Extension creates a **viewer URL**: `http://localhost:3000/view/{sessionId}`
6. Host can copy this link to share

### Step 2: Viewer Opens Link

Viewer opens the link in **any browser** (Chrome, Firefox, Safari, Edge, mobile browsers):
```
http://localhost:3000/view/sess_1234567890_abc123
```

**No installation required!** Works on:
- Desktop browsers (Windows, Mac, Linux)
- Mobile browsers (iOS Safari, Android Chrome)
- Any device with a modern browser

### Step 3: Viewer Connects to Signaling Server

1. Viewer page loads (`viewer/index.html`)
2. Extracts session ID from URL
3. Connects to WebSocket signaling server:
   ```
   ws://localhost:3000/ws/{sessionId}
   ```
4. Server assigns a `viewerId` to the viewer
5. Viewer receives confirmation message

### Step 4: WebRTC Connection Establishment

#### Host Side (Extension):
1. Host's content script creates WebRTC `RTCPeerConnection`
2. Captures screen stream using `getUserMedia` with `chromeMediaSourceId`
3. Adds video tracks to peer connection
4. Creates WebRTC **offer**
5. Sends offer to signaling server via WebSocket

#### Server (Signaling):
1. Receives offer from host
2. Forwards offer to all connected viewers for that session

#### Viewer Side:
1. Receives offer from server
2. Creates WebRTC `RTCPeerConnection`
3. Sets remote description (host's offer)
4. Creates WebRTC **answer**
5. Sends answer back to server
6. Server forwards answer to host

### Step 5: ICE Candidate Exchange

Both host and viewer exchange ICE (Interactive Connectivity Establishment) candidates:
- Host sends ICE candidates → Server → Viewer
- Viewer sends ICE candidates → Server → Host
- This allows NAT traversal and finding the best connection path

### Step 6: Media Streaming

Once WebRTC connection is established:
1. Host's screen stream flows directly to viewer via WebRTC
2. Viewer displays stream in `<video>` element
3. **Low latency** - peer-to-peer connection when possible
4. Falls back to TURN servers if direct connection fails

## Architecture Diagram

```
┌─────────────┐
│   Host      │
│ (Extension) │
└──────┬──────┘
       │
       │ 1. Start sharing
       │ 2. Create session
       │ 3. Generate link
       ▼
┌─────────────────┐
│  Backend Server │
│  (Signaling)    │
└──────┬──────────┘
       │
       │ WebSocket
       │ Signaling
       │
       ├──────────────┐
       │              │
       ▼              ▼
┌──────────┐    ┌──────────┐
│ Viewer 1 │    │ Viewer 2 │
│ (Browser)│    │ (Browser)│
└──────────┘    └──────────┘
       │              │
       └──────┬───────┘
              │
              │ WebRTC
              │ (Peer-to-Peer)
              │
       ┌──────▼──────┐
       │    Host     │
       │  (Stream)   │
       └─────────────┘
```

## Code Flow

### Host (Extension) - `content.ts`

```typescript
// 1. Initialize WebRTC
initializeWebRTC(sessionId, streamId, serverUrl)

// 2. Get screen stream
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    chromeMediaSource: 'desktop',
    chromeMediaSourceId: streamId
  }
})

// 3. Create peer connection and add tracks
peerConnection.addTrack(track, stream)

// 4. Create and send offer
const offer = await peerConnection.createOffer()
sendToServer({ type: 'offer', data: offer })
```

### Viewer - `viewer.ts`

```typescript
// 1. Connect to WebSocket
const ws = new WebSocket(`${serverUrl}/ws/${sessionId}`)

// 2. Receive offer from host
ws.onmessage = async (event) => {
  if (message.type === 'offer') {
    await peerConnection.setRemoteDescription(offer)
    const answer = await peerConnection.createAnswer()
    sendToServer({ type: 'answer', data: answer })
  }
}

// 3. Receive stream
peerConnection.ontrack = (event) => {
  const [remoteStream] = event.streams
  remoteVideo.srcObject = remoteStream  // Display on page
}
```

### Server (Signaling) - `websocket/index.ts`

```typescript
// Forward WebRTC messages between host and viewers
ws.on('message', async (data) => {
  const message = JSON.parse(data.toString())
  
  if (message.type === 'offer' || message.type === 'answer') {
    // Forward to other clients in same session
    sessionConnections.forEach(client => {
      if (client !== sender) {
        client.ws.send(JSON.stringify(message))
      }
    })
  }
})
```

## Features Available to Viewers

### 1. Real-time Viewing
- See host's screen in real-time
- Low latency (typically < 100ms)
- Works on any device/browser

### 2. Zoom Controls
- Zoom in/out on the shared screen
- Reset zoom to 100%
- Zoom indicator shows current level

### 3. Fullscreen Mode
- Click fullscreen button
- View in fullscreen for better experience

### 4. Engagement Tracking
- Viewer interactions are tracked (clicks, scrolls, zoom)
- Data sent to server for analytics
- Host can see engagement in real-time

### 5. Remote Control (Optional)
- If enabled by host, viewers can:
  - Click and interact with host's screen
  - Move mouse cursor
  - Type text
  - Scroll pages

### 6. Post-Session Redirect
- After session ends, viewer can be redirected
- Custom landing page
- Countdown timer before redirect

## URL Structure

### Viewer URL Format
```
http://{server}/view/{sessionId}
```

Example:
```
http://localhost:3000/view/sess_1701234567890_abc123xyz
```

### WebSocket URL Format
```
ws://{server}/ws/{sessionId}?host=true  (for host)
ws://{server}/ws/{sessionId}            (for viewer)
```

## Security Considerations

1. **Session IDs**: Randomly generated, hard to guess
2. **WebSocket**: Secure connection (can use WSS in production)
3. **WebRTC**: Encrypted media streams
4. **Remote Control**: Only enabled when host explicitly allows

## Troubleshooting

### Viewer Can't Connect
- Check server is running
- Verify session ID in URL is correct
- Check browser console for WebSocket errors
- Ensure firewall allows WebSocket connections

### No Video Appears
- Check WebRTC connection status
- Verify ICE candidates are being exchanged
- Check browser supports WebRTC
- Try different browser

### High Latency
- Check network connection
- May need TURN servers for NAT traversal
- Check if direct peer connection is established

## Production Considerations

1. **TURN Servers**: Configure for better NAT traversal
2. **HTTPS/WSS**: Use secure connections in production
3. **CDN**: Serve viewer page from CDN for faster loading
4. **Load Balancing**: Multiple signaling servers for scale
5. **Monitoring**: Track connection success rates

---

**Summary**: Viewers simply open a link, connect via WebSocket for signaling, establish WebRTC peer connection, and receive the screen stream directly. No downloads, no installations - just works!

