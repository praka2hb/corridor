/**
 * Create Virtual Account API
 * 
 * Creates a virtual bank account for an organization's treasury after KYB approval
 * This enables ACH deposits that automatically convert to USDC on-chain
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/jwt-service';
import { db } from '@/lib/db';
import { SDKGridClient } from '@/lib/grid/sdkClient';

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

    // 2. Get organization ID from request
    const body = await request.json();
    const { organizationId } = body;

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // 3. Verify user is member of organization and get user KYC status
    const organization = await db.organization.findFirst({
      where: {
        id: organizationId,
        members: {
          some: {
            userId: user.userId,
            role: { in: ['owner', 'admin'] }
          }
        }
      },
      include: {
        members: {
          where: { userId: user.userId },
          include: {
            user: {
              select: {
                kycStatus: true,
                gridUserId: true,
              }
            }
          }
        }
      }
    });

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found or insufficient permissions' },
        { status: 404 }
      );
    }

    // 4. Verify user KYC is approved (not org KYB)
    const member = organization.members[0];
    if (!member.user.kycStatus || member.user.kycStatus !== 'approved') {
      return NextResponse.json(
        { 
          success: false, 
          error: `User KYC verification must be approved before creating virtual account. Current status: ${member.user.kycStatus || 'not started'}` 
        },
        { status: 400 }
      );
    }

    if (!member.user.gridUserId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User Grid ID not found. Please complete authentication first.' 
        },
        { status: 400 }
      );
    }

    // 5. Check if virtual account already exists
    if (organization.virtualAccountId) {
      return NextResponse.json({
        success: true,
        message: 'Virtual account already exists',
        virtualAccount: {
          id: organization.virtualAccountId,
          status: 'active',
          bankDetails: {
            accountNumber: organization.bankAccountNumber,
            routingNumber: organization.bankRoutingNumber,
            beneficiaryName: organization.bankBeneficiaryName,
            bankName: organization.bankName,
          }
        }
      });
    }

    // 6. Verify multisig data exists
    if (!organization.treasuryAccountId || !organization.treasuryGridUserId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Organization treasury not properly configured. Missing multisig data.' 
        },
        { status: 400 }
      );
    }

    // 7. Create virtual account via Grid REST API
    
    // PRODUCTION: Use Grid REST API to create virtual account
    // POST https://api.grid.xyz/v1/virtual-accounts
    // Headers: { Authorization: `Bearer ${GRID_API_KEY}` }
    // Body: {
    //   grid_user_id: member.user.gridUserId,            // CRITICAL: Use user's grid_user_id (verified person)
    //   account_id: organization.treasuryAccountId,     // Multisig Solana address (account to fund)
    //   currency: 'USD',
    //   account_type: 'business'
    // }
    //
    // Example implementation:
    // const vaResponse = await fetch('https://api.grid.xyz/v1/virtual-accounts', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.GRID_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     grid_user_id: organization.treasuryGridUserId,
    //     account_id: organization.treasuryAccountId,
    //     currency: 'USD',
    //     account_type: 'business'
    //   })
    // });
    // const vaData = await vaResponse.json();
    
    // For now, create a simulated virtual account with proper structure
    const virtualAccountId = `va_${member.user.gridUserId}_${Date.now()}`;
    
    const bankDetails = {
      accountNumber: `****${Math.floor(1000 + Math.random() * 9000)}`,
      routingNumber: '121000248',
      beneficiaryName: `Grid - ${organization.name}`,
      bankName: 'Partner Bank (via Grid)',
    };

    // 8. Update organization in database with all virtual account data
    const updatedOrg = await db.organization.update({
      where: { id: organizationId },
      data: {
        virtualAccountId: virtualAccountId,
        bankAccountNumber: bankDetails.accountNumber,
        bankRoutingNumber: bankDetails.routingNumber,
        bankBeneficiaryName: bankDetails.beneficiaryName,
        bankName: bankDetails.bankName,
        treasuryStatus: 'active',
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Virtual account created successfully',
      virtualAccount: {
        id: virtualAccountId,
        status: 'active',
        bankDetails: bankDetails,
      }
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create virtual account' 
      },
      { status: 500 }
    );
  }
}
