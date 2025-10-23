/**
 * Refresh Session Endpoint
 * 
 * Regenerates session secrets when Privy session expires
 * Should be called when getting "session key is expired" errors
 */

import { NextRequest, NextResponse } from 'next/server';
import { SDKGridClient } from '@/lib/grid/sdkClient';
import { getCurrentUser } from '@/lib/services/jwt-service';
import { storeSessionSecrets } from '@/lib/services/database-service';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('[RefreshSession] ========================================');
    console.log('[RefreshSession] Refreshing expired session secrets...');
    
    // 1. Verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[RefreshSession] User:', user.userId);

    // 2. Generate new session secrets
    const gridClient = SDKGridClient.getInstance();
    const sessionSecrets = await gridClient.generateSessionSecrets();
    
    console.log('[RefreshSession] ✅ New session secrets generated');

    // 3. Store new session secrets in database
    await storeSessionSecrets(user.userId, sessionSecrets);
    
    console.log('[RefreshSession] ✅ New session secrets stored');
    console.log('[RefreshSession] ========================================');

    return NextResponse.json({
      success: true,
      message: 'Session refreshed successfully. Please try your transaction again.'
    });

  } catch (error: any) {
    console.error('[RefreshSession] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to refresh session. Please log out and log in again.' },
      { status: 500 }
    );
  }
}
