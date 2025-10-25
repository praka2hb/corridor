/**
 * Submit Standing Order Transaction
 * 
 * Manually signs and submits a standing order that's in "awaiting_confirmation" status
 * This is useful when automatic submission fails or when manually activating standing orders
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/jwt-service';
import { db } from '@/lib/db';
import { getSessionSecrets, getAuthSession } from '@/lib/services/database-service';
import * as gridClient from '@/lib/grid/client';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; streamId: string } }
) {
  try {
    const organizationId = params.id;
    const streamId = params.streamId;

    console.log('[SubmitStandingOrder] ========================================');
    console.log('[SubmitStandingOrder] Submitting standing order:', streamId);

    // 1. Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Verify user is admin/owner of organization
    const membership = await db.organizationMember.findFirst({
      where: {
        userId: user.userId,
        organizationId,
        role: { in: ['owner', 'admin'] },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to manage payroll' },
        { status: 403 }
      );
    }

    // 3. Get payroll stream
    const stream = await db.payrollStream.findUnique({
      where: { id: streamId },
      include: {
        employee: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!stream) {
      return NextResponse.json(
        { success: false, error: 'Payroll stream not found' },
        { status: 404 }
      );
    }

    if (stream.employee.organization.id !== organizationId) {
      return NextResponse.json(
        { success: false, error: 'Payroll stream does not belong to this organization' },
        { status: 403 }
      );
    }

    // 4. Check if standing order has Grid ID
    if (!stream.gridStandingOrderId) {
      return NextResponse.json(
        { success: false, error: 'Standing order does not have a Grid ID' },
        { status: 400 }
      );
    }

    // 5. Get organization and standing order details
    const organization = stream.employee.organization;
    if (!organization.creatorAccountAddress) {
      return NextResponse.json(
        { success: false, error: 'Organization does not have an account address' },
        { status: 400 }
      );
    }

    // 6. Get standing order from Grid to check status and get transaction payload
    const standingOrderDetails = await gridClient.getStandingOrder(
      organization.creatorAccountAddress,
      stream.gridStandingOrderId
    );

    if (!standingOrderDetails?.data) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch standing order from Grid' },
        { status: 500 }
      );
    }

    const gridStatus = standingOrderDetails.data.status;
    const transactionPayload = (standingOrderDetails.data as any).transactionPayload;

    // 7. Check if standing order needs to be submitted
    if (gridStatus !== 'awaiting_confirmation') {
      return NextResponse.json(
        { 
          success: false, 
          error: `Standing order is already in ${gridStatus} status. No action needed.`,
          currentStatus: gridStatus
        },
        { status: 400 }
      );
    }

    // Grid's getStandingOrder() doesn't return transactionPayload
    // The payload is only available during createStandingOrder()
    // If status is awaiting_confirmation, the transaction was never submitted
    if (!transactionPayload) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot retrieve transaction payload. The transaction payload is only available during standing order creation.',
          suggestion: 'Please delete this payroll stream and create a new one. The automatic submission should activate it immediately.',
          currentStatus: gridStatus
        },
        { status: 400 }
      );
    }

    // 8. Get organization owner's session secrets and auth session
    const organizationOwner = await db.organizationMember.findFirst({
      where: {
        organizationId,
        role: 'owner',
      },
      include: {
        user: true,
      },
    });

    if (!organizationOwner?.user) {
      return NextResponse.json(
        { success: false, error: 'Organization owner not found' },
        { status: 404 }
      );
    }

    const sessionSecrets = await getSessionSecrets(organizationOwner.user.id);
    if (!sessionSecrets) {
      return NextResponse.json(
        { success: false, error: 'Organization owner session secrets not found. Please log in again.' },
        { status: 404 }
      );
    }

    const authSession = await getAuthSession(organizationOwner.user.id);
    if (!authSession) {
      return NextResponse.json(
        { success: false, error: 'Organization owner auth session not found. Please log in again.' },
        { status: 404 }
      );
    }

    // 9. Sign and submit the transaction
    console.log('[SubmitStandingOrder] Signing and submitting standing order transaction...');
    const signedResult = await gridClient.signAndSend({
      sessionSecrets,
      transactionPayload,
      session: authSession,
      address: organization.creatorAccountAddress,
    });

    console.log('[SubmitStandingOrder] Standing order transaction signed and submitted:', signedResult);

    if (!signedResult?.transaction_signature) {
      return NextResponse.json(
        { success: false, error: 'Failed to submit transaction - no signature returned' },
        { status: 500 }
      );
    }

    console.log('[SubmitStandingOrder] ✅ Standing order submitted successfully');
    console.log('[SubmitStandingOrder] ========================================');

    return NextResponse.json({
      success: true,
      message: 'Standing order transaction submitted successfully',
      transactionSignature: signedResult.transaction_signature,
      standingOrderId: stream.gridStandingOrderId,
    });

  } catch (error: any) {
    console.error('[SubmitStandingOrder] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to submit standing order transaction' 
      },
      { status: 500 }
    );
  }
}

