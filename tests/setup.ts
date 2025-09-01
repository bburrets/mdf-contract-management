import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Setup for Vitest tests
// Add any global test setup here

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { src: string; alt: string }) => {
    return React.createElement('img', { src, alt, ...props });
  },
}));

// Mock environment variables for tests
Object.assign(process.env, {
  NODE_ENV: 'test',
  NEXTAUTH_SECRET: 'test-secret-at-least-32-characters-long',
  NEXTAUTH_URL: 'http://localhost:3000',
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_NAME: 'mdf_system_test',
  DB_USER: 'test',
  DB_PASSWORD: 'test'
});