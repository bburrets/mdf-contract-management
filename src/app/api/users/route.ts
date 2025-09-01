import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  createUser, 
  getAllUsers 
} from '../../../lib/users';
import { requireRole } from '../../../lib/auth-utils';

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(1),
  role: z.enum(['operations', 'finance', 'admin']).default('operations')
});

// GET /api/users - List all users (admin only)
export async function GET() {
  try {
    await requireRole('admin');
    
    const users = await getAllUsers();
    
    return NextResponse.json({
      success: true,
      data: users
    });
    
  } catch (error) {
    console.error('Get users error:', error);
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create new user (admin only)
export async function POST(request: NextRequest) {
  try {
    await requireRole('admin');
    
    const body = await request.json();
    const validatedData = createUserSchema.parse(body);
    
    const user = await createUser(validatedData);
    
    return NextResponse.json({
      success: true,
      data: user
    }, { status: 201 });
    
  } catch (error) {
    console.error('Create user error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: error.issues
        },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      if (error.message.includes('Access denied')) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        );
      }
      
      if (error.message.includes('duplicate key')) {
        return NextResponse.json(
          { success: false, error: 'Email already exists' },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  }
}