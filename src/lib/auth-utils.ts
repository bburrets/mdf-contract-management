import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { UserRole } from '../types/database';

// Server-side session utilities
export async function getAuthSession() {
  return await getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getAuthSession();
  
  if (!session?.user) {
    throw new Error('Authentication required');
  }
  
  return session;
}

export async function requireRole(requiredRole: UserRole | UserRole[]) {
  const session = await requireAuth();
  const userRole = session.user.role;
  
  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  
  // Admin has access to everything
  if (userRole === 'admin') {
    return session;
  }
  
  if (!allowedRoles.includes(userRole)) {
    throw new Error(`Access denied. Required role: ${allowedRoles.join(' or ')}`);
  }
  
  return session;
}

// Role hierarchy helper
export function canAccess(userRole: UserRole, requiredRole: UserRole): boolean {
  // Admin can access everything
  if (userRole === 'admin') return true;
  
  // Finance can access operations content
  if (userRole === 'finance' && requiredRole === 'operations') return true;
  
  // Direct role match
  return userRole === requiredRole;
}

// Role checking utilities
export const roleHierarchy: Record<UserRole, UserRole[]> = {
  admin: ['admin', 'finance', 'operations'],
  finance: ['finance', 'operations'],
  operations: ['operations']
};

export function hasPermission(userRole: UserRole, requiredPermission: UserRole): boolean {
  return roleHierarchy[userRole]?.includes(requiredPermission) ?? false;
}

// Client-side role utilities (for use with useSession)
export function canUserAccess(userRole: UserRole | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false;
  return canAccess(userRole, requiredRole);
}