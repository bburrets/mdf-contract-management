import { query } from './db';
import fs from 'fs/promises';
import path from 'path';

export interface Migration {
  filename: string;
  version: number;
  executed: boolean;
}

// Create migrations tracking table
export async function createMigrationsTable(): Promise<void> {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT UNIQUE NOT NULL,
      version INTEGER NOT NULL,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_migrations_version ON migrations(version);
  `;
  
  await query(createTableSQL);
}

// Get list of executed migrations
export async function getExecutedMigrations(): Promise<Migration[]> {
  await createMigrationsTable();
  
  const result = await query(`
    SELECT filename, version, true as executed
    FROM migrations
    ORDER BY version ASC
  `);
  
  return result.rows;
}

// Get available migration files
export async function getAvailableMigrations(): Promise<string[]> {
  const migrationsDir = path.join(process.cwd(), 'migrations');
  
  try {
    const files = await fs.readdir(migrationsDir);
    return files
      .filter(file => file.endsWith('.sql'))
      .sort();
  } catch {
    console.warn('Migrations directory not found, creating...');
    await fs.mkdir(migrationsDir, { recursive: true });
    return [];
  }
}

// Execute a single migration
export async function executeMigration(filename: string): Promise<void> {
  const migrationsDir = path.join(process.cwd(), 'migrations');
  const filePath = path.join(migrationsDir, filename);
  
  try {
    const migrationSQL = await fs.readFile(filePath, 'utf-8');
    
    // Extract version number from filename (e.g., 001_create_users.sql -> 1)
    const versionMatch = filename.match(/^(\d+)_/);
    const version = versionMatch ? parseInt(versionMatch[1], 10) : 0;
    
    // Execute migration in a transaction
    await query('BEGIN');
    
    try {
      // Execute the migration SQL
      await query(migrationSQL);
      
      // Record the migration as executed
      await query(
        'INSERT INTO migrations (filename, version) VALUES ($1, $2)',
        [filename, version]
      );
      
      await query('COMMIT');
      console.log(`Migration ${filename} executed successfully`);
      
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error(`Failed to execute migration ${filename}:`, error);
    throw error;
  }
}

// Run all pending migrations
export async function runMigrations(): Promise<void> {
  try {
    const executed = await getExecutedMigrations();
    const available = await getAvailableMigrations();
    const executedFilenames = new Set(executed.map(m => m.filename));
    
    const pending = available.filter(filename => !executedFilenames.has(filename));
    
    if (pending.length === 0) {
      console.log('No pending migrations');
      return;
    }
    
    console.log(`Running ${pending.length} migrations...`);
    
    for (const filename of pending) {
      await executeMigration(filename);
    }
    
    console.log('All migrations completed successfully');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Check migration status
export async function getMigrationStatus(): Promise<{
  executed: Migration[];
  pending: string[];
}> {
  const executed = await getExecutedMigrations();
  const available = await getAvailableMigrations();
  const executedFilenames = new Set(executed.map(m => m.filename));
  
  const pending = available.filter(filename => !executedFilenames.has(filename));
  
  return { executed, pending };
}