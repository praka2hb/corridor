/**
 * Cookie Utilities for Frontend
 * Helper functions to read cookies in client-side code
 */

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null; // Server-side, return null
  }

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  
  return null;
}

/**
 * Get Grid User ID from cookie
 */
export function getGridUserId(): string | null {
  return getCookie('grid_user_id');
}

/**
 * Check if user is authenticated (has auth_token cookie)
 */
export function hasAuthToken(): boolean {
  return getCookie('auth_token') !== null;
}
