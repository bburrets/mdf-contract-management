import pkg from 'pg';
import fs from 'fs/promises';
import path from 'path';

const { Client } = pkg;

// Load environment variables from .env.local
import { config } from 'dotenv';
config({ path: '.env.local' });

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'mdf_system',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || ''
};

async function runMigrations() {
  const client = new Client(dbConfig);
  
  try {
    console.log('Connecting to database...');
    await client.connect();
    
    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT UNIQUE NOT NULL,
        version INTEGER NOT NULL,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_migrations_version ON migrations(version);
    `);
    
    // Get executed migrations
    const executed = await client.query('SELECT filename FROM migrations ORDER BY version ASC');
    const executedFiles = new Set(executed.rows.map(row => row.filename));
    
    // Get available migration files
    const migrationsDir = path.join(process.cwd(), 'migrations');
    const files = await fs.readdir(migrationsDir);
    const migrationFiles = files
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    // Find pending migrations
    const pendingFiles = migrationFiles.filter(file => !executedFiles.has(file));
    
    if (pendingFiles.length === 0) {
      console.log('No pending migrations');
      return;
    }
    
    console.log(`Running ${pendingFiles.length} migrations...`);
    
    for (const filename of pendingFiles) {
      console.log(`Executing migration: ${filename}`);
      
      const filePath = path.join(migrationsDir, filename);
      const migrationSQL = await fs.readFile(filePath, 'utf-8');
      
      // Extract version number from filename
      const versionMatch = filename.match(/^(\\d+)_/);
      const version = versionMatch ? parseInt(versionMatch[1], 10) : 0;
      
      // Execute migration in a transaction
      await client.query('BEGIN');
      
      try {
        // Execute the migration SQL
        await client.query(migrationSQL);
        
        // Record the migration as executed
        await client.query(
          'INSERT INTO migrations (filename, version) VALUES ($1, $2)',
          [filename, version]
        );
        
        await client.query('COMMIT');
        console.log(`✓ Migration ${filename} executed successfully`);
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
    
    console.log('All migrations completed successfully');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();