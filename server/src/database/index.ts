/**
 * Database connection and initialization
 */

import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Database connection configuration with production-ready settings
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: parseInt(process.env.DB_POOL_MAX || '20', 10), // Maximum pool size
  min: parseInt(process.env.DB_POOL_MIN || '2', 10), // Minimum pool size
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection cannot be established
  statement_timeout: 30000, // Query timeout (30 seconds)
  query_timeout: 30000,
});

export async function initializeDatabase(): Promise<void> {
  try {
    // Test connection
    await pool.query('SELECT NOW()');
    
    // Create tables
    await createTables();
    
    // Log pool stats
    const poolStats = {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    };
    
    console.log('Database connection established', poolStats);
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

async function createTables(): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        team_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Teams table
    await client.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        plan VARCHAR(50) NOT NULL DEFAULT 'free',
        max_members INTEGER DEFAULT 10,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(255) PRIMARY KEY,
        host_id VARCHAR(255) NOT NULL REFERENCES users(id),
        share_type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        remote_control_enabled BOOLEAN DEFAULT FALSE,
        max_viewers INTEGER,
        redirect_url TEXT,
        recording_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        ended_at TIMESTAMP
      )
    `);

    // Viewers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS viewers (
        id VARCHAR(255) PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        user_agent TEXT,
        remote_control_enabled BOOLEAN DEFAULT FALSE,
        joined_at TIMESTAMP DEFAULT NOW(),
        last_activity TIMESTAMP DEFAULT NOW()
      )
    `);

    // Engagement events table
    await client.query(`
      CREATE TABLE IF NOT EXISTS engagement_events (
        id VARCHAR(255) PRIMARY KEY,
        viewer_id VARCHAR(255) NOT NULL REFERENCES viewers(id) ON DELETE CASCADE,
        session_id VARCHAR(255) NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        event_type VARCHAR(50) NOT NULL,
        event_data JSONB,
        timestamp TIMESTAMP DEFAULT NOW()
      )
    `);

    // Recordings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS recordings (
        id VARCHAR(255) PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        url TEXT NOT NULL,
        thumbnail_url TEXT,
        gif_preview_url TEXT,
        duration INTEGER NOT NULL,
        size BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP
      )
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_host_id ON sessions(host_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
      CREATE INDEX IF NOT EXISTS idx_viewers_session_id ON viewers(session_id);
      CREATE INDEX IF NOT EXISTS idx_engagement_session_id ON engagement_events(session_id);
      CREATE INDEX IF NOT EXISTS idx_recordings_session_id ON recordings(session_id);
    `);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export { pool };
export type { PoolClient };

