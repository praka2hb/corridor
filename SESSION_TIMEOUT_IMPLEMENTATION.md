# Session Timeout Implementation

## Overview
This implementation adds a 1-hour session timeout feature that requires users to re-authenticate from the auth section after each hour of activity.

## Features Implemented

### 1. JWT Service Updates (`lib/services/jwt-service.ts`)
- Added `sessionCreatedAt` timestamp to JWT token payload
- Added `SESSION_TIMEOUT_SECONDS` constant (set to 3600 seconds / 1 hour)
- New functions:
  - `isSessionExpired()`: Checks if session has exceeded 1 hour
  - `getRemainingSessionTime()`: Returns remaining session time in seconds

### 2. Session Check API (`app/api/session/check/route.ts`)
- GET endpoint that validates current session
- Returns remaining time in milliseconds
- Returns 401 if session expired or invalid

### 3. Session Refresh API (`app/api/session/refresh/route.ts`)
- POST endpoint to refresh session (generates new token with fresh timestamp)
- Only works if current session hasn't expired yet
- Returns 401 if session already expired

### 4. Session Timeout Hook (`lib/hooks/use-session-timeout.ts`)
- Client-side React hook for monitoring session status
- Checks session every minute
- Shows warning 5 minutes before expiration
- Automatically logs out when session expires
- Returns:
  - `isExpired`: Boolean indicating if session expired
  - `remainingTime`: Time remaining in milliseconds
  - `showWarning`: Boolean for showing warning dialog
  - `handleLogout()`: Function to manually logout
  - `extendSession()`: Function to refresh session

### 5. Session Timeout Provider (`components/session-timeout-provider.tsx`)
- React component that wraps the application
- Displays alert dialogs for:
  - Warning when session is about to expire (5 minutes before)
  - Notification when session has expired
- Automatically redirects to `/auth` on expiration
- Does not monitor on `/auth` or `/` (landing page)

### 6. Middleware Updates (`middleware.ts`)
- Server-side session validation on every request
- Checks `sessionCreatedAt` timestamp in JWT
- Redirects to `/auth` if session expired on protected routes
- Prevents access to protected routes with expired sessions

### 7. Root Layout Updates (`components/root-layout.tsx`)
- Wrapped with `SessionTimeoutProvider`
- Enables session monitoring across all pages

## How It Works

### Session Creation
1. User authenticates via `/auth` page
2. JWT token is generated with `sessionCreatedAt` timestamp
3. Token stored in HTTP-only cookie with 1-hour expiration

### Session Monitoring
1. **Client-side**: Hook checks session every 60 seconds via `/api/session/check`
2. **Server-side**: Middleware validates session on every page request
3. Warning shown 5 minutes before expiration
4. Automatic logout and redirect when expired

### Session Expiration
1. After 1 hour from `sessionCreatedAt`, session is considered expired
2. User is redirected to `/auth` page
3. User must re-authenticate to continue

### Timeline
- **0:00** - User logs in, session starts
- **0:55** - Warning dialog appears (5 minutes remaining)
- **1:00** - Session expires, user redirected to `/auth`

## Security Features
- HTTP-only cookies prevent XSS attacks
- Server-side validation prevents tampering
- Automatic logout on expiration
- No way to extend session without re-authentication once expired

## Configuration
To change the timeout duration, update these constants:

```typescript
// lib/services/jwt-service.ts
const SESSION_TIMEOUT_SECONDS = 60 * 60; // 1 hour

// lib/hooks/use-session-timeout.ts
const SESSION_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour
const WARNING_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes warning

// middleware.ts
const SESSION_TIMEOUT_SECONDS = 60 * 60; // 1 hour
```

## Testing
1. Log in to the application
2. Wait 55 minutes - warning dialog should appear
3. Wait 5 more minutes - should be redirected to `/auth`
4. Try accessing protected routes - should be redirected to `/auth`

## Notes
- Session timeout is based on creation time, not activity
- Each new login creates a fresh 1-hour session
- Session cannot be extended once created (by design for security)
- The `/api/session/refresh` endpoint can be used for future activity-based timeout if needed
