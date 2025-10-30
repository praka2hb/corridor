import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/jwt-service';

export const runtime = 'nodejs';

// GET /api/session/check - Check session validity and remaining time
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.sessionCreatedAt) {
      return NextResponse.json(
        { success: false, error: 'No active session' },
        { status: 401 }
      );
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const sessionAge = currentTime - user.sessionCreatedAt;
    const SESSION_TIMEOUT_SECONDS = 60 * 60; // 1 hour
    const remainingSeconds = Math.max(0, SESSION_TIMEOUT_SECONDS - sessionAge);

    // Session has expired
    if (remainingSeconds <= 0) {
      return NextResponse.json(
        { success: false, error: 'Session expired', remainingTime: 0 },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      remainingTime: remainingSeconds * 1000, // Convert to milliseconds for client
      sessionCreatedAt: user.sessionCreatedAt,
    });
  } catch (error: any) {
    console.error('[API] Error checking session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check session' },
      { status: 500 }
    );
  }
}
