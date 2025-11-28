/**
 * Error handling middleware
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from './logging';

export function errorHandler(
  err: Error | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    return next(err);
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    logger.warn('Validation error', {
      method: req.method,
      path: req.path,
      errors: err.errors,
    });
    
    res.status(400).json({
      error: 'Validation error',
      details: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Handle database errors
  if (err.name === 'PostgresError' || err.message.includes('database')) {
    logger.error('Database error', err as Error, {
      method: req.method,
      path: req.path,
    });
    
    res.status(500).json({
      error: process.env.NODE_ENV === 'production'
        ? 'Database error'
        : err.message,
    });
    return;
  }

  // Handle other errors
  logger.error('Unhandled error', err as Error, {
    method: req.method,
    path: req.path,
    statusCode: (err as any).statusCode || 500,
  });

  const statusCode = (err as any).statusCode || 500;
  
  res.status(statusCode).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    stack: process.env.NODE_ENV === 'development' ? (err as Error).stack : undefined,
  });
}

