/**
 * Main server entry point
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { setupWebSocket } from './websocket';
import { setupRoutes } from './routes';
import { initializeDatabase } from './database';
import { errorHandler } from './middleware/errorHandler';
import { setupStaticFiles } from './middleware/staticFiles';
import { setupSecurityHeaders, requestSizeLimit } from './middleware/security';
import { requestLogger, logger } from './middleware/logging';
import { validateSessionIdFromUrl } from './middleware/security';
import { Request, Response } from 'express';
import { env } from './config/env';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = env.PORT;

// Trust proxy (for rate limiting IP detection behind reverse proxy)
app.set('trust proxy', 1);

// Security headers
setupSecurityHeaders(app);

// CORS configuration
const allowedOrigins = env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [
  'https://screenshare.transparentinsurance.net',
  'http://screenshare.transparentinsurance.net',
  'https://transparentinsurance.net',
  'http://transparentinsurance.net',
  'http://localhost:3000',
  'http://localhost:5173',
];

// Remove wildcard in production
const isDevelopment = env.NODE_ENV !== 'production';
const corsOrigins = isDevelopment ? [...allowedOrigins, 'http://localhost:*'] : allowedOrigins;

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // In development, allow localhost with any port
    if (isDevelopment && origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    
    if (corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request', { origin, allowedOrigins: corsOrigins });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Request size limits
app.use(express.json({ limit: requestSizeLimit.json }));
app.use(express.urlencoded({ extended: true, limit: requestSizeLimit.urlencoded }));

// Request logging
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Setup static files (for assets like CSS, JS)
setupStaticFiles(app);

// Setup routes (API and viewer pages)
// IMPORTANT: Routes must be set up after static files
setupRoutes(app);

// Setup WebSocket
setupWebSocket(wss);

// Error handler
app.use(errorHandler);

// Initialize database
initializeDatabase()
  .then(() => {
    console.log('Database initialized');
    
    // Start server
    const HOST = env.HOST; // Listen on all interfaces for network access
    const port = parseInt(PORT.toString(), 10);
    server.listen(port, HOST, () => {
      console.log(`Server running on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${port}`);
      console.log(`WebSocket server ready`);
      if (HOST === '0.0.0.0') {
        console.log(`\n💡 For remote viewers, configure extension with your network IP:`);
        console.log(`   Example: http://192.168.1.100:${port}`);
        console.log(`   Or use your domain: https://transparentinsurance.net`);
        console.log(`   Find your IP: ipconfig getifaddr en0 (macOS) or ipconfig (Windows)\n`);
      }
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

