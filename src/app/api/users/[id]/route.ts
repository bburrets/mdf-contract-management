import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  getUserById, 
  updateUser, 
  deactivateUser,
  changePassword
} from '../../../../lib/users';
import { requireRole, requireAuth } from '../../../../lib/auth-utils';

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  full_name: z.string().min(1).optional(),
  role: z.enum(['operations', 'finance', 'admin']).optional(),
  is_active: z.boolean().optional()
});

const changePasswordSchema = z.object({
  newPassword: z.string().min(8)
});

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/users/[id] - Get user by ID (admin or self)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id } = params;
    
    // Users can view their own profile, admins can view anyone
    if (session.user.role !== 'admin' && session.user.id !== id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }
    
    const user = await getUserById(id);
    
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
    console.error('Get user error:', error);
    
    if (error instanceof Error && error.message.includes('Authentication required')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PATCH /api/users/[id] - Update user (admin or self for limited fields)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id } = params;
    const body = await request.json();
    
    // Parse the action if provided
    const { action, ...updateData } = body;
    
    // Handle password change action
    if (action === 'changePassword') {
      const validatedData = changePasswordSchema.parse(updateData);
      
      // Users can change their own password, admins can change anyone's
      if (session.user.role !== 'admin' && session.user.id !== id) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        );
      }
      
      const success = await changePassword(id, validatedData.newPassword);
      
      if (!success) {
        return NextResponse.json(
          { success: false, error: 'Failed to change password' },
          { status: 400 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Password changed successfully'
      });
    }
    
    // Regular user update
    const validatedData = updateUserSchema.parse(updateData);
    
    // Users can update their own profile (limited fields)
    if (session.user.id === id) {
      // Non-admin users can only update their own name and email
      if (session.user.role !== 'admin') {
        const allowedFields = ['email', 'full_name'];
        const restrictedFields = Object.keys(validatedData).filter(
          key => !allowedFields.includes(key)
        );
        
        if (restrictedFields.length > 0) {
          return NextResponse.json(
            { 
              success: false, 
              error: `Cannot update fields: ${restrictedFields.join(', ')}. Admin access required.`
            },
            { status: 403 }
          );
        }
      }
    } else if (session.user.role !== 'admin') {
      // Only admins can update other users
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }
    
    const updatedUser = await updateUser(id, validatedData);
    
    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: updatedUser
    });
    
  } catch (error) {
    console.error('Update user error:', error);
    
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
      if (error.message.includes('Authentication required')) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
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
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Deactivate user (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole('admin');
    const { id } = params;
    
    const success = await deactivateUser(id);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'User deactivated successfully'
    });
    
  } catch (error) {
    console.error('Deactivate user error:', error);
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to deactivate user' },
      { status: 500 }
    );
  }
}