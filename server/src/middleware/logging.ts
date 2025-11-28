/**
 * Structured logging middleware
 */

import { Request, Response, NextFunction } from 'express';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  method?: string;
  path?: string;
  statusCode?: number;
  ip?: string;
  userAgent?: string;
  error?: {
    message: string;
    stack?: string;
  };
  duration?: number;
}

class Logger {
  private log(entry: LogEntry): void {
    const output = process.env.NODE_ENV === 'production'
      ? JSON.stringify(entry)
      : this.formatPretty(entry);
    
    if (entry.level === 'error') {
      console.error(output);
    } else if (entry.level === 'warn') {
      console.warn(output);
    } else {
      console.log(output);
    }
  }

  private formatPretty(entry: LogEntry): string {
    const parts = [
      `[${entry.timestamp}]`,
      entry.level.toUpperCase(),
      entry.message,
    ];
    
    if (entry.method && entry.path) {
      parts.push(`${entry.method} ${entry.path}`);
    }
    
    if (entry.statusCode) {
      parts.push(`→ ${entry.statusCode}`);
    }
    
    if (entry.duration) {
      parts.push(`(${entry.duration}ms)`);
    }
    
    if (entry.error) {
      parts.push(`\n  Error: ${entry.error.message}`);
      if (entry.error.stack && process.env.NODE_ENV === 'development') {
        parts.push(`\n  ${entry.error.stack}`);
      }
    }
    
    return parts.join(' ');
  }

  info(message: string, meta?: any): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      ...meta,
    });
  }

  warn(message: string, meta?: any): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      ...meta,
    });
  }

  error(message: string, error?: Error, meta?: any): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      error: error ? {
        message: error.message,
        stack: error.stack,
      } : undefined,
      ...meta,
    });
  }
}

export const logger = new Logger();

// Request logging middleware
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
      duration,
    });
  });
  
  next();
}

