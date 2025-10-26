/**
 * JWT Token Service
 * Handles token generation, verification, and cookie management
 * Compatible with Edge Runtime using jose library
 */

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// JWT Secret - in production, this should be in env variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const TOKEN_EXPIRY_SECONDS = 60 * 60; // 1 hour
const COOKIE_NAME = 'auth_token';

// Convert secret to Uint8Array for jose
const secretKey = new TextEncoder().encode(JWT_SECRET);

export interface TokenPayload {
  userId: string;
  email: string;
  username?: string;
  accountAddress: string;
  gridUserId?: string;
  iat?: number;
  exp?: number;
}

/**
 * Generate a JWT token (Edge Runtime compatible)
 */
export async function generateToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_SECONDS)
    .sign(secretKey);
  
  return token;
}

/**
 * Verify and decode a JWT token (Edge Runtime compatible)
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);

    // Runtime validation and safe narrowing of the decoded payload
    const { userId, email, accountAddress, username, gridUserId, iat, exp } = payload as Record<string, unknown>;

    if (
      typeof userId === 'string' &&
      typeof email === 'string' &&
      typeof accountAddress === 'string'
    ) {
      return {
        userId,
        email,
        accountAddress,
        username: typeof username === 'string' ? username : undefined,
        gridUserId: typeof gridUserId === 'string' ? gridUserId : undefined,
        iat: typeof iat === 'number' ? iat : undefined,
        exp: typeof exp === 'number' ? exp : undefined,
      } as TokenPayload;
    }

    return null;
  } catch (error) {
    console.error('[JWT] Token verification failed:', error);
    return null;
  }
}

/**
 * Set auth token in HTTP-only cookie
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60, // 1 hour in seconds
    path: '/',
  });
}

/**
 * Get auth token from cookie
 */
export async function getAuthCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  return cookie?.value || null;
}

/**
 * Remove auth token cookie
 */
export async function removeAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  cookieStore.delete('grid_user_id'); // Also remove grid_user_id cookie
}

/**
 * Set grid user ID in cookie (accessible from frontend)
 */
export async function setGridUserIdCookie(gridUserId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('grid_user_id', gridUserId, {
    httpOnly: false, // Allow frontend access
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60, // 1 hour in seconds
    path: '/',
  });
}

/**
 * Get grid user ID from cookie
 */
export async function getGridUserIdCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get('grid_user_id');
  return cookie?.value || null;
}

/**
 * Get current user from cookie
 */
export async function getCurrentUser(): Promise<TokenPayload | null> {
  const token = await getAuthCookie();
  if (!token) return null;
  return await verifyToken(token);
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

