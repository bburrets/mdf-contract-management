// Temporary script to run migrations
import { runMigrations } from './src/lib/migrations.js';

async function main() {
  try {
    console.log('Running database migrations...');
    await runMigrations();
    console.log('Migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();