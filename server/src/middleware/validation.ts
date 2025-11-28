/**
 * Input validation middleware
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

// Session ID validation (alphanumeric, dashes, underscores, min 3 chars)
const SESSION_ID_REGEX = /^[a-zA-Z0-9_-]{3,255}$/;
const RECORDING_ID_REGEX = /^[a-zA-Z0-9_-]{3,255}$/;
const USER_ID_REGEX = /^[a-zA-Z0-9_-]{1,255}$/;

export function validateSessionId(req: Request, res: Response, next: NextFunction): void {
  const { sessionId } = req.params;
  
  if (!sessionId || !SESSION_ID_REGEX.test(sessionId)) {
    res.status(400).json({ 
      error: 'Invalid session ID format',
      message: 'Session ID must be 3-255 alphanumeric characters, dashes, or underscores'
    });
    return;
  }
  
  next();
}

export function validateRecordingId(req: Request, res: Response, next: NextFunction): void {
  const { recordingId } = req.params;
  
  if (!recordingId || !RECORDING_ID_REGEX.test(recordingId)) {
    res.status(400).json({ 
      error: 'Invalid recording ID format',
      message: 'Recording ID must be 3-255 alphanumeric characters, dashes, or underscores'
    });
    return;
  }
  
  next();
}

export function validateUserId(req: Request, res: Response, next: NextFunction): void {
  const { userId } = req.params;
  
  if (!userId || !USER_ID_REGEX.test(userId)) {
    res.status(400).json({ 
      error: 'Invalid user ID format',
      message: 'User ID must be 1-255 alphanumeric characters, dashes, or underscores'
    });
    return;
  }
  
  next();
}

// Schema for creating a session
const createSessionSchema = z.object({
  hostId: z.string().min(1).max(255).regex(/^[a-zA-Z0-9_-]+$/),
  shareType: z.enum(['desktop', 'window', 'tab']),
  remoteControlEnabled: z.boolean().optional().default(false),
  maxViewers: z.number().int().min(1).max(100).optional(),
  redirectUrl: z.string().url().optional().or(z.literal('')),
});

export function validateCreateSession(req: Request, res: Response, next: NextFunction): void {
  try {
    req.body = createSessionSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      });
    } else {
      next(error);
    }
  }
}

// Schema for updating a session
const updateSessionSchema = z.object({
  status: z.enum(['active', 'ended', 'paused']).optional(),
  remoteControlEnabled: z.boolean().optional(),
  maxViewers: z.number().int().min(1).max(100).optional(),
  redirectUrl: z.string().url().optional().or(z.literal('')),
  recordingId: z.string().regex(RECORDING_ID_REGEX).optional(),
}).strict();

export function validateUpdateSession(req: Request, res: Response, next: NextFunction): void {
  try {
    req.body = updateSessionSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      });
    } else {
      next(error);
    }
  }
}

// Schema for engagement query
const engagementQuerySchema = z.object({
  limit: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const num = parseInt(val, 10);
        return isNaN(num) ? undefined : num;
      }
      return val;
    },
    z.number().int().min(1).max(1000).optional()
  ),
});

export function validateEngagementQuery(req: Request, res: Response, next: NextFunction): void {
  try {
    const validated = engagementQuerySchema.parse(req.query);
    // Merge validated query back (TypeScript workaround)
    Object.assign(req.query, validated);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      });
    } else {
      next(error);
    }
  }
}

// Schema for recording upload
const recordingUploadSchema = z.object({
  sessionId: z.string().regex(SESSION_ID_REGEX),
  type: z.enum(['screen', 'webcam', 'both']),
  duration: z.number().int().min(0).max(86400), // Max 24 hours
  size: z.number().int().min(0).max(10737418240), // Max 10GB
});

export function validateRecordingUpload(req: Request, res: Response, next: NextFunction): void {
  try {
    req.body = recordingUploadSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      });
    } else {
      next(error);
    }
  }
}

