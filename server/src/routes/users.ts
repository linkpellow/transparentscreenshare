/**
 * User management routes
 */

import { Router } from 'express';
import { pool } from '../database';
import { v4 as uuidv4 } from 'uuid';

export const userRoutes = Router();

// Create user
userRoutes.post('/', async (req, res, next) => {
  try {
    const { email, name, role, teamId } = req.body;
    const userId = uuidv4();
    
    await pool.query(
      `INSERT INTO users (id, email, name, role, team_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, email, name, role || 'user', teamId]
    );

    res.status(201).json({ userId });
  } catch (error) {
    next(error);
  }
});

// Get user by ID
userRoutes.get('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(
      `SELECT * FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Get user sessions
userRoutes.get('/:userId/sessions', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;
    
    const result = await pool.query(
      `SELECT * FROM sessions 
       WHERE host_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

