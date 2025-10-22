/**
 * Get Treasury Balance API
 * 
 * Retrieves the current balance of an organization's treasury account from Solana blockchain
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/jwt-service';
import { db } from '@/lib/db';
import { GridService } from '@/lib/services/grid-service';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('[TreasuryBalance] ========================================');
    console.log('[TreasuryBalance] Fetching treasury balance...');
    
    // 1. Verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get organization ID from query params
    const { searchParams } = request.nextUrl;
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    console.log('[TreasuryBalance] Organization ID:', organizationId);

    // 3. Verify user is member of organization
    const organization = await db.organization.findFirst({
      where: {
        id: organizationId,
        members: {
          some: {
            userId: user.userId
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

    if (!organization.treasuryAccountId) {
      return NextResponse.json(
        { success: false, error: 'Organization does not have a treasury account' },
        { status: 400 }
      );
    }

    console.log('[TreasuryBalance] Treasury account:', organization.treasuryAccountId);

    // 4. Get balances from Solana via GridService
    const gridService = new GridService();
    const balancesResponse = await gridService.getAccountBalances(organization.treasuryAccountId);

    if (!balancesResponse.success || !balancesResponse.balances) {
      console.error('[TreasuryBalance] Failed to fetch balances:', balancesResponse.error);
      return NextResponse.json(
        { success: false, error: balancesResponse.error || 'Failed to fetch balances' },
        { status: 500 }
      );
    }

    console.log('[TreasuryBalance] ✅ Balances fetched successfully');
    console.log('[TreasuryBalance] Balance count:', balancesResponse.balances.length);

    // Log each balance
    balancesResponse.balances.forEach(balance => {
      console.log(`[TreasuryBalance] ${balance.currency}: ${balance.balance}`);
    });

    console.log('[TreasuryBalance] ========================================');

    return NextResponse.json({
      success: true,
      treasury: {
        accountId: organization.treasuryAccountId,
        balances: balancesResponse.balances,
      }
    });

  } catch (error) {
    console.error('[TreasuryBalance] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch treasury balance' 
      },
      { status: 500 }
    );
  }
}
