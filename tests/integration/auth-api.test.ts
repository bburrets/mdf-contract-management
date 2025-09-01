import { describe, it, expect } from 'vitest';
import { testApiHandler } from 'next-test-api-route-handler';
import * as usersHandler from '../../src/app/api/users/route';
import * as userByIdHandler from '../../src/app/api/users/[id]/route';
import * as currentUserHandler from '../../src/app/api/users/me/route';

// Mock the auth utilities to return different user sessions
const mockSessions = {
  admin: {
    user: {
      id: 'admin_001',
      email: 'admin@arkansas.gov',
      full_name: 'Admin User',
      role: 'admin',
      is_active: true
    }
  },
  operations: {
    user: {
      id: 'ops_001',
      email: 'ops@arkansas.gov',
      full_name: 'Operations User',
      role: 'operations',
      is_active: true
    }
  },
  finance: {
    user: {
      id: 'fin_001',
      email: 'finance@arkansas.gov',
      full_name: 'Finance User',
      role: 'finance',
      is_active: true
    }
  }
};

let currentMockUser: keyof typeof mockSessions = 'admin';

// Mock auth utilities
vi.mock('../../src/lib/auth-utils', () => ({
  requireAuth: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSessions[currentMockUser]);
  }),
  requireRole: vi.fn().mockImplementation((role: string) => {
    const session = mockSessions[currentMockUser];
    if (role === 'admin' && session.user.role !== 'admin') {
      throw new Error('Access denied. Required role: admin');
    }
    return Promise.resolve(session);
  })
}));

// Mock user service functions
vi.mock('../../src/lib/users', () => ({
  createUser: vi.fn().mockImplementation(async (userData: { email: string; full_name: string; role?: string }) => ({
    user_id: 'new_user_123',
    email: userData.email,
    full_name: userData.full_name,
    role: userData.role || 'operations',
    is_active: true,
    created_at: '2025-08-31T00:00:00.000Z',
    last_login: null
  })),
  getAllUsers: vi.fn().mockResolvedValue([
    {
      user_id: 'user_001',
      email: 'user1@arkansas.gov',
      full_name: 'User One',
      role: 'operations',
      is_active: true,
      created_at: '2025-08-31T00:00:00.000Z',
      last_login: null
    }
  ]),
  getUserById: vi.fn().mockImplementation(async (id: string) => {
    if (id === 'ops_001') {
      return {
        user_id: 'ops_001',
        email: 'ops@arkansas.gov',
        full_name: 'Operations User',
        role: 'operations',
        is_active: true,
        created_at: '2025-08-31T00:00:00.000Z',
        last_login: null
      };
    }
    return null;
  }),
  updateUser: vi.fn().mockResolvedValue({
    user_id: 'ops_001',
    email: 'ops@arkansas.gov',
    full_name: 'Updated User',
    role: 'operations',
    is_active: true,
    created_at: '2025-08-31T00:00:00.000Z',
    last_login: null
  }),
  changePassword: vi.fn().mockResolvedValue(true),
  deactivateUser: vi.fn().mockResolvedValue(true)
}));

describe('Authentication API Routes', () => {
  
  describe('/api/users', () => {
    it('should allow admin to create new user', async () => {
      currentMockUser = 'admin';
      
      await testApiHandler({
        appHandler: usersHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'newuser@arkansas.gov',
              password: 'password123',
              full_name: 'New User',
              role: 'operations'
            })
          });

          expect(res.status).toBe(201);
          const data = await res.json();
          expect(data.success).toBe(true);
          expect(data.data.email).toBe('newuser@arkansas.gov');
        }
      });
    });

    it('should deny non-admin user creation', async () => {
      currentMockUser = 'operations';
      
      await testApiHandler({
        appHandler: usersHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'newuser@arkansas.gov',
              password: 'password123',
              full_name: 'New User'
            })
          });

          expect(res.status).toBe(403);
          const data = await res.json();
          expect(data.success).toBe(false);
          expect(data.error).toBe('Access denied');
        }
      });
    });

    it('should validate required fields for user creation', async () => {
      currentMockUser = 'admin';
      
      await testApiHandler({
        appHandler: usersHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'invalid-email',
              password: '123', // Too short
              full_name: ''     // Empty
            })
          });

          expect(res.status).toBe(400);
          const data = await res.json();
          expect(data.success).toBe(false);
          expect(data.error).toBe('Validation failed');
          expect(data.details).toBeDefined();
        }
      });
    });

    it('should allow admin to list all users', async () => {
      currentMockUser = 'admin';
      
      await testApiHandler({
        appHandler: usersHandler,
        test: async ({ fetch }) => {
          const res = await fetch({ method: 'GET' });

          expect(res.status).toBe(200);
          const data = await res.json();
          expect(data.success).toBe(true);
          expect(Array.isArray(data.data)).toBe(true);
        }
      });
    });

    it('should deny non-admin from listing users', async () => {
      currentMockUser = 'operations';
      
      await testApiHandler({
        appHandler: usersHandler,
        test: async ({ fetch }) => {
          const res = await fetch({ method: 'GET' });

          expect(res.status).toBe(403);
          const data = await res.json();
          expect(data.success).toBe(false);
          expect(data.error).toBe('Access denied');
        }
      });
    });
  });

  describe('/api/users/[id]', () => {
    it('should allow user to view their own profile', async () => {
      currentMockUser = 'operations';
      
      await testApiHandler({
        appHandler: userByIdHandler,
        params: { id: 'ops_001' },
        test: async ({ fetch }) => {
          const res = await fetch({ method: 'GET' });

          expect(res.status).toBe(200);
          const data = await res.json();
          expect(data.success).toBe(true);
          expect(data.data.user_id).toBe('ops_001');
        }
      });
    });

    it('should allow user to update their own profile', async () => {
      currentMockUser = 'operations';
      
      await testApiHandler({
        appHandler: userByIdHandler,
        params: { id: 'ops_001' },
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              full_name: 'Updated Name'
            })
          });

          expect(res.status).toBe(200);
          const data = await res.json();
          expect(data.success).toBe(true);
          expect(data.data.full_name).toBe('Updated User');
        }
      });
    });

    it('should allow user to change their own password', async () => {
      currentMockUser = 'operations';
      
      await testApiHandler({
        appHandler: userByIdHandler,
        params: { id: 'ops_001' },
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'changePassword',
              newPassword: 'newpassword123'
            })
          });

          expect(res.status).toBe(200);
          const data = await res.json();
          expect(data.success).toBe(true);
          expect(data.message).toBe('Password changed successfully');
        }
      });
    });

    it('should prevent non-admin from changing role', async () => {
      currentMockUser = 'operations';
      
      await testApiHandler({
        appHandler: userByIdHandler,
        params: { id: 'ops_001' },
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              role: 'admin'
            })
          });

          expect(res.status).toBe(403);
          const data = await res.json();
          expect(data.success).toBe(false);
          expect(data.error).toContain('Cannot update fields');
        }
      });
    });

    it('should prevent user from accessing other profiles', async () => {
      currentMockUser = 'operations';
      
      await testApiHandler({
        appHandler: userByIdHandler,
        params: { id: 'different_user_123' },
        test: async ({ fetch }) => {
          const res = await fetch({ method: 'GET' });

          expect(res.status).toBe(403);
          const data = await res.json();
          expect(data.success).toBe(false);
          expect(data.error).toBe('Access denied');
        }
      });
    });
  });

  describe('/api/users/me', () => {
    it('should return current user profile', async () => {
      currentMockUser = 'operations';
      
      await testApiHandler({
        appHandler: currentUserHandler,
        test: async ({ fetch }) => {
          const res = await fetch({ method: 'GET' });

          expect(res.status).toBe(200);
          const data = await res.json();
          expect(data.success).toBe(true);
          expect(data.data.user_id).toBe('ops_001');
        }
      });
    });
  });
});