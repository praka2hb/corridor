import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/services/jwt-service'

// Routes that require authentication
const protectedRoutes = ['/home', '/payments', '/payroll']

// Routes that should redirect to home if authenticated
const authRoutes = ['/auth']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get token from cookie
  const token = request.cookies.get('auth_token')?.value
  
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  // Check if user is authenticated and session is valid
  let isAuthenticated = false
  let isSessionExpired = false
  
  if (token) {
    const payload = await verifyToken(token)
    isAuthenticated = payload !== null
    
    // Check if session has expired (1 hour timeout)
    if (payload && payload.sessionCreatedAt) {
      const currentTime = Math.floor(Date.now() / 1000)
      const sessionAge = currentTime - payload.sessionCreatedAt
      const SESSION_TIMEOUT_SECONDS = 60 * 60 // 1 hour
      isSessionExpired = sessionAge >= SESSION_TIMEOUT_SECONDS
    }
  }

  // Redirect if session expired on protected routes
  if (isProtectedRoute && (isSessionExpired || !isAuthenticated)) {
    const url = new URL('/auth', request.url)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users from auth page to home (if session not expired)
  if (isAuthRoute && isAuthenticated && !isSessionExpired) {
    const url = new URL('/home', request.url)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
}

