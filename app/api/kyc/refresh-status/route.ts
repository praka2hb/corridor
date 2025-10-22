/**
 * Refresh KYC Status API
 * 
 * Fetches the latest KYC status from Grid and updates the user's database
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

    // 2. Get user data from database
    const dbUser = await db.user.findUnique({
      where: { id: user.userId },
      select: {
        kycId: true,
        kycType: true,
        kycStatus: true,
        kycRejectionReasons: true,
        kycContinuationLink: true,
      },
    });

    if (!dbUser || !dbUser.kycId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No KYC verification found. Please start verification first.' 
        },
        { status: 404 }
      );
    }

    console.log('[KYC Refresh] Fetching status from Grid for KYC ID:', dbUser.kycId);

    // 3. Fetch latest status from Grid
    const gridClient = SDKGridClient.getInstance();
    const kycStatusResponse = await gridClient.getKycStatus(
      user.accountAddress,
      dbUser.kycId
    );

    if (!kycStatusResponse || !kycStatusResponse.success || !kycStatusResponse.data) {
      console.error('[KYC Refresh] Failed to fetch status from Grid:', kycStatusResponse?.error);
      return NextResponse.json(
        { 
          success: false, 
          error: kycStatusResponse?.error || 'Failed to fetch KYC status from Grid' 
        },
        { status: 500 }
      );
    }

    const gridKycStatus = kycStatusResponse.data;
    
    console.log('[KYC Refresh] Grid status:', gridKycStatus.status);
    console.log('[KYC Refresh] Full response:', JSON.stringify(gridKycStatus, null, 2));

    // 4. Update database with latest status
    // Extract fields that exist in the response
    const updateData: any = {
      kycStatus: gridKycStatus.status, // 'pending', 'approved', 'rejected', 'incomplete'
    };
    
    // Add verificationLevel only if it exists in the response
    if ('verificationLevel' in gridKycStatus && gridKycStatus.verificationLevel) {
      updateData.kycVerificationLevel = gridKycStatus.verificationLevel;
    }
    
    // Store rejection reasons if present
    if (gridKycStatus.rejection_reasons && gridKycStatus.rejection_reasons.length > 0) {
      updateData.kycRejectionReasons = JSON.stringify(gridKycStatus.rejection_reasons);
      console.log('[KYC Refresh] Storing rejection reasons:', gridKycStatus.rejection_reasons.length, 'reasons');
    }
    
    // Store continuation link if present
    if (gridKycStatus.kyc_continuation_link) {
      updateData.kycContinuationLink = gridKycStatus.kyc_continuation_link;
      console.log('[KYC Refresh] Storing continuation link');
    }
    
    const updatedUser = await db.user.update({
      where: { id: user.userId },
      data: updateData,
    });

    console.log('[KYC Refresh] Database updated - Status:', updatedUser.kycStatus);

    // 5. Return updated status with rejection reasons
    return NextResponse.json({
      success: true,
      message: 'KYC status refreshed successfully',
      kycStatus: updatedUser.kycStatus,
      kycType: updatedUser.kycType,
      kycVerificationLevel: updatedUser.kycVerificationLevel,
      kycLink: updatedUser.kycLink,
      rejectionReasons: gridKycStatus.rejection_reasons || null,
      continuationLink: gridKycStatus.kyc_continuation_link || null,
      previousStatus: dbUser.kycStatus,
      statusChanged: dbUser.kycStatus !== updatedUser.kycStatus,
    });

  } catch (error) {
    console.error('[KYC Refresh] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to refresh KYC status' 
      },
      { status: 500 }
    );
  }
}
