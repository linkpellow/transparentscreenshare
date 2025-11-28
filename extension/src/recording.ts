/**
 * Recording service for screen and webcam recording
 */

import { Recording } from '@usha/shared';

interface RecordingState {
  isRecording: boolean;
  mediaRecorder: MediaRecorder | null;
  recordedChunks: Blob[];
  webcamStream: MediaStream | null;
  screenStream: MediaStream | null;
  recordingId: string | null;
  startTime: number | null;
}

let recordingState: RecordingState = {
  isRecording: false,
  mediaRecorder: null,
  recordedChunks: [],
  webcamStream: null,
  screenStream: null,
  recordingId: null,
  startTime: null,
};

export async function startRecording(
  screenStream: MediaStream,
  includeWebcam: boolean = false
): Promise<string> {
  if (recordingState.isRecording) {
    throw new Error('Recording already in progress');
  }

  recordingState.screenStream = screenStream;
  recordingState.recordedChunks = [];
  recordingState.startTime = Date.now();
  recordingState.recordingId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Get webcam stream if requested
  if (includeWebcam) {
    try {
      recordingState.webcamStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });
    } catch (error) {
      console.warn('Failed to get webcam stream:', error);
    }
  }

  // Combine streams
  const tracks: MediaStreamTrack[] = [...screenStream.getTracks()];
  
  if (recordingState.webcamStream) {
    tracks.push(...recordingState.webcamStream.getTracks());
  }

  // Create combined stream for recording
  const combinedStream = new MediaStream(tracks);

  // Create MediaRecorder
  const options: MediaRecorderOptions = {
    mimeType: 'video/webm;codecs=vp9,opus',
    videoBitsPerSecond: 2500000, // 2.5 Mbps
  };

  const mediaRecorder = new MediaRecorder(combinedStream, options);
  recordingState.mediaRecorder = mediaRecorder;

  mediaRecorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      recordingState.recordedChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = async () => {
    await finalizeRecording();
  };

  mediaRecorder.onerror = (event) => {
    console.error('MediaRecorder error:', event);
  };

  // Start recording
  mediaRecorder.start(1000); // Collect data every second
  recordingState.isRecording = true;

  return recordingState.recordingId;
}

export async function stopRecording(): Promise<Blob> {
  if (!recordingState.isRecording || !recordingState.mediaRecorder) {
    throw new Error('No recording in progress');
  }

  return new Promise((resolve, reject) => {
    if (recordingState.mediaRecorder) {
      recordingState.mediaRecorder.onstop = async () => {
        try {
          const blob = await finalizeRecording();
          resolve(blob);
        } catch (error) {
          reject(error);
        }
      };

      recordingState.mediaRecorder.stop();
      recordingState.isRecording = false;
    } else {
      reject(new Error('MediaRecorder not initialized'));
    }
  });
}

async function finalizeRecording(): Promise<Blob> {
  // Stop all tracks
  if (recordingState.screenStream) {
    recordingState.screenStream.getTracks().forEach(track => {
      if (track.readyState === 'live') {
        track.stop();
      }
    });
  }

  if (recordingState.webcamStream) {
    recordingState.webcamStream.getTracks().forEach(track => {
      if (track.readyState === 'live') {
        track.stop();
      }
    });
  }

  // Combine recorded chunks
  const blob = new Blob(recordingState.recordedChunks, {
    type: 'video/webm',
  });

  // Upload recording
  if (recordingState.recordingId) {
    await uploadRecording(blob, recordingState.recordingId);
  }

  // Reset state
  recordingState = {
    isRecording: false,
    mediaRecorder: null,
    recordedChunks: [],
    webcamStream: null,
    screenStream: null,
    recordingId: null,
    startTime: null,
  };

  return blob;
}

async function uploadRecording(blob: Blob, recordingId: string): Promise<void> {
  try {
    const config = await chrome.storage.local.get(['serverUrl']);
    // Default to production server for transparentinsurance.net
    const serverUrl = config.serverUrl || 'https://screenshare.transparentinsurance.net';

    // Get session ID from background
    const response = await chrome.runtime.sendMessage({ type: 'GET_SESSION_STATE' });
    const sessionId = response?.sessionId;

    if (!sessionId) {
      console.error('No active session for recording');
      return;
    }

    // Calculate duration
    const duration = recordingState.startTime
      ? Math.floor((Date.now() - recordingState.startTime) / 1000)
      : 0;

    // Create FormData
    const formData = new FormData();
    formData.append('recording', blob, `${recordingId}.webm`);
    formData.append('sessionId', sessionId);
    formData.append('recordingId', recordingId);
    formData.append('type', recordingState.webcamStream ? 'both' : 'screen');
    formData.append('duration', duration.toString());
    formData.append('size', blob.size.toString());

    // Upload to server
    const uploadResponse = await fetch(`${serverUrl}/api/recordings/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload recording');
    }

    console.log('Recording uploaded successfully');
  } catch (error) {
    console.error('Error uploading recording:', error);
  }
}

export function isRecording(): boolean {
  return recordingState.isRecording;
}

export function getRecordingId(): string | null {
  return recordingState.recordingId;
}

