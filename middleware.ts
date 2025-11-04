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

  // Check if user is authenticated (JWT verification handles expiration)
  let isAuthenticated = false
  
  if (token) {
    const payload = await verifyToken(token)
    isAuthenticated = payload !== null
  }

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !isAuthenticated) {
    const url = new URL('/auth', request.url)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users from auth page to home
  if (isAuthRoute && isAuthenticated) {
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

