/**
 * WebSocket server for WebRTC signaling
 */

import { WebSocketServer, WebSocket } from 'ws';
import { WebRTCMessage, RemoteControlEvent, EngagementEvent } from '@usha/shared';
import { pool } from '../database';
import { generateViewerId } from '@usha/shared';
import { validateSessionIdFromUrl } from '../middleware/security';
import { logger } from '../middleware/logging';

interface ClientConnection {
  ws: WebSocket;
  sessionId: string;
  viewerId?: string;
  isHost: boolean;
}

const connections = new Map<string, ClientConnection[]>();

export function setupWebSocket(wss: WebSocketServer): void {
  wss.on('connection', (ws: WebSocket, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const sessionId = url.pathname.split('/').pop() || '';
    
    // Validate session ID
    if (!sessionId || !validateSessionIdFromUrl(sessionId)) {
      logger.warn('Invalid session ID in WebSocket connection', {
        sessionId,
        ip: req.socket.remoteAddress,
      });
      ws.close(1008, 'Invalid session ID');
      return;
    }

    const isHost = url.searchParams.get('host') === 'true';
    const viewerId = isHost ? undefined : generateViewerId();

    const connection: ClientConnection = {
      ws,
      sessionId,
      viewerId,
      isHost,
    };

    // Add to connections map
    if (!connections.has(sessionId)) {
      connections.set(sessionId, []);
    }
    connections.get(sessionId)!.push(connection);

    // Register viewer in database if not host
    if (!isHost && viewerId) {
      pool.query(
        `INSERT INTO viewers (id, session_id, user_agent, remote_control_enabled)
         VALUES ($1, $2, $3, $4)`,
        [viewerId, sessionId, req.headers['user-agent'] || '', false]
      ).catch((err) => {
        logger.error('Error registering viewer in database', err as Error, {
          sessionId,
          viewerId,
        });
      });
    }

    logger.info('WebSocket client connected', {
      sessionId,
      isHost,
      viewerId,
      ip: req.socket.remoteAddress,
    });

    // Handle messages
    ws.on('message', async (data: Buffer) => {
      try {
        const message: WebRTCMessage = JSON.parse(data.toString());
        await handleMessage(connection, message);
      } catch (error) {
        logger.error('Error handling WebSocket message', error as Error, {
          sessionId,
          isHost,
        });
        ws.send(JSON.stringify({ error: 'Invalid message format' }));
      }
    });

    // Handle close
    ws.on('close', () => {
      const sessionConnections = connections.get(sessionId);
      if (sessionConnections) {
        const index = sessionConnections.findIndex(c => c.ws === ws);
        if (index !== -1) {
          sessionConnections.splice(index, 1);
        }
        if (sessionConnections.length === 0) {
          connections.delete(sessionId);
        }
      }
      logger.info('WebSocket client disconnected', {
        sessionId,
        isHost,
        viewerId,
      });
    });

    // Handle errors
    ws.on('error', (error) => {
      logger.error('WebSocket error', error as Error, {
        sessionId,
        isHost,
        viewerId,
      });
    });

    // Send connection confirmation
    ws.send(JSON.stringify({
      type: 'connected',
      sessionId,
      viewerId,
      isHost,
    }));
  });
}

async function handleMessage(
  connection: ClientConnection,
  message: WebRTCMessage
): Promise<void> {
  const { sessionId, isHost, viewerId } = connection;
  const sessionConnections = connections.get(sessionId) || [];

  switch (message.type) {
    case 'offer':
    case 'answer':
    case 'ice-candidate':
      // Forward WebRTC signaling messages to other clients
      sessionConnections.forEach(client => {
        if (client.ws !== connection.ws && client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify({
            ...message,
            from: isHost ? 'host' : viewerId,
          }));
        }
      });
      break;

    case 'remote-control':
      // Forward remote control events to host
      if (!isHost) {
        const hostConnection = sessionConnections.find(c => c.isHost);
        if (hostConnection && hostConnection.ws.readyState === WebSocket.OPEN) {
          hostConnection.ws.send(JSON.stringify({
            type: 'remote-control',
            from: viewerId,
            data: message.data as RemoteControlEvent,
          }));
        }
      }
      break;

    case 'engagement':
      // Store engagement events in database
      if (!isHost && viewerId) {
        const event = message.data as EngagementEvent;
        await pool.query(
          `INSERT INTO engagement_events (id, viewer_id, session_id, event_type, event_data)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            event.id,
            viewerId,
            sessionId,
            event.type,
            JSON.stringify(event.data),
          ]
        ).catch(console.error);

        // Forward to host for real-time preview
        const hostConnection = sessionConnections.find(c => c.isHost);
        if (hostConnection && hostConnection.ws.readyState === WebSocket.OPEN) {
          hostConnection.ws.send(JSON.stringify({
            type: 'engagement',
            from: viewerId,
            data: event,
          }));
        }
      }
      break;
  }
}

