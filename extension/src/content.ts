/**
 * Content script for WebRTC connection and screen sharing
 * Injected into web pages to handle peer connections
 */

import { WebRTCMessage, RemoteControlEvent } from '@usha/shared';
import { startRecording, stopRecording, isRecording } from './recording';

interface WebRTCState {
  peerConnection: RTCPeerConnection | null;
  dataChannel: RTCDataChannel | null;
  websocket: WebSocket | null;
  sessionId: string | null;
  localStream: MediaStream | null;
  isHost: boolean;
  recordingId: string | null;
}

let webrtcState: WebRTCState = {
  peerConnection: null,
  dataChannel: null,
  websocket: null,
  sessionId: null,
  localStream: null,
  isHost: false,
  recordingId: null,
};

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'INIT_WEBRTC':
      initializeWebRTC(message.sessionId, message.streamId, message.serverUrl);
      sendResponse({ success: true });
      break;

    case 'GET_PREVIEW_STREAM':
      if (webrtcState.localStream) {
        sendResponse({ stream: webrtcState.localStream });
      } else {
        sendResponse({ stream: null });
      }
      break;

    case 'STOP_STREAM':
      stopSharing();
      sendResponse({ success: true });
      break;

    case 'START_RECORDING':
      handleStartRecording(message.includeWebcam, sendResponse);
      return true;

    case 'STOP_RECORDING':
      handleStopRecording(sendResponse);
      return true;

    case 'GET_RECORDING_STATE':
      sendResponse({ isRecording: isRecording(), recordingId: webrtcState.recordingId });
      break;
  }
  return true;
});

async function initializeWebRTC(sessionId: string, streamId: string, serverUrl: string) {
  try {
    webrtcState.sessionId = sessionId;
    webrtcState.isHost = true;

    // Get media stream
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        // @ts-ignore - Chrome-specific constraint
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: streamId,
        },
      } as MediaTrackConstraints,
      audio: false,
    });

    webrtcState.localStream = stream;

    // Connect to signaling server
    await connectToSignalingServer(serverUrl, sessionId);

    // Create peer connection
    const peerConnection = createPeerConnection();
    webrtcState.peerConnection = peerConnection;

    // Add tracks to peer connection
    stream.getTracks().forEach(track => {
      peerConnection.addTrack(track, stream);
    });

    // Create offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    // Send offer to signaling server
    sendToServer({
      type: 'offer',
      from: sessionId,
      data: offer,
    });

  } catch (error) {
    console.error('Error initializing WebRTC:', error);
    // Error is logged, continue without throwing
  }
}

function createPeerConnection(): RTCPeerConnection {
  const config: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  const pc = new RTCPeerConnection(config);

  // Handle ICE candidates
  pc.onicecandidate = (event) => {
    if (event.candidate && webrtcState.sessionId) {
      sendToServer({
        type: 'ice-candidate',
        from: webrtcState.sessionId,
        data: event.candidate,
      });
    }
  };

  // Handle remote stream (for viewer preview)
  pc.ontrack = (event) => {
    const [remoteStream] = event.streams;
    // Handle remote stream if needed
  };

  // Create data channel for remote control and engagement tracking
  const dataChannel = pc.createDataChannel('control', {
    ordered: true,
  });

  dataChannel.onopen = () => {
    console.log('Data channel opened');
    webrtcState.dataChannel = dataChannel;
  };

  dataChannel.onmessage = (event) => {
    handleDataChannelMessage(event.data);
  };

  return pc;
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
    // If no protocol, default to WSS for security
    return `wss://${cleanUrl}`;
  }
}

async function connectToSignalingServer(serverUrl: string, sessionId: string) {
  return new Promise<void>((resolve, reject) => {
    const wsUrl = getWebSocketUrl(serverUrl);
    const ws = new WebSocket(`${wsUrl}/ws/${sessionId}?host=true`);
    
    ws.onopen = () => {
      console.log('Connected to signaling server');
      webrtcState.websocket = ws;
      resolve();
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      reject(error);
    };

    ws.onmessage = async (event) => {
      const message: WebRTCMessage = JSON.parse(event.data);
      await handleSignalingMessage(message);
    };

    ws.onclose = () => {
      console.log('Disconnected from signaling server');
      webrtcState.websocket = null;
    };
  });
}

async function handleSignalingMessage(message: WebRTCMessage) {
  if (!webrtcState.peerConnection) return;

  switch (message.type) {
    case 'answer':
      await webrtcState.peerConnection.setRemoteDescription(
        new RTCSessionDescription(message.data)
      );
      break;

    case 'ice-candidate':
      await webrtcState.peerConnection.addIceCandidate(
        new RTCIceCandidate(message.data)
      );
      break;

    case 'remote-control':
      if (webrtcState.isHost) {
        handleRemoteControlEvent(message.data as RemoteControlEvent);
      }
      break;

    case 'engagement':
      // Handle engagement tracking
      if (webrtcState.isHost) {
        // Send to background for analytics
        chrome.runtime.sendMessage({
          type: 'ENGAGEMENT_EVENT',
          data: message.data,
        });
      }
      break;
  }
}

function handleRemoteControlEvent(event: RemoteControlEvent) {
  // Forward remote control events to the page
  // This allows viewers to control the host's screen
  const customEvent = new CustomEvent('usha-remote-control', {
    detail: event,
  });
  window.dispatchEvent(customEvent);
}

function handleDataChannelMessage(data: string) {
  try {
    const message = JSON.parse(data);
    // Handle data channel messages
  } catch (error) {
    console.error('Error parsing data channel message:', error instanceof Error ? error.message : 'Unknown error');
  }
}

function sendToServer(message: WebRTCMessage) {
  if (webrtcState.websocket && webrtcState.websocket.readyState === WebSocket.OPEN) {
    webrtcState.websocket.send(JSON.stringify(message));
  }
}

async function handleStartRecording(includeWebcam: boolean, sendResponse: (response: any) => void) {
  try {
    if (!webrtcState.localStream) {
      sendResponse({ success: false, error: 'No active stream' });
      return;
    }

    const recordingId = await startRecording(webrtcState.localStream, includeWebcam);
    webrtcState.recordingId = recordingId;
    sendResponse({ success: true, recordingId });
  } catch (error) {
    console.error('Error starting recording:', error);
    sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

async function handleStopRecording(sendResponse: (response: any) => void) {
  try {
    if (!isRecording()) {
      sendResponse({ success: false, error: 'No recording in progress' });
      return;
    }

    const blob = await stopRecording();
    sendResponse({ success: true, blob });
    webrtcState.recordingId = null;
  } catch (error) {
    console.error('Error stopping recording:', error);
    sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

function stopSharing() {
  // Stop recording if active
  if (isRecording()) {
    stopRecording().catch(console.error);
  }

  if (webrtcState.localStream) {
    webrtcState.localStream.getTracks().forEach(track => track.stop());
    webrtcState.localStream = null;
  }

  if (webrtcState.peerConnection) {
    webrtcState.peerConnection.close();
    webrtcState.peerConnection = null;
  }

  if (webrtcState.websocket) {
    webrtcState.websocket.close();
    webrtcState.websocket = null;
  }

  if (webrtcState.dataChannel) {
    webrtcState.dataChannel.close();
    webrtcState.dataChannel = null;
  }

  webrtcState.sessionId = null;
  webrtcState.recordingId = null;
}

