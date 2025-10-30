import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, generateToken, setAuthCookie, setGridUserIdCookie } from '@/lib/services/jwt-service';

export const runtime = 'nodejs';

// POST /api/session/refresh - Refresh session (requires re-authentication)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No active session' },
        { status: 401 }
      );
    }

    // Check if session has expired
    const currentTime = Math.floor(Date.now() / 1000);
    const sessionAge = user.sessionCreatedAt ? currentTime - user.sessionCreatedAt : Infinity;
    const SESSION_TIMEOUT_SECONDS = 60 * 60; // 1 hour

    if (sessionAge >= SESSION_TIMEOUT_SECONDS) {
      return NextResponse.json(
        { success: false, error: 'Session expired. Please re-authenticate.' },
        { status: 401 }
      );
    }

    // Generate new token with fresh session timestamp
    const newToken = await generateToken({
      userId: user.userId,
      email: user.email,
      username: user.username,
      accountAddress: user.accountAddress,
      gridUserId: user.gridUserId,
    });

    // Set new auth cookie
    await setAuthCookie(newToken);

    // Set grid_user_id cookie if present
    if (user.gridUserId) {
      await setGridUserIdCookie(user.gridUserId);
    }

    return NextResponse.json({
      success: true,
      message: 'Session refreshed successfully',
    });
  } catch (error: any) {
    console.error('[API] Error refreshing session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to refresh session' },
      { status: 500 }
    );
  }
}
