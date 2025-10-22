/**
 * Request Virtual Account API Route
 * 
 * Allows organization owners to request a virtual account (ACH deposit instructions)
 * for their organization's treasury multisig.
 * 
 * This enables funding the multisig via ACH bank transfers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/jwt-service';
import { db } from '@/lib/db';
import { SDKGridClient } from '@/lib/grid/sdkClient';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const organizationId = params.id;

    // 1. Authenticate user
    const user = await getCurrentUser();
    if (!user?.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get organization with member info
    const organization = await db.organization.findUnique({
      where: { id: organizationId },
      include: {
        members: {
          where: { userId: user.userId },
          include: {
            user: {
              select: {
                id: true,
                gridUserId: true,
                email: true,
                kycStatus: true,
              }
            }
          }
        }
      }
    });

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    // 3. Check if user is a member
    const member = organization.members[0];
    if (!member) {
      return NextResponse.json(
        { success: false, error: 'You are not a member of this organization' },
        { status: 403 }
      );
    }

    // 4. Check if user is owner or admin
    if (member.role !== 'owner' && member.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only owners and admins can request virtual accounts' },
        { status: 403 }
      );
    }

    // 5. Check if organization has treasury set up
    if (!organization.treasuryAccountId || !organization.treasuryGridUserId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Organization treasury account not set up' 
        },
        { status: 400 }
      );
    }

    // 6. Check user's KYC status
    if (!member.user.kycStatus || member.user.kycStatus !== 'approved') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User KYC verification required. Please complete KYC verification first.',
          kycStatus: member.user.kycStatus || 'not_started',
          needsKyc: true,
        },
        { status: 403 }
      );
    }

    // 7. Check if virtual account already exists
    if (organization.virtualAccountId) {
      return NextResponse.json({
        success: true,
        message: 'Virtual account already exists',
        virtualAccount: {
          id: organization.virtualAccountId,
          bankName: organization.bankName,
          bankAccountNumber: organization.bankAccountNumber,
          bankRoutingNumber: organization.bankRoutingNumber,
          bankBeneficiaryName: organization.bankBeneficiaryName,
        },
      });
    }

    // Validate user has Grid User ID
    if (!member.user.gridUserId) {
      return NextResponse.json(
        {
          success: false,
          error: 'User Grid ID not found. Please complete organization setup first.',
          needsSetup: true,
        },
        { status: 400 }
      );
    }

    // 8. Request virtual account from Grid
    const gridClient = SDKGridClient.getInstance();

    const virtualAccountRequest = {
      grid_user_id: member.user.gridUserId,
      currency: 'usd' as const,
    };

    const virtualAccountResponse = await gridClient.requestVirtualAccount(
      organization.treasuryAccountId,
      virtualAccountRequest
    );

    if (!virtualAccountResponse || virtualAccountResponse.error || !virtualAccountResponse.data) {
      const errorMessage = virtualAccountResponse?.error;
      let userFriendlyError = 'Failed to create virtual account. Please try again or contact support.';
      
      if (typeof errorMessage === 'string') {
        if (errorMessage.includes('Invalid user ID') || errorMessage.includes('user_id')) {
          userFriendlyError = 'Invalid user verification. Please ensure you have completed organization setup and KYC verification.';
        } else if (errorMessage.includes('KYC') || errorMessage.includes('verification')) {
          userFriendlyError = 'KYC verification required. Please complete KYC verification first.';
        } else if (errorMessage.includes('already exists')) {
          userFriendlyError = 'Virtual account already exists for this organization.';
        }
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: userFriendlyError,
          details: virtualAccountResponse?.error || 'Unknown error',
          debugInfo: {
            treasuryAddress: organization.treasuryAccountId,
            userGridId: member.user.gridUserId,
            kycStatus: member.user.kycStatus,
          }
        },
        { status: 500 }
      );
    }

    const virtualAccountData = virtualAccountResponse.data;

    // 9. Update organization with virtual account details
    const updatedOrganization = await db.organization.update({
      where: { id: organizationId },
      data: {
        virtualAccountId: virtualAccountData.id,
        bankAccountNumber: virtualAccountData.source_deposit_instructions?.bank_account_number,
        bankRoutingNumber: virtualAccountData.source_deposit_instructions?.bank_routing_number,
        bankBeneficiaryName: virtualAccountData.source_deposit_instructions?.bank_beneficiary_name,
        bankName: virtualAccountData.source_deposit_instructions?.bank_name,
      },
    });

    // 10. Return success response
    return NextResponse.json({
      success: true,
      message: 'Virtual account created successfully',
      virtualAccount: {
        id: virtualAccountData.id,
        status: virtualAccountData.status,
        depositInstructions: {
          currency: virtualAccountData.source_deposit_instructions?.currency,
          bankName: virtualAccountData.source_deposit_instructions?.bank_name,
          bankAccountNumber: virtualAccountData.source_deposit_instructions?.bank_account_number,
          bankRoutingNumber: virtualAccountData.source_deposit_instructions?.bank_routing_number,
          bankBeneficiaryName: virtualAccountData.source_deposit_instructions?.bank_beneficiary_name,
          paymentRails: virtualAccountData.source_deposit_instructions?.payment_rails,
        },
        destination: {
          currency: virtualAccountData.destination?.currency,
          paymentRail: virtualAccountData.destination?.payment_rail,
          address: virtualAccountData.destination?.address,
        },
      },
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to request virtual account' 
      },
      { status: 500 }
    );
  }
}

/**
 * Get Virtual Account Details
 * 
 * Retrieves existing virtual account information for an organization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const organizationId = params.id;
    
    console.log('[GetVirtualAccount] Fetching virtual account for organization:', organizationId);

    // 1. Authenticate user
    const user = await getCurrentUser();
    if (!user?.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get organization with member check
    const organization = await db.organization.findFirst({
      where: {
        id: organizationId,
        members: {
          some: {
            userId: user.userId,
          }
        }
      },
      select: {
        id: true,
        name: true,
        virtualAccountId: true,
        bankName: true,
        bankAccountNumber: true,
        bankRoutingNumber: true,
        bankBeneficiaryName: true,
        treasuryAccountId: true,
      }
    });

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found or access denied' },
        { status: 404 }
      );
    }

    // 3. Check if virtual account exists
    if (!organization.virtualAccountId) {
      return NextResponse.json({
        success: true,
        hasVirtualAccount: false,
        message: 'No virtual account set up for this organization',
      });
    }

    // 4. Return virtual account details
    return NextResponse.json({
      success: true,
      hasVirtualAccount: true,
      virtualAccount: {
        id: organization.virtualAccountId,
        bankName: organization.bankName,
        bankAccountNumber: organization.bankAccountNumber,
        bankRoutingNumber: organization.bankRoutingNumber,
        bankBeneficiaryName: organization.bankBeneficiaryName,
        destinationAddress: organization.treasuryAccountId,
      },
    });

  } catch (error) {
    console.error('[GetVirtualAccount] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get virtual account' 
      },
      { status: 500 }
    );
  }
}
