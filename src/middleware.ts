import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Track API request start time
  const startTime = Date.now();
  
  // Continue to the API route
  const response = NextResponse.next();
  
  // Only apply to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Add API timing headers
    response.headers.set('Server-Timing', `api;dur=${Date.now() - startTime}`);
    
    // Log API performance to console
    console.log(`API ${request.nextUrl.pathname} took ${Date.now() - startTime}ms`);
  }

  // Handle auth redirects
  if (request.nextUrl.pathname.startsWith('/dashboard') || 
      request.nextUrl.pathname.startsWith('/admin')) {
    // These routes will be protected by the ProtectedRoute component
    // The middleware just passes through for client-side auth checking
  }
  
  return response;
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*', '/admin/:path*'],
}; 