/**
 * Debug Auth Endpoint
 * TESTING ONLY - Remove before production
 * Shows what's stored in the JWT token
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/jwt-service';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      debug: {
        userId: user.userId,
        email: user.email,
        username: user.username,
        accountAddress: user.accountAddress,
        gridUserId: user.gridUserId,
        message: '⚠️ accountAddress should be user\'s PERSONAL wallet, not organization multisig'
      }
    });

  } catch (error: any) {
    console.error('[DebugAuth] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
