/**
 * Viewer management routes
 */

import { Router } from 'express';
import { pool } from '../database';
import { generateViewerId } from '@usha/shared';

export const viewerRoutes = Router();

// Register viewer
viewerRoutes.post('/', async (req, res, next) => {
  try {
    const { sessionId, userAgent, remoteControlEnabled } = req.body;
    
    const viewerId = generateViewerId();
    
    await pool.query(
      `INSERT INTO viewers (id, session_id, user_agent, remote_control_enabled)
       VALUES ($1, $2, $3, $4)`,
      [viewerId, sessionId, userAgent, remoteControlEnabled || false]
    );

    res.status(201).json({ viewerId });
  } catch (error) {
    next(error);
  }
});

// Update viewer activity
viewerRoutes.patch('/:viewerId/activity', async (req, res, next) => {
  try {
    const { viewerId } = req.params;
    
    await pool.query(
      `UPDATE viewers SET last_activity = NOW() WHERE id = $1`,
      [viewerId]
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Get viewer by ID
viewerRoutes.get('/:viewerId', async (req, res, next) => {
  try {
    const { viewerId } = req.params;
    
    const result = await pool.query(
      `SELECT * FROM viewers WHERE id = $1`,
      [viewerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Viewer not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

