/**
 * Video projector mode routes
 */

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const upload = multer({
  dest: './uploads/videos',
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'));
    }
  },
});

export const projectorRoutes = Router();

// Upload video for projector mode
projectorRoutes.post('/upload', upload.single('video'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    // Upload to S3 (similar to recording upload)
    // For now, return local file path
    const videoUrl = `/api/projector/videos/${req.file.filename}`;
    
    res.json({
      videoId: req.file.filename,
      videoUrl,
      size: req.file.size,
    });
  } catch (error) {
    next(error);
  }
});

// Get video by ID
projectorRoutes.get('/videos/:videoId', (req, res, next) => {
  try {
    const { videoId } = req.params;
    const filePath = path.join('./uploads/videos', videoId);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.sendFile(path.resolve(filePath));
  } catch (error) {
    next(error);
  }
});

// List available videos for user
projectorRoutes.get('/videos', async (req, res, next) => {
  try {
    const { userId } = req.query;
    
    // List videos from S3 or database
    // For now, return empty list
    res.json({ videos: [] });
  } catch (error) {
    next(error);
  }
});

