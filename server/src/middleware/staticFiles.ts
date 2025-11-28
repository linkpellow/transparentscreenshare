/**
 * Static file serving middleware
 */

import express, { Express } from 'express';
import path from 'path';
import fs from 'fs';
import { logger } from './logging';

export function setupStaticFiles(app: Express): void {
  // Serve viewer static files
  // Try multiple possible paths (development vs production)
  const possiblePaths = [
    path.resolve(__dirname, '../../viewer/dist'), // Development
    path.resolve(__dirname, '../../../viewer/dist'), // Production (if server is in dist/)
    path.resolve(process.cwd(), 'viewer/dist'), // Absolute from cwd
    path.resolve(process.cwd(), '../viewer/dist'), // Production (server in /app/server, viewer in /app/viewer)
    path.join(process.cwd(), 'viewer', 'dist'), // Alternative
  ];
  
  let viewerPath: string | null = null;
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath) && fs.existsSync(path.join(possiblePath, 'index.html'))) {
      viewerPath = possiblePath;
      logger.info('Viewer files found at', { path: viewerPath });
      break;
    }
  }
  
  if (viewerPath) {
    app.use(express.static(viewerPath, {
      maxAge: '1h', // Cache static assets for 1 hour
      etag: true,
      lastModified: true,
    }));
    logger.info('Static file serving configured', { viewerPath });
  } else {
    logger.error('Viewer dist directory not found!', undefined, {
      triedPaths: possiblePaths,
      cwd: process.cwd(),
      __dirname,
    });
    // Don't fail, but log the error - routes will handle 404s
  }
  
  // Serve public files (if any)
  const publicPath = path.resolve(__dirname, '../public');
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
    logger.info('Public files serving configured', { publicPath });
  }
  
  // Note: Viewer routes are handled in routes/index.ts
  // This allows both /view/:sessionId and /:sessionId formats
}

