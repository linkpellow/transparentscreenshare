/**
 * Popup UI controller for Usha extension
 */

import { ShareType } from '@usha/shared';

interface SessionState {
  sessionId: string | null;
  shareType: ShareType | null;
  status: string;
  recording: boolean;
  webcamEnabled: boolean;
  remoteControlEnabled: boolean;
}

let currentState: SessionState = {
  sessionId: null,
  shareType: null,
  status: 'ended',
  recording: false,
  webcamEnabled: false,
  remoteControlEnabled: false,
};

// DOM elements
const shareOptions = document.getElementById('shareOptions')!;
const sessionControls = document.getElementById('sessionControls')!;
const statusIndicator = document.getElementById('statusIndicator')!;
const statusText = statusIndicator.querySelector('.status-text') as HTMLElement;
const sessionIdElement = document.getElementById('sessionId')!;
const viewerCountElement = document.getElementById('viewerCount')!;
const copySessionIdBtn = document.getElementById('copySessionId')!;
const copyViewerLinkBtn = document.getElementById('copyViewerLink')!;
const viewerLinkInput = document.getElementById('viewerLink') as HTMLInputElement;
const serverUrlInput = document.getElementById('serverUrlInput') as HTMLInputElement;
const saveServerUrlBtn = document.getElementById('saveServerUrl')!;

// Hardcoded viewer domain - always use screenshare.transparentinsurance.net
const VIEWER_DOMAIN = 'https://screenshare.transparentinsurance.net';
const stopSharingBtn = document.getElementById('stopSharing')!;
const remoteControlCheckbox = document.getElementById('remoteControlEnabled') as HTMLInputElement;
const recordSessionCheckbox = document.getElementById('recordSession') as HTMLInputElement;
const recordWebcamCheckbox = document.getElementById('recordWebcam') as HTMLInputElement;
const previewVideo = document.getElementById('previewVideo') as HTMLVideoElement;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadServerUrl();
  await loadSessionState();
  setupEventListeners();
  startStatePolling();
});

function setupEventListeners() {
  // Share buttons
  document.querySelectorAll('.share-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const shareType = (e.currentTarget as HTMLElement).dataset.type as ShareType;
      await startSharing(shareType);
    });
  });

  // Stop sharing
  stopSharingBtn.addEventListener('click', async () => {
    await stopSharing();
  });

  // Copy session ID
  copySessionIdBtn.addEventListener('click', async () => {
    if (currentState.sessionId) {
      await copySessionLink(currentState.sessionId);
      showNotification('Link copied to clipboard!', 'success');
    }
  });

  // Copy viewer link
  copyViewerLinkBtn.addEventListener('click', async () => {
    if (viewerLinkInput.value) {
      await navigator.clipboard.writeText(viewerLinkInput.value);
      showNotification('Viewer link copied!', 'success');
    }
  });

  // Save server URL
  saveServerUrlBtn.addEventListener('click', async () => {
    const serverUrl = serverUrlInput.value.trim();
    if (serverUrl) {
      await chrome.storage.local.set({ serverUrl });
      showNotification('Server URL saved!', 'success');
    }
  });

  // Settings checkboxes
  remoteControlCheckbox.addEventListener('change', async (e) => {
    const enabled = (e.target as HTMLInputElement).checked;
    await updateSettings({ remoteControlEnabled: enabled });
  });

  recordSessionCheckbox.addEventListener('change', async (e) => {
    const enabled = (e.target as HTMLInputElement).checked;
    await updateSettings({ recording: enabled });
    
    // Start/stop recording
    if (enabled && currentState.status === 'active') {
      await startRecording();
    } else if (!enabled) {
      await stopRecording();
    }
  });

  recordWebcamCheckbox.addEventListener('change', async (e) => {
    const enabled = (e.target as HTMLInputElement).checked;
    await updateSettings({ webcamEnabled: enabled });
  });
}

async function loadServerUrl() {
  try {
    const config = await chrome.storage.local.get(['serverUrl']);
    // Default to production server for transparentinsurance.net
    const serverUrl = config.serverUrl || 'https://screenshare.transparentinsurance.net';
    serverUrlInput.value = serverUrl;
  } catch (error) {
    console.error('Error loading server URL:', error);
  }
}

async function loadSessionState() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_SESSION_STATE' });
    if (response) {
      currentState = response;
      updateUI();
      if (currentState.sessionId) {
        await updateViewerLink(currentState.sessionId);
      }
    }
  } catch (error) {
    console.error('Error loading session state:', error);
  }
}

async function updateViewerLink(sessionId: string) {
  // Always use hardcoded viewer domain
  // Use shorter format without /view/ prefix for cleaner URLs
  // Server supports both /view/:sessionId and /:sessionId
  const viewerUrl = `${VIEWER_DOMAIN}/${sessionId}`;
  viewerLinkInput.value = viewerUrl;
}

async function startSharing(shareType: ShareType) {
  try {
    showLoading();
    
    const response = await chrome.runtime.sendMessage({
      type: 'START_SHARING',
      shareType,
    });

    if (response.success) {
      currentState = {
        ...currentState,
        sessionId: response.sessionId,
        shareType,
        status: 'active',
      };
      
      updateUI();
      await setupPreview();
    } else {
      showError(response.error || 'Failed to start sharing');
    }
  } catch (error) {
    console.error('Error starting sharing:', error);
    showError('Failed to start sharing. Please try again.');
  }
}

async function stopSharing() {
  try {
    await chrome.runtime.sendMessage({ type: 'STOP_SHARING' });
    currentState = {
      sessionId: null,
      shareType: null,
      status: 'ended',
      recording: false,
      webcamEnabled: false,
      remoteControlEnabled: false,
    };
    updateUI();
    stopPreview();
  } catch (error) {
    console.error('Error stopping sharing:', error);
  }
}

async function updateSettings(settings: Partial<SessionState>) {
  try {
    await chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings,
    });
    currentState = { ...currentState, ...settings };
  } catch (error) {
    console.error('Error updating settings:', error);
  }
}

function updateUI() {
  const isActive = currentState.status === 'active';
  
  if (isActive) {
    shareOptions.classList.add('hidden');
    sessionControls.classList.remove('hidden');
    statusIndicator.classList.add('active');
    statusText.textContent = 'Sharing';
    
    if (currentState.sessionId) {
      sessionIdElement.textContent = currentState.sessionId;
      updateViewerLink(currentState.sessionId).catch(console.error);
    }
    
    remoteControlCheckbox.checked = currentState.remoteControlEnabled;
    recordSessionCheckbox.checked = currentState.recording;
    recordWebcamCheckbox.checked = currentState.webcamEnabled;
  } else {
    shareOptions.classList.remove('hidden');
    sessionControls.classList.add('hidden');
    statusIndicator.classList.remove('active');
    statusText.textContent = 'Ready';
  }
}

async function setupPreview() {
  // Request preview stream from content script
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.id) {
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_PREVIEW_STREAM' });
      if (response?.stream) {
        previewVideo.srcObject = response.stream;
      }
    }
  } catch (error) {
    console.error('Error setting up preview:', error);
  }
}

function stopPreview() {
  if (previewVideo.srcObject) {
    const tracks = (previewVideo.srcObject as MediaStream).getTracks();
    tracks.forEach(track => track.stop());
    previewVideo.srcObject = null;
  }
}

async function copySessionLink(sessionId: string) {
  // Always use hardcoded viewer domain
  // Use shorter format without /view/ prefix for cleaner URLs
  // Server supports both /view/:sessionId and /:sessionId
  const viewerUrl = `${VIEWER_DOMAIN}/${sessionId}`;
  
  await navigator.clipboard.writeText(viewerUrl);
  await updateViewerLink(sessionId);
}

async function fetchViewerCount(sessionId: string): Promise<number> {
  try {
    const config = await chrome.storage.local.get(['serverUrl']);
    // Default to production server for transparentinsurance.net
    const serverUrl = config.serverUrl || 'https://screenshare.transparentinsurance.net';
    const response = await fetch(`${serverUrl}/api/sessions/${sessionId}/viewers`);
    
    if (response.ok) {
      const viewers = await response.json();
      return Array.isArray(viewers) ? viewers.length : 0;
    }
    return 0;
  } catch (error) {
    console.error('Error fetching viewer count:', error);
    return 0;
  }
}

function startStatePolling() {
  // Poll for viewer count and session updates
  setInterval(async () => {
    if (currentState.status === 'active' && currentState.sessionId) {
      await loadSessionState();
      const viewerCount = await fetchViewerCount(currentState.sessionId);
      viewerCountElement.textContent = viewerCount.toString();
    }
  }, 2000);
}

function showLoading() {
  statusText.textContent = 'Starting...';
}

function showError(message: string) {
  statusText.textContent = 'Error';
  console.error(message);
  showNotification(message, 'error');
}

function showNotification(message: string, type: 'success' | 'error' = 'success') {
  const notification = document.createElement('div');
  notification.textContent = message;
  const bgColor = type === 'error' ? '#ef4444' : '#10b981';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${bgColor};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    z-index: 10000;
    font-size: 14px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    animation: slideIn 0.3s ease-out;
  `;
  
  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.style.animation = 'slideIn 0.3s ease-out reverse';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

async function startRecording() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.id) {
      const includeWebcam = recordWebcamCheckbox.checked;
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'START_RECORDING',
        includeWebcam,
      });
      
      if (response.success) {
        statusIndicator.classList.add('recording');
        statusText.textContent = 'Recording';
        showNotification('Recording started', 'success');
      } else {
        showError(response.error || 'Failed to start recording');
      }
    }
  } catch (error) {
    console.error('Error starting recording:', error);
    showError('Failed to start recording');
  }
}

async function stopRecording() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.id) {
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'STOP_RECORDING',
      });
      
      if (response.success) {
        statusIndicator.classList.remove('recording');
        statusText.textContent = 'Sharing';
        showNotification('Recording stopped and uploaded', 'success');
      }
    }
  } catch (error) {
    console.error('Error stopping recording:', error);
  }
}


