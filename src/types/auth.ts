// Authentication type definitions
// Story 1.2: Basic User Authentication System

import { UserRole } from './database';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthSession {
  user: AuthUser;
  expires: string;
}

export interface AuthError {
  code: string;
  message: string;
}

// NextAuth.js module augmentation to extend default session
declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
    is_active: boolean;
  }
  
  interface Session {
    user: AuthUser;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    uid: string;
    role: UserRole;
    full_name: string;
    is_active: boolean;
  }
}