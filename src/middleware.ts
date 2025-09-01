import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Allow access to public routes
    const publicRoutes = ['/', '/auth/signin', '/auth/error'];
    if (publicRoutes.includes(pathname)) {
      return NextResponse.next();
    }

    // Redirect unauthenticated users to sign-in
    if (!token) {
      const signInUrl = new URL('/auth/signin', req.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Check for inactive users
    if (!token.is_active) {
      const errorUrl = new URL('/auth/error', req.url);
      errorUrl.searchParams.set('error', 'AccessDenied');
      return NextResponse.redirect(errorUrl);
    }

    // Role-based access control
    const role = token.role as string;
    
    // Admin routes (admin only)
    if (pathname.startsWith('/admin') && role !== 'admin') {
      const errorUrl = new URL('/auth/error', req.url);
      errorUrl.searchParams.set('error', 'AccessDenied');
      return NextResponse.redirect(errorUrl);
    }

    // Finance routes (finance and admin)
    if (pathname.startsWith('/finance') && !['finance', 'admin'].includes(role)) {
      const errorUrl = new URL('/auth/error', req.url);
      errorUrl.searchParams.set('error', 'AccessDenied');
      return NextResponse.redirect(errorUrl);
    }

    // Operations routes (operations, finance, and admin)
    if (pathname.startsWith('/operations') && !['operations', 'finance', 'admin'].includes(role)) {
      const errorUrl = new URL('/auth/error', req.url);
      errorUrl.searchParams.set('error', 'AccessDenied');
      return NextResponse.redirect(errorUrl);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - api/health (health check)
     * - api/admin (admin endpoints for migrations, etc.)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api/auth|api/health|api/admin|_next/static|_next/image|favicon.ico|public/).*)',
  ],
};