/**
 * Get Organization API
 * 
 * Retrieves the organization for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/jwt-service';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('[GetOrganization] ========================================');
    console.log('[GetOrganization] Fetching organization...');
    
    // 1. Verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[GetOrganization] User authenticated:', user.userId);

    // 2. Get user's organizations
    const organizations = await db.organizationMember.findMany({
      where: { userId: user.userId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            gridOrgId: true,
            treasuryStatus: true,
            createdAt: true,
            updatedAt: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      }
    });

    const orgs = organizations.map(om => ({
      ...om.organization,
      role: om.role,
    }));

    console.log('[GetOrganization] ✅ Found', orgs.length, 'organizations');
    console.log('[GetOrganization] ========================================');

    return NextResponse.json({
      success: true,
      organizations: orgs,
    });

  } catch (error) {
    console.error('[GetOrganization] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch organization' 
      },
      { status: 500 }
    );
  }
}
