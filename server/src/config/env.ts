/**
 * Environment variable validation and configuration
 */

import dotenv from 'dotenv';
import { z } from 'zod';
import { logger } from '../middleware/logging';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().regex(/^\d+$/).transform(Number).default('3000'),
  HOST: z.string().default('0.0.0.0'),
  
  // Database
  DATABASE_URL: z.string().url().optional(),
  DB_HOST: z.string().optional(),
  DB_PORT: z.string().regex(/^\d+$/).optional(),
  DB_NAME: z.string().optional(),
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  DB_POOL_MAX: z.string().regex(/^\d+$/).optional(),
  DB_POOL_MIN: z.string().regex(/^\d+$/).optional(),
  
  // AWS S3
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET_NAME: z.string().default('usha-recordings'),
  
  // CORS
  ALLOWED_ORIGINS: z.string().optional(),
  
  // App URL
  APP_URL: z.string().url().optional(),
  
  // Recording storage
  RECORDING_STORAGE_PATH: z.string().default('./recordings'),
  
  // JWT (optional for now)
  JWT_SECRET: z.string().optional(),
  JWT_EXPIRES_IN: z.string().default('7d'),
});

type Env = z.infer<typeof envSchema>;

let validatedEnv: Env;

try {
  validatedEnv = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    logger.error('Environment variable validation failed', undefined, {
      errors: error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    
    // In production, exit on validation failure
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
  throw error;
}

// Validate required variables for production
if (validatedEnv.NODE_ENV === 'production') {
  const required = ['DATABASE_URL'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    logger.error('Missing required environment variables for production', undefined, {
      missing,
    });
    process.exit(1);
  }
}

export const env = validatedEnv;

