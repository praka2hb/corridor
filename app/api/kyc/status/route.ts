/**
 * Get KYC Status API
 * 
 * Retrieves the current KYC verification status for the user
 * Supports optional ?refresh=true to fetch from Grid API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/jwt-service';
import { SDKGridClient } from '@/lib/grid/sdkClient';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // 1. Verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Check if refresh from Grid API is requested
    const searchParams = request.nextUrl.searchParams;
    const shouldRefresh = searchParams.get('refresh') === 'true';

    // 3. Get KYC status from database
    const dbUser = await db.user.findUnique({
      where: { id: user.userId },
      select: {
        kycId: true,
        kycType: true,
        kycStatus: true,
        kycVerificationLevel: true,
        kycLink: true,
        kycLinkExpiresAt: true,
        kycRejectionReasons: true,
        kycContinuationLink: true,
      },
    });

    if (!dbUser || !dbUser.kycId) {
      return NextResponse.json({
        success: true,
        kycStatus: null,
        kycType: null,
        kycLink: null,
        kycLinkExpiresAt: null,
        rejectionReasons: null,
        continuationLink: null,
      });
    }

    // 4. If refresh requested and kycId exists, fetch from Grid API
    if (shouldRefresh && dbUser.kycId) {
      console.log('[KYC Status] Refreshing from Grid API...');
      
      try {
        const gridClient = SDKGridClient.getInstance();
        const gridResponse = await gridClient.getKycStatus(
          user.accountAddress,
          dbUser.kycId
        );

        if (gridResponse && gridResponse.success && gridResponse.data) {
          const gridData = gridResponse.data;
          
          // Update database with latest information
          const updateData: any = {
            kycStatus: gridData.status,
          };

          if (gridData.rejection_reasons && gridData.rejection_reasons.length > 0) {
            updateData.kycRejectionReasons = JSON.stringify(gridData.rejection_reasons);
          }

          if (gridData.kyc_continuation_link) {
            updateData.kycContinuationLink = gridData.kyc_continuation_link;
          }

          if ((gridData as any).verification_level) {
            updateData.kycVerificationLevel = (gridData as any).verification_level;
          }

          await db.user.update({
            where: { id: user.userId },
            data: updateData,
          });

          console.log('[KYC Status] Database updated from Grid API');

          return NextResponse.json({
            success: true,
            kycStatus: gridData.status,
            kycType: gridData.type || dbUser.kycType,
            kycVerificationLevel: (gridData as any).verification_level || dbUser.kycVerificationLevel,
            kycLink: dbUser.kycLink,
            kycLinkExpiresAt: dbUser.kycLinkExpiresAt,
            rejectionReasons: gridData.rejection_reasons || null,
            continuationLink: gridData.kyc_continuation_link || null,
            refreshed: true,
          });
        }
      } catch (error) {
        console.error('[KYC Status] Error refreshing from Grid:', error);
        // Fall through to return database status
      }
    }

    // 5. Return status from database
    return NextResponse.json({
      success: true,
      kycStatus: dbUser.kycStatus || 'pending',
      kycType: dbUser.kycType || 'individual',
      kycVerificationLevel: dbUser.kycVerificationLevel,
      kycLink: dbUser.kycLink,
      kycLinkExpiresAt: dbUser.kycLinkExpiresAt,
      rejectionReasons: dbUser.kycRejectionReasons ? JSON.parse(dbUser.kycRejectionReasons) : null,
      continuationLink: dbUser.kycContinuationLink,
      refreshed: false,
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
