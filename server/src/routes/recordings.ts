/**
 * Recording management routes
 */

import { Router } from 'express';
import { pool } from '../database';
import { generateRecordingId } from '@usha/shared';
import { uploadToS3, generateSignedUrl } from '../services/storage';
import { processRecording } from '../services/recording';
import { validateRecordingId, validateRecordingUpload, validateSessionId } from '../middleware/validation';
import { apiRateLimit, recordingUploadRateLimit } from '../middleware/rateLimit';

export const recordingRoutes = Router();

// Get recording by ID
recordingRoutes.get('/:recordingId', apiRateLimit, validateRecordingId, async (req, res, next) => {
  try {
    const { recordingId } = req.params;
    
    const result = await pool.query(
      `SELECT * FROM recordings WHERE id = $1`,
      [recordingId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recording not found' });
    }

    const recording = result.rows[0];
    
    // Generate signed URL if needed
    if (recording.url) {
      recording.signedUrl = await generateSignedUrl(recording.url);
    }

    res.json(recording);
  } catch (error) {
    next(error);
  }
});

// List recordings for a session
recordingRoutes.get('/session/:sessionId', apiRateLimit, validateSessionId, async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    
    const result = await pool.query(
      `SELECT * FROM recordings WHERE session_id = $1 ORDER BY created_at DESC`,
      [sessionId]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Upload recording (handled by recording service)
recordingRoutes.post('/upload', recordingUploadRateLimit, validateRecordingUpload, async (req, res, next) => {
  try {
    const { sessionId, type, duration, size } = req.body;
    
    // This endpoint is called after recording processing
    // The actual file upload is handled by the recording service
    const recordingId = generateRecordingId();
    
    // Recording URL will be set after S3 upload
    await pool.query(
      `INSERT INTO recordings (id, session_id, type, url, duration, size)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [recordingId, sessionId, type, '', duration, size]
    );

    res.status(201).json({ recordingId });
  } catch (error) {
    next(error);
  }
});

// Delete recording
recordingRoutes.delete('/:recordingId', apiRateLimit, validateRecordingId, async (req, res, next) => {
  try {
    const { recordingId } = req.params;
    
    // Get recording URL for S3 deletion
    const result = await pool.query(
      `SELECT url FROM recordings WHERE id = $1`,
      [recordingId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recording not found' });
    }

    // Delete from S3 (implement S3 deletion)
    // await deleteFromS3(result.rows[0].url);

    // Delete from database
    await pool.query(`DELETE FROM recordings WHERE id = $1`, [recordingId]);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Generate shareable link
recordingRoutes.post('/:recordingId/share', apiRateLimit, validateRecordingId, async (req, res, next) => {
  try {
    const { recordingId } = req.params;
    const { expiresIn } = req.body; // in hours
    
    const result = await pool.query(
      `SELECT * FROM recordings WHERE id = $1`,
      [recordingId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recording not found' });
    }

    const recording = result.rows[0];
    const shareUrl = `${process.env.APP_URL || 'http://localhost:3000'}/recording/${recordingId}`;
    
    // Set expiration if provided
    if (expiresIn) {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresIn);
      
      await pool.query(
        `UPDATE recordings SET expires_at = $1 WHERE id = $2`,
        [expiresAt, recordingId]
      );
    }

    res.json({ shareUrl, expiresAt: recording.expiresAt });
  } catch (error) {
    next(error);
  }
});

