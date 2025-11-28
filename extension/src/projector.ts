/**
 * Video projector mode - stream pre-recorded videos during screen share
 */

interface ProjectorState {
  isActive: boolean;
  videoElement: HTMLVideoElement | null;
  videoStream: MediaStream | null;
  currentVideoUrl: string | null;
}

let projectorState: ProjectorState = {
  isActive: false,
  videoElement: null,
  videoStream: null,
  currentVideoUrl: null,
};

export async function startProjectorMode(videoUrl: string): Promise<MediaStream> {
  if (projectorState.isActive) {
    await stopProjectorMode();
  }

  // Create video element
  const video = document.createElement('video');
  video.src = videoUrl;
  video.crossOrigin = 'anonymous';
  video.loop = false;
  video.muted = false;
  video.playsInline = true;

  // Wait for video to load
  await new Promise((resolve, reject) => {
    video.onloadedmetadata = () => {
      video.play()
        .then(() => resolve(undefined))
        .catch(reject);
    };
    video.onerror = reject;
  });

  // Capture video stream using captureStream API
  const stream = (video as any).captureStream ? 
    (video as any).captureStream() : 
    (video as any).mozCaptureStream ? 
    (video as any).mozCaptureStream() : 
    null;

  if (!stream) {
    throw new Error('Video capture stream not supported');
  }

  projectorState = {
    isActive: true,
    videoElement: video,
    videoStream: stream,
    currentVideoUrl: videoUrl,
  };

  return stream;
}

export async function stopProjectorMode(): Promise<void> {
  if (projectorState.videoElement) {
    projectorState.videoElement.pause();
    projectorState.videoElement.src = '';
    projectorState.videoElement = null;
  }

  if (projectorState.videoStream) {
    projectorState.videoStream.getTracks().forEach(track => track.stop());
    projectorState.videoStream = null;
  }

  projectorState.isActive = false;
  projectorState.currentVideoUrl = null;
}

export function isProjectorModeActive(): boolean {
  return projectorState.isActive;
}

export function getProjectorStream(): MediaStream | null {
  return projectorState.videoStream;
}

