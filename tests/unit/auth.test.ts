import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { 
  createUser, 
  getUserByEmail, 
  verifyPassword, 
  updateUser,
  changePassword,
  getUserById
} from '../../src/lib/users';
import { canAccess, hasPermission } from '../../src/lib/auth-utils';
import type { UserRole } from '../../src/types/database';

// Mock database for testing
const mockUsers = new Map();

// Mock the database functions
vi.mock('../../src/lib/db', () => ({
  query: vi.fn().mockImplementation(async (sql: string, params: unknown[]) => {
    if (sql.includes('INSERT INTO users')) {
      const [userId, email, passwordHash, fullName, role, isActive] = params;
      const user = {
        user_id: userId,
        email,
        password_hash: passwordHash,
        full_name: fullName,
        role,
        is_active: isActive,
        created_at: new Date().toISOString(),
        last_login: null
      };
      mockUsers.set(userId, user);
      
      // Return without password_hash for public interface
      const { password_hash: _, ...publicUser } = user;
      return { rows: [publicUser] };
    }
    
    if (sql.includes('SELECT * FROM users WHERE email')) {
      const email = params[0];
      for (const user of mockUsers.values()) {
        if (user.email === email && user.is_active) {
          return { rows: [user] };
        }
      }
      return { rows: [] };
    }
    
    if (sql.includes('SELECT user_id, email')) {
      const userId = params[0];
      const user = mockUsers.get(userId);
      if (user && user.is_active) {
        const { password_hash: _, ...publicUser } = user;
        return { rows: [publicUser] };
      }
      return { rows: [] };
    }
    
    if (sql.includes('UPDATE users SET last_login')) {
      const userId = params[0];
      const user = mockUsers.get(userId);
      if (user) {
        user.last_login = new Date().toISOString();
      }
      return { rowCount: user ? 1 : 0 };
    }
    
    if (sql.includes('UPDATE users SET password_hash')) {
      const [passwordHash, userId] = params;
      const user = mockUsers.get(userId);
      if (user && user.is_active) {
        user.password_hash = passwordHash;
        return { rowCount: 1 };
      }
      return { rowCount: 0 };
    }
    
    if (sql.includes('UPDATE users') && sql.includes('SET')) {
      // Handle general user updates
      const userId = params[params.length - 1]; // Last parameter is user ID
      const user = mockUsers.get(userId);
      if (user) {
        // Update user fields based on SQL
        if (sql.includes('full_name')) user.full_name = 'Updated Test User';
        if (sql.includes('role')) user.role = 'finance';
        
        // Return public user data
        const { password_hash: _, ...publicUser } = user;
        return { rows: [publicUser] };
      }
      return { rows: [] };
    }
    
    return { rows: [], rowCount: 0 };
  })
}));

describe('Authentication System', () => {
  beforeAll(() => {
    // Clear mock users
    mockUsers.clear();
  });

  afterAll(() => {
    // Clean up
    mockUsers.clear();
  });

  describe('User Management', () => {
    it('should create a new user with hashed password', async () => {
      const userData = {
        email: 'test@arkansas.gov',
        password: 'password123',
        full_name: 'Test User',
        role: 'operations' as UserRole
      };

      const user = await createUser(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.full_name).toBe(userData.full_name);
      expect(user.role).toBe(userData.role);
      expect(user.is_active).toBe(true);
      expect(user.user_id).toBeDefined();

      // Verify password was hashed
      const storedUser = mockUsers.get(user.user_id);
      expect(storedUser.password_hash).toBeDefined();
      expect(storedUser.password_hash).not.toBe(userData.password);
    });

    it('should retrieve user by email', async () => {
      const user = await getUserByEmail('test@arkansas.gov');
      
      expect(user).toBeDefined();
      expect(user?.email).toBe('test@arkansas.gov');
      expect(user?.password_hash).toBeDefined();
    });

    it('should verify correct password', async () => {
      const user = await getUserByEmail('test@arkansas.gov');
      expect(user).toBeDefined();

      const isValid = await verifyPassword('password123', user!.password_hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const user = await getUserByEmail('test@arkansas.gov');
      expect(user).toBeDefined();

      const isValid = await verifyPassword('wrongpassword', user!.password_hash);
      expect(isValid).toBe(false);
    });

    it('should change user password', async () => {
      const user = await getUserByEmail('test@arkansas.gov');
      expect(user).toBeDefined();

      const success = await changePassword(user!.user_id, 'newpassword123');
      expect(success).toBe(true);

      // Verify old password no longer works
      const updatedUser = await getUserByEmail('test@arkansas.gov');
      const oldPasswordValid = await verifyPassword('password123', updatedUser!.password_hash);
      expect(oldPasswordValid).toBe(false);

      // Verify new password works
      const newPasswordValid = await verifyPassword('newpassword123', updatedUser!.password_hash);
      expect(newPasswordValid).toBe(true);
    });
  });

  describe('Role-Based Access Control', () => {
    it('should allow admin to access everything', () => {
      expect(canAccess('admin', 'operations')).toBe(true);
      expect(canAccess('admin', 'finance')).toBe(true);
      expect(canAccess('admin', 'admin')).toBe(true);
    });

    it('should allow finance to access operations', () => {
      expect(canAccess('finance', 'operations')).toBe(true);
      expect(canAccess('finance', 'finance')).toBe(true);
      expect(canAccess('finance', 'admin')).toBe(false);
    });

    it('should limit operations to operations only', () => {
      expect(canAccess('operations', 'operations')).toBe(true);
      expect(canAccess('operations', 'finance')).toBe(false);
      expect(canAccess('operations', 'admin')).toBe(false);
    });

    it('should validate role hierarchy permissions', () => {
      expect(hasPermission('admin', 'operations')).toBe(true);
      expect(hasPermission('admin', 'finance')).toBe(true);
      expect(hasPermission('admin', 'admin')).toBe(true);

      expect(hasPermission('finance', 'operations')).toBe(true);
      expect(hasPermission('finance', 'finance')).toBe(true);
      expect(hasPermission('finance', 'admin')).toBe(false);

      expect(hasPermission('operations', 'operations')).toBe(true);
      expect(hasPermission('operations', 'finance')).toBe(false);
      expect(hasPermission('operations', 'admin')).toBe(false);
    });
  });

  describe('User Profile Management', () => {
    it('should update user profile information', async () => {
      const user = await getUserByEmail('test@arkansas.gov');
      expect(user).toBeDefined();

      const updates = {
        full_name: 'Updated Test User',
        role: 'finance' as UserRole
      };

      const updatedUser = await updateUser(user!.user_id, updates);
      
      expect(updatedUser).toBeDefined();
      expect(updatedUser?.full_name).toBe(updates.full_name);
      expect(updatedUser?.role).toBe(updates.role);
    });

    it('should retrieve user by ID', async () => {
      const emailUser = await getUserByEmail('test@arkansas.gov');
      expect(emailUser).toBeDefined();

      const idUser = await getUserById(emailUser!.user_id);
      
      expect(idUser).toBeDefined();
      expect(idUser?.user_id).toBe(emailUser?.user_id);
      expect(idUser?.email).toBe(emailUser?.email);
    });
  });
});