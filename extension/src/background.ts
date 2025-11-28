/**
 * Background service worker for Usha Chrome Extension
 * Handles screen capture requests and WebRTC signaling
 */

import { ShareType, SessionStatus } from '@usha/shared';

interface SessionState {
  sessionId: string | null;
  shareType: ShareType | null;
  streamId: string | null;
  status: SessionStatus;
  recording: boolean;
  webcamEnabled: boolean;
  remoteControlEnabled: boolean;
}

let sessionState: SessionState = {
  sessionId: null,
  shareType: null,
  streamId: null,
  status: 'ended',
  recording: false,
  webcamEnabled: false,
  remoteControlEnabled: false,
};

let activeTabId: number | null = null;

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Usha extension installed');
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'START_SHARING':
      handleStartSharing(message.shareType, sendResponse);
      return true; // Keep channel open for async response

    case 'STOP_SHARING':
      handleStopSharing();
      sendResponse({ success: true });
      break;

    case 'GET_SESSION_STATE':
      sendResponse(sessionState);
      break;

    case 'UPDATE_SETTINGS':
      handleUpdateSettings(message.settings);
      sendResponse({ success: true });
      break;

    case 'CAPTURE_SCREEN':
      handleCaptureScreen(message.shareType, sendResponse);
      return true;
  }
});

async function handleStartSharing(shareType: ShareType, sendResponse: (response: any) => void) {
  try {
    // Request screen capture
    const streamId = await requestScreenCapture(shareType);
    
    if (!streamId) {
      sendResponse({ success: false, error: 'Screen capture denied' });
      return;
    }

    sessionState = {
      ...sessionState,
      shareType,
      streamId,
      status: 'active',
    };

    // Generate session ID
    const sessionId = generateSessionId();
    sessionState.sessionId = sessionId;

    // Create session on server
    await createSessionOnServer(sessionId, shareType);

    // Initialize WebRTC connection
    await initializeWebRTC(streamId, sessionId);

    sendResponse({ success: true, sessionId, streamId });
  } catch (error) {
    console.error('Error starting sharing:', error);
    sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

async function requestScreenCapture(shareType: ShareType): Promise<string | null> {
  // Get the current active tab (needed for content script communication)
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs[0]?.id) {
    throw new Error('No active tab found');
  }
  
  activeTabId = tabs[0].id;
  const targetTab = tabs[0]; // Full Tab object for chooseDesktopMedia
  
  const sources: string[] = [];
  
  switch (shareType) {
    case 'desktop':
      sources.push('screen' as any);
      break;
    case 'window':
      sources.push('window' as any);
      break;
    case 'tab':
      sources.push('tab' as any);
      break;
  }

  return new Promise((resolve, reject) => {
    // Manifest V3: chooseDesktopMedia(sources, targetTab, callback)
    // targetTab is REQUIRED when called from service worker context
    // Must pass the full Tab object, not just the ID
    (chrome.desktopCapture as any).chooseDesktopMedia(
      sources,
      targetTab, // REQUIRED in Manifest V3 service worker context
      (streamId: string) => {
        if (chrome.runtime.lastError) {
          const error = chrome.runtime.lastError.message;
          console.error('Desktop capture error:', error);
          reject(new Error(error));
          return;
        }
        resolve(streamId || null);
      }
    );
  });
}

async function handleCaptureScreen(shareType: ShareType, sendResponse: (response: any) => void) {
  try {
    const streamId = await requestScreenCapture(shareType);
    sendResponse({ success: true, streamId });
  } catch (error) {
    sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

async function handleStopSharing() {
  // Send stop message to the active tab (not streamId which is not a tab ID)
  // Only send if we have a valid tab ID
  if (!activeTabId || typeof activeTabId !== 'number' || activeTabId <= 0) {
    // No valid tab ID, just reset state
    sessionState = {
      sessionId: null,
      shareType: null,
      streamId: null,
      status: 'ended',
      recording: false,
      webcamEnabled: false,
      remoteControlEnabled: false,
    };
    activeTabId = null;
    return;
  }
  
  // Verify tab still exists before sending message
  try {
    const tab = await chrome.tabs.get(activeTabId);
    if (tab && tab.id) {
      // Tab exists, try to send message
      chrome.tabs.sendMessage(activeTabId, { type: 'STOP_STREAM' }).catch((error) => {
        // Ignore errors if tab is closed or doesn't have content script
        // This is expected if tab was closed or content script not loaded
        console.log('Could not send stop message to tab (this is usually fine):', error.message || error);
      });
    }
  } catch (error) {
    // Tab doesn't exist anymore, that's fine
    console.log('Tab no longer exists, skipping stop message');
  }

  sessionState = {
    sessionId: null,
    shareType: null,
    streamId: null,
    status: 'ended',
    recording: false,
    webcamEnabled: false,
    remoteControlEnabled: false,
  };
  
  activeTabId = null;
}

function handleUpdateSettings(settings: Partial<SessionState>) {
  sessionState = { ...sessionState, ...settings };
}

async function initializeWebRTC(streamId: string, sessionId: string) {
  // WebRTC initialization will be handled by the content script
  // This will connect to the signaling server
  const config = await chrome.storage.local.get(['serverUrl']);
  // Default to production server for transparentinsurance.net
  const serverUrl = config.serverUrl || 'https://screenshare.transparentinsurance.net';
  
  // Notify content script to initialize WebRTC
  // In service worker context, we must have a valid tab ID
  let tabId: number | null | undefined = activeTabId;
  
  // If we don't have activeTabId, query for the active tab (exclude extension pages)
  if (!tabId) {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      // Filter out extension pages (chrome-extension://) and find a real web page
      const webTab = tabs.find(tab => 
        tab.id && 
        tab.url && 
        !tab.url.startsWith('chrome-extension://') &&
        !tab.url.startsWith('chrome://') &&
        !tab.url.startsWith('about:')
      );
      
      if (webTab && webTab.id !== undefined) {
        tabId = webTab.id;
        activeTabId = tabId;
      } else if (tabs.length > 0 && tabs[0].id !== undefined) {
        // Fallback to first tab if no web tab found
        tabId = tabs[0].id;
        activeTabId = tabId;
      }
    } catch (error) {
      console.error('Error querying tabs:', error);
      return; // Can't proceed without a valid tab
    }
  }
  
  // Validate tab ID before sending message
  if (!tabId || typeof tabId !== 'number' || tabId <= 0) {
    console.warn('No valid tab ID available for WebRTC initialization');
    return;
  }
  
  // Verify tab still exists and is a web page before sending message
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab || !tab.id) {
      console.warn('Tab no longer exists');
      return;
    }
    
    // Check if it's an extension page - content scripts don't work there
    if (tab.url && (tab.url.startsWith('chrome-extension://') || tab.url.startsWith('chrome://'))) {
      console.warn('Cannot inject content script into extension page:', tab.url);
      // Try to find any web page tab instead
      const allTabs = await chrome.tabs.query({});
      const webTab = allTabs.find(t => 
        t.id && 
        t.url && 
        !t.url.startsWith('chrome-extension://') &&
        !t.url.startsWith('chrome://')
      );
      if (webTab && webTab.id) {
        tabId = webTab.id;
        activeTabId = tabId;
      } else {
        console.error('No web page tabs found to inject content script');
        return;
      }
    }
  } catch (error) {
    console.warn('Tab not found or invalid:', error);
    return;
  }
  
  // Inject content script if needed, then send message
  try {
    // Try to send message first
    await chrome.tabs.sendMessage(tabId, {
      type: 'INIT_WEBRTC',
      sessionId,
      streamId,
      serverUrl,
    });
  } catch (error) {
    // If content script isn't ready, try to inject it
    console.log('Content script not ready, attempting to inject...');
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js']
      });
      
      // Wait a bit for script to initialize, then try again
      setTimeout(async () => {
        try {
          await chrome.tabs.sendMessage(tabId!, {
            type: 'INIT_WEBRTC',
            sessionId,
            streamId,
            serverUrl,
          });
        } catch (retryError) {
          console.error('Failed to send INIT_WEBRTC after injection:', retryError);
        }
      }, 500);
    } catch (injectError) {
      console.error('Could not inject content script:', injectError);
    }
  }
}

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function createSessionOnServer(sessionId: string, shareType: ShareType): Promise<void> {
  try {
    const config = await chrome.storage.local.get(['serverUrl', 'hostId']);
    // Default to production server for transparentinsurance.net
    const serverUrl = config.serverUrl || 'https://screenshare.transparentinsurance.net';
    const hostId = config.hostId || 'default_host';

    const response = await fetch(`${serverUrl}/api/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hostId,
        shareType,
        remoteControlEnabled: sessionState.remoteControlEnabled || false,
        maxViewers: 10,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('Failed to create session on server:', errorText);
      // Don't throw - session can work without server registration
      // WebRTC will work via WebSocket connection
    } else {
      const session = await response.json();
      console.log('Session created on server:', session.id);
    }
  } catch (error) {
    console.warn('Error creating session on server (continuing anyway):', error);
    // Don't fail the sharing if server is unavailable
    // WebRTC will work via direct WebSocket connection
  }
}

// Handle tab capture for tab sharing
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (sessionState.shareType === 'tab' && changeInfo.status === 'complete') {
    // Handle tab updates during sharing
  }
});

