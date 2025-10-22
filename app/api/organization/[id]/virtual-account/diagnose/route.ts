/**
 * Diagnose Virtual Account Issues
 * 
 * Helps debug virtual account creation issues by checking:
 * - User's Grid ID
 * - User's KYC status
 * - Organization's treasury details
 * - Member permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/jwt-service';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const organizationId = params.id;
    
    console.log('[DiagnoseVA] ========================================');
    console.log('[DiagnoseVA] Diagnosing virtual account setup for org:', organizationId);

    // 1. Authenticate user
    const user = await getCurrentUser();
    if (!user?.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[DiagnoseVA] User authenticated:', user.userId);

    // 2. Get organization with full details
    const organization = await db.organization.findUnique({
      where: { id: organizationId },
      include: {
        members: {
          where: { userId: user.userId },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                publicKey: true,
                gridUserId: true,
                kycId: true,
                kycStatus: true,
                kycType: true,
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

    const member = organization.members[0];
    if (!member) {
      return NextResponse.json(
        { success: false, error: 'Not a member of this organization' },
        { status: 403 }
      );
    }

    // 3. Build diagnostic report
    const diagnostic = {
      organization: {
        id: organization.id,
        name: organization.name,
        treasuryAccountId: organization.treasuryAccountId,
        treasuryGridUserId: organization.treasuryGridUserId,
        treasurySignerAddress: organization.treasurySignerAddress,
        treasuryStatus: organization.treasuryStatus,
        virtualAccountId: organization.virtualAccountId,
        hasVirtualAccount: !!organization.virtualAccountId,
      },
      user: {
        id: member.user.id,
        email: member.user.email,
        publicKey: member.user.publicKey,
        gridUserId: member.user.gridUserId,
        kycId: member.user.kycId,
        kycStatus: member.user.kycStatus,
        kycType: member.user.kycType,
      },
      membership: {
        role: member.role,
        canCreateVirtualAccount: member.role === 'owner' || member.role === 'admin',
      },
      checks: {
        hasGridUserId: !!member.user.gridUserId,
        hasKycId: !!member.user.kycId,
        isKycApproved: member.user.kycStatus === 'approved',
        hasTreasury: !!organization.treasuryAccountId,
        hasTreasuryGridId: !!organization.treasuryGridUserId,
        hasVirtualAccount: !!organization.virtualAccountId,
        canProceed: false,
        blockingIssues: [] as string[],
      }
    };

    // 4. Identify blocking issues
    if (!member.user.gridUserId) {
      diagnostic.checks.blockingIssues.push('User does not have Grid User ID - please complete organization setup');
    }
    
    if (!member.user.kycStatus || member.user.kycStatus !== 'approved') {
      diagnostic.checks.blockingIssues.push(`User KYC not approved - current status: ${member.user.kycStatus || 'not_started'}`);
    }
    
    if (!organization.treasuryAccountId) {
      diagnostic.checks.blockingIssues.push('Organization does not have treasury account');
    }
    
    if (!organization.treasuryGridUserId) {
      diagnostic.checks.blockingIssues.push('Organization treasury does not have Grid User ID');
    }
    
    if (member.role !== 'owner' && member.role !== 'admin') {
      diagnostic.checks.blockingIssues.push(`Insufficient permissions - role: ${member.role} (need owner or admin)`);
    }

    // 5. Determine if can proceed
    diagnostic.checks.canProceed = diagnostic.checks.blockingIssues.length === 0;

    console.log('[DiagnoseVA] Diagnostic complete');
    console.log('[DiagnoseVA] Can proceed:', diagnostic.checks.canProceed);
    console.log('[DiagnoseVA] Blocking issues:', diagnostic.checks.blockingIssues);
    console.log('[DiagnoseVA] ========================================');

    // 6. Return diagnostic report
    return NextResponse.json({
      success: true,
      diagnostic,
      recommendation: diagnostic.checks.canProceed
        ? 'All checks passed! Virtual account creation should succeed.'
        : 'Please resolve the blocking issues listed above before creating a virtual account.',
    });

  } catch (error: any) {
    console.error('[DiagnoseVA] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to run diagnostics' 
      },
      { status: 500 }
    );
  }
}
