import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes
const protectedRoutes = [
  '/calendars',
  '/import',
  '/jobs',
  '/settings',
];

// Define auth routes
const authRoutes = [
  '/auth/install',
  '/auth/callback',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to auth routes and public assets
  if (
    authRoutes.some(route => pathname.startsWith(route)) ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname === '/' ||
    pathname.startsWith('/favicon') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.svg')
  ) {
    return NextResponse.next();
  }

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    // In a real app, you'd check for valid session/token here
    // For now, we'll allow all requests but you would implement:
    // 1. Check for valid session cookie
    // 2. Verify JWT token
    // 3. Check database for valid tenant/location access
    // 4. Redirect to /auth/install if not authenticated

    // Example authentication check (mock):
    const hasValidSession = checkValidSession(request);

    if (!hasValidSession) {
      // Redirect to install page
      const installUrl = new URL('/auth/install', request.url);
      return NextResponse.redirect(installUrl);
    }
  }

  // Add security headers
  const response = NextResponse.next();

  // Security headers for iframe compatibility
  response.headers.set('X-Frame-Options', 'ALLOWALL');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // CSP headers
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors *",
    ].join('; ')
  );

  return response;
}

// Mock session validation function
function checkValidSession(request: NextRequest): boolean {
  // In a real implementation, you would:
  // 1. Check for session cookie
  // 2. Validate JWT token
  // 3. Check database for active session
  // 4. Verify tenant/location permissions

  const sessionCookie = request.cookies.get('session');
  if (!sessionCookie) {
    return false;
  }

  // Mock validation - in real app, decode and verify JWT
  try {
    // const payload = jwt.verify(sessionCookie.value, process.env.JWT_SECRET);
    // return payload.exp > Date.now() / 1000;
    return true; // Mock valid session
  } catch {
    return false;
  }
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
