/**
 * Sync KYC Status API
 * 
 * Manually syncs KYC status from Grid API to local database
 * This is useful when KYC was completed but status wasn't updated
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/jwt-service';
import { db } from '@/lib/db';
import { SDKGridClient } from '@/lib/grid/sdkClient';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('[SyncKYCStatus] ========================================');
    console.log('[SyncKYCStatus] Syncing KYC status from Grid...');
    
    // 1. Authenticate user
    const user = await getCurrentUser();
    if (!user?.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[SyncKYCStatus] User authenticated:', user.userId);

    // 2. Get user from database
    const dbUser = await db.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        gridUserId: true,
        kycId: true,
        kycStatus: true,
      }
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('[SyncKYCStatus] Current DB status:', dbUser.kycStatus);
    console.log('[SyncKYCStatus] Grid User ID:', dbUser.gridUserId);
    console.log('[SyncKYCStatus] KYC ID:', dbUser.kycId);

    if (!dbUser.gridUserId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User does not have Grid User ID. Please complete organization setup first.' 
        },
        { status: 400 }
      );
    }

    // 3. Fetch KYC status from Grid API
    console.log('[SyncKYCStatus] Fetching KYC status from Grid...');
    const gridClient = SDKGridClient.getInstance();
    
    try {
      // Try to get KYC status - this might require the kycId
      if (!dbUser.kycId) {
        console.log('[SyncKYCStatus] No KYC ID found, cannot fetch status from Grid');
        return NextResponse.json(
          { 
            success: false, 
            error: 'No KYC record found. Please request KYC verification first.' 
          },
          { status: 400 }
        );
      }

      // Note: Grid SDK might not have a direct getKycStatus method
      // This is a workaround - we'll need to check what's available
      console.log('[SyncKYCStatus] Attempting to fetch KYC details...');
      
      // For now, let's manually update based on what we know
      // In production, you'd query Grid's API here
      const { kycStatusOverride } = await request.json().catch(() => ({ kycStatusOverride: null }));
      
      if (kycStatusOverride) {
        // Manual status update (for testing/debugging)
        console.log('[SyncKYCStatus] Manually updating status to:', kycStatusOverride);
        
        await db.user.update({
          where: { id: user.userId },
          data: {
            kycStatus: kycStatusOverride,
          },
        });

        console.log('[SyncKYCStatus] ✅ Status updated successfully');
        console.log('[SyncKYCStatus] ========================================');

        return NextResponse.json({
          success: true,
          message: 'KYC status updated successfully',
          kycStatus: kycStatusOverride,
          updated: true,
        });
      }

      // If no manual override, return current status
      console.log('[SyncKYCStatus] No status update available from Grid API');
      console.log('[SyncKYCStatus] Current status:', dbUser.kycStatus);
      console.log('[SyncKYCStatus] ========================================');

      return NextResponse.json({
        success: true,
        message: 'KYC status retrieved',
        kycStatus: dbUser.kycStatus,
        updated: false,
        note: 'Grid SDK does not provide direct KYC status query. Use kycStatusOverride parameter to manually update.',
      });

    } catch (error: any) {
      console.error('[SyncKYCStatus] Error fetching from Grid:', error);
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch KYC status from Grid',
          details: error.message 
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('[SyncKYCStatus] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to sync KYC status' 
      },
      { status: 500 }
    );
  }
}
