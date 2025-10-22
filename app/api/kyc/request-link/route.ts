/**
 * Request KYC Link API
 * 
 * Generates a KYC verification link for the user using Grid SDK
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/jwt-service';
import { SDKGridClient } from '@/lib/grid/sdkClient';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get request body
    const body = await request.json();
    const kycType = body.type || 'individual';
    
    if (!['individual', 'business'].includes(kycType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid KYC type. Must be "individual" or "business"' },
        { status: 400 }
      );
    }

    // 3. Get user data from database
    const dbUser = await db.user.findUnique({
      where: { id: user.userId },
      select: {
        email: true,
        username: true,
        gridUserId: true,
      },
    });

    if (!dbUser || !dbUser.gridUserId) {
      return NextResponse.json(
        { success: false, error: 'User data not found' },
        { status: 404 }
      );
    }

    const fullName = dbUser.username || dbUser.email.split('@')[0];

    // 4. Request KYC link from Grid
    const gridClient = SDKGridClient.getInstance();
    
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/organization?kyc=true`;
    
    const kycRequest = {
      grid_user_id: dbUser.gridUserId,
      type: kycType as 'individual' | 'business',
      email: dbUser.email,
      full_name: fullName,
      endorsements: [],
      redirect_uri: redirectUri,
    };

    console.log('[KYC] Sending redirect_uri to Grid:', redirectUri);
    console.log('[KYC] Full KYC request:', JSON.stringify(kycRequest, null, 2));

    const response = await gridClient.requestKycLink(
      user.accountAddress,
      kycRequest
    );

    if (!response || response.error || !response.data) {
      const error = response?.error || 'Failed to generate KYC link';
      return NextResponse.json(
        { success: false, error: `Failed to generate KYC link: ${error}` },
        { status: 500 }
      );
    }

    const kycData = response.data;
    
    console.log('[KYC] Grid response received:');
    console.log('[KYC] - KYC ID:', kycData.id);
    console.log('[KYC] - KYC Link:', kycData.kyc_link);
    console.log('[KYC] - Status:', kycData.kyc_status);
    
    // 5. Store KYC ID, type, and link in database
    // Note: We do NOT update kycStatus here - it should remain null/pending until
    // Grid redirects back or sends a webhook callback confirming the verification is approved
    await db.user.update({
      where: { id: user.userId },
      data: {
        kycId: kycData.id,
        kycType: kycType,
        kycLink: kycData.kyc_link, // Store link so user can resume if needed
        kycLinkExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
        kycStatus: 'pending', // Set to pending when link is generated
        // kycVerificationLevel: Intentionally NOT updated here - will be set via webhook callback
      },
    });

    return NextResponse.json({
      success: true,
      kycData: {
        id: kycData.id,
        full_name: kycData.full_name,
        email: kycData.email,
        type: kycData.type,
        kyc_link: kycData.kyc_link,
        tos_link: kycData.tos_link,
        kyc_status: kycData.kyc_status,
        tos_status: kycData.tos_status,
        verification_level: (kycData as any).verification_level,
        created_at: kycData.created_at,
      },
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
