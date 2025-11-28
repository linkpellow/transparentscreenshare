/**
 * Shared types for Usha screen sharing application
 */

export type ShareType = 'desktop' | 'window' | 'tab';

export type SessionStatus = 'active' | 'paused' | 'ended' | 'recording';

export interface Session {
  id: string;
  hostId: string;
  shareType: ShareType;
  status: SessionStatus;
  createdAt: Date;
  endedAt?: Date;
  recordingId?: string;
  remoteControlEnabled: boolean;
  maxViewers?: number;
  redirectUrl?: string;
}

export interface Viewer {
  id: string;
  sessionId: string;
  joinedAt: Date;
  lastActivity: Date;
  userAgent: string;
  remoteControlEnabled: boolean;
}

export interface EngagementEvent {
  id: string;
  viewerId: string;
  sessionId: string;
  type: 'click' | 'scroll' | 'zoom' | 'focus' | 'idle';
  timestamp: Date;
  data: {
    x?: number;
    y?: number;
    zoom?: number;
    duration?: number;
  };
}

export interface Recording {
  id: string;
  sessionId: string;
  type: 'screen' | 'webcam' | 'both';
  url: string;
  thumbnailUrl?: string;
  gifPreviewUrl?: string;
  duration: number;
  size: number;
  createdAt: Date;
  expiresAt?: Date;
}

export interface WebRTCMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'remote-control' | 'engagement';
  from: string;
  to?: string;
  data: any;
}

export interface RemoteControlEvent {
  type: 'mousemove' | 'mousedown' | 'mouseup' | 'click' | 'keydown' | 'keyup' | 'scroll' | 'wheel';
  x?: number;
  y?: number;
  button?: number;
  key?: string;
  code?: string;
  deltaX?: number;
  deltaY?: number;
  deltaZ?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  teamId?: string;
  createdAt: Date;
}

export interface Team {
  id: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  maxMembers: number;
  createdAt: Date;
}

