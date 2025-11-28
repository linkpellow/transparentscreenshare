/**
 * Recording service for processing and storing recordings
 */

import ffmpeg from 'fluent-ffmpeg';
import { uploadToS3 } from './storage';
import { pool } from '../database';
import path from 'path';
import fs from 'fs';
import { logger } from '../middleware/logging';

// Maximum file size: 10GB
const MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024;
// Maximum duration: 24 hours
const MAX_DURATION = 24 * 60 * 60;

const RECORDING_STORAGE_PATH = process.env.RECORDING_STORAGE_PATH || './recordings';

// Ensure recording directory exists
if (!fs.existsSync(RECORDING_STORAGE_PATH)) {
  fs.mkdirSync(RECORDING_STORAGE_PATH, { recursive: true });
}

export async function processRecording(
  recordingId: string,
  inputPath: string,
  sessionId: string,
  type: 'screen' | 'webcam' | 'both'
): Promise<void> {
  try {
    // Validate file exists and size
    if (!fs.existsSync(inputPath)) {
      throw new Error('Recording file not found');
    }
    
    const fileStats = fs.statSync(inputPath);
    if (fileStats.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024 * 1024)}GB`);
    }
    
    // Process video: compress, generate thumbnail, create GIF preview
    const outputPath = path.join(RECORDING_STORAGE_PATH, `${recordingId}.webm`);
    const thumbnailPath = path.join(RECORDING_STORAGE_PATH, `${recordingId}_thumb.jpg`);
    const gifPath = path.join(RECORDING_STORAGE_PATH, `${recordingId}_preview.gif`);

    // Get video duration and size
    const metadata = await getVideoMetadata(inputPath);
    
    // Validate duration
    if (metadata.duration > MAX_DURATION) {
      throw new Error(`Recording duration exceeds maximum allowed duration of ${MAX_DURATION / 3600} hours`);
    }
    
    // Compress video
    await compressVideo(inputPath, outputPath);
    
    // Generate thumbnail
    await generateThumbnail(inputPath, thumbnailPath);
    
    // Generate GIF preview
    await generateGifPreview(inputPath, gifPath);

    // Upload to S3
    const videoUrl = await uploadToS3(outputPath, `recordings/${recordingId}.webm`, 'video/webm');
    const thumbnailUrl = await uploadToS3(thumbnailPath, `recordings/${recordingId}_thumb.jpg`, 'image/jpeg');
    const gifUrl = await uploadToS3(gifPath, `recordings/${recordingId}_preview.gif`, 'image/gif');

    // Update recording in database
    await pool.query(
      `UPDATE recordings 
       SET url = $1, thumbnail_url = $2, gif_preview_url = $3, duration = $4, size = $5
       WHERE id = $6`,
      [
        videoUrl,
        thumbnailUrl,
        gifUrl,
        metadata.duration,
        fs.statSync(outputPath).size,
        recordingId,
      ]
    );

    // Clean up local files
    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);
    fs.unlinkSync(thumbnailPath);
    fs.unlinkSync(gifPath);

  } catch (error) {
    logger.error('Error processing recording', error as Error, {
      recordingId,
      sessionId,
      type,
    });
    throw error;
  }
}

function getVideoMetadata(filePath: string): Promise<{ duration: number }> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        resolve({ duration: Math.floor(metadata.format?.duration || 0) });
      }
    });
  });
}

function compressVideo(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libvpx-vp9')
      .audioCodec('libopus')
      .outputOptions(['-crf 30', '-b:v 0'])
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .save(outputPath);
  });
}

function generateThumbnail(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .screenshots({
        timestamps: ['00:00:01'],
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
        size: '1280x720',
      })
      .on('end', () => resolve())
      .on('error', (err) => reject(err));
  });
}

function generateGifPreview(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-vf', 'fps=10,scale=320:-1:flags=lanczos',
        '-t', '5', // 5 second preview
      ])
      .format('gif')
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .save(outputPath);
  });
}

