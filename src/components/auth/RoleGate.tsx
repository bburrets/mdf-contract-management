'use client';

import { useSession } from 'next-auth/react';
import { UserRole } from '../../types/database';
import { canUserAccess } from '../../lib/auth-utils';

interface RoleGateProps {
  children: React.ReactNode;
  requiredRole: UserRole;
  fallback?: React.ReactNode;
}

export default function RoleGate({ children, requiredRole, fallback = null }: RoleGateProps) {
  const { data: session } = useSession();

  if (!session?.user) {
    return fallback;
  }

  if (!canUserAccess(session.user.role, requiredRole)) {
    return fallback;
  }

  return <>{children}</>;
}