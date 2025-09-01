import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth-utils';
import { getUserById } from '../../../../lib/users';

// GET /api/users/me - Get current user profile
export async function GET() {
  try {
    const session = await requireAuth();
    
    const user = await getUserById(session.user.id);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: user
    });
    
  } catch (error) {
    console.error('Get current user error:', error);
    
    if (error instanceof Error && error.message.includes('Authentication required')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}