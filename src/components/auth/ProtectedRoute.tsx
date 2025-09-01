'use client';

import { useSession } from 'next-auth/react';
import { UserRole } from '../../types/database';
import { canUserAccess } from '../../lib/auth-utils';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  requiredRole,
  fallback,
  redirectTo = '/auth/signin'
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push(redirectTo);
      return;
    }

    if (requiredRole && !canUserAccess(session.user.role, requiredRole)) {
      router.push('/auth/error?error=AccessDenied');
      return;
    }
  }, [session, status, requiredRole, router, redirectTo]);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Not authenticated
  if (!session) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">Please sign in to continue.</p>
        </div>
      </div>
    );
  }

  // Role check failed
  if (requiredRole && !canUserAccess(session.user.role, requiredRole)) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">
            You don&apos;t have permission to access this resource.
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Required role: {requiredRole}
          </p>
        </div>
      </div>
    );
  }

  // All checks passed
  return <>{children}</>;
}