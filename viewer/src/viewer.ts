/**
 * Web viewer for screen sharing sessions
 * No downloads required - works on any device
 */

import { WebRTCMessage, RemoteControlEvent, EngagementEvent } from '@usha/shared';

interface ViewerState {
  sessionId: string;
  viewerId: string | null;
  websocket: WebSocket | null;
  peerConnection: RTCPeerConnection | null;
  remoteStream: MediaStream | null;
  zoomLevel: number;
  isFullscreen: boolean;
  remoteControlEnabled: boolean;
}

const state: ViewerState = {
  sessionId: '',
  viewerId: null,
  websocket: null,
  peerConnection: null,
  remoteStream: null,
  zoomLevel: 1,
  isFullscreen: false,
  remoteControlEnabled: false,
};

// DOM elements
const remoteVideo = document.getElementById('remoteVideo') as HTMLVideoElement;
const connectionStatus = document.getElementById('connectionStatus')!;
const statusText = connectionStatus.querySelector('.status-text') as HTMLElement;
const videoOverlay = document.getElementById('videoOverlay')!;
const loadingSpinner = document.getElementById('loadingSpinner')!;
const controlsPanel = document.getElementById('controlsPanel')!;
const sessionEnded = document.getElementById('sessionEnded')!;
const redirectMessage = document.getElementById('redirectMessage')!;
const redirectCountdown = document.getElementById('redirectCountdown')!;

const fullscreenBtn = document.getElementById('fullscreenBtn')!;
const zoomInBtn = document.getElementById('zoomInBtn')!;
const zoomOutBtn = document.getElementById('zoomOutBtn')!;
const resetZoomBtn = document.getElementById('resetZoomBtn')!;
const zoomIndicator = document.getElementById('zoomIndicator')!;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initializeViewer();
  setupEventListeners();
  setupEngagementTracking();
});

function initializeViewer() {
  // Get session ID from URL
  // Supports both formats:
  // - /view/sess_1234567890_abc123
  // - /sess_1234567890_abc123
  // - /screenshareid169304
  const pathParts = window.location.pathname.split('/').filter(p => p);
  let sessionId = pathParts[pathParts.length - 1];
  
  // If URL is /view/:sessionId, get the last part
  if (pathParts.length > 1 && pathParts[pathParts.length - 2] === 'view') {
    sessionId = pathParts[pathParts.length - 1];
  }

  if (!sessionId || sessionId === 'view' || sessionId.length < 3) {
    showError('Invalid session ID');
    return;
  }

  state.sessionId = sessionId;
  connectToSession(sessionId);
}

/**
 * Convert HTTP/HTTPS URL to WebSocket URL (WS/WSS)
 * Industry standard: HTTP -> WS, HTTPS -> WSS
 */
function getWebSocketUrl(serverUrl: string): string {
  // Remove trailing slash if present
  const cleanUrl = serverUrl.replace(/\/$/, '');
  
  // Convert protocol: http -> ws, https -> wss
  if (cleanUrl.startsWith('https://')) {
    return cleanUrl.replace(/^https:\/\//, 'wss://');
  } else if (cleanUrl.startsWith('http://')) {
    return cleanUrl.replace(/^http:\/\//, 'ws://');
  } else {
    // If no protocol, assume HTTPS in production (secure by default)
    const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    return `${protocol}${cleanUrl}`;
  }
}

async function connectToSession(sessionId: string) {
  try {
    updateConnectionStatus('connecting');
    console.log('Connecting to session:', sessionId);

    // Connect to WebSocket signaling server
    // Get server URL from environment or use current origin
    // For production, this will use the same domain (screenshare.transparentinsurance.net)
    const serverUrl = (window as any).USHA_SERVER_URL || window.location.origin;
    const wsUrl = getWebSocketUrl(serverUrl);
    const fullWsUrl = `${wsUrl}/ws/${sessionId}`;
    
    console.log('WebSocket URL:', fullWsUrl);
    console.log('Server URL:', serverUrl);
    console.log('Current origin:', window.location.origin);
    
    const ws = new WebSocket(fullWsUrl);

    ws.onopen = () => {
      console.log('Connected to signaling server');
      state.websocket = ws;
    };

    ws.onmessage = async (event) => {
      const message: WebRTCMessage = JSON.parse(event.data);

      if (message.type === 'connected') {
        state.viewerId = message.viewerId as string;
        updateConnectionStatus('connected');
        await initializeWebRTC();
      } else {
        await handleSignalingMessage(message);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      updateConnectionStatus('error');
      
      // Check if it's a DNS/connection error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('ERR_NAME_NOT_RESOLVED') || 
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('network')) {
        showError('Cannot connect to server. Please check:\n1. DNS is configured\n2. Server is running\n3. SSL certificate is installed');
      } else {
        showError('Connection error. Please try again.');
      }
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
      updateConnectionStatus('disconnected');
      if (state.peerConnection?.connectionState !== 'closed') {
        showError('Connection lost. Attempting to reconnect...');
        setTimeout(() => connectToSession(sessionId), 3000);
      }
    };

  } catch (error) {
    console.error('Error connecting to session:', error);
    showError('Failed to connect to session');
  }
}

async function initializeWebRTC() {
  const config: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  const pc = new RTCPeerConnection(config);
  state.peerConnection = pc;

  // Handle remote stream
  pc.ontrack = async (event) => {
    console.log('WebRTC track received', event);
    const [remoteStream] = event.streams;
    
    if (!remoteStream) {
      console.error('No remote stream in event');
      return;
    }
    
    state.remoteStream = remoteStream;
    remoteVideo.srcObject = remoteStream;
    
    // Explicitly play the video (handles autoplay policy issues)
    try {
      await remoteVideo.play();
      console.log('Video playback started');
      videoOverlay.classList.add('hidden');
      loadingSpinner.style.display = 'none';
    } catch (error) {
      console.error('Error playing video:', error);
      // Show user-friendly message
      showError('Unable to play video. Please click to start playback.');
      // Add click handler to play on user interaction
      remoteVideo.addEventListener('click', async () => {
        try {
          await remoteVideo.play();
          videoOverlay.classList.add('hidden');
        } catch (e) {
          console.error('Still unable to play:', e);
        }
      }, { once: true });
    }
    
    // Log stream info for debugging
    console.log('Remote stream tracks:', remoteStream.getTracks().map(t => ({
      kind: t.kind,
      enabled: t.enabled,
      readyState: t.readyState,
      muted: t.muted
    })));
  };

  // Handle ICE candidates
  pc.onicecandidate = (event) => {
    if (event.candidate && state.websocket) {
      sendToServer({
        type: 'ice-candidate',
        from: state.viewerId || '',
        data: event.candidate,
      });
    }
  };

  // Handle connection state changes
  pc.onconnectionstatechange = () => {
    const state = pc.connectionState;
    console.log('WebRTC connection state:', state);
    
    if (state === 'failed' || state === 'disconnected') {
      updateConnectionStatus('error');
      showError('Connection failed. Please check your network and try again.');
    } else if (state === 'connected') {
      updateConnectionStatus('connected');
      console.log('WebRTC connection established successfully');
    } else if (state === 'connecting') {
      updateConnectionStatus('connecting');
      console.log('WebRTC connecting...');
    } else if (state === 'closed') {
      updateConnectionStatus('disconnected');
      console.log('WebRTC connection closed');
    }
  };
  
  // Handle ICE connection state
  pc.oniceconnectionstatechange = () => {
    const iceState = pc.iceConnectionState;
    console.log('ICE connection state:', iceState);
    
    if (iceState === 'failed') {
      console.error('ICE connection failed - may need TURN server');
      showError('Network connection failed. The host may be behind a firewall.');
    } else if (iceState === 'disconnected') {
      console.warn('ICE connection disconnected');
    } else if (iceState === 'connected' || iceState === 'completed') {
      console.log('ICE connection established');
    }
  };

  // Listen for data channel (for remote control)
  pc.ondatachannel = (event) => {
    const channel = event.channel;
    channel.onopen = () => {
      console.log('Data channel opened');
      state.remoteControlEnabled = true;
    };
    channel.onmessage = (event) => {
      // Handle messages from host
    };
  };
}

async function handleSignalingMessage(message: WebRTCMessage) {
  if (!state.peerConnection) return;

  switch (message.type) {
    case 'offer':
      await state.peerConnection.setRemoteDescription(
        new RTCSessionDescription(message.data)
      );
      const answer = await state.peerConnection.createAnswer();
      await state.peerConnection.setLocalDescription(answer);
      sendToServer({
        type: 'answer',
        from: state.viewerId || '',
        data: answer,
      });
      break;

    case 'ice-candidate':
      await state.peerConnection.addIceCandidate(
        new RTCIceCandidate(message.data)
      );
      break;

    case 'session-ended':
      handleSessionEnded();
      break;
  }
}

function setupEventListeners() {
  // Zoom controls
  zoomInBtn.addEventListener('click', () => {
    state.zoomLevel = Math.min(state.zoomLevel + 0.25, 3);
    updateZoom();
  });

  zoomOutBtn.addEventListener('click', () => {
    state.zoomLevel = Math.max(state.zoomLevel - 0.25, 0.5);
    updateZoom();
  });

  resetZoomBtn.addEventListener('click', () => {
    state.zoomLevel = 1;
    updateZoom();
  });

  // Fullscreen
  fullscreenBtn.addEventListener('click', toggleFullscreen);

  // Click tracking for engagement
  remoteVideo.addEventListener('click', (e) => {
    trackEngagement('click', {
      x: e.offsetX,
      y: e.offsetY,
    });
  });

  // Scroll tracking
  remoteVideo.addEventListener('wheel', (e) => {
    trackEngagement('scroll', {
      deltaX: e.deltaX,
      deltaY: e.deltaY,
    });
  });
}

function updateZoom() {
  remoteVideo.style.transform = `scale(${state.zoomLevel})`;
  zoomIndicator.textContent = `${Math.round(state.zoomLevel * 100)}%`;
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    remoteVideo.requestFullscreen();
    state.isFullscreen = true;
  } else {
    document.exitFullscreen();
    state.isFullscreen = false;
  }
}

function setupEngagementTracking() {
  let lastActivity = Date.now();
  const idleThreshold = 30000; // 30 seconds

  // Track user activity
  ['mousemove', 'click', 'keydown', 'scroll'].forEach(event => {
    document.addEventListener(event, () => {
      lastActivity = Date.now();
      trackEngagement('focus');
    });
  });

  // Track idle time
  setInterval(() => {
      const idleTime = Date.now() - lastActivity;
      if (idleTime > idleThreshold) {
        trackEngagement('idle', { duration: idleTime });
      }
    }, 5000);
}

function trackEngagement(type: string, data: any = {}) {
  if (!state.viewerId || !state.sessionId) return;

  const event: EngagementEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    viewerId: state.viewerId,
    sessionId: state.sessionId,
    type: type as any,
    timestamp: new Date(),
    data,
  };

  sendToServer({
    type: 'engagement',
    from: state.viewerId,
    data: event,
  });
}

function sendToServer(message: WebRTCMessage) {
  if (state.websocket && state.websocket.readyState === WebSocket.OPEN) {
    state.websocket.send(JSON.stringify(message));
  }
}

function updateConnectionStatus(status: 'connecting' | 'connected' | 'disconnected' | 'error') {
  connectionStatus.className = `connection-status ${status}`;
  statusText.textContent = 
    status === 'connecting' ? 'Connecting...' :
    status === 'connected' ? 'Connected' :
    status === 'disconnected' ? 'Disconnected' :
    'Error';
}

function handleSessionEnded() {
  if (state.remoteStream) {
    state.remoteStream.getTracks().forEach(track => track.stop());
  }
  if (state.peerConnection) {
    state.peerConnection.close();
  }
  if (state.websocket) {
    state.websocket.close();
  }

  sessionEnded.style.display = 'flex';
  
  // Check for redirect URL
  fetch(`/api/sessions/${state.sessionId}`)
    .then(res => res.json())
    .then(session => {
      if (session.redirectUrl) {
        redirectMessage.style.display = 'block';
        let countdown = 5;
        redirectCountdown.textContent = countdown.toString();
        
        const interval = setInterval(() => {
          countdown--;
          if (countdown <= 0) {
            clearInterval(interval);
            window.location.href = session.redirectUrl;
          } else {
            redirectCountdown.textContent = countdown.toString();
          }
        }, 1000);
      }
    })
    .catch(console.error);
}

function showError(message: string) {
  videoOverlay.classList.remove('hidden');
  loadingSpinner.style.display = 'block';
  loadingSpinner.innerHTML = `
    <div style="color: #ef4444; font-size: 16px; text-align: center; padding: 20px;">
      <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
      <p style="margin-bottom: 8px; font-weight: 600;">Error</p>
      <p style="color: #ccc; font-size: 14px; white-space: pre-line;">${message}</p>
      <button onclick="window.location.reload()" style="
        margin-top: 16px;
        padding: 8px 16px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
      ">Reload Page</button>
    </div>
  `;
}

