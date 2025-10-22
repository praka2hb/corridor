/**
 * KYC Callback Webhook Handler
 * 
 * This endpoint receives webhook callbacks from Grid when a user's KYC status changes.
 * It updates the user's KYC status in the database.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // 1. Parse the webhook payload from Grid
    const payload = await request.json();
    
    console.log('[KYC Callback] Received webhook:', JSON.stringify(payload, null, 2));

    // 2. Extract relevant data from Grid's webhook
    // Grid webhook payload structure (based on typical KYC webhook):
    // {
    //   "event": "kyc.status_updated",
    //   "data": {
    //     "id": "kyc_request_id",
    //     "kyc_status": "approved" | "rejected" | "pending",
    //     "verification_level": "standard" | "enhanced",
    //     "grid_user_id": "user_grid_id",
    //     ...
    //   }
    // }

    const eventType = payload.event;
    const kycData = payload.data;

    if (!kycData || !kycData.id) {
      return NextResponse.json(
        { success: false, error: 'Invalid webhook payload' },
        { status: 400 }
      );
    }

    // 3. Find the user by kycId
    const user = await db.user.findFirst({
      where: { kycId: kycData.id },
    });

    if (!user) {
      console.log(`[KYC Callback] No user found with kycId: ${kycData.id}`);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // 4. Update user's KYC status based on Grid's webhook
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        kycStatus: kycData.kyc_status,
        kycVerificationLevel: kycData.verification_level || user.kycVerificationLevel,
      },
    });

    console.log(`[KYC Callback] Updated user ${user.id} KYC status to: ${kycData.kyc_status}`);

    // 5. Send success response to Grid
    return NextResponse.json({
      success: true,
      message: 'KYC status updated successfully',
      userId: user.id,
      kycStatus: updatedUser.kycStatus,
    });

  } catch (error) {
    console.error('[KYC Callback] Error processing webhook:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
