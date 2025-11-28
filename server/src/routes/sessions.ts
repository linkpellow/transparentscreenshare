/**
 * Session management routes
 */

import { Router } from 'express';
import { pool } from '../database';
import { generateSessionId } from '@usha/shared';
import { Session, SessionStatus } from '@usha/shared';
import { validateCreateSession, validateUpdateSession, validateSessionId, validateEngagementQuery } from '../middleware/validation';
import { sessionCreationRateLimit, apiRateLimit } from '../middleware/rateLimit';

export const sessionRoutes = Router();

// Create new session
sessionRoutes.post('/', sessionCreationRateLimit, validateCreateSession, async (req, res, next) => {
  try {
    const { hostId, shareType, remoteControlEnabled, maxViewers, redirectUrl } = req.body;
    
    const sessionId = generateSessionId();
    const session: Session = {
      id: sessionId,
      hostId,
      shareType,
      status: 'active',
      createdAt: new Date(),
      remoteControlEnabled: remoteControlEnabled || false,
      maxViewers,
      redirectUrl,
    };

    // Try to save to database if available, but don't fail if DB is not configured
    if (process.env.DATABASE_URL && pool) {
      try {
        await pool.query(
          `INSERT INTO sessions (id, host_id, share_type, status, remote_control_enabled, max_viewers, redirect_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            session.id,
            session.hostId,
            session.shareType,
            session.status,
            session.remoteControlEnabled,
            session.maxViewers,
            session.redirectUrl,
          ]
        );
      } catch (dbError) {
        // Log but don't fail - session can work without database
        console.warn('Could not save session to database (continuing without DB):', dbError instanceof Error ? dbError.message : String(dbError));
      }
    }

    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

// Get session by ID
sessionRoutes.get('/:sessionId', apiRateLimit, validateSessionId, async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    
    // If database is not available, return a basic session object
    if (!process.env.DATABASE_URL || !pool) {
      return res.json({
        id: sessionId,
        status: 'active',
        // Return minimal session info when DB is not available
      });
    }
    
    try {
      const result = await pool.query(
        `SELECT * FROM sessions WHERE id = $1`,
        [sessionId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const session = result.rows[0];
      res.json(session);
    } catch (dbError) {
      // If database query fails, return basic session info
      console.warn('Could not fetch session from database (returning basic info):', dbError instanceof Error ? dbError.message : String(dbError));
      res.json({
        id: sessionId,
        status: 'active',
      });
    }
  } catch (error) {
    next(error);
  }
});

// Update session
sessionRoutes.patch('/:sessionId', apiRateLimit, validateSessionId, validateUpdateSession, async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const updates = req.body;
    
    const allowedFields = ['status', 'remoteControlEnabled', 'maxViewers', 'redirectUrl', 'recordingId'];
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        const dbKey = key === 'remoteControlEnabled' ? 'remote_control_enabled' :
                      key === 'maxViewers' ? 'max_viewers' :
                      key === 'redirectUrl' ? 'redirect_url' :
                      key === 'recordingId' ? 'recording_id' : key;
        updateFields.push(`${dbKey} = $${paramCount++}`);
        values.push(value);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    if (updates.status === 'ended') {
      updateFields.push(`ended_at = $${paramCount++}`);
      values.push(new Date());
    }

    values.push(sessionId);

    await pool.query(
      `UPDATE sessions SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount}`,
      values
    );

    const result = await pool.query(`SELECT * FROM sessions WHERE id = $1`, [sessionId]);
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Get session viewers
sessionRoutes.get('/:sessionId/viewers', apiRateLimit, validateSessionId, async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    
    // If database is not available, return empty array (viewers tracked in WebSocket connections)
    if (!process.env.DATABASE_URL || !pool) {
      return res.json([]);
    }
    
    try {
      const result = await pool.query(
        `SELECT * FROM viewers WHERE session_id = $1 ORDER BY joined_at DESC`,
        [sessionId]
      );
      res.json(result.rows);
    } catch (dbError) {
      // If database query fails, return empty array instead of error
      console.warn('Could not fetch viewers from database (returning empty):', dbError instanceof Error ? dbError.message : String(dbError));
      res.json([]);
    }
  } catch (error) {
    next(error);
  }
});

// Get session engagement events
sessionRoutes.get('/:sessionId/engagement', apiRateLimit, validateSessionId, validateEngagementQuery, async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const limit = (req.query.limit as number | undefined) || 100;
    
    const result = await pool.query(
      `SELECT * FROM engagement_events 
       WHERE session_id = $1 
       ORDER BY timestamp DESC 
       LIMIT $2`,
      [sessionId, limit]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

