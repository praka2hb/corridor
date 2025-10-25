/**
 * Check KYC Status Before Organization Creation
 * 
 * Comprehensive KYC status check specifically for organization creation flow
 * Always fetches fresh status from Grid API when kycId exists
 * Stores rejection reasons and continuation link in database
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/jwt-service';
import { SDKGridClient } from '@/lib/grid/sdkClient';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('[CheckBeforeOrg] Starting comprehensive KYC check...');
    
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
        kycLink: true,
        kycContinuationLink: true,
        kycRejectionReasons: true,
        gridUserId: true,
        email: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('[CheckBeforeOrg] User found, kycId:', dbUser.kycId);

    // 3. If no KYC initiated yet, return no-kyc state
    if (!dbUser.kycId) {
      console.log('[CheckBeforeOrg] No KYC initiated yet');
      return NextResponse.json({
        success: true,
        state: 'no-kyc',
        message: 'KYC verification not started',
        canCreateOrg: false,
      });
    }

    // 4. Fetch latest status from Grid API
    console.log('[CheckBeforeOrg] Fetching status from Grid API...');
    const gridClient = SDKGridClient.getInstance();
    
    let gridStatusResponse;
    try {
      gridStatusResponse = await gridClient.getKycStatus(
        user.accountAddress,
        dbUser.kycId
      );
    } catch (error: any) {
      console.error('[CheckBeforeOrg] Error fetching from Grid:', error);
      // Fall back to database status if Grid API fails
      return NextResponse.json({
        success: true,
        state: dbUser.kycStatus || 'unknown',
        kycStatus: dbUser.kycStatus,
        kycType: dbUser.kycType,
        kycLink: dbUser.kycLink,
        kycContinuationLink: dbUser.kycContinuationLink,
        rejectionReasons: dbUser.kycRejectionReasons ? JSON.parse(dbUser.kycRejectionReasons) : null,
        canCreateOrg: dbUser.kycStatus === 'approved',
        message: 'Using cached status (Grid API unavailable)',
      });
    }

    if (!gridStatusResponse || !gridStatusResponse.success || !gridStatusResponse.data) {
      console.error('[CheckBeforeOrg] Invalid Grid response:', gridStatusResponse?.error);
      // Fall back to database status
      return NextResponse.json({
        success: true,
        state: dbUser.kycStatus || 'unknown',
        kycStatus: dbUser.kycStatus,
        kycType: dbUser.kycType,
        kycLink: dbUser.kycLink,
        kycContinuationLink: dbUser.kycContinuationLink,
        rejectionReasons: dbUser.kycRejectionReasons ? JSON.parse(dbUser.kycRejectionReasons) : null,
        canCreateOrg: dbUser.kycStatus === 'approved',
        message: 'Using cached status',
      });
    }

    const gridData = gridStatusResponse.data;
    console.log('[CheckBeforeOrg] Grid status:', gridData.status);
    console.log('[CheckBeforeOrg] Grid response:', JSON.stringify(gridData, null, 2));

    // 5. Parse Grid response
    const status = gridData.status;
    const rejectionReasons = gridData.rejection_reasons || [];
    const continuationLink = gridData.kyc_continuation_link || dbUser.kycLink;
    const verificationLevel = (gridData as any).verification_level;

    // 6. Update database with latest information
    const updateData: any = {
      kycStatus: status,
    };

    // Store rejection reasons as JSON string
    if (rejectionReasons.length > 0) {
      updateData.kycRejectionReasons = JSON.stringify(rejectionReasons);
    }

    // Store continuation link if available
    if (continuationLink) {
      updateData.kycContinuationLink = continuationLink;
    }

    // Update verification level if provided
    if (verificationLevel) {
      updateData.kycVerificationLevel = verificationLevel;
    }

    await db.user.update({
      where: { id: user.userId },
      data: updateData,
    });

    console.log('[CheckBeforeOrg] Database updated with latest status');

    // 7. Determine state and return comprehensive response
    const canCreateOrg = status === 'approved';
    let state = status;
    let message = '';

    switch (status) {
      case 'approved':
        message = 'KYC verification approved';
        break;
      case 'pending':
        message = 'KYC verification in progress';
        break;
      case 'incomplete':
        message = 'KYC verification incomplete';
        break;
      case 'rejected':
        message = 'KYC verification rejected';
        break;
      default:
        message = `KYC status: ${status}`;
    }

    return NextResponse.json({
      success: true,
      state,
      canCreateOrg,
      message,
      kycStatus: status,
      kycType: gridData.type || dbUser.kycType,
      kycId: gridData.id,
      continuationLink: continuationLink,
      rejectionReasons: rejectionReasons.length > 0 ? rejectionReasons : null,
      verificationLevel: verificationLevel || null,
      tosStatus: gridData.tos_status || null,
      updatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[CheckBeforeOrg] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to check KYC status' 
      },
      { status: 500 }
    );
  }
}

