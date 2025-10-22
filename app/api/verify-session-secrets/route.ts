import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/jwt-service';
import { verifySessionSecrets } from '@/lib/services/database-service';

export const runtime = 'nodejs';

/**
 * GET /api/verify-session-secrets
 * Verify that stored session secrets match the user's Grid account signers
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user from JWT
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (!user.accountAddress) {
      return NextResponse.json(
        { success: false, error: 'No Grid account address found for user' },
        { status: 400 }
      );
    }

    console.log('[VerifySecrets] Verifying session secrets for user:', user.userId);
    console.log('[VerifySecrets] Grid account address:', user.accountAddress);

    // Verify session secrets
    const verification = await verifySessionSecrets(user.userId, user.accountAddress);

    console.log('[VerifySecrets] Verification result:', verification);

    return NextResponse.json({
      success: verification.valid,
      message: verification.message,
      details: verification.details,
    });

  } catch (error: any) {
    console.error('[VerifySecrets] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to verify session secrets' 
      },
      { status: 500 }
    );
  }
}
