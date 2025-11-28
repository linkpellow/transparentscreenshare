/**
 * API routes
 */

import { Express, Request, Response } from 'express';
import { sessionRoutes } from './sessions';
import { recordingRoutes } from './recordings';
import { viewerRoutes } from './viewers';
import { userRoutes } from './users';
import { apiRoutes } from './api';
import { projectorRoutes } from './projector';
import path from 'path';
import { validateSessionIdFromUrl } from '../middleware/security';
import { logger } from '../middleware/logging';

export function setupRoutes(app: Express): void {
  // API routes (must come before viewer routes)
  app.use('/api/sessions', sessionRoutes);
  app.use('/api/recordings', recordingRoutes);
  app.use('/api/viewers', viewerRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/projector', projectorRoutes);
  app.use('/api', apiRoutes);
  
  // Support both /view/:sessionId and /:sessionId routes for viewer
  // This allows URLs like: screenshare.transparentinsurance.net/screenshareid169304
  // IMPORTANT: These routes must come AFTER API routes to avoid conflicts
  app.get('/view/:sessionId', serveViewerPage);
  
  // Direct session ID route (catch-all, must be last)
  // Exclude common paths that shouldn't be treated as session IDs
  app.get('/:sessionId', (req, res, next) => {
    const sessionId = req.params.sessionId;
    // Exclude common paths
    if (['favicon.ico', 'robots.txt', 'health', 'api'].includes(sessionId)) {
      return next();
    }
    serveViewerPage(req, res);
  });
}

function serveViewerPage(req: Request, res: Response): void {
  const sessionId = req.params.sessionId;
  
  // Validate session ID format
  if (!sessionId || !validateSessionIdFromUrl(sessionId)) {
    logger.warn('Invalid session ID in viewer request', {
      sessionId,
      path: req.path,
      ip: req.ip,
    });
    res.status(400).json({ error: 'Invalid session ID format' });
    return;
  }
  
  // Try multiple possible paths (development vs production)
  const possiblePaths = [
    path.resolve(__dirname, '../../viewer/dist'), // Development
    path.resolve(__dirname, '../../../viewer/dist'), // Production (if server is in dist/)
    path.resolve(process.cwd(), 'viewer/dist'), // Absolute from cwd
    path.join(process.cwd(), 'viewer', 'dist'), // Alternative
  ];
  
  let viewerPath: string | null = null;
  const fs = require('fs');
  for (const possiblePath of possiblePaths) {
    const indexPath = path.join(possiblePath, 'index.html');
    if (fs.existsSync(possiblePath) && fs.existsSync(indexPath)) {
      viewerPath = indexPath;
      break;
    }
  }
  
  if (!viewerPath) {
    logger.error('Viewer index.html not found!', undefined, {
      sessionId,
      triedPaths: possiblePaths,
      cwd: process.cwd(),
      __dirname,
    });
    res.status(500).json({ 
      error: 'Viewer files not found',
      message: 'The viewer application has not been deployed. Please build and deploy the viewer files.',
    });
    return;
  }
  
  // Serve viewer page - it will extract sessionId from URL
  res.sendFile(viewerPath, (err) => {
    if (err) {
      logger.error('Error serving viewer page', err as Error, {
        sessionId,
        path: req.path,
        viewerPath,
      });
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Error loading viewer',
          message: err.message,
        });
      }
    } else {
      logger.info('Viewer page served successfully', {
        sessionId,
        path: req.path,
      });
    }
  });
}

