import { NextResponse } from 'next/server';
import { runMigrations, getMigrationStatus } from '@/lib/migrations';

export async function POST() {
  try {
    console.log('Starting database migrations...');
    await runMigrations();
    
    const status = await getMigrationStatus();
    
    return NextResponse.json({
      success: true,
      message: 'Migrations completed successfully',
      executed: status.executed.length,
      pending: status.pending.length
    });
  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Migration failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const status = await getMigrationStatus();
    
    return NextResponse.json({
      success: true,
      executed: status.executed,
      pending: status.pending
    });
  } catch (error) {
    console.error('Failed to get migration status:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to get migration status',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}